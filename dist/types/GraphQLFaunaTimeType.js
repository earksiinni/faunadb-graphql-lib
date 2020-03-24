"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const faunadb_1 = require("faunadb");
exports.GraphQLFaunaTimeType = new graphql_1.GraphQLScalarType({
    name: "GraphQLFaunaTimeType",
    serialize(val) {
        if (val)
            return val.value;
    },
    parseValue(val) {
        if (val === "")
            return null;
        if (val)
            return faunadb_1.query.Time(val);
    },
});
