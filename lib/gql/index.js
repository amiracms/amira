"use strict";

const {buildSchema, extendSchema} = require("graphql");
const {parse} = require("graphql/language/parser");
const Server = require('../server');
const {decryptHashKey} = require('../utils');
const generateSchema = require('./generate');

exports.initGQL = async function(req, res, next) {
	// Store req and res to server
	Server.__set(req, res);

	// Set default schemas
	Server.gql_schema(require('./config'));
	Server.gql_schema(require('./user'));
	Server.gql_schema(require('./page'));

	/**
	 * Trigger whenever any gql request is present.
	 **/
	await Server.trigger('gql_init');

	// Validate database connection
	const [err] = await Server.db.connect();

	if (err) {
		Server.error = true;
		Server.errorCode = 'DATABASE_ERROR';
	}

	// Get session id and store in server for quick access
	Server.sessionId = Server.get_session_id();

	// Set current user as guest
	Server.currentUser = {Id: 0};

	next();
}

exports.renderGQL = async function(req, res) {
	if (!Server.sessionId) {
		// Validate clientId and clientSecret
		if (! await validateClient()) {
			return res.json({error: true});
		}
	}

	// Validate session Id
	await validateSessionId();

	if (!Server.schema) {
		// Generate schema
		Server.schema = generateSchema();
	}

	const { createHandler } = require('graphql-http/lib/use/node');
	const execute = require('./execute');

	return createHandler({
		schema: Server.schema,
		execute,
		context: {Server}
	})(req, res);
}

async function validateClient() {
	const clientId = Server.get_header('x-client-id');
	const [, hash] = await decryptHashKey(clientId);

	if (hash !== Server.config('clientId')) {
		return false;
	}

	const clientSecret = Server.get_header('x-client-secret');
	const [, hashSecret] = await decryptHashKey(clientSecret);

	if (hashSecret !== Server.config('clientSecret')) {
		return false;
	}

	// Generate session Id
	Server.sessionId = await Server.create_session_id();

	return true;
}

async function validateSessionId() {
	const sessionId = Server.sessionId;
	const [, hash] = await decryptHashKey(sessionId);

	// Validate against client id
	const clientId = Server.config('clientId');

	if (clientId === hash) {
		return true;
	}
	// Check email
	const [, user] = await Server.get_user_by('email', hash);

	if (user && user.Id) {
		Server.currentUser = user;

		return true;
	}

	return false;
}