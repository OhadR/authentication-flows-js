import { AccountState, AuthenticationPolicy } from "..";


/**
 * manages the data like user's account lock, or number of login-retries, etc.
 * @author OhadR
 *
 */
export interface AuthenticationFlowsProcessor
{
	/**
	 * @param email
	 * @param password
	 * @param retypedPassword
	 * @param firstName: first name of the registered user.
	 * @param lastName: second (last) name of the registered user.
	 * @param path: the server-path. used for building the link in the email.
	 */
	createAccount(
		email: string,
		password: string,
		retypedPassword: string,
		firstName: string,
		lastName: string,
		path: string);


	/**
	 * 
	 * @param email
	 * @param serverPath - the server-path. used for building the link in the email
	 */
	forgotPassword( email: string, serverPath: string );
	
	/**
	 * 
	 * @param encUserAndTimestamp
	 * @param password
	 * @param retypedPassword
	 * @return the username (decrypted from 'encUserAndTimestamp', by crytpService)
	 * @throws AuthenticationFlowsException
	 */
	handleSetNewPassword(
		encUserAndTimestamp: string,
		password: string,
		retypedPassword: string): string;
	

	/**
	 * changes the user password. user must be logged in when he calls this method. 
	 * from security reasons, user must provide with the old password.
	 * @param currentPassword
	 * @param newPassword
	 * @param retypedPassword
	 * @param encUser - Originally, it was built for oAuth. so the app had to pass the auth-server
	 * the username, encrypted.
	 * @throws AuthenticationFlowsException
	 */
	handleChangePassword(
			currentPassword: string,
			newPassword: string,
			retypedPassword: string,
			encUser: string);

	
	handleChangePassword(
		currentPassword: string,
		newPassword: string,
		retypedPassword: string);


	/**
	 * 
	 * @param username
	 * @return boolean, passChangeRequired. true if change password is required.
	 */
	setLoginSuccessForUser(username: string): boolean;


	getAuthenticationSettings(): AuthenticationPolicy;

	getAccountState(email: string): Promise<AccountState>;


	setLoginFailureForUser(email: string);

	sendUnlockAccountMail(email: string,
			serverPath: string);

	setPassword(email: string, encodedPassword: string);
	
	getPasswordLastChangeDate(email: string): Date;


	setEnabled(userEmail: string);
	
	/**
	 * 
	 * @param link- the link to search
	 * @throws AuthenticationFlowsException - if link was not found in DB. it means that link was already used, or it is invalid.
	 */
	removeLinkFromDB(link: string);
}
