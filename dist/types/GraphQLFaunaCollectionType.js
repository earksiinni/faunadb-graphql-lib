"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
class GraphQLFaunaCollectionType extends graphql_1.GraphQLObjectType {
    constructor({ name, fields, collectionName, interfaces = undefined, isTypeOf = undefined, fqlTypeCheck = undefined, }) {
        super({ name, fields, interfaces, isTypeOf });
        this.collectionName = collectionName;
        this.fqlTypeCheck = fqlTypeCheck;
    }
}
exports.GraphQLFaunaCollectionType = GraphQLFaunaCollectionType;
