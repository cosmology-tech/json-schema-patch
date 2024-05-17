import JSONSchemaPatch from '../src';

describe('JSONSchemaPatch - Remove Definitions Including Complex References', () => {
  it('should remove a definition referenced by anyOf and update the structure', () => {
    const schema = {
      $defs: {
        asset: { type: "object", properties: { id: { type: "number" } } },
        product: { type: "object", properties: { name: { type: "string" } } }
      },
      properties: {
        item: {
          anyOf: [
            { $ref: "#/$defs/asset" },
            { $ref: "#/$defs/product" }
          ]
        }
      }
    };
    const patcher = new JSONSchemaPatch(schema);

    // Removing 'asset' definition, should also update 'anyOf' in 'item'
    patcher.removeDefinition('asset');

    expect(schema).toEqual({
      $defs: {
        product: { type: "object", properties: { name: { type: "string" } } }
      },
      properties: {
        item: {
          anyOf: [
            { $ref: "#/$defs/product" }
          ]
        }
      }
    });
  });

  it('should handle allOf with nested $ref after removing one reference', () => {
    const schema = {
      $defs: {
        asset: { type: "object", properties: { id: { type: "number" } } },
        product: { type: "object", properties: { name: { type: "string" } } }
      },
      properties: {
        item: {
          allOf: [
            { $ref: "#/$defs/asset" },
            { $ref: "#/$defs/product" }
          ]
        }
      }
    };
    const patcher = new JSONSchemaPatch(schema);

    // Removing 'product' definition, should also update 'allOf' in 'item'
    patcher.removeDefinition('product');

    expect(schema).toEqual({
      $defs: {
        asset: { type: "object", properties: { id: { type: "number" } } }
      },
      properties: {
        item: {
          allOf: [
            { $ref: "#/$defs/asset" }
          ]
        }
      }
    });
  });
});
