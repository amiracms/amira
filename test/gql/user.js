"use strict";

/* global getRequest */

const chai = require('chai');
const assert = chai.assert;
const should = chai.should();

describe('Describe GQL Users', function() {
	it(
		'Should get current user as guest',
		async function() {
			const res = await getRequest(`query {
				CurrentUser {
					Id
					email
					group
					status
					created
					updated
				}
			}`);

			const data = res.body.data.CurrentUser;

			assert.isObject(data);
			data.Id.should.be.equal('0')
		})

	it(
		'Should login user',
		async function() {
			const res = await postRequest(
				`mutation WRAPPER($email: String $pwd: String) {
					login(email: $email pwd: $pwd) {
						Id
						email
					}
				}`,
				{email: 'admin@local.local', pwd: 'admin'}
			);

			const user = res.body.data.login;

			assert.isObject(user);
			user.email.should.be.equal('admin@local.local');
		});

	it(
		'Should get current logged in user',
		async function() {
			const res = await getRequest(`query {
				CurrentUser {
					Id
					email
				}
			}`);

			const data = res.body.data.CurrentUser;

			//console.log(res.body);

			assert.isObject(data);
			data.email.should.be.equal('admin@local.local');
		})

	let userId;

	it(
		'Should create new user',
		async function() {
			const res = await postRequest(
				`mutation WRAPPER($input: UserInput) {
					createUser(input: $input) {
						Id email
					}
				}`,
				{
					input: {
						email: 'something@local.local',
						group: 'subscriber',
						status: 'active',
						pass: 'something'
					}
				}
			);

			const user = res.body.data.createUser;

			assert.isObject(user);

			userId = user.Id;
		});

	it(
		'Should get users',
		async function() {
			const res = await getRequest(
				`query WRAPPER(
					$search: String
					$status: String
				) {
					getUsers(
						search: $search
						status: $status
					) {
						items {Id email}
						totalItems
						groupCount
						statusCount
					}
				}`,
				{}
			);

			const data = res.body.data.getUsers;

			data.items.should.be.an('array');
			data.totalItems.should.be.equal(2);
			data.groupCount.should.be.an('object');
			data.statusCount.should.be.an('object');
		})
})