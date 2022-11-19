"use strict";

const {buildSchema, extendSchema} = require("graphql");
const {parse} = require("graphql/language/parser");
const Server = require('./server');
const cached = {keys: {}};

exports.initGQL = async function(req, res, next) {
	/**
	 * Trigger whenever any gql request is present.
	 **/
	await Screen.trigger('gql_init');

	// Get database
	Server.db = require('./db')();

	// Validate database connection

	// Get session id and store in server for quick access
	Server.sessionId = Server.get_session_id();

	next();
}

exports.renderGQL = async function(req, res) {}