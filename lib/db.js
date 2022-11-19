"use strict";

const _ = require('underscore');

module.exports = function() {
	const config = require('./config')();
	const type = config.database;

	switch(type) {
		case 'MySQL' :
			const MySQL = require('./mysql');
			const mysql = pickData(config, /^MySQL_/);
			mysql.prefix = config.prefix;

			return new MySQL(mysql);
	}
}

function pickData(obj, prefix) {
	const entries = Object.entries(obj)
			.filter(([a, b]) => a.match(prefix))
			.map(([a,b]) => {
				
				return [a.replace(prefix, '').toLowerCase(),b];
			});

	return Object.fromEntries(entries);
}