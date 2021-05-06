import { AuthenticationUser } from "../interfaces/authentication-user";

export class AuthenticationUserImpl implements AuthenticationUser {
    constructor(
        private email: string,
        private encodedPassword: any,
        private isActive: boolean,
        private loginAttemptsLeft: number,
        private passwordLastChangeDate: Date,
        private firstName: string,
        private lastName: string,
        private authorities: string[],
        private token: string = null,
        private tokenDate: Date = null) {
    }

    getAuthorities(): string[] {
        return this.authorities;
    }

    getPassword(): string {
        return this.encodedPassword;
    }

    getUsername(): string {
        return this.email;
    }

    getFirstName(): string {
        return this.firstName;
    }

    getLastName(): string {
        return this.lastName;
    }

    getLoginAttemptsLeft(): number {
        return this.loginAttemptsLeft;
    }

    getPasswordLastChangeDate(): Date {
        return this.passwordLastChangeDate;
    }

    isEnabled(): boolean {
        return this.isActive;
    }

    getToken(): string {
        return this.token;
    }

    getTokenDate(): Date {
        return this.tokenDate;
    }
}