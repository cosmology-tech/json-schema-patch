interface JSONSchemaPatchOperation {
    op: 'add' | 'remove' | 'replace' | 'addProperty' | 'removeProperty' | 'addDefinition' | 'removeDefinition';
    path: string;
    value?: any;
}
declare class JSONSchemaPatch {
    schema: any;
    private ops;
    constructor(schema: any);
    prepareOperation(op: JSONSchemaPatchOperation): void;
    applyPatch(): any;
    addDefinition(name: string, definition: any): void;
    removeDefinition(name: string): void;
    private removePropertiesUsingDefinition;
    addProperty(path: string, propertyName: string, property: any): void;
    removeProperty(path: string, propertyName: string): void;
    private removeRequiredFromProperty;
}
export default JSONSchemaPatch;
