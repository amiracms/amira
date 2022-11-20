"use strict";

const {
		assertValidExecutionArguments,
	    buildExecutionContext,
	    getFieldDef,
	    buildResolveInfo,
	    execute
	} = require("graphql/execution/execute");
const {getArgumentValues} = require("graphql/execution/values");
const {getOperationRootType} = require("graphql/utilities/getOperationRootType");
const _ = require('underscore');
const Server = require('../server');

module.exports = async function({
	document,
	contextValue,
	variableValues,
	schema,
	operationName
}) {
	assertValidExecutionArguments(schema, document, variableValues);

	const exeContext = buildExecutionContext(
        schema,
        document,
        {},
        contextValue,
        variableValues,
        operationName
    );

    if (exeContext.errors && exeContext.errors.length > 0) {
    	return {errors: exeContext.errors};
    }

    const operation = getOperationRootType(exeContext.schema, exeContext.operation);

    // Store directives
    schema.Directives = {};

    // Store field error
    schema.error = {};

    const data = await execute({
		schema,
		document,
        rootValue: null,
        contextValue,
        variableValues,
        operationName
	});

	Server.db.close();

	// Add error
	data.error = schema.error;

	return data;
}