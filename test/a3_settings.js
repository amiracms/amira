"use strict";

const chai = require('chai');
const assert = chai.assert;
const should = chai.should();
const Server = require('../lib/server');

describe('Describe Settings', function() {
	it(
		'Should set new setting',
		async function() {
			const [err] = await Server.set_setting('test', 1);

			assert.isNull(err);
		});

	it(
		'Should get setting value',
		async function() {
			const value = await Server.get_setting('test');

			value.should.equal(1);
		});

	it(
		'Should update setting value',
		async function() {
			const [err] = await Server.set_setting('test', 2);

			assert.isNull(err);

			const value = await Server.get_setting('test');

			value.should.equal(2);
		})

	it(
		'Should delete setting',
		async function() {
			const [err] = await Server.unset_setting('test');

			assert.isNull(err);

			const value = await Server.get_setting('test');

			assert.isUndefined(value);
		});

	it(
		'Should get all settings',
		async function() {
			const all = await Server.get_settings();

			all.should.be.a('object');
		})
})