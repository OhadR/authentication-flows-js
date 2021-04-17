import {
    AccountLockedError,
    AuthenticationFlowsError,
    LinkExpiredError,
    PasswordAlreadyChangedError,
    AuthenticationPolicy,
    AuthenticationUser,
    generateKeyFile,
    shaString, MailSender,
    randomString
} from "..";
import { CreateAccountInterceptor } from "../interceptors/create-account-interceptor";
import {
    ACTIVATE_ACCOUNT_ENDPOINT,
    AUTHENTICATION_MAIL_SUBJECT,
    RESTORE_PASSWORD_ENDPOINT, RESTORE_PASSWORD_MAIL_SUBJECT, UNLOCK_MAIL_SUBJECT,
    UTS_PARAM
} from "../types/flows-constatns";
import { AuthenticationAccountRepository } from "../interfaces/repository/authentication-account-repository";
import { AuthenticationPolicyRepository } from "../interfaces/authentication-policy-repository";
import { AuthenticationUserImpl } from "./authentication-user-impl";
import { DefaultMailSenderImpl } from "../interceptors/default-email-sender";
import { AuthenticationPolicyRepositoryImpl } from "./authentication-policy-repository-impl";

const debug = require('debug')('authentication-flows-processor');

//constants that are relevant only for this class:
const EMAIL_NOT_VALID = "The e-mail you have entered is not valid.";
const USER_ALREADY_EXIST = "cannot create account - user already exist.";

const PASSWORD_CANNOT_BE_USED = "Your password is not acceptable by the organizational password policy.";
const PASSWORD_IS_TOO_LONG = "Password is too long";
const PASSWORD_IS_TOO_SHORT = "Password is too short";
const PASSWORD_TOO_FEW_LOWERS = "Password needs to contains at least %d lower-case characters";
const PASSWORD_TOO_FEW_UPPERS = "Password needs to contains at least %d upper-case characters";
const PASSWORD_TOO_FEW_NUMERICS = "Password needs to contains at least %d numeric characters";
const PASSWORD_TOO_FEW_SPECIAL_SYMBOLS = "Password needs to contains at least %d special symbols";
const SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE =
    "Setting a new password has failed. Please note the password policy and try again. Error message: ";
const ACCOUNT_CREATION_HAS_FAILED_PASSWORDS_DO_NOT_MATCH =
    "Account creation has failed. These passwords don't match";

const ACCOUNT_LOCKED_OR_DOES_NOT_EXIST = "Account is locked or does not exist";

const LINK_HAS_EXPIRED = "link has expired";
const LINK_DOES_NOT_EXIST = "link does not exist in DB";	//means that link was already used, or it is invalid

const CHANGE_PASSWORD_FAILED_NEW_PASSWORD_SAME_AS_OLD_PASSWORD = "CHANGE PASSWORD FAILED: New Password is same as Old Password.";
const CHANGE_PASSWORD_BAD_OLD_PASSWORD = "CHANGE PASSWORD Failed: Bad Old Password.";

export class AuthenticationFlowsProcessor {

    private static _instance: AuthenticationFlowsProcessor;

    private createAccountEndpoint: CreateAccountInterceptor = new CreateAccountInterceptor();

    private _authenticationAccountRepository: AuthenticationAccountRepository;
    private _authenticationPolicyRepository: AuthenticationPolicyRepository;

    private _mailSender: MailSender = new DefaultMailSenderImpl();


    private constructor() {
        this._authenticationPolicyRepository = new AuthenticationPolicyRepositoryImpl();
    }

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    public set authenticationAccountRepository(authenticationAccountRepository: AuthenticationAccountRepository) {
        debug(`set authenticationAccountRepository: ${JSON.stringify(authenticationAccountRepository)}`);
        this._authenticationAccountRepository = authenticationAccountRepository;
    }

    public set mailSender(mailSender: MailSender) {
        debug(`set mailSender: ${JSON.stringify(mailSender)}`);
        this._mailSender = mailSender;
    }

    async authenticate(
        name: string,
        pass: string,
        serverPath: string) {
        debug(`authenticating ${name}...`);

        const hashedPass = shaString(pass);

        const user: AuthenticationUser = await this._authenticationAccountRepository.loadUserByUsername(name);
        // query the db for the given username
        if (!user)
            throw new Error('cannot find user');

        if(!user.isEnabled())
            throw new Error('account is not active');


        //validate the credentials:
        if(hashedPass !== user.getPassword()) {
            //wrong password:
            await this.onAuthenticationFailure(user, serverPath);
        }

        const passChangeRequired = this.setLoginSuccessForUser(name);

        //success
        return user;
    }

