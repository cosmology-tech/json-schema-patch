import { applyPatch, Operation } from 'fast-json-patch';

export interface JSONSchemaPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'addProperty' | 'removeProperty' | 'renameProperty' | 'addDefinition' | 'removeDefinition';
  path: string;
  value?: any;
}

function getValueAtPath(obj, path) {
  const parts = path.split('/').slice(1); // Split the path and remove the initial empty string
  let current = obj;
  for (let part of parts) {
    if (current[part] === undefined) return undefined; // Path does not exist
    current = current[part];
  }
  return current;
}


export class JSONSchemaPatch {
  private ops: JSONSchemaPatchOperation[] = [];

  constructor(public schema: any) { }

  // Accumulate operations in an internal state
  prepareOperation(op: JSONSchemaPatchOperation) {
    this.ops.push(op);
  }

  // Apply all accumulated operations
  applyPatch(): any {
    this.ops.forEach(op => {
      switch (op.op) {
        case 'addProperty':
          this.addProperty(op.path, op.value.name, op.value.property);
          break;
        case 'removeProperty':
          this.removeProperty(op.path, op.value);
          break;
        case 'renameProperty':
          this.renameProperty(op.path, op.value.oldName, op.value.newName);
        case 'addDefinition':
          this.addDefinition(op.path, op.value);
          break;
        case 'removeDefinition':
          this.removeDefinition(op.value);
          break;
        default:
          // Standard operations will be processed later
          break;
      }
    });

    // Apply only standard operations using fast-json-patch
    const standardOps = this.ops.filter(op => ['add', 'remove', 'replace'].includes(op.op));
    this.schema = applyPatch(this.schema, standardOps as Operation[]).newDocument;

    // Reset the operations array after application
    this.ops = [];
    return this.schema;
  }

  // Add a definition to the $defs section
  addDefinition(name: string, definition: any): void {
    const path = `/$defs/${name}`;
    // Create an operation to add the new definition
    const op: Operation = { op: 'add', path, value: definition };
    // Apply the operation using fast-json-patch
    applyPatch(this.schema, [op]);
  }

  // Remove a definition from the $defs section and any references to it
  removeDefinition(name: string): void {
    // Construct the path to the definition
    const path = `/$defs/${name}`;
    // First, remove any properties that reference this definition
    this.removePropertiesUsingDefinition(name);
    // Then, remove the definition itself
    const op: Operation = { op: 'remove', path };
    applyPatch(this.schema, [op]);
  }

  // Helper method to remove properties that reference a specific definition
  private removePropertiesUsingDefinition(defName: string): void {
    const findPaths = (obj: any, currentPath: string) => {
      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          // Check if the object has a $ref that matches the definition
          //@ts-ignore
          if (value.$ref && value.$ref === `#/$defs/${defName}`) {
            // Determine if we're within a properties object
            if (currentPath.endsWith('/properties')) {
              // Remove property by calling removeProperty
              // Extract the parent path and the property name
              let propertyPath = currentPath.replace('/properties', '');
              this.removeProperty(propertyPath, key);
            } else {
              // If it's not a direct property, just remove the reference
              const fullPath = currentPath + '/' + key;
              const op: Operation = { op: 'remove', path: fullPath };
              applyPatch(this.schema, [op]);
            }
          }
          // Recurse further into the object
          findPaths(value, currentPath + '/' + key);
        }
      });
    };

    // Start the recursive search from the root of the schema
    findPaths(this.schema, '');
  }

  // Add a property at a specified path
  addProperty(path: string, propertyName: string, property: any): void {
    path = path.trim() === '/' ? '' : path;
    const fullPath = `${path}/properties/${propertyName}`;
    const op: Operation = { op: 'add', path: fullPath, value: property };
    applyPatch(this.schema, [op]);
  }

  // Remove a property from a specified path
  removeProperty(path: string, propertyName: string): void {
    path = path.trim() === '/' ? '' : path;
    const fullPath = `${path}/properties/${propertyName}`;
    const op: Operation = { op: 'remove', path: fullPath };
    applyPatch(this.schema, [op]);
    this.removeRequiredFromProperty(path, propertyName);
  }

  // Remove from required if the property is present
  private removeRequiredFromProperty(path: string, propertyName: string): void {
    path = path.trim() === '/' ? '' : path;
    const requiredPath = `${path}/required`;
    const requiredIndex = getValueAtPath(this.schema, requiredPath)?.indexOf(propertyName);
    if (requiredIndex > -1) {
      applyPatch(this.schema, [{ op: 'remove', path: `${requiredPath}/${requiredIndex}` }]);
    }
  }

  renameProperty(path: string, oldName: string, newName: string): void {
    const propertyPath = `${path}/properties/${oldName}`;
    const newPath = `${path}/properties/${newName}`;
    const propertyValue = getValueAtPath(this.schema, propertyPath);
    if (propertyValue) {
      applyPatch(this.schema, [{ op: 'remove', path: propertyPath }]);
      applyPatch(this.schema, [{ op: 'add', path: newPath, value: propertyValue }]);
      this.updateRequiredField(path, oldName, newName);
    }
  }

  private updateRequiredField(path: string, oldName: string, newName: string): void {
    const requiredPath = `${path}/required`;
    const requiredArray = getValueAtPath(this.schema, requiredPath);
    if (requiredArray && requiredArray.includes(oldName)) {
      const index = requiredArray.indexOf(oldName);
      if (index !== -1) {
        applyPatch(this.schema, [
          { op: 'remove', path: `${requiredPath}/${index}` },
          { op: 'add', path: `${requiredPath}/-`, value: newName }
        ]);
      }
    }
  }

}

export default JSONSchemaPatch;
