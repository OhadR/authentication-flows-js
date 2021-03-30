import { AuthenticationFlowsProcessorImpl } from "../core/authentication-flows-processor-impl";
import * as url from 'url';
import * as express from 'express';
import { UTS_PARAM } from "../types/flows-constatns";
import { AuthenticationAccountRepository } from "..";
const debug = require('debug')('user-action-controller');
let app;

export function config(config: {
    user_app: object,
    authenticationAccountRepository: AuthenticationAccountRepository
}) {
    app = config.user_app;
    AuthenticationFlowsProcessorImpl.instance.authenticationAccountRepository = config.authenticationAccountRepository;

    /**
     * The UI calls this method in order to get the password policy
     */
    app.get('/getPasswordConstraints', (req, res) => {
        debug('getPasswordConstraints');
        res.send('Hello getPasswordConstraints!')
    });

    app.post('/createAccount', async (req: express.Request, res) => {
        const requestBody = req.body;
        debug(`createAccount requestBody ${JSON.stringify(requestBody)}`);
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
            
        }
        res.render('accountCreatedSuccess', { email: requestBody.email });
    });

    app.get('/aa', (req: express.Request, res) => {
        debug('ActivateAccountEndpoint');
        try {
            AuthenticationFlowsProcessorImpl.instance.activateAccount(req.param(UTS_PARAM));
        }
        catch (e) {
            debug('ERROR: ', e);
        }
        res.redirect('accountActivated');
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

