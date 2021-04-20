import { AuthenticationFlowsProcessor } from "../core/authentication-flows-processor";
import * as url from 'url';
import * as express from 'express';
import {
    ACTIVATE_ACCOUNT_ENDPOINT,
    ERR_MSG, HASH_PARAM_NAME, RESTORE_PASSWORD_ENDPOINT,
    UTS_PARAM
} from "../types/flows-constatns";
import { AccountLockedError, AuthenticationAccountRepository, LinkExpiredError, PasswordAlreadyChangedError } from "..";
const debug = require('debug')('user-action-controller');
let app;

/**
 * Status code (423) indicating that the resource that is being accessed is locked
 */
const SC_LOCKED = 423;

export function config(config: {
    user_app: object,
    authenticationAccountRepository: AuthenticationAccountRepository,
}) {
    app = config.user_app;
    AuthenticationFlowsProcessor.instance.authenticationAccountRepository = config.authenticationAccountRepository;



    app.get('/login', function(req: express.Request, res: express.Response) {
        res.render('login');
    });

    app.post('/login', async function(req: express.Request, res: express.Response){
        let user;
        try {
            user = await AuthenticationFlowsProcessor.instance.authenticate(
                req.body.username,
                req.body.password,
                fullUrl(req));
        }
        catch(err) {
            if (err instanceof AccountLockedError) {
                debug(`note: caught AccountLockedError`);
                //redirect the user to "account has been locked" page:
                res
                    .status(SC_LOCKED)
                    .append(ERR_MSG, err.message)         //add to headers
                    .render('accountLockedPage');
                return;
            }

            debug(`authentication failed for ${req.body.username}`);
            req.session.error = 'Authentication failed, please check your '
                + ' username and password.';
            res
                .append(ERR_MSG, 'authentication failed')         //add to headers
                .redirect(401, '/login');
            return;
        }

        debug(user);

        // Regenerate session when signing in
        // to prevent fixation
        req.session.regenerate(function() {
            // Store the user's primary key
            // in the session store to be retrieved,
            // or in this case the entire user object
            req.session.user = user;
            req.session.success = 'Authenticated as ' + user.email
                + ' click to <a href="/logout">logout</a>. '
                + ' You may now access <a href="/restricted">/restricted</a>.';
            res.redirect('back');
        });
    });


    app.get('/logout', function(req: express.Request, res: express.Response) {
        // destroy the user's session to log them out
        // will be re-created next request
        req.session.destroy(function() {
            res.redirect('/');
        });
    });

    /**
     * The UI calls this method in order to get the password policy
     */
    app.get('/getPasswordConstraints', (req, res) => {
        debug('getPasswordConstraints');
        res.send('Hello getPasswordConstraints!')
    });

    /**
 	 * The UI calls this method in order to get the password policy
     */
    app.get('/createAccountPage', (req, res) => {
        res.render('createAccountPage', { [ERR_MSG]: null });
    });

    app.post('/createAccount', async (req: express.Request, res: express.Response) => {
        const requestBody = req.body;
        //debug(`createAccount requestBody ${JSON.stringify(requestBody)}`);
        try {
            await AuthenticationFlowsProcessor.instance.createAccount(
                requestBody.email,
                requestBody.password,
                requestBody.retypedPassword,
                requestBody.firstName,
                requestBody.lastName,
                fullUrl(req));
        }
        catch (e) {
            debug('ERROR: ', e);
            //back again to createAccountPage, but add error message:
            res
                .status(500)
                .append(ERR_MSG, e.message)         //add to headers
                .render('createAccountPage', { [ERR_MSG]: e.message });
            return;
        }
        res.render('accountCreatedSuccess', { email: requestBody.email });
    });

    app.get(ACTIVATE_ACCOUNT_ENDPOINT, async (req: express.Request, res: express.Response) => {
        debug('ActivateAccountEndpoint');
        try {
            await AuthenticationFlowsProcessor.instance.activateAccount(req.param(UTS_PARAM));
        }
        catch (e) {
            debug('ERROR: ', e);
            res
                .status(500)
                .append('err_msg', e.message)
                .render('errorPage', { [ERR_MSG]: e.message });
            return;
        }
        res.render('accountActivated');
    });


    /**
     * just like createAccount, this controller renders the forgot-password form:
     */
    app.get('/forgotPasswordPage', (req: express.Request, res: express.Response) => {
        res.render('forgotPasswordPage', { 'err_msg': null });
    });

    app.post('/forgotPassword', async (req: express.Request, res: express.Response) => {
        const requestBody = req.body;
        try {
            await AuthenticationFlowsProcessor.instance.forgotPassword(
                requestBody.email,
                fullUrl(req));
        }
        catch (e) {
            debug('ERROR: ', e);
            //back again to forgotPasswordPage, but add error message:
            res
                .status(500)
                .append(ERR_MSG, e.message)         //add to headers
                .render('forgotPasswordPage', { [ERR_MSG]: e.message });
            return;
        }
        res
            .render('passwordRestoreEmailSent', { email: requestBody.email });
    });

    app.get(RESTORE_PASSWORD_ENDPOINT, async (req: express.Request, res: express.Response) => {
        debug('Restore Password Endpoint');
        try {
            await AuthenticationFlowsProcessor.instance.validatePasswordRestoration(req.param(UTS_PARAM));
        }
        catch (err) {
            debug('ERROR: ', err);
            res
                .status(500)
                .append('err_msg', err.message)         //add to headers
                .render('errorPage', { [ERR_MSG]: err.message });
            return;
        }
        res
            .render('setNewPasswordPage', {
                [ERR_MSG]: null,
                [HASH_PARAM_NAME]: req.param(UTS_PARAM)
            });
    });

    app.post('/setNewPassword', async (req: express.Request, res: express.Response) => {

        debug('Set New Password Endpoint');
        try {
            await AuthenticationFlowsProcessor.instance.setNewPassword(
                req.body.enc,
                req.body.password,
                req.body.retypedPassword);
        }
        catch (e) {
            debug('ERROR: ', e);
            //back again to setNewPasswordPage, but add error message:
            res
                .status(500)
                .append(ERR_MSG, e.message)         //add to headers
                .render('setNewPasswordPage', {
                    [ERR_MSG]: e.message,
                    [HASH_PARAM_NAME]: req.body.enc
                });
            return;
        }
        res
            .render('passwordSetSuccess');
    });

    app.post('/deleteAccount', async (req: express.Request, res: express.Response) => {
        const requestBody = req.body;
        //debug(`createAccount requestBody ${JSON.stringify(requestBody)}`);
        try {
            await AuthenticationFlowsProcessor.instance.deleteAccount(
                requestBody.email,
                requestBody.password);
        }
        catch (e) {
            debug('ERROR: ', e);
            //back again to deleteAccountPage, but add error message:
            res
                .status(500)
                .render('deleteAccountPage', { [ERR_MSG]: e.message });
            return;
        }
        res
            .render('accountDeletedSuccess', { email: requestBody.email });
    });
}

export function fullUrl(req: express.Request): string {
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),      //host + port
//        pathname: req.originalUrl
        pathname: req.baseUrl
    });
}

