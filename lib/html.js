"use strict";

const path = require('path');
const express = require('express');
const Server = require('./server');
const basePath = process.cwd();

exports.renderAdmin = async function(req, res, next, html) {
	Server.client = 'admin';

	// Initialize
	await init(req, res);

	// If request is of resource type, bail!
	if (is_resource(req)) {
		next();
	}

	/**
	 * Trigger before rendering the administrative screen.
	 **/
	await Server.trigger('admin_init');

	// Generate scripts
	const scripts = [];

	// Generate css
	const css = [];

	// Generate data
	const data = {
		client: 'admin',
		endPoint: Server.config('endPoint'),
		host: Server.config('host'),
		protocol: Server.config('ssl') ? 'https' : 'http',
		name: Server.config('name'),
		tagline: Server.config('description')
	};

	const renderer = html || render;

	res.end(renderer(
		Server.get_scripts(),
		Server.get_css(),
		data
	));
}

exports.renderHTML = async function(req, res, next, html) {
	Server.client = 'client';

	// Initialize
	await init(req, res);

	// If request is of resource type, bail!
	if (is_resource(req)) {
		return next();
	}

	/**
	 * Trigger before rendering the screen.
	 **/
	await Server.trigger('init');

	// Generate scripts
	const scripts = [];

	// Generate css
	const css = [];

	// Generate data
	const data = {
		client: 'client',
		host: Server.config('host'),
		protocol: Server.config('ssl') ? 'https' : 'http',
		name: Server.config('name'),
		tagline: Server.config('description')
	};

	const renderer = html || render;

	res.end(renderer(
		Server.get_scripts(), css, data));
}

function is_resource(req) {
	return req.url.indexOf(".") >= 1;
}

async function init(req, res) {
	// Set static path
	const options = {
		index: false,
        fallthrough: true,
        dotfiles: 'ignore',
        //maxAge: '365d',
        // TODO: GET ALL STATIC FILE FORMAT 
        //extensions: ['js', 'css', 'jpg', 'jpeg', 'png', 'gif', 'ico']
	};

	const app = req.app;

	// Set this app's resource
	const publicPath = path.resolve(__dirname, '../public');

	app.use(express.static(publicPath, options));
	app.use('/admin', express.static(publicPath, options));

	// Set this app's public path
	//const appPath = path.resolve(basePath, './public');
	//app.use(express.static(appPath, options));

	// Iterate all other static paths
	Server
		.get_static_paths()
		.map(
		({absPath, pathName}) => {
			if (pathName) {
				app.use(pathName, express.static(absPath, options));

				return;
			}

			app.use(express.static(absPath, options));
		});

	// Store req and res to server
	Server.__set(req, res);

	Server.sessionId = Server.get_session_id();

	// Generate session Id if there's none
	if (!Server.sessionId) {
		Server.sessionId = await Server.create_session_id();
	}
}

function render(scripts = [], css = [], data = []) {
	const {lang, name, tagline} = data;

	return `<!DOCTYPE html>
<html lang="${lang}">
<head>
	<title>${name} - ${tagline}</title>
	<meta charset="UTF-8"/>
    <meta name="description" content="${tagline}"/>
    <meta name="viewport" content="width=device-width,initial-scale=1"/>
    <link rel="icon" href="/fav-logo.png"/>
    ${Server.print_css(css)}
</head>
<body>
	<div id="doc-root"></div>
	${Server.print_scripts(scripts)}
	<script type="text/javascript">
	//<![CDATA[
        require("@amira").Browser(${JSON.stringify(data)}, "doc-root");
	//]]>
	</script>
</body>
</html>`;
}