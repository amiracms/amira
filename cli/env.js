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
	clientSecret = randomSalt(64),
	database = 'MySQL',
	prefix = 'ma_',
	MySQL_Database = '',
	MySQL_Host = 'localhost',
	MySQL_Port = 3306,
	MySQL_User = 'root',
	MySQL_Password = '',
	MySQL_SSL = false,
	MySQL_cert = '',
	MySQL_ca = ''
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

## The type of database use to store the data to. Default is MySQL.
database = ${database}

## The prefix to use when creating database tables
prefix = ${prefix}

## MySQL Database Configuration ##
## The name of the database where to store the application's data.
MySQL_Database = ${MySQL_Database}

## The hostname of the database to connect to.
MySQL_Host = ${MySQL_Host}

## The port number of the database to connect to.
MySQL_Port = ${MySQL_Port}

## The MySQL user to use for authentication.
MySQL_User = ${MySQL_User}

## The MySQL password that goes with the user.
MySQL_Password = ${MySQL_Password}

## Whether the database uses SSL when establishing a connection.
MySQL_SSL = ${MySQL_SSL}

## If your database connection is using SSL, you may add the SSL options
## by prefixing each option with MySQL_SSL_{option_name}. For more information about
## the SSL options, you may refer to https://github.com/mysqljs/mysql#ssl-options
## For ca and cert, simply remove the comment to the options below then
## write the relative path location of the files.

## The relative path location of the certificate(s) to trust.
MySQL_SSL_ca = 

## The relative path location of the client certificate to use as handshake.
MySQL_SSL_cert =
	`;
}