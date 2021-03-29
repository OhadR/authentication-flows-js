export interface AuthenticationUser /*extends UserDetails*/
{
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
}