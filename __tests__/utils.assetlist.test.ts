
import assetList from '../__fixtures__/assetlist.schema.json';
import { createJSONSchemaPatchOperations, findAllProps } from '../src/utils';

function camelCaseTransform(key: string): string {
  return key.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}

it('findAllProps', () => {
  expect(findAllProps(assetList)).toMatchSnapshot();
})


it('createJSONSchemaPatchOperations', () => {
  expect(createJSONSchemaPatchOperations(findAllProps(assetList), camelCaseTransform)).toMatchSnapshot();
})

