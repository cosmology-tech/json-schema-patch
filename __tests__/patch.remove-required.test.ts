import JSONSchemaPatch from '../src';

describe('JSONSchemaPatch - Remove Property and Update Required Array', () => {
  it('should remove a property and its required reference', () => {
    const schema = {
      properties: {
        name: { type: "string" },
        age: { type: "number" }
      },
      required: ["name", "age"]
    };
    const patcher = new JSONSchemaPatch(schema);

    patcher.removeProperty('/', 'age');

    expect(schema).toEqual({
      properties: {
        name: { type: "string" }
      },
      required: ["name"]
    });
  });

  it('should handle removal of a non-existent property gracefully', () => {
    const schema = {
      properties: {
        name: { type: "string" }
      },
      required: ["name"]
    };
    const patcher = new JSONSchemaPatch(schema);

    patcher.removeProperty('/', 'age'); // 'age' does not exist

    expect(schema).toEqual({
      properties: {
        name: { type: "string" }
      },
      required: ["name"]
    });
  });
});
