"use strict";

const Server = require('./lib/server');

Server.serve = async function(html = require('./lib/html')) {
	const bodyParser = require("body-parser");
	const app = require('express')();
	const uploadLimit = this.config('uploadLimit')||'2MB';

	app.use(
		require('cookie-parser')(),
		bodyParser.json({limit: uploadLimit}),
		bodyParser.urlencoded({
			extended: true, 
			limit: uploadLimit
		})
	);

	// Handle gql related requests
	const endPoint = this.config('endPoint');
	const {initGQL, renderGQL} = require('./lib/gql');

	app.use(endPoint, initGQL);

	// We only cater get and post gql requests
	app.post(endPoint, renderGQL);
	app.get(endPoint, renderGQL);

	// Client handler
	app.get('*', (q, r, n) => html(q, r, n));

	const ssl = this.config('ssl');
	const host = this.config('host');
	const port = this.config('port');

	if (ssl) {
		return require('https')
			.createServer(ssl, app)
			.listen(port, host);
	}

	return require('http')
		.createServer(app)
		.listen(port, host);
}

module.exports = Server;