// Defining a text to be encrypted
import { encryptString,
    decryptString,
    generateKeyFile } from "../../src";

//generate the key file:
generateKeyFile();

const plainText = "ohad redlich is the man";

// Defining encrypted text
const encrypted = encryptString(plainText);

// Prints plain text
console.log("Plaintext:", plainText);

// Prints encrypted text
console.log("Encrypted: ", encrypted);

const decrypted = decryptString(encrypted);
console.log("Decrypted: ", decrypted);
