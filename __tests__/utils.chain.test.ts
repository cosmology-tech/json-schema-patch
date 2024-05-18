
import chain from '../__fixtures__/chain.schema.json';
import { createJSONSchemaPatchOperations, findAllProps } from '../src/utils';

function camelCaseTransform(key: string): string {
  return key.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
}

it('findAllProps', () => {
  expect(findAllProps(chain)).toMatchSnapshot();
})


it('createJSONSchemaPatchOperations', () => {
  expect(createJSONSchemaPatchOperations(findAllProps(chain), camelCaseTransform)).toMatchSnapshot();
})

