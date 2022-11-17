"use strict";

exports.randomSalt = function(bytes = 16, length = 64, format = 'base64') {
	const crypto = require('crypto');

    return crypto.randomBytes(bytes)
        .toString(format)
        .slice( 0, length );
}