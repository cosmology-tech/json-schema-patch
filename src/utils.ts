import { JSONSchemaPatchOperation } from "./";

interface JSONSchema {
  properties?: { [key: string]: JSONSchema };
  items?: JSONSchema | JSONSchema[];
  $defs?: { [key: string]: JSONSchema };
  $ref?: string;
  [key: string]: any;
}

export interface PropertyPath {
  type: '$def' | 'property' | '$ref';
  path: string;
  name: string;
}

export type TransformFunction = (str: string) => string;
export type BooleanFunction = (str: string) => boolean;

function sortByDeepestPath(propertyPaths: PropertyPath[]): PropertyPath[] {
  return propertyPaths.sort((a, b) => {
    const depthA = a.path.split('/').length;
    const depthB = b.path.split('/').length;
    return depthB - depthA; // Descending order
  });
}

function sortOpsByDeepestPath(propertyPaths: JSONSchemaPatchOperation[]): JSONSchemaPatchOperation[] {
  return propertyPaths.sort((a, b) => {
    const depthA = a.path.split('/').length;
    const depthB = b.path.split('/').length;
    return depthB - depthA; // Descending order
  });
}

function findProps(schema: JSONSchema, currentPath: string = ''): PropertyPath[] {
  let paths: PropertyPath[] = [];
  const name = basename(currentPath);
  const parent = dirname(currentPath);

  if (!(name === '' && currentPath === '')) {
    const parentName = basename(parent);
    if (parentName == '$defs') {
      paths.push({ type: '$def', path: currentPath, name });
    } else if (schema.$ref) {
      paths.push({ type: '$ref', path: currentPath, name: schema.$ref });
      paths.push({ type: 'property', path: currentPath, name });
    } else {
      paths.push({ type: 'property', path: currentPath, name });
    }
  }

  // Process properties
  if (schema.properties) {
    for (const [key, value] of Object.entries(schema.properties)) {
      paths = paths.concat(findProps(value, `${currentPath}/properties/${key}`));
    }
  }

  // Process $defs
  if (schema.$defs) {
    for (const [key, value] of Object.entries(schema.$defs)) {
      paths = paths.concat(findProps(value, `${currentPath}/$defs/${key}`));
    }
  }

  // Process items in arrays or tuples
  if (schema.items) {
    if (Array.isArray(schema.items)) {
      schema.items.forEach((item, index) => {
        paths = paths.concat(findProps(item, `${currentPath}/items/${index}`));
      });
    } else {
      paths = paths.concat(findProps(schema.items, `${currentPath}/items`));
    }
  }

  // Process anyOf, allOf, and oneOf constructs
  ['anyOf', 'allOf', 'oneOf'].forEach(key => {
    if (schema[key]) {
      schema[key].forEach((item, index) => {
        paths = paths.concat(findProps(item, `${currentPath}/${key}/${index}`));
      });
    }
  });

  return paths;
}

export function findAllProps(schema: JSONSchema, currentPath: string = ''): PropertyPath[] {
  return sortByDeepestPath(findProps(schema, currentPath));
}

export function createJSONSchemaPatchOperations(
  propertyPaths: PropertyPath[],
  transform: TransformFunction,
  transformTest: BooleanFunction
): JSONSchemaPatchOperation[] {
  const ops = propertyPaths.map(propertyPath => {
    switch (propertyPath.type) {
      case 'property':
        return createRenamePropertyOperation(propertyPath, transform, transformTest);
      case '$def':
        return createReplaceDefOperation(propertyPath, transform, transformTest);
      case '$ref':
        return createReplaceRefOperation(propertyPath, transform, transformTest);
      default:
        throw new Error(`Unknown property type: ${propertyPath.type}`);
    }
  }).filter(Boolean);
  const final = sortOpsByDeepestPath(ops);
  const replaces = final.filter(o => o.op === 'replace');
  const rest = final.filter(o => o.op !== 'replace');
  return [
    ...rest,
    ...replaces
  ];

}

function createRenamePropertyOperation(
  propertyPath: PropertyPath,
  transform: TransformFunction,
  transformTest: BooleanFunction
): JSONSchemaPatchOperation {
  const grandParent = dirname(dirname(propertyPath.path));
  const oldName = basename(propertyPath.path);
  const newName = transform(oldName);

  if (!transformTest(oldName) || oldName === newName) return;

  return {
    op: 'renameProperty',
    path: grandParent,
    value: { oldName, newName }
  };
}

function createReplaceRefOperation(
  propertyPath: PropertyPath,
  transform: TransformFunction,
  transformTest: BooleanFunction
): JSONSchemaPatchOperation {
  const newRef = transformJsonPath(propertyPath.name, transform, transformTest);
  if (newRef === propertyPath.name) return;
  return {
    op: 'replace',
    path: transformJsonPath(propertyPath.path + '/$ref', transform, transformTest),
    value: newRef
  };
}

function createReplaceDefOperation(
  propertyPath: PropertyPath,
  transform: TransformFunction,
  transformTest: BooleanFunction
): JSONSchemaPatchOperation {
  const oldName = basename(propertyPath.path);
  const newName = transform(oldName);
  if (!transformTest(oldName) || oldName === newName) return;
  return {
    op: 'rename',
    path: propertyPath.path,
    value: transformJsonPath(propertyPath.name, transform, transformTest)
  };
}

function transformJsonPath(
  path: string,
  transform: TransformFunction,
  transformTest: BooleanFunction
): string {
  const specialKeywords = ['#', '$defs', '$ref', 'definitions', 'properties'];
  return path.split('/').map(segment => {
    const normalizedSegment = segment.replace(/^#/, '');
    if (specialKeywords.includes(normalizedSegment) || !transformTest(segment)) {
      return segment;
    }
    return transform(segment);
  }).join('/');
}

// MARKED AS NOT DRY


// from strfy-js
export function dirname(path: string): string {
  return path.replace(/\/[^\/]*$/, ''); // Removes last segment after the last '/'
}

export function basename(path: string): string {
  // Matches the last segment after the final '/'
  return path.split('/').pop() || '';
}
// end from strfy-js