    async createAccount(email: string, password: string, retypedPassword: string, firstName: string, lastName: string, path: string) {
        //validate the input:
        const settings: AuthenticationPolicy = this.getAuthenticationSettings();

        AuthenticationFlowsProcessor.validateEmail(email);

        AuthenticationFlowsProcessor.validateRetypedPassword(password, retypedPassword);

        AuthenticationFlowsProcessor.validatePassword(password, settings);

        //encrypt the password:
        const encodedPassword: string = shaString(password);

        //make any other additional chackes. this let applications override this impl and add their custom functionality:
        this.createAccountEndpoint.additionalValidations(email, password);

        await this.internalCreateAccount(email, encodedPassword, firstName, lastName, path);
    }

    public async activateAccount(link: string) {

        const username: string = await this._authenticationAccountRepository.getUsernameByLink(link);
        debug(`activating username: ${username}`);

        //this part was persisted in the DB, in order to make sure the activation-link is single-used.
        //so here we remove it from the DB:
        await this.removeLinkFromDB( username );

        // enable the account. NOTE: if userEmail was not found in DB, we will get RuntimeException (NoSuchElement)
        await this.setEnabled(username);

        // reset the #attempts, since there is a flow of exceeding attempts number, so when clicking the link
        // (in the email), we get here and enable the account and reset the attempts number
        this.setLoginSuccessForUser(username);

    }

    /**
     * decode/decrypt the (UTS part of the) link received. ensure it was not expired,
     * and that the password was not changed in between
     * @param link
     */
    public async validatePasswordRestoration(link: string) {

        //decrypt date:
        const username: string = await this._authenticationAccountRepository.getUsernameByLink(link);
        debug(`restore password for username: ${username}`);

        const lastChange: Date = this.getPasswordLastChangeDate(username);

        const linkData = await this._authenticationAccountRepository.getLink(username);

        if(!linkData || !linkData.link) {
            debug(`ERROR: user ${username} tried to use an non-existing link`);
            throw new LinkExpiredError(`ERROR: user ${username} tried to use non-existing`);
        }


        //check if link is expired:
        if(new Date().getTime() - linkData.date.getTime() > 1000 * 1000) {
            debug(`ERROR: user ${username} tried to use an expired link`);
            throw new LinkExpiredError(`ERROR: user ${username} tried to use an expired link: link is valid for 1000 seconds`);
        }

        //if password was changed AFTER the email creation (that is AFTER the user initiated "4got password" flow) -
        //it means the request is irrelevant
        if(lastChange > linkData.date) {
            debug(`ERROR: user ${username} tried to use an expired link: password was already changed AFTER the timestamp of the link`);
            throw new PasswordAlreadyChangedError(`ERROR: user ${username} tried to use an expired link: password was already changed AFTER the timestamp of the link`);
        }
    }

    getAuthenticationSettings(): AuthenticationPolicy {
        return undefined;
    }

    getPasswordLastChangeDate(email: string): Date {
        return this._authenticationAccountRepository.getPasswordLastChangeDate(email);
    }

    handleChangePassword(currentPassword: string, newPassword: string, retypedPassword: string, encUser: string);
    handleChangePassword(currentPassword: string, newPassword: string, retypedPassword: string);
    handleChangePassword(currentPassword: string, newPassword: string, retypedPassword: string, encUser?: string) {
    }

    async forgotPassword(email: string, serverPath: string) {
        debug('forgotPassword() for user ' + email);


        AuthenticationFlowsProcessor.validateEmail(email);

        //if account is already locked, no need to ask the user the secret question:
        if( ! await this._authenticationAccountRepository.isEnabled(email) )
        {
            throw new Error( ACCOUNT_LOCKED_OR_DOES_NOT_EXIST );
        }

        await this.sendPasswordRestoreMail(email, serverPath);
    }

    handleSetNewPassword(encUserAndTimestamp: string, password: string, retypedPassword: string): string {
        return "";
    }

    async removeLinkFromDB(username: string) {
        const deleted = await this._authenticationAccountRepository.removeLink(username);
        if(!deleted)
            throw new Error(LINK_DOES_NOT_EXIST);
    }

    private async sendUnlockAccountMail(email: string, serverPath: string) {

        const utsPart: string = randomString();
        const activationUrl: string = serverPath + ACTIVATE_ACCOUNT_ENDPOINT +
            "?" +
            UTS_PARAM + "=" + utsPart;
        //persist the "uts", so this activation link will be single-used:
        await this._authenticationAccountRepository.addLink( email, utsPart );

        debug(`sending Unlock-Account email to ${email}; activationUrl: ${activationUrl}`);

        await this._mailSender.sendEmail(email,
            UNLOCK_MAIL_SUBJECT,
            activationUrl );
    }

