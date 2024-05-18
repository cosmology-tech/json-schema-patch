import { JSONSchemaPatchOperation } from "src";
interface JSONSchema {
    properties?: {
        [key: string]: JSONSchema;
    };
    items?: JSONSchema | JSONSchema[];
    $defs?: {
        [key: string]: JSONSchema;
    };
    $ref?: string;
    [key: string]: any;
}
export interface PropertyPath {
    type: '$def' | 'property' | '$ref';
    path: string;
    name: string;
}
export type TransformFunction = (str: string) => string;
export declare function findAllProps(schema: JSONSchema, currentPath?: string): PropertyPath[];
export declare function createJSONSchemaPatchOperations(propertyPaths: PropertyPath[], transform: TransformFunction): JSONSchemaPatchOperation[];
export declare function isSimpleKey(key: string): boolean;
export declare function dirname(path: string): string;
export declare function basename(path: string): string;
export {};
