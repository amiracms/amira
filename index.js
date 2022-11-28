"use strict";

const bodyParser = require("body-parser");
const cors = require('cors');
const app = require('express')();
const Server = require('./lib');
const uploadLimit = Server.config('uploadLimit')||'2MB';
const endPoint = Server.config('endPoint');
const {renderAdmin, renderHTML} = require('./lib/html');
const {initGQL, renderGQL} = require('./lib/gql');

app.use(
    cors(),
	require('cookie-parser')(),
	bodyParser.json({limit: uploadLimit}),
	bodyParser.urlencoded({
		extended: true, 
		limit: uploadLimit
	})
);

/**
 * Handles client only requests.
 * 
 * @param {int} port
 * 	The port number the requests connects to. This will override the
 * 	the default port number set in the configuration.
 * @param {string} host
 * 	The hostname the listens to. This will override the default
 * 	host name set in the configuration.
 * @param {object} ssl
 *  An object defining the location of the certificate files.
 * @param {function} html
 * 	An override method which will replace the default html format
 * 	to render.
 * @return {Object}
 **/
exports.serveClient = function(port, host, ssl, html) {
	app.get('*', (q, r, n) => renderHTML(q, r, n, html));

	return httpRequest(port, host, ssl, html);
}

/**
 * Handles admin only requests.
 * 
 * @param {int} port
 * 	The port number the requests connects to. This will override the
 * 	the default port number set in the configuration.
 * @param {string} host
 * 	The hostname the listens to. This will override the default
 * 	host name set in the configuration.
 * @param {object} ssl
 *  An object defining the location of the certificate files.
 * @param {function} html
 * 	An override method which will replace the default html format
 * 	to render.
 * @return {Object}
 **/
exports.serveAdmin = function(port, host, ssl, html) {
	app.get('*', (q, r, n) => renderAdmin(q, r, n, html));

	return httpRequest(port, host, ssl);
}

/**
 * Handles API requests thrue GraphQL.
 * 
 * @param {int} port
 * 	The port number the requests connects to. This will override the
 * 	the default port number set in the configuration.
 * @param {string} host
 * 	The hostname the listens to. This will override the default
 * 	host name set in the configuration.
 * @param {object} ssl
 *  An object defining the location of the certificate files.
 * @return {Object}
 **/
exports.serveAPI = function(port, host, ssl) {
    app.use(initGQL, renderGQL);

	return httpRequest(port, host, ssl);
}

/**
 * Handles all types of requests.
 * 
 * @param {int} port
 * 	The port number the requests connects to. This will override the
 * 	the default port number set in the configuration.
 * @param {string} host
 * 	The hostname the listens to. This will override the default
 * 	host name set in the configuration.
 * @param {object} ssl
 *  An object defining the location of the certificate files.
 * @param {function} html
 * 	An override method which will replace the default html format
 * 	to render.
 * @return {Object}
 **/
exports.serve = async function(port, host, ssl, html) {
	// Enable API
    app.use(endPoint, initGQL, renderGQL);

	// Handle adminstrative screen
	app.get('/admin', (q, r, n) => renderAdmin(q, r, n, html));

	// Handle client screens
	app.get('*', (q, r, n) => renderHTML(q, r, n, html));

	return httpRequest(port, host, ssl);
}

function httpRequest(port, host, ssl) {
	ssl = ssl||Server.config('ssl');
	host = host||Server.config('host');
	port = port||Server.config('port');

	if (ssl) {
		return require('https')
			.createServer(ssl, app)
			.listen(port, host);
	}

	return require('http')
		.createServer(app)
		.listen(port, host);
}