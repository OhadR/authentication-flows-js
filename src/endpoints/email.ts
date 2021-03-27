import { AuthenticationFlowsConfig, AuthenticationFlowsError } from "..";
import * as nodemailer from 'nodemailer';
const debug = require('debug')('email');

export async function sendEmail(recipient: string,
    subject: string,
    url: string) {
    debug( 'sending email from: ' + AuthenticationFlowsConfig.instance.emailSender );

    try {
        const transporter = nodemailer.createTransport({
            host: "mail.smtp2go.com",
            port: 2525,
            auth: {
                user: AuthenticationFlowsConfig.instance.emailServerUser,
                pass: AuthenticationFlowsConfig.instance.emailServerPass
            }
        });

        const mailOptions = {
            from: AuthenticationFlowsConfig.instance.emailSender,
            to: recipient,
            // from: '"Fred Foo 👻" <foo@example.com>', // sender address
            // to: "bar@example.com, baz@example.com", // list of receivers
            subject,
            text: url
        };

        await transporter.sendMail(mailOptions);
        debug( 'email was sent successfully.' );
    }
    catch (me) {
        debug( me );
        throw new AuthenticationFlowsError( me );
    }
}