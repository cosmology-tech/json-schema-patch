
import chain from '../__fixtures__/chain.schema.json';
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

it('JSONSchemaPatch transformer w excludes', () => {
  const patcher = new JSONSchemaPatch(chain);
  patcher.prepareOperation({
    op: 'remove',
    path: '/properties/images/items/properties/image_sync'
  });
  // patcher.applyPatch();
  patcher.transform(camelCaseTransform, isValidIdentifierCamelized);
  patcher.applyPatch();
  expect(patcher.schema).toMatchSnapshot();
})
