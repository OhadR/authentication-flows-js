const debug = require('debug')('user-action-controller');
const express = require('express');
let app;

export function config_test_wip(user_app) {
    app = user_app;

    app.get('/createAccountPage', (req, res) => {
        debug('yo yo i am here!');
        res.send('Hello World!')
    });
}

