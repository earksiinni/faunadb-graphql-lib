"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const graphql_1 = require("graphql");
const GraphQLFaunaCursorType_1 = require("./GraphQLFaunaCursorType");
class GraphQLFaunaPageType extends graphql_1.GraphQLObjectType {
    constructor(_a) {
        var { name, itemType, fields = {} } = _a, rest = __rest(_a, ["name", "itemType", "fields"]);
        super(Object.assign(Object.assign({ name }, rest), { fields: () => (Object.assign({ next: {
                    type: GraphQLFaunaCursorType_1.GraphQLFaunaCursorType,
                    fql: q => q.Select(["after"], q.Var("_item_"), null),
                }, previous: {
                    type: GraphQLFaunaCursorType_1.GraphQLFaunaCursorType,
                    fql: q => q.Select(["before"], q.Var("_item_"), null),
                }, items: {
                    type: new graphql_1.GraphQLList(itemType()),
                    args: {
                        size: { type: graphql_1.GraphQLInt, defaultValue: 64 },
                    },
                    fql: q => q.Select(["data"], q.Var("_item_")),
                } }, fields)) }));
    }
}
exports.GraphQLFaunaPageType = GraphQLFaunaPageType;
