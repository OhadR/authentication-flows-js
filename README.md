# authentication-flows-js

[![npm Package](https://img.shields.io/npm/v/authentication-flows-js.svg?style=flat-square)](https://www.npmjs.org/package/authentication-flows-js)
[![build status](https://api.travis-ci.com/OhadR/authentication-flows-js.svg)](http://travis-ci.com/OhadR/authentication-flows-js)

### authentication-flows-js is a powerful and highly customizable framework that covers all flows that any express-based authentication-server needs.

[authentication-flows](https://github.com/OhadR/authentication-flows) for javascript

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
 
`authentication-flows-js` is a package that any express-based secured web applications can reuse, to get all the flows 
implemented, with a minimal set of configurations. 
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

### password policy

authentication-flows-js comes with a default set of configuration for the password policy (in 
`/config/authentication-policy-repository-config.json`). The hosting application can replace\edit the JSON file, and use 
its own preferred values. 

The password policy contains the following properties (with the following default values):

    passwordMinLength: 6,
    passwordMaxLength: 10,
    passwordMinUpCaseChars: 1,
    passwordMinLoCaseChars: 1,
    passwordMinNumbericDigits: 1,
    passwordMinSpecialSymbols: 1,
    passwordBlackList: ["password", "123456"],
    maxPasswordEntryAttempts: 5,
    passwordLifeInDays: 60

an example for a client-app can be found [here](https://github.com/OhadR/authentication-flows-js-app).

## `body-parser`

According to https://www.digitalocean.com/community/tutorials/use-expressjs-to-get-url-and-post-parameters, the client-app
MUST use body-parser in order to be able to parse the body params.
Thus, the `authentication-flows-js` can use:

        debug(`createAccount requestBody ${req.body}`);


## dependencies

* `express` - this module uses web-api for flows such create-account, forget-password, etc.
* `log4js` - logs.
* `nodemailer` - sending verification emails. version 4.7.0 and NOT latest: https://stackoverflow.com/questions/54385031/nodemailer-fails-with-connection-refused-using-known-good-smtp-server/54537119#54537119


## deploy 
* tsc
* npm version patch
* npm publish

## emails

This module sends verification emails. By default, it uses `nodemailer` and [SMTP2GO](https://www.smtp2go.com/),
but it makes sense that each application has its own mailing system. In addition, verification emails
may have the same look and feel of the hosting application. Hosing-application can have their own implementation by implementing `MailSender` interface.

## API
   
The AFM supports the below APIs:

This URL renders the login page that is sent to the user:

    GET
    /login

As mentioned earlier, the AFM manages also the authentication of the hosting application:
   
    POST
    /login
        username: string
        password: string
   
By calling the URL, the hosting application can get the password policy. e.g. constraints like length, number of Capital 
letters required, number of digits required etc. This way the UI can alert the user if the password he chooses does not meet 
the requirements, before the request is sent to the server.

    GET
    /getPasswordConstraints

renders the create account page that is sent to the user:
   
    GET 
    /createAccount
   
    POST 
    /createAccount
    
    GET
    /aa
    
    GET 
    /forgotPassword
    
    POST 
    /forgotPassword
    
    GET 
    /rp
    
    POST 
    /setNewPassword
    
    POST 
    /deleteAccount

## tests

all flows are tested very clearly using [Cucumber automated tests](https://github.com/OhadR/authentication-flows-js-automation).


## refs

https://softwareengineering.stackexchange.com/questions/424981/authentication-flows-for-secured-applications

https://www.smashingmagazine.com/2020/03/creating-secure-password-flows-nodejs-mysql/

## Questions? issues? something is missing?

Feel free to open issues here if you have any unclear matter or any other question.