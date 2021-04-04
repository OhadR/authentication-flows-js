export class AuthenticationFlowsError extends Error {
    constructor(message) {
        super(message);
        this.name = 'MyError';
    }
}

export class AccountLockedError extends Error {

}