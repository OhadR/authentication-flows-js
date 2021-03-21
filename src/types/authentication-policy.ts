export class AuthenticationPolicy {

	private static readonly DB_ITEMS_DELIMITER: string = ";";

	private readonly passwordMinLength: number;
	private readonly passwordMaxLength: number;
	private readonly passwordMinUpCaseChars: number;
	private readonly passwordMinLoCaseChars: number;
	private readonly passwordMinNumbericDigits: number;
	private readonly passwordMinSpecialSymbols: number;
	private readonly passwordBlackList: string[];
	private readonly maxPasswordEntryAttempts: number;
	private readonly passwordLifeInDays: number;
	private readonly rememberMeTokenValidityInDays: number;


	public constructor(passwordMinLength: number,
			passwordMaxLength: number,
			passwordMinUpCaseChars: number,
			passwordMinLoCaseChars: number,
			passwordMinNumbericDigits: number,
			passwordMinSpecialSymbols: number,
			passwordBlackList: string,
			maxPasswordEntryAttempts: number,
			passwordLifeInDays: number,
			rememberMeTokenValidityInDays: number)
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
		
		this.passwordBlackList = passwordBlackList.split(AuthenticationPolicy.DB_ITEMS_DELIMITER);

	}

	public getPasswordMinSpecialSymbols(): number
	{
		return this.passwordMinSpecialSymbols;
	}

	public getPasswordBlackList(): string[]
	{
		return this.passwordBlackList;
	}

	public getPasswordLifeInDays(): number
	{
		return this.passwordLifeInDays;
	}

	public getPasswordMinLength(): number
	{
		return this.passwordMinLength;
	}

	public getPasswordMinLoCaseChars(): number
	{
		return this.passwordMinLoCaseChars;
	}

	public getRememberMeTokenValidityInDays(): number
	{
		return this.rememberMeTokenValidityInDays;
	}

	public getPasswordMinUpCaseChars(): number
	{
		return this.passwordMinUpCaseChars;
	}

	public getPasswordMaxLength(): number
	{
		return this.passwordMaxLength;
	}

	public getPasswordMinNumbericDigits(): number
	{
		return this.passwordMinNumbericDigits;
	}

	public getMaxPasswordEntryAttempts(): number
	{
		return this.maxPasswordEntryAttempts;
	}

}
