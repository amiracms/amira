"use strict";

const {i18n} = require('./lang');

/**
 * Creates new error object with error code.
 * 
 * @param {string} message
 *      The error message.
 * @param {string} code
 *      The unique error code.
 * @return {object<Error>}
 **/
exports.setError = function(message, code) {
    const err = new Error(message);
    err.code = code;

    // todo: Log error

    return err;
}

exports.randomSalt = function(bytes = 16, length = 64, format = 'base64') {
	const crypto = require('crypto');

    return crypto.randomBytes(bytes)
        .toString(format)
        .slice( 0, length );
}

const crypto = require('crypto');

exports.generateHashKey = function(uniqKey) {
    const SECRET_KEY = exports.randomSalt(64, 32, 'hex').toString();

    return new Promise(res => {
        let iv = crypto.randomBytes(16),
            secretKey = Buffer.from(SECRET_KEY),
            cipher = crypto.createCipheriv('aes-256-cbc', secretKey, iv );

        cipher.on('readable', () => {
            let key = cipher.read();

            if ( ! key ) {
                return res([exports.setError(
                    i18n('Something went wrong. Unable to generate hash key.'),
                    'system_error')
                ]);
            }

            key = [iv.toString('base64'), key.toString('base64'), SECRET_KEY];

            res([null, key.join(';)')]);
        });

        cipher.write(uniqKey);
        cipher.end();
    });
}

exports.isHashKey = function(hash) {
    return hash && 3 === hash.split(";)").length;
}

exports.decryptHashKey = function(hash) {
    return new Promise( res => {
        if (!exports.isHashKey(hash)) {
            return res([exports.setError('Invalid arguments!')]);
        }

        let _hash = hash.split(';)'),
            secretKey = Buffer.from(_hash[2]),
            iv, encrypt;

        iv = Buffer.from(_hash[0], 'base64');
        encrypt = Buffer.from(_hash[1], 'base64');

        let decipher = crypto.createDecipheriv('aes-256-cbc', secretKey, iv );

        decipher.on('readable', () => {
            let match = decipher.read();

            if(!match) {
                return res([exports.setError(
                    i18n('Something went wrong. Unable to decrypt the given hash!'),
                    'system_error')
                ]);
            }

            match = match.toString();

            res([null, match]);
        });
        decipher.write(encrypt);
        decipher.end();
    });
}

/**
 * Stringify an object.
 * 
 * @param {*} value
 *      The value to stringify to.
 * @return {*}
 **/
exports.serialize = function(value) {
    try {
        return JSON.stringify(value);
    } catch(e) {
        return value;
    }
}

/**
 * Parse a string to transform into an object.
 * 
 * @param {*} value
 *      The value to parse to.
 * @return {*}
 **/
exports.unserialize = function(value) {
    try {
        return JSON.parse(value);
    } catch(e) {
        return value;
    }
}