import { GraphQLObjectType } from "graphql";
export declare class GraphQLFaunaPageType extends GraphQLObjectType {
    constructor({ name, itemType, fields, ...rest }: {
        [x: string]: any;
        name: any;
        itemType: any;
        fields?: {};
    });
}
