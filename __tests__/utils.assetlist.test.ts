
import assetList from '../__fixtures__/assetlist.schema.json';
import { createJSONSchemaPatchOperations, findAllProps } from '../src/utils';
import JSONSchemaPatch from '../src';

// FROM schema-typescript
// // Determine if the key is a valid JavaScript identifier

// Determine if the key is a valid JavaScript-like identifier, allowing internal hyphens
function isValidIdentifierCamelized(key: string) {
  return /^[$A-Z_][0-9A-Z_$\-]*$/i.test(key) && !/^[0-9]+$/.test(key) && !/^-/.test(key);
}

// FROM strfy-js
function camelCaseTransform(key: string): string {
  return key.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}

it('findAllProps', () => {
  expect(findAllProps(assetList)).toMatchSnapshot();
})


it('createJSONSchemaPatchOperations', () => {
  expect(createJSONSchemaPatchOperations(findAllProps(assetList), camelCaseTransform, isValidIdentifierCamelized)).toMatchSnapshot();
})


it('JSONSchemaPatch transformer', () => {
  const patcher = new JSONSchemaPatch(assetList);
  patcher.transform(camelCaseTransform, isValidIdentifierCamelized);
  patcher.applyPatch();
  expect(patcher.schema).toMatchSnapshot();
})
