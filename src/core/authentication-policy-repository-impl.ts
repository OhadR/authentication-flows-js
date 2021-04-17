import { AuthenticationPolicyRepository } from "../interfaces/authentication-policy-repository";
import { AuthenticationPolicy } from "../types/authentication-policy";

const config = require('../config/authentication-flows-config.json');

export class AuthenticationPolicyRepositoryImpl implements AuthenticationPolicyRepository {
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