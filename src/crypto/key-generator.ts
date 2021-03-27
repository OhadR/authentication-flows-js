// Node.js program to demonstrate the
// crypto.publicEncrypt() method

// Including crypto and fs module
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from "path";

const PUBLIC_KEY_FILE_NAME = "auth_flows_js_public_key";

export function generateKeyFile() {
    return _generateKeyFile(PUBLIC_KEY_FILE_NAME);
}


function _generateKeyFile(publicKeyFile) {
    const keyPair = crypto.generateKeyPairSync('rsa', {
        modulusLength: 520,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem'
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: ''
        }
    });

    // Creating public key file
    fs.writeFileSync(publicKeyFile, keyPair.publicKey);
}

/**
 * encrypt string and then encode-base64
 * @param plaintext
 */
export function encryptString (plaintext): string {
    return _encryptString(plaintext, path.join(".", PUBLIC_KEY_FILE_NAME));
}

/**
 * encrypt string and then encode-base64
 * @param plaintext
 * @param publicKeyFile
 * @private
 */
function _encryptString (plaintext, publicKeyFile): string {
    const publicKey = fs.readFileSync(publicKeyFile, "utf8");

    // publicEncrypt() method with its parameters
    const encrypted = crypto.publicEncrypt(
        publicKey, Buffer.from(plaintext));
    return encrypted.toString("base64");
}

/*
function _encryptIntAndString (arg1, arg2, publicKeyFile): string {
    const publicKey = fs.readFileSync(publicKeyFile, "utf8");

    // publicEncrypt() method with its parameters
    const encrypted = crypto.publicEncrypt(
        publicKey, Buffer.from(plaintext));
    return encrypted.toString("base64");
}
*/


