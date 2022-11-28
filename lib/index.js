"use strict";

const Server = require('./server');

// Add database handler
Object.assign(Server, require('./settings'));
Object.assign(Server, require('./user'));
Object.assign(Server, require('./page'));

Object.defineProperty(
	global, 'AmiraServer', 
	{value: Server, writable: false}
);

module.exports = Server;