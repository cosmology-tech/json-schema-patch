
import assetList from '../__fixtures__/assetlist.schema.json';
import { createJSONSchemaPatchOperations, findAllProps } from '../src/utils';
import JSONSchemaPatch from '../src';

function camelCaseTransform(key: string): string {
  return key.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}

it('findAllProps', () => {
  expect(findAllProps(assetList)).toMatchSnapshot();
})


it('createJSONSchemaPatchOperations', () => {
  expect(createJSONSchemaPatchOperations(findAllProps(assetList), camelCaseTransform)).toMatchSnapshot();
})


it('JSONSchemaPatch transformer', () => {
  const patcher = new JSONSchemaPatch(assetList);
  patcher.transform(camelCaseTransform);
  patcher.applyPatch();
  expect(patcher.schema).toMatchSnapshot();
})
