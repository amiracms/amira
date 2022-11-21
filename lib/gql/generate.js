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
		return keys
			.reduce(
				(d, key) => {
					const dir = getDirective(schema, obj, key)?.[0];

					if (!dir) {
						return d;
					}

					const {resolve, isAfter} = list[key];
					const data = {name: key, resolve, args: dir};

					if (isAfter) {
						d.after.push(data);

						return d;
					}

					d.before.push(data);

					return d;
				},
				{before: [], after: []}
			);
	}

	return mapSchema(schema, {
		[MapperKind.OBJECT_FIELD](fieldConfig, fieldName, parentName) {
			if(resolvers[fieldName]) {
				return {
					...fieldConfig,
					resolve: fieldResolver(
						resolvers[fieldName],
						fieldName,
						parentName,
						getDirectives(schema, fieldConfig)
					)
				}
			}

			if (resolvers[parentName] 
				&& resolvers[parentName][fieldName]
				&& _.isFunction(resolvers[parentName][fieldName])) {
				return {
					...fieldConfig,
					resolve: typeFieldResolver(
						resolvers[parentName][fieldName],
						fieldName,
						parentName,
						getDirectives(schema, fieldConfig)
					)
				}
			}

			return fieldConfig;
		}
	})
}

function fieldResolver(resolver, fieldName, parentName, dirs) {
	return async (source, args, context, info) => {
		if (dirs.before.length > 0) {
			for(const {resolve, args} of dirs.before) {
				const isValid = await resolve.call(null, args, context);

				if (!isValid) {
					return null;
				}
			}
		}

		const res = await resolver(args, context);

		if (_.isError(res)) {
			info.schema.error[fieldName] = res;

			return null;
		}

		if (!dirs.after.length) {
			return res;
		}

		return dirs.after
			.reduce(
				(p, {resolve, args}) => 
					p.then(r => resolve.call(null, r, args, context)),
				Promise.resolve(res)
			);
	}
}

function typeFieldResolver(resolver, fieldName, parentName, dirs) {
	return async (source, args, context, info) => {
		if (dirs.before.length > 0) {
			for(const {resolve, args} of dirs.before) {
				const isValid = await resolve.call(null, args, context);

				if (!isValid) {
					return null;
				}
			}
		}

		const res = await resolver(source, args, context);

		if (!dirs.after.length) {
			return res;
		}

		return dirs.after
			.reduce(
				(p, {resolve, args}) => 
					p.then(r => resolve.call(null, r, args, context)),
				Promise.resolve(res)
			);
	}
}