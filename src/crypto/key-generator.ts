// Node.js program to demonstrate the
// crypto.publicEncrypt() method

// Including crypto and fs module
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from "path";
const debug = require('debug')('authentication-flows:crypto');

const PUBLIC_KEY_FILE_NAME = "auth_flows_js_public_key";
const PRIVATE_KEY_FILE_NAME = "auth_flows_js_private_key";

export function generateKeyFile() {
    debug('generating key files...');
    const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 520,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: ''
        }
    });

    // Creating public key file
    fs.writeFileSync(PUBLIC_KEY_FILE_NAME, keyPair.publicKey);
    fs.writeFileSync(PRIVATE_KEY_FILE_NAME, keyPair.privateKey);
}

/**
 * encrypt string and then encode-base64
 * @param plaintext
 */
export function encryptString (plaintext: string): string {
    return _encryptString(plaintext, path.join(".", PUBLIC_KEY_FILE_NAME));
}

export function decryptString (encryptedText: string): string {
    return _decryptString(encryptedText, path.join(".", PRIVATE_KEY_FILE_NAME));
}

export function shaString(data: string): string {
    return crypto
        .createHash('sha256')
        .update(data)
        .digest('base64');
}

export function randomString(): string {
    return crypto.randomBytes(20).toString('hex');
}

/**
 * encrypt string and then encode-base64
 * @param plaintext
 * @param publicKeyFile
 * @private
 */
function _encryptString (plaintext: string, publicKeyFile: string): string {
    const publicKey = fs.readFileSync(publicKeyFile, 'utf8');

    // publicEncrypt() method with its parameters
    const encrypted = crypto.publicEncrypt(
        {
            key: publicKey,
//            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING
        },
        Buffer.from(plaintext, 'utf8'));
    const based64EncryptedContent: string = encrypted.toString('base64');
    //debug(based64EncryptedContent);
    //instead of encodeURI(), just replace the '+' to '.':
    return based64EncryptedContent.replace(/\+/g, '.');
}

function _decryptString (encryptedText: string, privateKeyFile): string {
    //first, instead of decodeURI(), just replace the '.' to '+':
    encryptedText = encryptedText.replace(/\./g, '+');
    //debug(encryptedText);
    const privateKey = fs.readFileSync(privateKeyFile, 'utf8');
    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey.toString(),
            passphrase: '',
//            padding: crypto.constants.RSA_PKCS1_PADDING
        },
        Buffer.from(encryptedText, 'base64'));
    return decrypted.toString("utf8");
}


