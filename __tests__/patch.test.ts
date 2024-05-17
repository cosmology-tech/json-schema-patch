import JSONSchemaPatch from '../src';
import assetList from '../__fixtures__/assetlist.schema.json';

describe('JSONSchemaPatch Operations', () => {
  it('should correctly apply schema modifications and match snapshot', () => {
    const patcher = new JSONSchemaPatch(assetList);

    // Prepare operations
    patcher.prepareOperation({
      op: 'addProperty',
      path: '/$defs/asset',
      value: {
        name: 'newDescription',
        property: { type: "string", description: "A new description property" }
      }
    });

    patcher.prepareOperation({
      op: 'removeProperty',
      path: '/$defs/asset',
      value: 'symbol'
    });

    patcher.prepareOperation({
      op: 'removeProperty',
      path: '/$defs/ibc_cw20_transition/properties/counterparty',
      value: 'channel_id'
    });

    patcher.prepareOperation({
      op: 'addDefinition',
      path: 'newAssetType',
      value: {
        type: "object",
        properties: {
          id: { type: "number" },
          name: { type: "string" }
        }
      }
    });

    patcher.prepareOperation({
      op: 'removeDefinition',
      path: 'asset'
    });

    // Apply all prepared operations
    const updatedSchema = patcher.applyPatch();

    // Check the updated schema against a snapshot
    expect(updatedSchema).toMatchSnapshot();
  });
});
