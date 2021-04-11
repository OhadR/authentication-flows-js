export interface MailSender {
    sendEmail(
        recipient: string,
        subject: string,
        url: string);
}