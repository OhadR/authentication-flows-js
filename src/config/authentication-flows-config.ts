export class AuthenticationFlowsConfig {

    private static _instance: AuthenticationFlowsConfig;
    private _emailServerUser: string;
    private _emailServerPass: string;

    private constructor() {
    }

    public static get instance() {
        if( !AuthenticationFlowsConfig._instance )
            AuthenticationFlowsConfig._instance = new AuthenticationFlowsConfig();

        return AuthenticationFlowsConfig._instance;
    }

    public set emailServerUser(emailServerUser: string) {
        this._emailServerUser = emailServerUser;
    }

    public get emailServerUser(): string {
        return this._emailServerUser;
    }

    public set emailServerPass(emailServerPass: string) {
        this._emailServerPass = emailServerPass;
    }

    public get emailServerPass(): string {
        return this._emailServerPass;
    }
}
