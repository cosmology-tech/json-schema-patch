import JSONSchemaPatch from '../src';

describe('JSONSchemaPatch - Remove Complex allOf References', () => {
  it('should remove properties with allOf references and clean up the schema', () => {
    const schema = {
      $defs: {
        asset: { type: "object", properties: { id: { type: "number" } } },
        product: { type: "object", properties: { name: { type: "string" } } }
      },
      properties: {
        name: { type: "string" },
        item: {
          allOf: [
            { $ref: "#/$defs/asset" },
            { $ref: "#/$defs/product" }
          ]
        },
        equipment: {
          allOf: [
            { $ref: "#/$defs/asset" }
          ]
        }
      },
      required: ["name", "item", "equipment"]
    };
    const patcher = new JSONSchemaPatch(schema);

    // Removing both 'asset' and 'product' definitions used in allOf structures
    patcher.removeDefinition('asset');
    patcher.removeDefinition('product');

    // After removing the definitions, check that the 'item' and 'equipment' properties are also removed
    expect(schema).toEqual({
      $defs: {},
      properties: {
        name: { type: "string" }
      },
      required: ["name"] // 'item' and 'equipment' should be removed from required as their conditions fail
    });
  });
});
