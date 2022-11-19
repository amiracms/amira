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

    let configData = toConfig(config.parsed);

    // Get ssl cert if ssl is true
    if (configData.ssl) {
    	configData.ssl = {
    		key: configData.ssl_key||process.env.ssl_key,
    		cert: configData.ssl_cert||process.env.ssl_cert
    	};
    }

    return configData;
}

function toConfig(config) {
	const orig = Object.entries(config)
			.filter(([a,b]) => !!b)
			.map(([name, value]) => {
				// Transform true|false into boolean
				if ('false' === value || 'true' === value) {
					value = 'true' === value ? true : false;
				}

				return [name, value];
			});

	return Object.fromEntries(orig);
}