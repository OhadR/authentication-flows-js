import {
    AccountLockedError,
    AuthenticationFlowsError,
    LinkExpiredError,
    PasswordAlreadyChangedError,
    AuthenticationPolicy,
} from "..";
import { CreateAccountInterceptor } from "../interceptors/create-account-interceptor";
import { DefaultMailSenderImpl } from "../interceptors/default-email-sender";
import {
    ACTIVATE_ACCOUNT_ENDPOINT,
    AUTHENTICATION_MAIL_SUBJECT,
    PASSWORD_CHANGED_MAIL_SUBJECT,
    RESTORE_PASSWORD_ENDPOINT,
    RESTORE_PASSWORD_MAIL_SUBJECT,
    UNLOCK_MAIL_SUBJECT,
    UTS_PARAM
} from "../types/flows-constatns";
import { AuthenticationAccountRepository } from "../interfaces/repository/authentication-account-repository";
import { PasswordPolicyRepository } from "../interfaces/password-policy-repository";
import { AuthenticationUser } from "../interfaces/authentication-user";
import { MailSender } from "../interfaces/mail-sender";
import { AuthenticationUserImpl } from "./authentication-user-impl";
import { PasswordPolicyRepositoryImpl } from "../config/password-policy-repository-impl";
import { randomString, shaString } from "../crypto/key-generator";

const debug = require('debug')('authentication-flows-processor');

//constants that are relevant only for this class:
const EMAIL_NOT_VALID = "The e-mail you have entered is not valid.";
const USER_ALREADY_EXIST = "cannot create account - user already exist.";

