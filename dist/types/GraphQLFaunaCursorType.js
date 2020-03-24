"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const _json_1 = require("faunadb/src/_json");
exports.GraphQLFaunaCursorType = new graphql_1.GraphQLScalarType({
    name: "GraphQLFaunaCursorType",
    serialize(value) {
        return Buffer.from(JSON.stringify(value)).toString("base64");
    },
    parseValue(value) {
        return _json_1.parseJSON(Buffer.from(value, "base64").toString("utf8"));
    },
});
