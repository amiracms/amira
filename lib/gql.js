"use strict";

const {buildSchema, extendSchema} = require("graphql");
const {parse} = require("graphql/language/parser");
const Server = require('./server');
const cached = {keys: {}};

exports.add_gql_schema = function(typeDef, resolvers = {}, directives = []) {
	if (cached.keys[typeDef]) {
		// Don't create previously created schema
		return;
	}

	if (!Server.schema) {
		// Clear keys
		cached.keys = {};

		// Build the first schema
		Server.schema = buildSchema(typeDef);
	} else {
		// Regenerate schema
		const schema = parse(typeDef);

		try {
			Server.schema = extendSchema(Server.schema, schema);
		} catch(e) {
			Server.error = true;
			Server.errorCode = 'schema';

			return;
		}
	}

	// Record type definition
	cached.keys[typeDef] = true;

	Server.resolvers = Server.resolvers||{};

	// Iterate resolvers
	Object.entries(resolvers)
		.map(
			([name, callback]) => {
				if (!Server.resolvers[name]) {
					Server.resolvers[name] = callback;

					return;
				}

				// If there's a resolver exist, assume it's an object type
				Object.assign(Server.resolvers[name], callback);
			}
		);

	// If there are directives, just store it
	Server.directives = Server.directives||{};

	for(const {
		name,
		description,
		deprecationReason = '',
		locations = ['Field'],
		resolve
	} of directives) {
		Server.directives[name] = {name, description, deprecationReason, resolve};
	}
}

exports.initGQL = async function(req, res, next) {
	
}

exports.renderGQL = async function(req, res) {}