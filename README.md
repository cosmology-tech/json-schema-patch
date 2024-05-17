# json-schema-patch

`json-schema-patch` provides a dynamic way to modify JSON schemas by applying a series of operations that can add, remove, or replace properties and definitions within the schema.

## Features

- Add, remove, and replace properties within a JSON schema.
- Manage schema `$defs` with operations to add and remove definitions.
- Automatically handle dependencies and cleanup for removed definitions.

## Installation

```bash
npm install json-schema-patch
```

## Usage

### import the `JSONSchemaPatch` class

```js
import { JSONSchemaPatch } from 'path-to-json-schema-patch';
```

### Create an instance

```js
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
```

### Applying Operations

```js
// Add a new definition
patcher.addDefinition('newDef', { type: "object", properties: { newProp: { type: "string" } } });

// Remove a definition and clean up references
patcher.removeDefinition('asset');

// Add a new property
patcher.addProperty('/properties', 'newProp', { type: "number" });

// Remove a property
patcher.removeProperty('/properties', 'item');

// Apply all prepared operations and finalize changes
patcher.applyPatch();

console.log(schema);
```