    async setEnabled(userEmail: string) {
        await this._authenticationAccountRepository.setEnabled(userEmail);
    }

    setLoginSuccessForUser(username: string): boolean {
        debug("setting login success for user " + username);
        //TODO:
        this._authenticationAccountRepository.setAttemptsLeft( username,
            /*getAuthenticationSettings().getMaxPasswordEntryAttempts()*/5 );

        return this.isPasswordChangeRequired(username);
    }


    async setPassword(username: string, encodedPassword: string) {
        debug("setting password for user " + username);
        await this._authenticationAccountRepository.setPassword(username, encodedPassword);
    }

    private static validateEmail(email: string) {
        if( ! email.includes("@") ) {
            throw new AuthenticationFlowsError( EMAIL_NOT_VALID );
        }
    }

    private static validateRetypedPassword(password: string, retypedPassword: string) {
        if(password !== retypedPassword) {
            throw new AuthenticationFlowsError( ACCOUNT_CREATION_HAS_FAILED_PASSWORDS_DO_NOT_MATCH );
        }
    }

    //TODO
    private static validatePassword(password: string,
                                    settings: AuthenticationPolicy) {
    //     List<String> blackList = settings.getPasswordBlackList();
    //     if(blackList != null)
    // {
    //     for(String forbidenPswd : blackList)
    // {
    //     if(password.equalsIgnoreCase(forbidenPswd))
    // {
    //     throw new AuthenticationFlowsException(SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE + "; " + PASSWORD_CANNOT_BE_USED);
    // }
    // }
    // }
    //
    //
    // if(password.length() > settings.getPasswordMaxLength())
    // {
    //     throw new AuthenticationFlowsException(SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE + "; " + PASSWORD_IS_TOO_LONG);
    // }
    //
    // if(password.length() < settings.getPasswordMinLength())
    // {
    //     throw new AuthenticationFlowsException(SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE + "; " + PASSWORD_IS_TOO_SHORT);
    // }
    //
    // int uppersCounter = 0;
    // int lowersCounter = 0;
    // int numericCounter = 0;
    // int specialSymbolCounter = 0;
    // char[] dst = new char[password.length()];
    // password.getChars(0, password.length(), dst, 0);
    // for(int i=0; i<password.length(); ++i)
    // {
    //     if(Character.isUpperCase(dst[i]))
    //     {
    //         ++uppersCounter;
    //     }
    //     else if(Character.isLowerCase(dst[i]))
    //     {
    //         ++lowersCounter;
    //     }
    //     else if(Character.isDigit(dst[i]))
    //     {
    //         ++numericCounter;
    //     }
    //     else
    //     {
    //         //not digit and not a letter - consider it as a 'special symbol':
    //         ++specialSymbolCounter;
    //     }
    // }
    //
    // Formatter formatter = new Formatter();
    //
    // String retVal = "";
    //
    // if(uppersCounter < settings.getPasswordMinUpCaseChars())
    // {
    //     retVal = formatter.format(PASSWORD_TOO_FEW_UPPERS, settings.getPasswordMinUpCaseChars()).toString() ;
    // }
    // if(lowersCounter < settings.getPasswordMinLoCaseChars())
    // {
    //     retVal =  formatter.format(PASSWORD_TOO_FEW_LOWERS, settings.getPasswordMinLoCaseChars()).toString();
    // }
    // if(numericCounter < settings.getPasswordMinNumbericDigits())
    // {
    //     retVal =  formatter.format(PASSWORD_TOO_FEW_NUMERICS, settings.getPasswordMinNumbericDigits()).toString();
    // }
    // if(specialSymbolCounter < settings.getPasswordMinSpecialSymbols())
    // {
    //     retVal =  formatter.format(PASSWORD_TOO_FEW_SPECIAL_SYMBOLS, settings.getPasswordMinSpecialSymbols()).toString();
    // }
    //
    // formatter.close();
    //
    // if(!retVal.isEmpty())
    // {
    //     throw new AuthenticationFlowsException(SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE + "; " + retVal);
    // }
    }

