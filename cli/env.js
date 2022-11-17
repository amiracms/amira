"use strict";

const path = require('path');
const basePath = process.cwd();
const {randomSalt} = require('../lib/utils');

module.exports = function({
	host = 'localhost',
	port = 80,
	ssl = false,
	name = path.parse(basePath).name,
	tagline = 'A simple starter CMS by nodejs.',
	lang = 'en',
	adminEmail,
	endPoint = '/' + randomSalt(16, 16, 'hex'),
	clientId = randomSalt(16, 32, 'hex'),
	clientSecret = randomSalt(64)
}) {
	return `## This is a configuration file. 
## All contents are important and are vital for the application to work.
## Ensure that the correct file permission is set to this file!

## API end point
endPoint = ${endPoint}

## Client Id
clientId = ${clientId}

## Client Secret
clientSecret = ${clientSecret}

## Hostname where the application listens to.
## @type string
host = ${host}

## The port number where the application runs to.
## @type int
port = ${port}

## Is your application use ssl? Default is false
## @type boolean
ssl = ${ssl ? true : ''}

## The absolute path location where the SSL certificate key resides
## @type string
ssl_key = 
ssl_cert = 
ssl_ca = 

## Default Settings
## Important to note that the default settings can be overridden at the
## administration screen.

## Store or business name. Also serve as the application's general title.
name = ${name}

## Brief description about the store or business.
tagline = ${tagline}

## Admin email.
## The email address to send email notification relating to the application and/or
## user activities.
adminEmail = ${adminEmail||''}

## Language use. Default is 'en'.
lang = ${lang}
	`;
}