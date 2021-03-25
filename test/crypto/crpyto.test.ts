// Defining a text to be encrypted
import { encryptString } from "../..";

const plainText = "GfG";

// Defining encrypted text
const encrypted = encryptString(plainText);

// Prints plain text
console.log("Plaintext:", plainText);

// Prints encrypted text
console.log("Encrypted: ", encrypted);