    private async internalCreateAccount(email: string, encedPassword: string, firstName: string, lastName: string, serverPath: string) {
        email = email.toLowerCase();		// issue #23 : username is case-sensitive (https://github.com/OhadR/oAuth2-sample/issues/23)
        debug('createAccount() for user ' + email);
        debug('encrypted password: ' + encedPassword);

        let authUser: AuthenticationUser = null;
        try
        {
            authUser = await this._authenticationAccountRepository.loadUserByUsername( email );
        }
        catch(unfe)
        {
            //basically do nothing - we expect user not to be found.
        }
        debug(`oauthUser: ${authUser}`);

        //if user exist, but not activated - we allow re-registration:
        if(authUser)
        {
            if( !authUser.isEnabled())
            {
                await this._authenticationAccountRepository.deleteUser( email );
            }
            else
            {
                //error - user already exists and active
                //log.error( "cannot create account - user " + email + " already exist." );
                debug( "cannot create account - user " + email + " already exist." );
                throw new AuthenticationFlowsError( USER_ALREADY_EXIST );
            }
        }

        const authorities: string[] = this.setAuthorities();		//set authorities
        authUser = new AuthenticationUserImpl(
            email, encedPassword,
            false,									//start as de-activated
//            policyRepo.getDefaultAuthenticationPolicy().getMaxPasswordEntryAttempts(),
            5,
            null,					//set by the repo-impl
            firstName,
            lastName,
            authorities);

        debug(`authUser: ${authUser}`);

        await this._authenticationAccountRepository.createUser(authUser);

        await this.createAccountEndpoint.postCreateAccount( email );

        const utsPart: string = randomString();
        const activationUrl: string = serverPath + ACTIVATE_ACCOUNT_ENDPOINT +
            "?" +
            UTS_PARAM + "=" + utsPart;
        //persist the "uts", so this activation link will be single-used:
        await this._authenticationAccountRepository.addLink( email, utsPart );


        debug("sending registration email to " + email + "; activationUrl: " + activationUrl);


        await this._mailSender.sendEmail(email,
            AUTHENTICATION_MAIL_SUBJECT,
            activationUrl );
    }

    private setAuthorities(): string[]
    {
        const set: string[] = [];
        set.push("ROLE_USER");
        return set;
    }

    private isPasswordChangeRequired(username: string) {
        return false;
    }

    async deleteAccount(email: string, password: string) {
        if(!password)
            return;

        //encrypt the password:
        const encodedPassword: string = shaString(password);

        //validate the credentials:
        if(encodedPassword !== await this._authenticationAccountRepository.getEncodedPassword(email))
            throw new Error('bad credentials');

        //delete:
        debug("deleting account " + email);
        await this._authenticationAccountRepository.deleteUser( email );
    }

    private async sendPasswordRestoreMail(email: string, serverPath: string) {
        const utsPart: string = randomString();
        const passwordRestoreUrl: string = serverPath + RESTORE_PASSWORD_ENDPOINT +
            "?" +
            UTS_PARAM + "=" + utsPart;
        //persist the "uts", so this activation link will be single-used:
        await this._authenticationAccountRepository.addLink( email, utsPart );

        debug("sending restore-password email to " + email + "; url: " + passwordRestoreUrl);

        await this._mailSender.sendEmail(email,
            RESTORE_PASSWORD_MAIL_SUBJECT,
            passwordRestoreUrl );
    }


    async setNewPassword(linkParam: string, password: string, retypedPassword: string) {
        //validate the input:
        const settings: AuthenticationPolicy = this.getAuthenticationSettings();

        AuthenticationFlowsProcessor.validateRetypedPassword(password, retypedPassword);

        AuthenticationFlowsProcessor.validatePassword(password, settings);

        //extract the username/email:
        const username: string = await this._authenticationAccountRepository.getUsernameByLink(linkParam);
        debug(`setNewPassword(): username: ${username}`);

        //validate expiration (again):

        //encrypt the password:
        const encodedPassword: string = shaString(password);

        await this.setPassword(username, encodedPassword);
    }


    private async onAuthenticationFailure(
        user: AuthenticationUser,
        serverPath: string) {

        if(!user)
            return;

        const username = user.getUsername();
        debug(`login failed for user: ` + username);

        await this._authenticationAccountRepository.decrementAttemptsLeft(username);

        //if user is currently enabled, and num attempts left is 0, it means now we lock him up:
        if( user.isEnabled() && user.getLoginAttemptsLeft() == 0 ) {
            debug(`Account has been locked out for user: ${username} due to exceeding number of attempts to login.`);

            //lock the user
            await this._authenticationAccountRepository.setDisabled(username);

            await this.sendUnlockAccountMail(username, serverPath);
            throw new AccountLockedError();
        }

        throw new Error('bad credentials');
    }
}