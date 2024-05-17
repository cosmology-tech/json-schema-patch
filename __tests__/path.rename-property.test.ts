import JSONSchemaPatch from '../src';

describe('JSONSchemaPatch - renameProperty', () => {
  it('should rename a property and update required fields', () => {
    const schema = {
      properties: {
        oldName: { type: "string" },
        otherProp: { type: "number" }
      },
      required: ["oldName", "otherProp"]
    };
    const patcher = new JSONSchemaPatch(schema);

    // Preparing operation to rename 'oldName' to 'newName'
    patcher.prepareOperation({
      op: 'renameProperty',
      path: '/properties',
      value: { oldName: 'oldName', newName: 'newName' }
    });

    // Applying all prepared operations
    patcher.applyPatch();

    // Expected schema after the operation
    const expectedSchema = {
      properties: {
        newName: { type: "string" }, // 'oldName' should now be 'newName'
        otherProp: { type: "number" }
      },
      required: ["newName", "otherProp"] // 'required' should be updated to reflect the new property name
    };

    // Asserting that the schema has been updated as expected
    expect(schema).toEqual(expectedSchema);
  });

  it('should handle renaming a non-existent property gracefully', () => {
    const schema = {
      properties: {
        someProp: { type: "string" }
      },
      required: ["someProp"]
    };
    const patcher = new JSONSchemaPatch(schema);

    // Attempting to rename a non-existent property
    patcher.prepareOperation({
      op: 'renameProperty',
      path: '/properties',
      value: { oldName: 'nonExistent', newName: 'newName' }
    });

    // Applying all prepared operations
    patcher.applyPatch();

    // Expect the schema to remain unchanged as the property does not exist
    expect(schema).toEqual({
      properties: {
        someProp: { type: "string" }
      },
      required: ["someProp"]
    });
  });
});
