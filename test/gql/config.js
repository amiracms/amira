"use strict";

const chai = require('chai');
const assert = chai.assert;
const should = chai.should();
const Server = require('../../lib/server');

describe('Describe GQL Config', function() {
	it(
		'Should get configuration',
		async function() {
			const res = await getRequest(
				`query WRAPPER($platform: Object) {
						getConfig(platform: $platform) {
							sessionId
							templates
						}
					}`,
				{platform: {}}
			)


			const data = res.body.data;

			assert.isObject(data);

			const {sessionId, templates} = data.getConfig;

			sessionId.should.equal(Server.sessionId);
			templates.should.be.a('object');
		})
})