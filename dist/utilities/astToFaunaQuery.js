"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
// import { query as q } from "faunadb"
const faunadb_fql_lib_1 = require("faunadb-fql-lib");
const reduceToObject = fields => faunadb_fql_lib_1.query.Reduce(faunadb_fql_lib_1.query.Lambda(["acc", "val"], faunadb_fql_lib_1.query.Merge(faunadb_fql_lib_1.query.Var("acc"), faunadb_fql_lib_1.query.Var("val"))), {}, fields);
const nestedQuery = (query, fields, isList) => {
    if (isList) {
        return faunadb_fql_lib_1.query.Map(query, faunadb_fql_lib_1.query.Lambda("_item_", reduceToObject(fields)));
    }
    else {
        return faunadb_fql_lib_1.query.Let({
            _item_: query,
        }, reduceToObject(fields));
    }
};
const defaultEmbedQuery = (fieldName, isList) => faunadb_fql_lib_1.query.Let({
    ref: faunadb_fql_lib_1.query.Select(["data", `${fieldName}Ref`], faunadb_fql_lib_1.query.Var("_item_"), null),
}, faunadb_fql_lib_1.query.If(faunadb_fql_lib_1.query.IsNull(faunadb_fql_lib_1.query.Var("ref")), null, faunadb_fql_lib_1.query.Get(faunadb_fql_lib_1.query.Var("ref"))));
exports.astToFaunaQuery = (ast, query) => {
    const { operation, schema, fieldName } = ast;
    const typeInfo = new graphql_1.TypeInfo(schema);
    const visitor = {
        InlineFragment: {
            leave: node => {
                const type = typeInfo.getType();
                return faunadb_fql_lib_1.query.If(
                // @ts-ignore
                type.fqlTypeCheck(faunadb_fql_lib_1.query, faunadb_fql_lib_1.query.Var("_item_")), reduceToObject(node.selectionSet.selections), {});
            },
        },
        Field: {
            leave: (node, key, parent, path) => {
                const name = node.name.value;
                const type = typeInfo.getType();
                const isLeaf = graphql_1.isLeafType(type);
                const isList = type instanceof graphql_1.GraphQLList;
                // If name === fieldName then this is the root.
                if (name === fieldName) {
                    return nestedQuery(query, node.selectionSet.selections, isList);
                }
                else if (isLeaf) {
                    const field = typeInfo.getFieldDef();
                    let selector;
                    // @ts-ignore 2
                    if (field.fql) {
                        // @ts-ignore 2
                        return { [name]: field.fql(faunadb_fql_lib_1.query) };
                    }
                    if (name === "id") {
                        selector = ["ref"];
                    }
                    else if (name === "ts") {
                        selector = ["ts"];
                    }
                    else {
                        selector = ["data", name];
                    }
                    return {
                        [name]: faunadb_fql_lib_1.query.Select(selector, faunadb_fql_lib_1.query.Var("_item_"), null),
                    };
                }
                else {
                    const field = typeInfo.getFieldDef();
                    let relQuery;
                    // @ts-ignore 2
                    if (field.fql) {
                        // @ts-ignore 2
                        relQuery = field.fql(faunadb_fql_lib_1.query);
                    }
                    else {
                        relQuery = defaultEmbedQuery(name, isList);
                    }
                    return {
                        [name]: nestedQuery(relQuery, node.selectionSet.selections, isList),
                    };
                }
            },
        },
    };
    const res = graphql_1.visit(operation, graphql_1.visitWithTypeInfo(typeInfo, visitor));
    return res.selectionSet.selections[0];
};
