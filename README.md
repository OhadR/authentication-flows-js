# authentication-flows-js

[authentication-flows](https://github.com/OhadR/authentication-flows) for javascript

[npm](https://www.npmjs.com/package/authentication-flows-js)

## motivation

Every secured web application should support these flows - unless it delegates the authentication to a third party
(such as oAuth2.0). Thus, we end up in the same code written again and again. 

The `authentication-flows-js` module implements all authentication flows: 

 * authentication
 * create account, 
 * forgot password, 
 * change password by user request, 
 * force change password if password is expired,
 * locks the accont after pre-configured login failures.
 
`authentication-flows-js` is a package that can be reused, so any secured web applications can add this package as 
a dependency, to get all the flows implemented, with a minimal set of configurations. 
This way developers can concentrate on developing the core of their app, instead of messing around with flows that are
definitely not the core of their business.
 

Find [here](here) all required configurations, API and more.
 

## configuration

### repository adapters

The client-app passes the repository-adapters (**TODO: elaborate**).  

### express server object

This module *reuses* that client-app' express server and adds several endpoints to it (e.g. `/createAccount`).
Thus, the client-app should pass authentication-flows-js its server object (example below).


    const app = module.exports = express();
    var authentication-flows-js = require('authentication-flows-js');
    authentication-flows-js.config(
        config: {
            user_app: app, 
            authenticationAccountRepository: inmemRepo
        });

an example for a client-app can be found [here](https://github.com/OhadR/authentication-flows-js-app).

## `body-parser`

According to https://www.digitalocean.com/community/tutorials/use-expressjs-to-get-url-and-post-parameters, the client-app
MUST use body-parser in order to be able to parse the body params.
Thus, the `authentication-flows-js` can use:

        debug(`createAccount requestBody ${req.body}`);


## dependencies

* **TODO** `crypto` - to encrypt user's password. and to encode verification emails that are sent to users.
* `express` - this module uses web-api for flows such create-account, forget-password, etc.
* `log4js` - logs.
* `nodemailer` - sending verification emails. version 4.7.0 and NOT latest: https://stackoverflow.com/questions/54385031/nodemailer-fails-with-connection-refused-using-known-good-smtp-server/54537119#54537119


## deploy 
* tsc
* npm version patch
* npm publish

## emails

This module sends verification emails. By default, it uses `nodemail`er` and [SMTP2GO](https://www.smtp2go.com/),
but it makes sense that each client-app will has its own mailing system, plus verification emails
can have the same look and feel of the hosting application.

Client-app can easily override the `sendEmail()` function.

## tests

all flows are tested very clearly using [Cucumber automated tests](https://github.com/OhadR/authentication-flows-js-automation).


## refs

https://softwareengineering.stackexchange.com/questions/424981/authentication-flows-for-secured-applications