import { AuthenticationPolicy } from "../types/authentication-policy";

export interface AuthenticationPolicyRepository {

	getDefaultAuthenticationPolicy(): AuthenticationPolicy;
	getAuthenticationPolicy(settingsId: number): AuthenticationPolicy;
}
