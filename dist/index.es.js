import { GraphQLObjectType, GraphQLScalarType, GraphQLList, GraphQLInt, TypeInfo, visit, visitWithTypeInfo, isLeafType } from 'graphql';
import { parseJSON } from 'faunadb/src/_json';
import { query } from 'faunadb';
import { query as query$1 } from 'faunadb-fql-lib';

class GraphQLFaunaCollectionType extends GraphQLObjectType {
    constructor({ name, fields, collectionName, interfaces = undefined, isTypeOf = undefined, fqlTypeCheck = undefined, }) {
        super({ name, fields, interfaces, isTypeOf });
        this.collectionName = collectionName;
        this.fqlTypeCheck = fqlTypeCheck;
    }
}

const GraphQLFaunaCursorType = new GraphQLScalarType({
    name: "GraphQLFaunaCursorType",
    serialize(value) {
        return Buffer.from(JSON.stringify(value)).toString("base64");
    },
    parseValue(value) {
        return parseJSON(Buffer.from(value, "base64").toString("utf8"));
    },
});

const GraphQLFaunaDateType = new GraphQLScalarType({
    name: "GraphQLFaunaDateType",
    serialize(val) {
        if (val)
            return val.value;
    },
    parseValue(val) {
        if (val === "")
            return null;
        if (val)
            return query.Date(val);
    },
});

class GraphQLFaunaIdType extends GraphQLScalarType {
    constructor({ name, collection }) {
        super({
            name,
            serialize: val => val.id,
            parseValue: val => query.Ref(query.Collection(collection), val),
            parseLiteral: (ast) => query.Ref(query.Collection(collection), ast.value),
        });
        this.collection = collection;
    }
}

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

class GraphQLFaunaPageType extends GraphQLObjectType {
    constructor(_a) {
        var { name, itemType, fields = {} } = _a, rest = __rest(_a, ["name", "itemType", "fields"]);
        super(Object.assign(Object.assign({ name }, rest), { fields: () => (Object.assign({ next: {
                    type: GraphQLFaunaCursorType,
                    fql: q => q.Select(["after"], q.Var("_item_"), null),
                }, previous: {
                    type: GraphQLFaunaCursorType,
                    fql: q => q.Select(["before"], q.Var("_item_"), null),
                }, items: {
                    type: new GraphQLList(itemType()),
                    args: {
                        size: { type: GraphQLInt, defaultValue: 64 },
                    },
                    fql: q => q.Select(["data"], q.Var("_item_")),
                } }, fields)) }));
    }
}

const digitsFromInt = int => {
    return Math.floor(Math.log10(int) + 1);
};
const intToNanoUnix = int => {
    const digits = digitsFromInt(int);
    switch (digits) {
        case 16:
            return int;
        case 13:
            return int * 1000;
        case 10:
            return int * 1000000;
        default:
            throw new Error("Unsupported unix timestamp digit length");
    }
};
const toISO8601StringWithNanoseconds = int => {
    const digits = digitsFromInt(int);
    let date;
    let remainder;
    let millis = true;
    switch (digits) {
        case 16:
            date = new Date(int / 1000);
            remainder = int % 1000;
            break;
        case 13:
            date = new Date(int);
            break;
        case 10:
            date = new Date(int * 1000);
            millis = false;
            break;
        default:
            throw new Error("Unsupported unix timestamp digit length");
    }
    let string = date.toISOString().slice(0, -5);
    if (millis)
        string += `.${date.getUTCMilliseconds()}${remainder}`;
    string += "Z";
    return string;
};
const fromISO8601StringWithNanoseconds = string => {
    const match = string.match(/\.(\d+)Z$/);
    const subSeconds = match ? parseInt(match[1], 0) : 0;
    const digits = Math.floor(Math.log10(subSeconds) + 1);
    let unix = Date.parse(string) * 1000;
    if (digits === 6)
        unix += subSeconds % 1000;
    return unix;
};
const GraphQLFaunaTimestampType = new GraphQLScalarType({
    name: "GraphQLFaunaTimestampType",
    serialize(val) {
        return toISO8601StringWithNanoseconds(val);
    },
    parseValue(val) {
        if (Number.isInteger(val))
            return intToNanoUnix(val);
        return fromISO8601StringWithNanoseconds(val);
    },
});

const GraphQLFaunaTimeType = new GraphQLScalarType({
    name: "GraphQLFaunaTimeType",
    serialize(val) {
        if (val)
            return val.value;
    },
    parseValue(val) {
        if (val === "")
            return null;
        if (val)
            return query.Time(val);
    },
});

const reduceToObject = fields => query$1.Reduce(query$1.Lambda(["acc", "val"], query$1.Merge(query$1.Var("acc"), query$1.Var("val"))), {}, fields);
const nestedQuery = (query, fields, isList) => {
    if (isList) {
        return query$1.Map(query, query$1.Lambda("_item_", reduceToObject(fields)));
    }
    else {
        return query$1.Let({
            _item_: query,
        }, reduceToObject(fields));
    }
};
const defaultEmbedQuery = (fieldName, isList) => query$1.Let({
    ref: query$1.Select(["data", `${fieldName}Ref`], query$1.Var("_item_"), null),
}, query$1.If(query$1.IsNull(query$1.Var("ref")), null, query$1.Get(query$1.Var("ref"))));
const astToFaunaQuery = (ast, query) => {
    const { operation, schema, fieldName } = ast;
    const typeInfo = new TypeInfo(schema);
    const visitor = {
        InlineFragment: {
            leave: node => {
                const type = typeInfo.getType();
                return query$1.If(
                // @ts-ignore
                type.fqlTypeCheck(query$1, query$1.Var("_item_")), reduceToObject(node.selectionSet.selections), {});
            },
        },
        Field: {
            leave: (node, key, parent, path) => {
                const name = node.name.value;
                const type = typeInfo.getType();
                const isLeaf = isLeafType(type);
                const isList = type instanceof GraphQLList;
                // If name === fieldName then this is the root.
                if (name === fieldName) {
                    return nestedQuery(query, node.selectionSet.selections, isList);
                }
                else if (isLeaf) {
                    const field = typeInfo.getFieldDef();
                    let selector;
                    console.log(field);
                    console.log('is field.fql?');
                    // @ts-ignore 2
                    if (field.fql) {
                        console.log('yes field.fql');
                        // @ts-ignore 2
                        return { [name]: field.fql(query$1) };
                    }
                    console.log('no field.fql');
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
                        [name]: query$1.Select(selector, query$1.Var("_item_"), null),
                    };
                }
                else {
                    const field = typeInfo.getFieldDef();
                    let relQuery;
                    // @ts-ignore 2
                    if (field.fql) {
                        // @ts-ignore 2
                        relQuery = field.fql(query$1);
                    }
                    else {
                        relQuery = defaultEmbedQuery(name);
                    }
                    return {
                        [name]: nestedQuery(relQuery, node.selectionSet.selections, isList),
                    };
                }
            },
        },
    };
    const res = visit(operation, visitWithTypeInfo(typeInfo, visitor));
    return res.selectionSet.selections[0];
};

export { GraphQLFaunaCollectionType, GraphQLFaunaCursorType, GraphQLFaunaDateType, GraphQLFaunaIdType, GraphQLFaunaPageType, GraphQLFaunaTimeType, GraphQLFaunaTimestampType, astToFaunaQuery };
