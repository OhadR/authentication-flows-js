import { AuthenticationFlowsError } from "..";
import * as nodemailer from 'nodemailer';
import { MailSender } from "../interfaces/mail-sender";
const debug = require('debug')('authentication-flows:email');

export class DefaultMailSenderImpl implements MailSender {

    async sendEmail(recipient: string,
              subject: string,
              url: string) {
        debug('sending email from: ' + process.env.emailSender);

        try {
            const transporter = nodemailer.createTransport({
                host: process.env.smtpServer,
                port: process.env.smtpPort,
                auth: {
                    user: process.env.emailServerUser,
                    pass: process.env.emailServerPass
                }
            });

            const mailOptions = {
                from: process.env.emailSender,
                to: recipient,
                // from: '"Fred Foo 👻" <foo@example.com>', // sender address
                // to: "bar@example.com, baz@example.com", // list of receivers
                subject,
                text: url
            };

            await transporter.sendMail(mailOptions);
            debug('email was sent successfully.');
        } catch (me) {
            debug(me);
            throw new AuthenticationFlowsError(me);
        }
    }
}