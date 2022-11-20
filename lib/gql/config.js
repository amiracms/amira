"use strict";

exports.typeDef = `
scalar Object
scalar Array
scalar DateTime

type Config {
	sessionId: String
	adminEndPoint: String
	templates: Object
	error: String
	errorCode: String
}

type Query {
	getConfig(platform: Object): Config
	getLang(lang: String): Object
}

type Mutation {
	validate: Boolean
}
`;

exports.resolvers = {
	getConfig({platform}, {Server}) {
		return {sessionId: Server.sessionId}
	},

	Config: {
		templates(__, args) {
			return {};
		}
	},

	getLang({lang}) {
		// Get english first
	}
}

exports.directives = [
	{
		name: 'sessionId',
		resolve(__, {Server}) {
			if (!Server.sessionId) {
				return false;
			}
		}
	}
]