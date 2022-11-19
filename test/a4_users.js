"use strict";

const chai = require('chai');
const assert = chai.assert;
const should = chai.should();
const Server = require('../lib/server');

describe('Describe Users & User Meta', function() {
	let userId;

	it(
		'Should create new user',
		async function() {
			const [err, Id] = await Server.create_user({
				email: 'test@local.local',
				group: 'administrator',
				pass: 'tester'
			});

			assert.isNull(err);

			userId = Id;

			Id.should.be.a('number');
		});

	it(
		'Should update user data',
		async function() {
			const [err] = await Server.update_user({
				Id: userId,
				status: 'active'
			});

			assert.isNull(err);

			const [, user] = await Server.get_user(userId);

			user.should.be.an('object');
			user.status.should.equal('active');
		})

	it(
		'Should set user meta data',
		async function() {
			const [err] = await Server.set_user_meta(userId, 'me', 'u');

			assert.isNull(err);
		});

	it(
		'Should get user meta',
		async function() {
			const value = await Server.get_user_meta(userId, 'me');

			value.should.equal('u');

			const meta = await Server.get_user_meta(userId);

			meta.should.be.an('object');
		});

	it(
		'Should delete user meta',
		async function() {
			const [err] = await Server.unset_user_meta(userId, 'me');

			assert.isNull(err);

			const value = await Server.get_user_meta(userId, 'me');

			assert.isUndefined(value);
		})

	it(
		'Should get users',
		async function() {
			const [err, users] = await Server.get_users({});

			assert.isNull(err);
			users.should.be.a('array');
		})

	it(
		'Should delete user',
		async function() {
			const [err] = await Server.delete_user(userId);

			assert.isNull(err);
		})
});