import { AuthenticationUser } from "..";

export class AuthenticationUserImpl implements AuthenticationUser {
    constructor(
        email: string,
        encodedPassword: any,
        isActive: boolean,
        maxPasswordEntryAttempts: number,
        passwordLastChangeDate: Date,
        firstName: string,
        lastName: string,
        authorities: string[]) {

    }

    getFirstName(): string {
        return "";
    }

    getLastName(): string {
        return "";
    }

    getLoginAttemptsLeft(): number {
        return 0;
    }

    getPasswordLastChangeDate(): Date {
        return undefined;
    }

    isEnabled(): boolean {
        return false;
    }

}

