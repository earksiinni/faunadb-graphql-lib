import { GraphQLObjectType } from "graphql";
export declare class GraphQLFaunaCollectionType extends GraphQLObjectType {
    collectionName: string;
    fqlTypeCheck: () => void;
    constructor({ name, fields, collectionName, interfaces, isTypeOf, fqlTypeCheck, }: {
        name: any;
        fields: any;
        collectionName: any;
        interfaces?: any;
        isTypeOf?: any;
        fqlTypeCheck?: any;
    });
}
