import { GraphQLScalarType } from "graphql";
export declare class GraphQLFaunaIdType extends GraphQLScalarType {
    collection: any;
    constructor({ name, collection }: {
        name: any;
        collection: any;
    });
}
