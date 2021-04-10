/**
 * this class let applications override this impl and add their custom functionality
 */
export class CreateAccountInterceptor
{
	/**
	 * any other additional validations the app does before account creation. upon failure, exception is thrown.
	 * @param email
	 * @param password
	 * @throws AuthenticationFlowsException
	 */
	public additionalValidations(email: string, password: string)	{
	}
	
	public postCreateAccount( username: string ) {
	}
	
}
