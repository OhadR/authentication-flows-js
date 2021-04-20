import { DefaultMailSenderImpl } from "../../src/interceptors/default-email-sender";

new DefaultMailSenderImpl().sendEmail('ohad.redlich@intel.com', 'hello me!', 'url');