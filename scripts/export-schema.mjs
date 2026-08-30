#!/usr/bin/env node
// scripts/export-schema.mjs
// Exports the GraphQL schema via introspection and saves as schema-introspection.json.
// Used by CI to diff against the committed schema (T061).
//
// Builds the schema directly from typeDefs — no running server or DB required.

import { buildSchema, introspectionFromSchema, print } from "graphql";
import { writeFileSync } from "fs";

// Import typeDefs (DocumentNode) and print to SDL
const { typeDefs } = await import("../lib/graphql-schema/typeDefs.ts");

const sdl = print(typeDefs);
const schema = buildSchema(sdl);
const introspection = introspectionFromSchema(schema, { descriptions: false });

writeFileSync(
  "schema-introspection.json",
  JSON.stringify(introspection.__schema, null, 2) + "\n",
);
console.log("Schema exported to schema-introspection.json");
