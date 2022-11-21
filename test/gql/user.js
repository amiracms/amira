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
						Id email meta
					}
				}`,
				{
					input: {
						email: 'something@local.local',
						group: 'subscriber',
						status: 'active',
						pass: 'something',
						meta: {
							first_name: 'Natasha',
							last_name: 'Reyes'
						}
					}
				}
			);

			const user = res.body.data.createUser;

			assert.isObject(user);

			userId = user.Id;
		});

	it(
		'Should create new user group',
		async function() {
			const res = await postRequest(
				`mutation WRAPPER($input: UserGroupInput) {
					setUserGroup(input: $input) {
						Id name slug description caps
					}
				}`,
				{
					input: {
						name: 'Manager',
						caps: ['edit-users', 'delete-users']
					}
				}
			);

			const group = res.body.data.setUserGroup;

			assert.isObject(group);
			group.should.have.property('Id');
		})

	it(
		'Should update user',
		async function() {
			const res = await postRequest(
				`mutation WRAPPER($input: UserInput) {
					updateUser(input: $input) {
						Id group email meta
					}
				}`,
				{
					input: {
						Id: userId,
						group: 'manager',
						meta: {
							first_name: 'Natasha Mae'
						}
					}
				}
			);

			const user = res.body.data.updateUser;

			assert.isObject(user);
			user.group.should.be.equal('manager');
			user.meta.first_name.should.be.equal('Natasha Mae');
		});

	let groupId;

	it(
		'Should get user group',
		async function() {
			const res = await getRequest(`query WRAPPER($slug: String) {
					getUserGroup(slug: $slug) {
						Id name slug description caps userCount
					}
				}`,
				{slug: 'manager'}
			);

			const group = res.body.data.getUserGroup;

			assert.isObject(group);
			group.should.have.property('userCount').equal(1);

			groupId = group.Id;
		});

	it(
		'Should get all user group',
		async function() {
			const res = await getRequest(
				`query {getUserGroups {
					Id name slug userCount
				}}`
			);

			const groups = res.body.data.getUserGroups;

			assert.isArray(groups);
			groups.should.have.length(2);
		});

	it(
		'Should delete user group',
		async function() {
			const res = await postRequest(`mutation WRAPPER($Id: String! $action: String) {
				deleteUserGroup(Id: $Id action: $action)
				}`,
				{Id: groupId, action: 'administrator'}
			);

			const done = res.body.data.deleteUserGroup;

			assert.isTrue(done);
		})

	it(
		'Should delete user from database',
		async function() {
			const res = await postRequest(
				`mutation WRAPPER($Id: String!) {
					deleteUser(Id: $Id)
				}`,
				{
					Id: userId
				}
			);

			const done = res.body.data.deleteUser;

			assert.isTrue(done);
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
			data.totalItems.should.be.equal(1);
			data.groupCount.should.be.an('object');
			data.statusCount.should.be.an('object');
		});

	it(
		'Should log user out',
		async function() {
			const res = await getRequest(
				`query {logout}`,
				{}
			);

			const done = res.body.data.logout;

			assert.isTrue(done);

			const res2 = await getRequest(`query {
				CurrentUser {
					Id
					email
				}
			}`);

			const user = res2.body.data.CurrentUser;

			user.Id.should.be.equal('0');
		});
})