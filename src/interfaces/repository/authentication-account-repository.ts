import { AuthenticationUser } from "../authentication-user";

export interface AuthenticationAccountRepository /*extends UserDetailsManager*/
{
	loadUserByUsername(email: string): Promise<AuthenticationUser>;

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
	userExists(username: string): Promise<boolean>;


	setEnabled(email: string);
	setDisabled(email: string);
	isEnabled(email: string): Promise<boolean>;

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

	getEncodedPassword(username: string): Promise<string>;
	getPasswordLastChangeDate(email: string): Promise<Date>;

	setAuthority(username: string, authority: string);

	// LINKS:

	addLink(username: string, link: string);

	/**
	 *
	 * @param username- the key in the map to whom the link is attached
	 * @return true if link was found (and removed). false otherwise.
	 */
	removeLink(username: string): Promise<boolean>;

	getLink(username: string): Promise<{ link: string, date: Date }>;

	/**
	 * @param link
	 * @throws Error if link was not found for any user
	 */
	getUsernameByLink(link: string): Promise<string>;
}
