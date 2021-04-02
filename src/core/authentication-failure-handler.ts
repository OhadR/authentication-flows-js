import { AccountState, fullUrl } from "..";
import { express } from 'express';
import { AuthenticationFlowsProcessorImpl } from "./authentication-flows-processor-impl";
import { ERR_MSG } from "../types/flows-constatns";

const debug = require('debug')('authentication-failure-handler');

/**
 * Status code (423) indicating that the resource that is being accessed is locked
 */
const SC_LOCKED = 423;


export async function onAuthenticationFailure(
    req: express.Request,
    res: express.Response,
    username: string) {

    debug(`login failed for user: ` + username);

    //notify the processor (that updates the DB):
    await AuthenticationFlowsProcessorImpl.instance.setLoginFailureForUser(username);
    const state: AccountState = await AuthenticationFlowsProcessorImpl.instance.getAccountState(username);

    if( state == AccountState.LOCKED ) {
        debug(`Account has been locked out for user: ${username} due to exceeding number of attempts to login.`);

        const serverPath: string = fullUrl(req);
        await AuthenticationFlowsProcessorImpl.instance.sendUnlockAccountMail(username, serverPath);

        //redirect the user to "account has been locked" page:
        res
            .status(SC_LOCKED)
            .render('accountLockedPage', { [ERR_MSG]: e.message });
        return;
    }

    throw new Error('bad credentials');
}
