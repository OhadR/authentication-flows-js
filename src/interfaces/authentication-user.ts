export interface AuthenticationUser /*extends UserDetails*/
{
	/**
	 * 	Returns the authorities granted to the user.
	 */
	getAuthorities(): string[];

	/**
	 * 	Returns the password used to authenticate the user.
	 */
	getPassword(): string;

	/**
	 * Returns the username used to authenticate the user.
	 */
	getUsername(): string;

	/**
	 * Indicates whether the user is enabled or disabled.
	 */
	isEnabled(): boolean;

	/**
	 * the logic: in the DB we count DOWN the attempts of the user. upon account creation and
	 * upon login success, we set the "login attempts left" in the DB as set in the props file.
	 * upon login failure, we decreament the counter. this way, the loginFailureHandler does not 
	 * have to know the "max attempts". only the processor knows this max value. 
	 * @return LoginAttemptsLeft
	 */
	getLoginAttemptsLeft(): number;

	getPasswordLastChangeDate(): Date;
	
	getFirstName(): string;
	getLastName(): string;

	getToken(): string;
	getTokenDate(): Date;
}