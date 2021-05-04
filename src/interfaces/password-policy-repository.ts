import { AuthenticationPolicy } from "../types/authentication-policy";

export interface PasswordPolicyRepository {

	getDefaultAuthenticationPolicy(): AuthenticationPolicy;
	getAuthenticationPolicy(settingsId: number): AuthenticationPolicy;
}
