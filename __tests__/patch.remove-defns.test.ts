import JSONSchemaPatch from '../src';

describe('JSONSchemaPatch - Remove Definitions and Dependent Properties', () => {
  it('should remove a definition and a property that references it', () => {
    const schema = {
      $defs: {
        asset: {
          type: "object",
          properties: {
            id: { type: "number" }
          }
        }
      },
      properties: {
        myAsset: { $ref: "#/$defs/asset" }
      }
    };
    const patcher = new JSONSchemaPatch(schema);

    patcher.removeDefinition('asset');

    expect(schema).toEqual({
      $defs: {},
      properties: {}
    });
  });

  it('should not fail if the definition does not exist', () => {
    const schema = {
      $defs: {},
      properties: {}
    };
    const patcher = new JSONSchemaPatch(schema);

    patcher.removeDefinition('nonexistent');

    expect(schema).toEqual({
      $defs: {},
      properties: {}
    });
  });
});
