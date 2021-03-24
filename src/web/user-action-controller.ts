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
        const requestParams = req.params;
        debug(`createAccount requestParams ${JSON.stringify(requestParams)}`);
        res.send('Hello createAccount!')
    });
}

