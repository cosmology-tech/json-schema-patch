
import chain from '../__fixtures__/chain.schema.json';
import JSONSchemaPatch from '../src';

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
  patcher.transform(camelCaseTransform);
  patcher.applyPatch();
  expect(patcher.schema).toMatchSnapshot();
})
