"use strict";

const path = require('path');
const basePath = process.cwd();
const dotenv = require('dotenv');
const _ = require('underscore');

module.exports = function() {
	const config = dotenv.config({path: path.resolve(basePath, ".env")});

	if (!config || config.error) {
		return {};
	}

    let configData = config.parsed && _.pick(config.parsed, v => !!v);

    // Get ssl cert if ssl is true
    if (configData.ssl) {
    	configData.ssl = {
    		key: configData.ssl_key||process.env.ssl_key,
    		cert: configData.ssl_cert||process.env.ssl_cert
    	};
    }

    return configData;
}