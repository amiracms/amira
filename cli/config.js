"use strict";

const [,,,flag] = process.argv;
const path = require('path');
const basePath = process.cwd();
const {writeFile} = require('fs/promises');
const envConfig = require('./env');
const Config = require('../lib/config');
const {Prompt} = require('./utils');

module.exports = async function() {
	const isSilent = '-y' === flag;
	const config = Config();
	const isUpdate = config && config.name;

	console.log('Generating configuration file.')

	if (isSilent) {
		// Create 
		await writeFile(
			path.resolve(basePath, '.env'),
			envConfig(config)
		);

		const newConfig = Config();

		console.log(newConfig);

		return;
	}

	await Prompt({
		host: {
			label: 'Hostname where the application listens to',
			value: 'localhost'
		},
		port: {
			label: 'The port number where the application runs to',
			value: 80
		},
		ssl: {
			label: 'Use SSL? (enter \'y\' or \'n\')',
			callback() {
				if (!config.ssl || 'n' === config.ssl) {
					// Clear previous ssl data
					config.ssl = false;
					config.ssl_key = '';
					config.ssl_cert = '';
					config.ssl_ca = '';
					return;
				}

				// Change ssl value
				config.ssl = true;

				console.log('The absolute location where the SSL certificates reside.');

				return Prompt({
					ssl_key: {
						label: 'SSL Key'
					},
					ssl_cert: {
						label: 'SSL Cert'
					},
					ssl_ca: {
						label: 'SSL_CA'
					}
				}, config)
			}
		},
		name: {
			label: 'Application Name'
		},
		tagline: {
			label: 'Brief Description'
		},
		adminEmail: {
			label: 'Admin Email Address'
		}
	}, config);
}