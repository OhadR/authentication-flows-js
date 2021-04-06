export class AuthenticationFlowsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MyError';
    }
}

export class AccountLockedError extends Error {

}

export class PasswordAlreadyChangedError extends Error {

}

export class LinkExpiredError extends Error {

}



