import { applyPatch } from 'fast-json-patch';
import assetList from '../__fixtures__/assetlist.schema.json';

describe('JSON Schema Modification Test', () => {
  it('should modify the asset list schema and match the snapshot', () => {
    const patch = [
      { "op": "remove", "path": "/$defs/asset/properties/extended_description" },
      { "op": "remove", "path": "/$defs/asset/properties/logo_URIs" },
      { "op": "remove", "path": "/$defs/asset/properties/symbol" },
      { "op": "remove", "path": "/$defs/asset/properties/ibc" },
      { "op": "remove", "path": "/$defs/asset/required/4" }  // Assuming the index is known; otherwise, handle dynamically
    ];

    // Applying the JSON Patch
    const updatedDocument = applyPatch(assetList, patch as any).newDocument;

    // Asserting the output with a snapshot
    expect(updatedDocument).toMatchSnapshot();
  });
});
