"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const faunadb_1 = require("faunadb");
exports.GraphQLFaunaDateType = new graphql_1.GraphQLScalarType({
    name: "GraphQLFaunaDateType",
    serialize(val) {
        if (val)
            return val.value;
    },
    parseValue(val) {
        if (val === "")
            return null;
        if (val)
            return faunadb_1.query.Date(val);
    },
});
