"use strict";

const {GraphQLScalarType} =  require("graphql");

exports.ObjectType = new GraphQLScalarType({
	name: 'Object',
	serialize: output => output,
	parseValue: output => output
});

exports.ArrayType = new GraphQLScalarType({
	name: 'Array',
	parseValue: output => output
});

exports.DateTime = new GraphQLScalarType({
	name: 'DateTime'
});