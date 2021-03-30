import {
    AccountState,
    AuthenticationFlowsError,
    AuthenticationFlowsProcessor,
    AuthenticationPolicy,
    AuthenticationUser,
    decryptString,
    encryptString,
    generateKeyFile
} from "..";
import { CreateAccountEndpoint } from "../endpoints/create-account-endpoint";
import { ACTIVATE_ACCOUNT_ENDPOINT,
    AUTHENTICATION_MAIL_SUBJECT,
    UTS_PARAM } from "../types/flows-constatns";
import { sendEmail } from "../endpoints/email";
import { AuthenticationAccountRepository } from "../interfaces/repository/authentication-account-repository";
import { AuthenticationUserImpl } from "./authentication-user-impl";

const debug = require('debug')('authentication-flows-processor');

//constants that are relevant only for this class:
const EMAIL_NOT_VALID = "The e-mail you have entered is not valid.";
const USER_ALREADY_EXIST = "USER_ALREADY_EXIST";

export class AuthenticationFlowsProcessorImpl implements AuthenticationFlowsProcessor {

    private static _instance: AuthenticationFlowsProcessorImpl;

    private static readonly PASSWORD_CANNOT_BE_USED = "Your password is not acceptable by the organizational password policy.";
    private static readonly PASSWORD_IS_TOO_LONG = "Password is too long";
    private static readonly PASSWORD_IS_TOO_SHORT = "Password is too short";
    private static readonly PASSWORD_TOO_FEW_LOWERS = "Password needs to contains at least %d lower-case characters";
    private static readonly PASSWORD_TOO_FEW_UPPERS = "Password needs to contains at least %d upper-case characters";
    private static readonly PASSWORD_TOO_FEW_NUMERICS = "Password needs to contains at least %d numeric characters";
    private static readonly PASSWORD_TOO_FEW_SPECIAL_SYMBOLS = "Password needs to contains at least %d special symbols";
    private static readonly SETTING_A_NEW_PASSWORD_HAS_FAILED_PLEASE_NOTE_THE_PASSWORD_POLICY_AND_TRY_AGAIN_ERROR_MESSAGE =
        "Setting a new password has failed. Please note the password policy and try again. Error message: ";
    public static readonly ACCOUNT_CREATION_HAS_FAILED_PASSWORDS_DO_NOT_MATCH =
        "Account creation has failed. These passwords don't match";

    private static readonly ACCOUNT_LOCKED_OR_DOES_NOT_EXIST = "Account is locked or does not exist";

    private static readonly LINK_HAS_EXPIRED = "link has expired";
    private static readonly LINK_DOES_NOT_EXIST = "link does not exist in DB";	//means that link was already used, or it is invalid

    private static readonly CHANGE_PASSWORD_FAILED_NEW_PASSWORD_SAME_AS_OLD_PASSWORD = "CHANGE PASSWORD FAILED: New Password is same as Old Password.";
    private static readonly CHANGE_PASSWORD_BAD_OLD_PASSWORD = "CHANGE PASSWORD Failed: Bad Old Password.";

    private createAccountEndpoint: CreateAccountEndpoint = new CreateAccountEndpoint();

    private _authenticationAccountRepository: AuthenticationAccountRepository;

    private constructor() {
        // Generate keys
        generateKeyFile();
    }

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    public set authenticationAccountRepository(authenticationAccountRepository: AuthenticationAccountRepository) {
        debug(`set authenticationAccountRepository: ${JSON.stringify(authenticationAccountRepository)}`);
        this._authenticationAccountRepository = authenticationAccountRepository;
    }

    async createAccount(email: string, password: string, retypedPassword: string, firstName: string, lastName: string, path: string) {
        //validate the input:
        const settings: AuthenticationPolicy = this.getAuthenticationSettings();

        AuthenticationFlowsProcessorImpl.validateEmail(email);

        AuthenticationFlowsProcessorImpl.validateRetypedPassword(password, retypedPassword);

        AuthenticationFlowsProcessorImpl.validatePassword(password, settings);

        //encrypt the password:
        const encodedPassword: string = encryptString(password);

        //make any other additional chackes. this let applications override this impl and add their custom functionality:
        this.createAccountEndpoint.additionalValidations(email, password);

        await this.internalCreateAccount(email, encodedPassword, firstName, lastName, path);
    }

    public async activateAccount(utsParam: string) {
        debug(`param: ${utsParam}`);
        //encrypt the password:
        const xxx: string = decryptString(utsParam);
        debug(`xxx: ${xxx}`);
    }

    getAccountState(email: string): AccountState {
        return undefined;
    }

    getAuthenticationSettings(): AuthenticationPolicy {
        return undefined;
    }

    getPasswordLastChangeDate(email: string): Date {
        return undefined;
    }

    handleChangePassword(currentPassword: string, newPassword: string, retypedPassword: string, encUser: string);
    handleChangePassword(currentPassword: string, newPassword: string, retypedPassword: string);
    handleChangePassword(currentPassword: string, newPassword: string, retypedPassword: string, encUser?: string) {
    }

    handleForgotPassword(email: string, serverPath: string) {
    }

    handleSetNewPassword(encUserAndTimestamp: string, password: string, retypedPassword: string): string {
        return "";
    }

    removeLinkFromDB(link: string) {
    }

    sendUnlockAccountMail(email: string, serverPath: string) {
    }

    setEnabled(userEmail: string) {
    }

    setLoginFailureForUser(email: string) {
    }

    setLoginSuccessForUser(username: string): boolean {
        return false;
    }

    setPassword(email: string, encodedPassword: string) {
    }

    private static validateEmail(email: string) {
        if( ! email.includes("@") ) {
            throw new AuthenticationFlowsError( EMAIL_NOT_VALID );
        }
    }

    private static validateRetypedPassword(password: string, retypedPassword: string) {
        if(password !== retypedPassword) {
            throw new AuthenticationFlowsError( this.ACCOUNT_CREATION_HAS_FAILED_PASSWORDS_DO_NOT_MATCH );
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
        //
        // try
        // {
            let authUser: AuthenticationUser = null;
            try
            {
                authUser = this._authenticationAccountRepository.loadUserByUsername( email );
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
                    this._authenticationAccountRepository.deleteUser( email );
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

            this._authenticationAccountRepository.createUser(authUser);
        //
        //     createAccountEndpoint.postCreateAccount( email );
        // }
        //     //we should not get to these exceptions since we check earlier if account already exist (so repo's do not
        //     // have to check it)
        // catch(DataIntegrityViolationException e)
        // {
        //     //get the cause-exception, since it has a better message:
        //     Throwable root = e.getRootCause();
        //     String msg = root.getMessage();
        //     Assert.isTrue(msg.contains("Duplicate entry"));
        //
        //
        //     log.error( msg );
        //     throw new AuthenticationFlowsException( USER_ALREADY_EXIST );
        // }


        const utsPart: string = encryptString( /*new Date(System.currentTimeMillis()),*/ email);
        const activationUrl: string = serverPath + ACTIVATE_ACCOUNT_ENDPOINT +
            "?" +
            UTS_PARAM + "=" + utsPart;
        //persist the "uts", so this activation link will be single-used:
        // linksRepository.addLink( utsPart );


        debug("Manager: sending registration email to " + email + "; activationUrl: " + activationUrl);


        await sendEmail(email,
            AUTHENTICATION_MAIL_SUBJECT,
            activationUrl );

    }

    private setAuthorities(): string[]
    {
        const set: string[] = [];
        set.push("ROLE_USER");
        return set;
    }
}