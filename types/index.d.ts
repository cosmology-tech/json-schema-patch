import { BooleanFunction, TransformFunction } from './utils';
export interface JSONSchemaPatchOperation {
    op: 'add' | 'remove' | 'replace' | 'rename' | 'addProperty' | 'removeProperty' | 'renameProperty' | 'addDefinition' | 'removeDefinition';
    path: string;
    value?: any;
}
export declare function expandOperations(operations: JSONSchemaPatchOperation[]): JSONSchemaPatchOperation[];
export declare class JSONSchemaPatch {
    schema: any;
    private ops;
    constructor(schema: any);
    prepareOperation(op: JSONSchemaPatchOperation): void;
    transform(transformFunction: TransformFunction, transformTest: BooleanFunction): void;
    applyPatch(): any;
    addDefinition(name: string, definition: any): void;
    removeDefinition(name: string): void;
    private removePropertiesUsingDefinition;
    addProperty(path: string, propertyName: string, property: any): void;
    removeProperty(path: string, propertyName: string): void;
    private removeRequiredFromProperty;
    renameProperty(path: string, oldName: string, newName: string): void;
    rename(path: string, value: string): void;
    replace(path: string, value: string): void;
    add(path: string, value: string): void;
    remove(path: string): void;
    private updateRequiredField;
}
export default JSONSchemaPatch;
