// Defining a text to be encrypted
import {
    encryptString,
    decryptString,
    generateKeyFile, shaString
} from "../../src";
import * as crypto from 'crypto';

//generate the key file:
generateKeyFile();

const plainText = "ohad redlich is the man";

// Prints plain text
console.log("Plaintext: ", plainText);

// Defining encrypted text
const encrypted = encryptString(plainText);

// Prints encrypted text
console.log("Encrypted: ", encrypted);

const decrypted = decryptString(encrypted);
console.log("Decrypted: ", decrypted);

const a = encryptString('plainText');
const b = encryptString('plainText');
const c = encryptString('plainText');
console.log(`pass encrypted 1: ${ a }`);
console.log(`pass encrypted 2: ${ b }`);
console.log(`pass encrypted 2: ${ c }`);
console.log(`decrypted 1: ${ decryptString(a) }`);
console.log(`decrypted 2: ${ decryptString(b) }`);
console.log(`decrypted 3: ${ decryptString(c) }`);


//testSymetryBase64();
function testSymetryBase64() {
    const b1 = Buffer.from('plainText').toString('base64');     //default is utf8
    const b2 = Buffer.from('plainText', 'utf8').toString('base64');
    const b3 = Buffer.from('plainText', 'utf8').toString('base64');
    console.log(`b1: ${b1}`);
    console.log(`b2: ${b2}`);
    console.log(`b3: ${b3}`);
    console.log(`decrypted 1: ${Buffer.from(b1, 'base64')}`);
}

testSHA256();
function testSHA256() {
    const hashed = shaString('ohad redlich is the man of crypto!!');
    const hashed2 = shaString('ohad redlich is the man of crypto!!');
    console.log(`hashed1: ${hashed}`);
    console.log(`hashed2: ${hashed2}`);
}