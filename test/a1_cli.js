"use strict";

const Server = require('../lib/server');

describe('Describe $ amira config -y', function() {
	const config = require('../cli/config');

	it(
		'Should create an .env file with default configurations',
		async function() {
			await config();

			return true;
		}
	);
})