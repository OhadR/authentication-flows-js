import { AuthenticationFlowsProcessorImpl } from "../core/authentication-flows-processor-impl";
import * as url from 'url';
import * as express from 'express';
import { ERR_MSG, UTS_PARAM } from "../types/flows-constatns";
import { AuthenticationAccountRepository, LinksRepository } from "..";
const debug = require('debug')('user-action-controller');
let app;

export function config(config: {
    user_app: object,
    authenticationAccountRepository: AuthenticationAccountRepository,
    linksRepository: LinksRepository
}) {
    app = config.user_app;
    AuthenticationFlowsProcessorImpl.instance.authenticationAccountRepository = config.authenticationAccountRepository;
    AuthenticationFlowsProcessorImpl.instance.linksRepository = config.linksRepository;


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
            await AuthenticationFlowsProcessorImpl.instance.createAccount(
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
                .render('createAccountPage', { [ERR_MSG]: e.message });
            return;
        }
        res
            .append('verification_link','is the man')
            .render('accountCreatedSuccess', { email: requestBody.email });
    });

    app.get('/aa', async (req: express.Request, res) => {
        debug('ActivateAccountEndpoint');
        try {
            await AuthenticationFlowsProcessorImpl.instance.activateAccount(req.param(UTS_PARAM));
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


    app.post('/forgotPassword', async (req: express.Request, res: express.Response) => {
        const requestBody = req.body;
        try {
            await AuthenticationFlowsProcessorImpl.instance.forgotPassword(
                requestBody.email,
                fullUrl(req));
        }
        catch (e) {
            debug('ERROR: ', e);
            //back again to forgotPasswordPage, but add error message:
            res
                .status(500)
                .render('forgotPasswordPage', { [ERR_MSG]: e.message });
            return;
        }
        res
            .render('passwordRestoreEmailSent', { email: requestBody.email });
    });

    app.post('/deleteAccount', async (req: express.Request, res: express.Response) => {
        const requestBody = req.body;
        //debug(`createAccount requestBody ${JSON.stringify(requestBody)}`);
        try {
            await AuthenticationFlowsProcessorImpl.instance.deleteAccount(
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

function fullUrl(req: express.Request): string {
    return url.format({
        protocol: req.protocol,
        host: req.get('host'),      //host + port
//        pathname: req.originalUrl
        pathname: req.baseUrl
    });
}

