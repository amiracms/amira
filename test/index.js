"use strict";

const Server = require('../lib/server');

before(() => {})

after(() => {
	// Delete database tables??
	
	// Close db connection
	Server.db.close();
})