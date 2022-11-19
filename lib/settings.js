"use strict";

const Server = require('./server');
const {serialize, unserialize} = require('./utils');

/**
 * Sets or updates setting in the database.
 * 
 * @param {string} name
 * 	Required. The unique setting name.
 * @param {*} value
 * 	The corresponding value of the given setting name.
 * @return {Promise<[Error, Boolean]>}
 **/
exports.set_setting = async function(name, value) {
	// Check previous setting value
	const [, oldValue] = await Server.db.get_row('settings', {name});

	if (oldValue && oldValue.name) {
		// Do an update instead
		return Server.db.update(
			'settings',
			{value: serialize(value)},
			{name}
		);
	}

	return Server.db
		.insert(
		'settings',
		{name, value: serialize(value)}
		);
}

/**
 * Removes setting from the database.
 * 
 * @param {string} name
 * 	The name of the setting to remove to.
 * @return {Promise<[Error, Boolean]>}
 **/
exports.unset_setting = function(name) {
	return Server.db.delete('settings', {name});
}

/**
 * Retrieve the setting value of the given name.
 * 
 * @param {string} name
 * 	The setting name to get the value to.
 * @return {Promise<*>}
 **/
exports.get_setting = async function(name) {
	const value = await Server.db.get_var(
		'settings',
		'value',
		{name}
	);

	return value && unserialize(value);
}

/**
 * Retrieve all settings stored in the database.
 * 
 * @return {Promise<Object>}
 **/
exports.get_settings = async function() {
	const [err, settings = []] = await Server.db.get({table: 'settings'});

	return settings.reduce(
		(d, {name, value}) => {
			d[name] = value && unserialize(value);

			return d;
		},
		{})
}