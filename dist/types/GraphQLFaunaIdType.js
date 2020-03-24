"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const faunadb_1 = require("faunadb");
class GraphQLFaunaIdType extends graphql_1.GraphQLScalarType {
    constructor({ name, collection }) {
        super({
            name,
            serialize: val => val.id,
            parseValue: val => faunadb_1.query.Ref(faunadb_1.query.Collection(collection), val),
            parseLiteral: (ast) => faunadb_1.query.Ref(faunadb_1.query.Collection(collection), ast.value),
        });
        this.collection = collection;
    }
}
exports.GraphQLFaunaIdType = GraphQLFaunaIdType;
