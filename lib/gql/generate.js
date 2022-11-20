"use strict";

const {buildSchema, extendSchema} = require("graphql");
const {parse} = require("graphql/language/parser");
const {mapSchema, getDirective, MapperKind } = require('@graphql-tools/utils');
const _ = require('underscore');
const Server = require('../server');

module.exports = function() {
	const typeDefs = Server.get_typeDef();

	let schema;
	for(const typeDef of typeDefs) {
		if (!schema) {
			schema = buildSchema(typeDef);

			continue;
		}

		// Otherwise build per definition
		schema = extendSchema(schema, parse(typeDef));
	}
	
	return mapDirectives(schema);
}

function mapDirectives(schema) {
	const directives = Server.get_directives();
	const resolvers = Server.get_resolvers();

	const list = _.indexBy(directives, 'name');
	const keys = _.keys(list);

	const getDirectives = (schema, obj) => {
		const dirs = [];

		keys.map(
			key => {
				const dir = getDirective(schema, obj, key)?.[0];

				if (!dir) {
					return;
				}

				dirs.push({name: key, args: dir});
			});

		return dirs;
	}

	return mapSchema(schema, {
		[MapperKind.OBJECT_TYPE](objConfig) {
			const dirs = getDirectives(schema, objConfig);

			if (dirs.length > 0) {
				// Store object directive to the server
				if (!Server.Directives) {
					Server.Directives = {};
				}

				Server.Directives[objConfig.name] = dirs;
			}
	
			return objConfig;
		},
		[MapperKind.OBJECT_FIELD](fieldConfig, fieldName, parentName) {
			if(resolvers[fieldName]) {
				return {
					...fieldConfig,
					resolve: fieldResolver(
						resolvers[fieldName],
						parentName,
						getDirectives(schema, fieldConfig),
						list
					)
				}
			}

			if (resolvers[parentName] 
				&& resolvers[parentName][fieldName]
				&& _.isFunction(resolvers[parentName][fieldName])) {
				return {
					...fieldConfig,
					resolve: typeResolver(
						resolvers[parentName][fieldName],
						parentName,
						getDirectives(schema, fieldConfig),
						list
					)
				}
			}

			return fieldConfig;
		}
	})
}

function fieldResolver(resolver, parentName, dirs, directives) {
	return async (source, args, context, info) => {
		// Check if the parent name contains directives
		const valid = await shouldResolve(
			info.schema, 
			parentName, 
			context, 
			directives
		);

		if (!valid) {
			return null;
		}

		return resolver(args, context);
	}
}

function typeResolver(resolver, parentName, dirs, directives) {
	return async (source, args, context, info) => {
		// Check if the parent name contains directives
		const valid = await shouldResolve(
			info.schema, 
			parentName, 
			context, 
			directives
		);

		if (!valid) {
			return null;
		}

		return resolver(source, args, context);
	}
}

async function shouldResolve(schema, parentName, context, directives) {
	if (!Server.Directives || !Server.Directives[parentName]) {
		return true;
	}

	const dirs = Server.Directives[parentName];

	if (schema.Directives[parentName]) {
		// Previously validated, return the result
		return schema.Directives[parentName];
	}

	// Otherwise validate
	let result = true;

	for(const {name, args} of dirs) {
		const {resolve} = directives[name];
		const valid = await resolve.call(null, args, context);

		if (!valid) {
			result = false;
			schema.Directives[parentName] = false;

			return false;
		}
	}

	schema.Directives[parentName] = result;

	return true;
}