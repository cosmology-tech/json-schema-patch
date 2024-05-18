import { applyPatch, Operation } from 'fast-json-patch';
import { BooleanFunction, createJSONSchemaPatchOperations, dirname, findAllProps, TransformFunction } from './utils';

export interface JSONSchemaPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'rename' | 'addProperty' | 'removeProperty' | 'renameProperty' | 'addDefinition' | 'removeDefinition';
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

export function expandOperations(operations: JSONSchemaPatchOperation[]): JSONSchemaPatchOperation[] {
  const expandedOps: JSONSchemaPatchOperation[] = [];

  operations.forEach(op => {
    if (Array.isArray(op.value)) {
      // Create a new operation for each item in the value array
      op.value.forEach(item => {
        expandedOps.push({
          op: op.op,
          path: op.path,
          value: item
        });
      });
    } else if (typeof op.value !== 'undefined') {
      // Directly push the operation if the value is defined
      expandedOps.push(op);
    } else {
      // Push the operation if there's no value, such as for 'remove' operations
      expandedOps.push({
        op: op.op,
        path: op.path
      });
    }
  });

  return expandedOps;
}

function sanitizeJsonPath(path: string): string {
  // Remove redundant slashes and ensure there is no trailing slash.
  const sanitizedPath = path.replace(/\/+/g, '/').replace(/\/$/, '');
  // Ensure the path starts with a slash unless it's an empty string.
  return sanitizedPath.startsWith('/') || sanitizedPath === '' ? sanitizedPath : '/' + sanitizedPath;
}

export class JSONSchemaPatch {
  private ops: JSONSchemaPatchOperation[] = [];

  constructor(public schema: any) { }

  // Accumulate operations in an internal state
  prepareOperation(op: JSONSchemaPatchOperation) {
    this.ops.push(op);
  }

  transform(transformFunction: TransformFunction, transformTest: BooleanFunction): void {
    this.ops = [
      ...this.ops,
      ...createJSONSchemaPatchOperations(findAllProps(this.schema), transformFunction, transformTest)
    ];
  }

  // Apply all accumulated operations
  applyPatch(): any {
    const ops = expandOperations(this.ops);
    ops.forEach(op => {
      switch (op.op) {
        case 'addProperty':
          this.addProperty(op.path, op.value.name, op.value.property);
          break;
        case 'removeProperty':
          this.removeProperty(op.path, op.value);
          break;
        case 'renameProperty':
          this.renameProperty(op.path, op.value.oldName, op.value.newName);
          break;
        case 'rename':
          this.rename(op.path, op.value);
          break;
        case 'replace':
          this.replace(op.path, op.value);
          break;
        case 'add':
          this.add(op.path, op.value);
          break;
        case 'remove':
          this.remove(op.path);
          break;
        case 'addDefinition':
          this.addDefinition(op.path, op.value);
          break;
        case 'removeDefinition':
          this.removeDefinition(op.value);
          break;
        default:
          throw new Error('OP not supported!');
      }
    });

    // Reset the operations array after application
    this.ops = [];
    return this.schema;
  }

  // Add a definition to the $defs section
  addDefinition(name: string, definition: any): void {
    const path = sanitizeJsonPath(`/$defs/${name}`);
    // Create an operation to add the new definition
    const op: Operation = { op: 'add', path, value: definition };
    // Apply the operation using fast-json-patch
    console.log(op)
    applyPatch(this.schema, [op]);
  }

  // Remove a definition from the $defs section and any references to it
  removeDefinition(name: string): void {
    // Construct the path to the definition
    const path = sanitizeJsonPath(`/$defs/${name}`);
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
    const fullPath = sanitizeJsonPath(`${path}/properties/${propertyName}`);
    const op: Operation = { op: 'add', path: fullPath, value: property };
    applyPatch(this.schema, [op]);
  }

  // Remove a property from a specified path
  removeProperty(path: string, propertyName: string): void {
    path = path.trim() === '/' ? '' : path;
    const fullPath = sanitizeJsonPath(`${path}/properties/${propertyName}`);
    const op: Operation = { op: 'remove', path: fullPath };
    applyPatch(this.schema, [op]);
    this.removeRequiredFromProperty(path, propertyName);
  }

  // Remove from required if the property is present
  private removeRequiredFromProperty(path: string, propertyName: string): void {
    path = path.trim() === '/' ? '' : path;
    const requiredPath = sanitizeJsonPath(`${path}/required`);
    const requiredIndex = getValueAtPath(this.schema, requiredPath)?.indexOf(propertyName);
    if (requiredIndex > -1) {
      applyPatch(this.schema, [{ op: 'remove', path: `${requiredPath}/${requiredIndex}` }]);
    }
  }

  renameProperty(path: string, oldName: string, newName: string): void {
    const propertyPath = sanitizeJsonPath(`${path}/properties/${oldName}`);
    const newPath = sanitizeJsonPath(`${path}/properties/${newName}`);
    const propertyValue = getValueAtPath(this.schema, propertyPath);
    if (typeof propertyValue !== 'undefined') {
      applyPatch(this.schema, [{ op: 'remove', path: propertyPath }]);
      applyPatch(this.schema, [{ op: 'add', path: newPath, value: propertyValue }]);
      this.updateRequiredField(path, oldName, newName);
    }
  }

  rename(path: string, value: string): void {
    const newPath = sanitizeJsonPath(`${dirname(path)}/${value}`);
    const currentValue = getValueAtPath(this.schema, path);
    if (typeof currentValue !== 'undefined') {
      applyPatch(this.schema, [{ op: 'remove', path }]);
      applyPatch(this.schema, [{ op: 'add', path: newPath, value: currentValue }]);
    }
  }

  replace(path: string, value: string): void {
    const currentValue = getValueAtPath(this.schema, path);
    if (typeof currentValue !== 'undefined') {
      applyPatch(this.schema, [{ op: 'replace', path, value }]);
    }
  }

  add(path: string, value: string): void {
    applyPatch(this.schema, [{ op: 'add', path, value }]);
  }

  remove(path: string): void {
    const currentValue = getValueAtPath(this.schema, path);
    if (typeof currentValue !== 'undefined') {
      applyPatch(this.schema, [{ op: 'remove', path }]);
    }
  }

  private updateRequiredField(path: string, oldName: string, newName: string): void {
    const requiredPath = sanitizeJsonPath(`${path}/required`);
    const requiredArray = getValueAtPath(this.schema, requiredPath);
    if (requiredArray && requiredArray.includes(oldName)) {
      const index = requiredArray.indexOf(oldName);
      if (index !== -1) {
        applyPatch(this.schema, [
          { op: 'replace', path: `${requiredPath}/${index}`, value: newName }
        ]);
      }
    }
  }

}

export default JSONSchemaPatch;
