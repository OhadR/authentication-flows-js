export class AuthenticationPolicy {

	private static readonly DB_ITEMS_DELIMITER: string = ";";

	private passwordMinLength: number;

	private passwordMaxLength: number;

	private passwordMinUpCaseChars: number;

	private passwordMinLoCaseChars: number;

	private passwordMinNumbericDigits: number;

	private passwordMinSpecialSymbols: number;
	
	private passwordBlackList: string[];
	
	private maxPasswordEntryAttempts: number;

	private passwordLifeInDays: number;

	private rememberMeTokenValidityInDays: number;



	@SuppressWarnings("unchecked")
	public AuthenticationPolicy(int passwordMinLength,
			int passwordMaxLength,
			int passwordMinUpCaseChars,
			int passwordMinLoCaseChars, 
			int passwordMinNumbericDigits,
			int passwordMinSpecialSymbols,
			String passwordBlackList,
			int maxPasswordEntryAttempts,
			int passwordLifeInDays,
			int rememberMeTokenValidityInDays)
	{
		this.passwordMinLength = passwordMinLength;
		this.passwordMaxLength = passwordMaxLength;
		this.passwordMinUpCaseChars = passwordMinUpCaseChars;
		this.passwordMinLoCaseChars = passwordMinLoCaseChars;
		this.passwordMinNumbericDigits = passwordMinNumbericDigits;
		this.passwordMinSpecialSymbols = passwordMinSpecialSymbols;
		this.maxPasswordEntryAttempts = maxPasswordEntryAttempts;
		this.passwordLifeInDays = passwordLifeInDays;
		this.rememberMeTokenValidityInDays = rememberMeTokenValidityInDays;
		
		this.passwordBlackList = CollectionUtils.arrayToList( passwordBlackList.split(DB_ITEMS_DELIMITER)); 

	}

	public int getPasswordMinSpecialSymbols()
	{
		return passwordMinSpecialSymbols;
	}

	public List<String> getPasswordBlackList()
	{
		return passwordBlackList;
	}

	public int getPasswordLifeInDays()
	{
		return passwordLifeInDays;
	}

	public int getPasswordMinLength()
	{
		return passwordMinLength;
	}

	public int getPasswordMinLoCaseChars()
	{
		return passwordMinLoCaseChars;
	}

	public int getRememberMeTokenValidityInDays()
	{
		return rememberMeTokenValidityInDays;
	}

	public int getPasswordMinUpCaseChars()
	{
		return passwordMinUpCaseChars;
	}

	public getPasswordMaxLength(): number
	{
		return passwordMaxLength;
	}

	public int getPasswordMinNumbericDigits()
	{
		return passwordMinNumbericDigits;
	}

	public int getMaxPasswordEntryAttempts()
	{
		return maxPasswordEntryAttempts;
	}

}
