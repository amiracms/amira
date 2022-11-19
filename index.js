"use strict";

const Server = require('./lib/server');

/**
 * Handles the request via http or https.
 * 
 * @param {function} html
 * 	A function which will override how the html screen.
 * @return {object}
 *  Returns a nodejs server.
 **/
Server.serve = async function(html) {
	const bodyParser = require("body-parser");
	const app = require('express')();
	const uploadLimit = Server.config('uploadLimit')||'2MB';

	app.use(
		require('cookie-parser')(),
		bodyParser.json({limit: uploadLimit}),
		bodyParser.urlencoded({
			extended: true, 
			limit: uploadLimit
		})
	);

	// Handle gql related requests
	const endPoint = Server.config('endPoint');
	const {initGQL, renderGQL} = require('./lib/gql');

	app.use(endPoint, initGQL);

	// We only cater get and post gql requests
	app.post(endPoint, renderGQL);
	app.get(endPoint, renderGQL);

	const {renderAdmin, renderHTML} = require('./lib/html');

	// Admin Hanlder
	app.get(
		'/admin',
		(q, r, n) => renderAdmin(q, r, n, html)
	);

	// Client handler
	app.get(
		'*',
		(q, r, n) => renderHTML(q, r, n, html)
	);

	const ssl = Server.config('ssl');
	const host = Server.config('host');
	const port = Server.config('port');

	if (ssl) {
		return require('https')
			.createServer(ssl, app)
			.listen(port, host);
	}

	return require('http')
		.createServer(app)
		.listen(port, host);
}

module.exports = {
	...Server
}