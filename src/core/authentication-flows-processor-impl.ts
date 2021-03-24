import { AccountState,
    AuthenticationFlowsError,
    AuthenticationFlowsProcessor,
    AuthenticationPolicy } from "..";

export class AuthenticationFlowsProcessorImpl implements AuthenticationFlowsProcessor {

    private static _instance: AuthenticationFlowsProcessorImpl;

    public static readonly EMAIL_NOT_VALID = "The e-mail you have entered is not valid.";
    public static readonly USER_ALREADY_EXIST = "USER_ALREADY_EXIST";

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

    private constructor() {}

    public static get instance() {
        return this._instance || (this._instance = new this());
    }

    createAccount(email: string, password: string, retypedPassword: string, firstName: string, lastName: string, path: string) {
        //validate the input:
        const settings: AuthenticationPolicy = this.getAuthenticationSettings();

        AuthenticationFlowsProcessorImpl.validateEmail(email);

        AuthenticationFlowsProcessorImpl.validateRetypedPassword(password, retypedPassword);

        // validatePassword(password, settings);
        //
        //
        // const encodedPassword: string = encodeString(email, password);
        //
        //
        // //make any other additional chackes. this let applications override this impl and add their custom functionality:
        // createAccountEndpoint.additionalValidations(email, password);
        //
        // internalCreateAccount(email, encodedPassword, firstName, lastName, path);
        //
        //
        // //update the "remember-me" token validity:
        // int rememberMeTokenValidityInDays = settings.getRememberMeTokenValidityInDays();

        //get the "remem-me" bean and update its validity:
//        rememberMeService.setTokenValiditySeconds(rememberMeTokenValidityInDays * 60 * 60 * 24);
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
            throw new AuthenticationFlowsError( this.EMAIL_NOT_VALID );
        }
    }

    private static validateRetypedPassword(password: string, retypedPassword: string) {
        if(password !== retypedPassword) {
            throw new AuthenticationFlowsError( this.ACCOUNT_CREATION_HAS_FAILED_PASSWORDS_DO_NOT_MATCH );
        }
    }
}