// lib/apollo/client.ts
// Apollo Client instance for the admin console (Constitution Article V — single instance,
// reused everywhere instead of creating multiple clients).

import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: "/api/graphql", credentials: "include" }),
  cache: new InMemoryCache(),
});
