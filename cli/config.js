"use strict";

const path = require('path');
const _ = require('underscore');
const basePath = process.cwd();
const {writeFile} = require('fs/promises');
const envConfig = require('./env');
const Config = require('../lib/config');
const {Prompt} = require('./utils');

const Server = require('../lib/server');
Object.assign(Server, require('../lib/settings'));
Object.assign(Server, require('../lib/user'));

module.exports = async function(flag) {
	const config = Config();

	//if (_.isEmpty(config)) {
		// Create configuration file
		await writeFile(
			path.resolve(basePath, '.env'),
			envConfig(config)
		);

		//return;
	//}

	// Check database connection
	const [err] = await Server.db.connect();

	if (err) {
		throw err;
	}

	// Create or update database tables
	const type = Server.config('database');
	const {install_mysql_tables} = require('./install');

	if ('MySQL' === type) {
		await install_mysql_tables();
	}

	// Set default settings if not exist
	const settings = await Server.get_settings();

	// Set default settings but don't override
	// existing settings
	await maybe_set_setting(settings, 'name');
	await maybe_set_setting(settings, 'tagline');
	await maybe_set_setting(settings, 'lang');
	await maybe_set_setting(settings, 'adminEmail');

	// Maybe set administrator
	await Server.create_user({
		email: 'admin@local.local',
		group: 'administrator',
		status: 'active',
		pass: 'admin'
	});
}

async function maybe_set_setting(settings, name) {
	if (settings[name]) {
		return;
	}

	const [err] = await Server.set_setting(
		name,
		Server.config(name)
	);

	if (err) {
		Server.db.close();

		throw err;
	}
}