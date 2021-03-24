import { AuthenticationFlowsProcessorImpl } from "../core/authentication-flows-processor-impl";
import { LOGIN_FORMS_DIR } from "../types/flows-constatns";

const debug = require('debug')('user-action-controller');
//const express = require('express');
let app;

export function config(user_app) {
    app = user_app;

    /**
     * The UI calls this method in order to get the password policy
     */
    app.get('/getPasswordConstraints', (req, res) => {
        debug('getPasswordConstraints');
        res.send('Hello getPasswordConstraints!')
    });

    app.post('/createAccount', (req, res) => {
        const requestBody = req.body;
        debug(`createAccount requestBody ${JSON.stringify(requestBody)}`);
        try {
            AuthenticationFlowsProcessorImpl.instance.createAccount(
                requestBody.email,
                requestBody.password,
                requestBody.retypedPassword,
                requestBody.firstName,
                requestBody.lastName,
                requestBody.path);
        }
        catch (e) {
            debug('ERROR: ', e);
            
        }

//        res.redirect(LOGIN_FORMS_DIR + "/accountCreatedSuccess.jsp");
//        res.redirect("accountCreatedSuccess.html");
        res.render('accountCreatedSuccess', { email: requestBody.email });
    });
}

