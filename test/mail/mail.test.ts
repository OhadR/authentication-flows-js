import { AuthenticationFlowsConfig } from "../../src";
import { sendEmail } from "../../src/interceptors/default-email-sender";

AuthenticationFlowsConfig.instance.emailSender = 'authentication.flows@ohadr.com';
AuthenticationFlowsConfig.instance.emailServerUser = '*******';
AuthenticationFlowsConfig.instance.emailServerPass = '*******';

sendEmail('ohad.redlich@intel.com', 'hello me!', 'url');