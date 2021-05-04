import { PasswordPolicyRepository } from "../interfaces/password-policy-repository";
import { AuthenticationPolicy } from "../types/authentication-policy";

//load the json file with the policy:
const config = require('../../config/authentication-policy-repository-config.json');

export class PasswordPolicyRepositoryImpl implements PasswordPolicyRepository {
    public getAuthenticationPolicy(settingsId: number): AuthenticationPolicy {
        const policy: AuthenticationPolicy = new AuthenticationPolicy(
            config.passwordMinLength,
            config.passwordMaxLength,
            config.passwordMinUpCaseChars,
            config.passwordMinLoCaseChars,
            config.passwordMinNumbericDigits,
            config.passwordMinSpecialSymbols,
            config.passwordBlackList,
            config.maxPasswordEntryAttempts,
            config.passwordLifeInDays);
        return policy;
    }

    public getDefaultAuthenticationPolicy(): AuthenticationPolicy {
        return this.getAuthenticationPolicy(0);
    }

}