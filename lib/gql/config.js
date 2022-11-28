"use strict";

exports.typeDef = `
type Config {
	sessionId: String
	adminEndPoint: String
	templates: Object
	error: String
	errorCode: String
}

extend type Query {
	getConfig(platform: Object): Config
	getLang(lang: String): Object
}
`;

exports.resolvers = {
	Query: {
		getConfig(__, {platform}, {Server}) {
			return {
				sessionId: Server.sessionId,
				error: Server.error,
				errorCode: Server.errorCode
			}
		},

		getLang({lang}) {
			// Get english first
		}
	},
	
	Config: {
		async templates(__, args, {Server}) {
			const client = Server.client;
			const path = require('path');

			// Get default templates
			const template = await __getTemplates(
				path.resolve(__dirname, '../../html/template'));
			const defaults = await __getTemplates(
				path.resolve(__dirname, `../../html/${client}`));

			// Get templates base on client
			return {...template, ...defaults};
		}
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

async function __getTemplates(dir, base) {
	const path = require('path');
	const {readdirSync, readFileSync} = require('fs');
	const templates = {};

	let list;

	try {
		list = await readdirSync(
			dir, 
			{encoding: 'utf8', withFileTypes: true}
			);
	} catch(e) {
		return templates;
	}

	for(const file of list) {
		const name = file.name;
		const isDir = file.isDirectory(file);

		if (isDir) {
			const otherFile = path.resolve(dir, name);
			const otherList = await __getTemplates(otherFile, path.basename(dir));

			Object.assign(templates, otherList);

			continue;
		}

		// Don't get non-html
		if (!name.match(/\.html/)) {
			continue;
		}

		const filePath = path.resolve(dir, name);
		let id = ['', base, path.basename(dir), name].join('/');
		id = id.replace(/\\|\/\//g, "/").replace('.html', '');

		// Get the content
		let data = await readFileSync(filePath, {encoding: 'utf8'});

		// Remove comments
		data = data.replace(/<\!--.*?-->|\r?\n|\r|\t/sg, " ");

		templates[id] = data;
	}

	return templates;
}