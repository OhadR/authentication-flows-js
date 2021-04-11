export class AuthenticationFlowsConfig {

    private static _instance: AuthenticationFlowsConfig;
    private _emailSender: string;

    private constructor() {
    }

    public static get instance() {
        if( !AuthenticationFlowsConfig._instance )
            AuthenticationFlowsConfig._instance = new AuthenticationFlowsConfig();

        return AuthenticationFlowsConfig._instance;
    }

    public set emailSender(emailSender: string) {
        this._emailSender = emailSender;
    }

    public get emailSender(): string {
        return this._emailSender;
    }
}

