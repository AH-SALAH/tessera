#!/usr/bin/env node
// scripts/export-schema.mjs
// Exports the GraphQL schema via introspection query and saves as schema.graphql
// Used by CI to diff against the committed schema (T061).

const INTROSPECTION_QUERY = `
  query IntrospectionQuery {
    __schema {
      queryType { name }
      mutationType { name }
      subscriptionType { name }
      types {
        name
        kind
        description
        fields(includeDeprecated: true) {
          name
          description
          args { name description type { name kind ofType { name kind } } }
          type { name kind ofType { name kind } }
          isDeprecated
          deprecationReason
        }
        inputFields { name description type { name kind ofType { name kind } } }
        interfaces { name kind }
        enumValues(includeDeprecated: true) { name description isDeprecated deprecationReason }
        possibleTypes { name kind }
      }
      directives { name description locations args { name description type { name kind ofType { name kind } } } }
    }
  }
`;

async function main() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: INTROSPECTION_QUERY }),
  });

  if (!res.ok) {
    console.error(`Introspection failed: ${res.status} ${res.statusText}`);
    process.exit(1);
  }

  const { data, errors } = await res.json();
  if (errors) {
    console.error("Introspection errors:", JSON.stringify(errors, null, 2));
    process.exit(1);
  }

  // Write raw JSON for diffing (more reliable thanSDL conversion)
  const fs = await import("fs");
  fs.writeFileSync("schema-introspection.json", JSON.stringify(data.__schema, null, 2) + "\n");
  console.log("Schema exported to schema-introspection.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
