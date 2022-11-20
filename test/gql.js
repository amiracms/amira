"use strict";

const http = require('http');
const app = require('express')();
const chai = require('chai');
const chaiHttp = require('chai-http');
const assert = chai.assert;
const should = chai.should();

chai.use(chaiHttp);

const httpRequest = chai.request(app).keepOpen();
const Server = require('../lib/server');
const {initGQL, renderGQL} = require('../lib/gql');
const {generateHashKey} = require('../lib/utils');

global.getRequest = async function(query, variables) {
	const endPoint = Server.config('endPoint');
	const clientId = Server.config('clientId');
	const clientSecret = Server.config('clientSecret');
	const [, hashId] = await generateHashKey(clientId);
	const [, hashSecret] = await generateHashKey(clientSecret);

	return httpRequest
		.get(endPoint)
		.set('X-Client-Id', hashId)
		.set('X-Client-Secret', hashSecret)
		.set('X-Session-Id', Server.sessionId||null)
		.query({query, variables: JSON.stringify(variables)});
}

global.postRequest = async function(query, variables) {
	const endPoint = Server.config('endPoint');
	const clientId = Server.config('clientId');
	const clientSecret = Server.config('clientSecret');
	const [, hashId] = await generateHashKey(clientId);
	const [, hashSecret] = await generateHashKey(clientSecret);

	return httpRequest.post(endPoint)
		.set('X-Client-Id', hashId)
		.set('X-Client-Secret', hashSecret)
		.send({query, variables: variables});

}

let request;

before(
	async () => {
		const config = require('../cli/config');
		await config();

		const endPoint = Server.config('endPoint');
		const host = Server.config('host');
		const port = Server.config('port');

		app.post(endPoint, initGQL, renderGQL);
		app.get(endPoint, initGQL, renderGQL);

		request = http.createServer(app).listen(port, host);
	});

after(async () => {
	httpRequest.close();
	request.close();

	// todo: change if not mysql
	await Server.db.query(`DROP DATABASE testdb`);
	await Server.db.query('CREATE DATABASE testdb');

	Server.db.close();
});

require('./gql/config');
require('./gql/user');