const PASSWORD_CANNOT_BE_USED = "Your password is not acceptable by the organizational password policy.";
const PASSWORD_IS_TOO_LONG = "Password is too long";
const PASSWORD_IS_TOO_SHORT = "Password is too short";
const PASSWORD_TOO_FEW_LOWERS = "Password needs to contains at least XXXX lower-case characters";
const PASSWORD_TOO_FEW_UPPERS = "Password needs to contains at least XXXX upper-case characters";
const PASSWORD_TOO_FEW_NUMERICS = "Password needs to contains at least XXXX numeric characters";
const PASSWORD_TOO_FEW_SPECIAL_SYMBOLS = "Password needs to contains at least XXXX special symbols";
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
    private _passwordPolicyRepository: PasswordPolicyRepository;

    private _mailSender: MailSender = new DefaultMailSenderImpl();


    private constructor() {
        this._passwordPolicyRepository = new PasswordPolicyRepositoryImpl();
    }

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    public set authenticationAccountRepository(authenticationAccountRepository: AuthenticationAccountRepository) {
        debug(`set authenticationAccountRepository: ${authenticationAccountRepository.constructor.name}`);
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

        const passChangeRequired = await this.setLoginSuccessForUser(name);

        //success
        return user;
    }

    async createAccount(email: string, password: string, retypedPassword: string, firstName: string, lastName: string, serverPath: string) {
        //validate the input:
        AuthenticationFlowsProcessor.validateEmail(email);

        this.validatePassword(password);

        AuthenticationFlowsProcessor.validateRetypedPassword(password, retypedPassword);

        //encrypt the password:
        const encodedPassword: string = shaString(password);

        //make any other additional chackes. this let applications override this impl and add their custom functionality:
        this.createAccountEndpoint.additionalValidations(email, password);

        email = email.toLowerCase();		// issue #23 : username is case-sensitive
        debug('createAccount() for user ' + email);
        debug('encoded password: ' + encodedPassword);

        let authUser: AuthenticationUser = null;
        try
        {
            authUser = await this._authenticationAccountRepository.loadUserByUsername( email );
        }
        catch(unfe)
        {
            //basically do nothing - we expect user not to be found.
        }
        debug(`create-account, user: ${authUser}`);

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
            email, encodedPassword,
            false,									//start as de-activated
            this._passwordPolicyRepository.getDefaultAuthenticationPolicy().getMaxPasswordEntryAttempts(),
            null,					//set by the repo-impl
            firstName,
            lastName,
            authorities);

        debug(`authUser: ${authUser}`);

        await this._authenticationAccountRepository.createUser(authUser);

        await this.createAccountEndpoint.postCreateAccount( email );

        const token: string = randomString();
        const activationUrl: string = serverPath + ACTIVATE_ACCOUNT_ENDPOINT +
            "/" + token;
        //persist the "uts", so this activation link will be single-used:
        await this._authenticationAccountRepository.addLink( email, token );


        //debug("sending registration email to " + email + "; activationUrl: " + activationUrl);
        debug("sending registration email; activationUrl: " + activationUrl);


        await this._mailSender.sendEmail(email,
            AUTHENTICATION_MAIL_SUBJECT,
            activationUrl );
    }

    public async activateAccount(linkCode: string) {

        const username: string = await this._authenticationAccountRepository.getUsernameByLink(linkCode);
        debug(`activating username: ${username}`);

        // check token expiration and throw LINK_HAS_EXPIRED
        const tokenData = await this._authenticationAccountRepository.getLink(username);

        if(!tokenData || !tokenData.link) {
            debug(`ERROR: user ${username} tried to use a non-existing link`);
            throw new LinkExpiredError(`ERROR: user ${username} tried to use non-existing link`);
        }

        const tokenDate: Date = new Date(tokenData.date);

        //check if link is expired:
        if(new Date().getTime() - tokenDate.getTime() > 1000 * 1000) {
            debug(`ERROR: user ${username} tried to use an expired link`);
            throw new LinkExpiredError(`ERROR: user ${username} tried to use an expired link: link is valid for 1000 seconds`);
        }

        //this part was persisted in the DB, in order to make sure the activation-link is single-used.
        //so here we remove it from the DB:
        await this.removeLinkFromDB( username );

        // enable the account. NOTE: if userEmail was not found in DB, we will get RuntimeException (NoSuchElement)
        await this.setEnabled(username);

        // reset the #attempts, since there is a flow of exceeding attempts number, so when clicking the link
        // (in the email), we get here and enable the account and reset the attempts number
        await this.setLoginSuccessForUser(username);
    }

    /**
     * decode/decrypt the (UTS part of the) link received. ensure it was not expired,
     * and that the password was not changed in between
     * @param link
     */
    public async validatePasswordRestoration(link: string) {

        const username: string = await this._authenticationAccountRepository.getUsernameByLink(link);
        debug(`restore password for username: ${username}`);

        const lastChange: Date = await this._authenticationAccountRepository.getPasswordLastChangeDate(username);
        const lastChangedDate: Date = new Date(lastChange);
        debug("lastChangedDate: " + lastChangedDate);

        const tokenData = await this._authenticationAccountRepository.getLink(username);

        if(!tokenData || !tokenData.link) {
            debug(`ERROR: user ${username} tried to use a non-existing link`);
            throw new LinkExpiredError(`ERROR: user ${username} tried to use non-existing link`);
        }

        const tokenDate: Date = new Date(tokenData.date);

        //check if link is expired:
        if(new Date().getTime() - tokenDate.getTime() > 1000 * 1000) {
            debug(`ERROR: user ${username} tried to use an expired link`);
            throw new LinkExpiredError(`ERROR: user ${username} tried to use an expired link: link is valid for 1000 seconds`);
        }

        //if password was changed AFTER the email creation (that is AFTER the user initiated "4got password" flow) -
        //it means the request is irrelevant
        if(lastChangedDate > tokenDate) {
            debug(`ERROR: user ${username} tried to use an expired link: password was already changed AFTER the timestamp of the link`);
            throw new PasswordAlreadyChangedError(`ERROR: user ${username} tried to use an expired link: password was already changed AFTER the timestamp of the link`);
        }
    }

    getAuthenticationSettings(): AuthenticationPolicy {
        return this._passwordPolicyRepository.getDefaultAuthenticationPolicy();
    }


    async forgotPassword(email: string, serverPath: string) {
        debug('forgotPassword() for user ' + email);

        AuthenticationFlowsProcessor.validateEmail(email);

        //if account is already locked, he is not allowed to reset password:
        if( ! await this._authenticationAccountRepository.isEnabled(email) )
        {
            //security bug: Even if we don’t find an email address, we return 'ok'. We don’t want untoward
            // bots figuring out what emails are real vs not real in our database.
            //throw new Error( ACCOUNT_LOCKED_OR_DOES_NOT_EXIST );
            return;
        }

        await this.sendPasswordRestoreMail(email, serverPath);
    }

    private async removeLinkFromDB(username: string) {
        const deleted = await this._authenticationAccountRepository.removeLink(username);
        if(!deleted)
            throw new Error(LINK_DOES_NOT_EXIST);
    }

    private async sendUnlockAccountMail(email: string, serverPath: string) {

        const token: string = randomString();
        const activationUrl: string = serverPath + ACTIVATE_ACCOUNT_ENDPOINT +
            "/" + token;
        //persist the "uts", so this activation link will be single-used:
        await this._authenticationAccountRepository.addLink( email, token );

        debug(`sending Unlock-Account email to ${email}; activationUrl: ${activationUrl}`);

        await this._mailSender.sendEmail(email,
            UNLOCK_MAIL_SUBJECT,
            activationUrl );
    }

    private async setEnabled(userEmail: string) {
        await this._authenticationAccountRepository.setEnabled(userEmail);
    }

    private async setLoginSuccessForUser(username: string): Promise<boolean> {
        debug("setting login success for user " + username);

        this._authenticationAccountRepository.setAttemptsLeft( username,
            this.getAuthenticationSettings().getMaxPasswordEntryAttempts() );

        return await this.isPasswordChangeRequired(username);
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


    private validatePassword(password: string) {
        const settings: AuthenticationPolicy = this._passwordPolicyRepository.getDefaultAuthenticationPolicy();

        const blackList: string[] = settings.getPasswordBlackList();
        if(blackList != null) {
            for(const forbidenPswd of blackList) {
                if(password.toLowerCase() === forbidenPswd.toLowerCase())
                {
                    throw new Error(SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE + " " + PASSWORD_CANNOT_BE_USED);
                }
            }
        }


        if(password.length > settings.getPasswordMaxLength())
            throw new Error(SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE + " " + PASSWORD_IS_TOO_LONG);


        if(password.length < settings.getPasswordMinLength())
            throw new Error(SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE + " " + PASSWORD_IS_TOO_SHORT);

        let uppersCounter = 0;
        let lowersCounter = 0;
        let numericCounter = 0;
        let specialSymbolCounter = 0;

        for(let i=0; i<password.length; ++i) {
            const c = password.charAt(i);

            if (c == c.toUpperCase() && !(c >= '0' && c <= '9') &&(c >='A' && c <= 'Z'))
                ++uppersCounter;
            else if (c == c.toLowerCase() && !(c >= '0' && c <= '9') &&(c >='a' && c <= 'z'))
                ++lowersCounter;
            else if (c >= '0' && c <= '9')
                ++numericCounter;
            else
                ++specialSymbolCounter;
        }

        let retVal;
        if(uppersCounter < settings.getPasswordMinUpCaseChars()) {
            retVal = PASSWORD_TOO_FEW_UPPERS.replace('XXXX', settings.getPasswordMinUpCaseChars() + '');
        }
        if(lowersCounter < settings.getPasswordMinLoCaseChars()) {
            retVal = PASSWORD_TOO_FEW_LOWERS.replace('XXXX', settings.getPasswordMinLoCaseChars() + '');
        }
        if(numericCounter < settings.getPasswordMinNumbericDigits()) {
            retVal = PASSWORD_TOO_FEW_NUMERICS.replace('XXXX', settings.getPasswordMinNumbericDigits() + '');
        }
        if(specialSymbolCounter < settings.getPasswordMinSpecialSymbols()) {
            retVal = PASSWORD_TOO_FEW_SPECIAL_SYMBOLS.replace('XXXX', settings.getPasswordMinSpecialSymbols()+ '');
        }

        if(retVal)
            throw new Error(SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE + " " + retVal);
    }

    private setAuthorities(): string[]
    {
        const set: string[] = [];
        set.push("ROLE_USER");
        return set;
    }


    private async isPasswordChangeRequired(username: string): Promise<boolean> {
        const lastChange: Date = await this._authenticationAccountRepository.getPasswordLastChangeDate(username);
        const lastChangedDate: Date = new Date(lastChange);
        debug("lastChangedDate: " + lastChangedDate);
        debug("PasswordLifeInDays: " + this.getAuthenticationSettings().getPasswordLifeInDays());

        const passwordChangeRequired = (Date.now() - lastChangedDate.getTime()) > (this.getAuthenticationSettings().getPasswordLifeInDays() * 24 * 60 * 60 * 1000);
        debug("passwordChangeRequired: " + passwordChangeRequired);
        return passwordChangeRequired;
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
        const token: string = randomString();
        const passwordRestoreUrl: string = serverPath + RESTORE_PASSWORD_ENDPOINT +
            "/" + token;
        //persist the "uts", so this activation link will be single-used:
        await this._authenticationAccountRepository.addLink( email, token );

        debug("sending restore-password email to " + email + "; url: " + passwordRestoreUrl);

        await this._mailSender.sendEmail(email,
            RESTORE_PASSWORD_MAIL_SUBJECT,
            passwordRestoreUrl );
    }


    async setNewPassword(linkParam: string, password: string, retypedPassword: string) {
        //validate the input:
        AuthenticationFlowsProcessor.validateRetypedPassword(password, retypedPassword);

        this.validatePassword(password);

        //extract the username/email:
        const username: string = await this._authenticationAccountRepository.getUsernameByLink(linkParam);
        debug(`setNewPassword(): username: ${username}`);

        //validate expiration (again):
        const tokenData = await this._authenticationAccountRepository.getLink(username);

        if(!tokenData || !tokenData.link) {
            debug(`ERROR: user ${username} tried to use a non-existing link`);
            throw new LinkExpiredError(`ERROR: user ${username} tried to use non-existing link`);
        }

        const tokenDate: Date = new Date(tokenData.date);

        //check if link is expired:
        if(new Date().getTime() - tokenDate.getTime() > 1000 * 1000) {
            debug(`ERROR: user ${username} tried to use an expired link`);
            throw new LinkExpiredError(`ERROR: user ${username} tried to use an expired link: link is valid for 1000 seconds`);
        }


        //encrypt the password:
        const encodedPassword: string = shaString(password);

        //store the new password, and also clear the link, to ensure the activation-link is single-used:
        debug("setting password for user " + username);
        await this._authenticationAccountRepository.setPassword(username, encodedPassword);
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
            throw new AccountLockedError(`Account has been locked out for user: ${username} due to exceeding number of attempts to login.`);
        }

        throw new Error('bad credentials');
    }

    async changePassword(
        username: string,
        currentPassword: string,
        newPassword: string,
        retypedPassword: string) {

        AuthenticationFlowsProcessor.validateRetypedPassword(newPassword, retypedPassword);

        this.validatePassword(newPassword);

        //encrypt the password:
        const encodedPassword: string = shaString(newPassword);

        debug("setting password for user " + username);
        await this._authenticationAccountRepository.setPassword(username, encodedPassword);

        await this._mailSender.sendEmail(username,
            PASSWORD_CHANGED_MAIL_SUBJECT,
            'your password has been changed.' );
    }
}