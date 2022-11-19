"use strict";

const {assert, setTimeOut} = require('chai');
const Server = require('../lib/server');
const db = Server.db;

describe('Describe MySQL', function() {
	it(
		'Should establish database connection', 
		async function() {
			const [err] = await db.connect();

			assert.isNull(err);
		});
});