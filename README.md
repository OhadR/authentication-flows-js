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

## dependencies

* `crypto-js` - to encrypt user's password. and to encode verification emails that are sent to users.
* `express` - this module uses web-api for flows such create-account, forget-password, etc.
* `log4js` - logs.


## deploy 
* tsc
* npm version patch
* npm publish