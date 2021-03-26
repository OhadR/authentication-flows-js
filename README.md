# authentication-flows-js

[authentication-flows](https://github.com/OhadR/authentication-flows) for javascript

[npm](https://www.npmjs.com/package/authentication-flows-js)

## motivation
 
## configuration

This module reuses that client-app' express server and adds several endpoints to it (such as /createAccount, for example).
Thus, the client-app should pass authentication-flows-js its server object, like:  

    const app = module.exports = express();
    var authentication-flows-js = require('authentication-flows-js');
    authentication-flows-js.config_test_wip(app);

an example for a client-app can be found [here](https://github.com/OhadR/authentication-flows-js-app).

## `body-parser`

According to https://www.digitalocean.com/community/tutorials/use-expressjs-to-get-url-and-post-parameters, the client-app
MUST use body-parser in order to be able to parse the body params.
Thus, the `authentication-flows-js` can use:

        debug(`createAccount requestBody ${req.body}`);


## dependencies

* `crypto` - to encrypt user's password. and to encode verification emails that are sent to users.
* `express` - this module uses web-api for flows such create-account, forget-password, etc.
* `log4js` - logs.
* `nodemailer` - sending verification emails. version 4.7.0 and NOT latest: https://stackoverflow.com/questions/54385031/nodemailer-fails-with-connection-refused-using-known-good-smtp-server/54537119#54537119


## deploy 
* tsc
* npm version patch
* npm publish