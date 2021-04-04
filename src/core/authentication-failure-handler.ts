import { AccountLockedError, AccountState } from "..";
import { AuthenticationFlowsProcessorImpl } from "./authentication-flows-processor-impl";

const debug = require('debug')('authentication-failure-handler');

export async function onAuthenticationFailure(
    username: string,
    serverPath: string) {

    debug(`login failed for user: ` + username);

    //notify the processor (that updates the DB):
    await AuthenticationFlowsProcessorImpl.instance.setLoginFailureForUser(username);
    const state: AccountState = await AuthenticationFlowsProcessorImpl.instance.getAccountState(username);

    if( state == AccountState.LOCKED ) {
        debug(`Account has been locked out for user: ${username} due to exceeding number of attempts to login.`);

        await AuthenticationFlowsProcessorImpl.instance.sendUnlockAccountMail(username, serverPath);
        throw new AccountLockedError();
    }

    throw new Error('bad credentials');
}
