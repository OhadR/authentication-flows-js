import { AccountState, AuthenticationUser } from "../..";

export interface AuthenticationAccountRepository /*extends UserDetailsManager*/
{
	loadUserByUsername(email: string): AuthenticationUser;

	/**
	 * Create a new user with the supplied details.
	 */
	createUser(authenticationUser: AuthenticationUser): void;

	/**
	 * Remove the user with the given login name from the system.
	 * @param email
	 */
	deleteUser(email: string): void;

	/**
	 * Check if a user with the supplied login name exists in the system.
	 */
	userExists(username: string): boolean;


	setEnabled(email: string);
	setDisabled(email: string);
	isActivated(email: string): boolean;

	isAccountLocked(email: string): AccountState;

//	boolean changePassword(String username, String newEncodedPassword);
	
	/**
	 * 
	 * @param email
	 */
	decrementAttemptsLeft(email: string);
	setAttemptsLeft(email: string, numAttemptsAllowed: number);

	/**
	 * sets a password for a given user
	 * @param email - the user's email
	 * @param newPassword - new password to set
	 */
	setPassword(email: string, newPassword: string);

	getEncodedPassword(username: string): string;
	getPasswordLastChangeDate(email: string): Date;

	setAuthority(username: string, authority: string);

	/**
	 * NOT IMPLEMENTED
	 * 
	 * 
	String getEncodedSecretAnswer(String email);
	*/

	/**
	 * this method is not needed anymore since we extend 
	 * {@link org.springframework.security.core.userdetails.UserDetailsService} 
	 * with its <code>loadUserByUsername(String username)</code>
	 *  
	 * @param email
	 * @return null if username was not found
	 * 
	AuthenticationUser getUser(String email);
	*/
}
