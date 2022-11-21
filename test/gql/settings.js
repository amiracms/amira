"use strict";

/* global getRequest, postRequest */

const chai = require('chai');
const assert = chai.assert;
const should = chai.should();

describe('Describe GQL Settings', function() {
	it(
		'Should set settings',
		async function() {
			// Let's login first
			await postRequest(
				`mutation WRAPPER($email: String $pwd: String) {
					login(email: $email pwd: $pwd) {Id}
				}`,
				{email: 'admin@local.local', pwd: 'admin'}
			);

			const res = await getRequest(`query {getSettings}`);

			assert.isObject(res.body.data.getSettings);
		})

	it(
		'Should set settings',
		async function() {
			const res = await postRequest(
				`mutation Wrapper($settings: Object) {
					setSettings(settings: $settings)
				}`,
				{
					settings: {
						single: true,
						double: 2
					}
				}
			);

			const done = res.body.data.setSettings;
			assert.isTrue(done);
		})

	it(
		'Should delete setting',
		async function() {
			const res = await postRequest(
				`mutation WRAPPER($name: String!) {
					deleteSetting(name: $name)
				}`,
				{name: 'single'}
			);

			const done = res.body.data.deleteSetting;
			assert.isTrue(done);
		})
});