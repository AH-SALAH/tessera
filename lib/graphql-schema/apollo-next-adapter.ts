// lib/graphql-schema/apollo-next-adapter.ts
// Lightweight adapter between Next.js App Router and Apollo Server 5.
//
// Why this exists instead of using @as-integrations/next:
//   The official adapter calls getBody() on EVERY request (including GET).
//   GET requests have no body, so req.text() returns "", and downstream
//   CSRF / JSON parsing crashes with "Unexpected end of JSON input".
//   Apollo Server 5 already handles GET (landing page) and POST (query)
//   correctly — we just need to wire the HTTP types properly.

import type {
  ApolloServer,
  BaseContext,
  HTTPGraphQLRequest,
  HTTPGraphQLResponse,
} from "@apollo/server";
import { HeaderMap } from "@apollo/server";
import { NextRequest, NextResponse } from "next/server";

/**
 * Build an Apollo Server HTTPGraphQLRequest from a NextRequest.
 * Only reads the body for POST/PUT/PATCH — GET/HEAD get body: undefined.
 */
async function toApolloRequest(request: NextRequest): Promise<HTTPGraphQLRequest> {
  const method = request.method;
  const url = new URL(request.url);

  // Convert Next.js Headers → Apollo HeaderMap
  const headers = new HeaderMap();
  request.headers.forEach((value: string, key: string) => {
    headers.set(key, value);
  });

  // Only parse body for methods that have one
  let body: unknown = undefined;
  if (method === "POST" || method === "PUT" || method === "PATCH") {
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        body = undefined;
      }
    } else {
      // GraphQL over HTTP spec: POST body must be JSON
      body = undefined;
    }
  }

  return {
    method,
    headers,
    search: url.search,
    body,
  };
}

/**
 * Convert Apollo Server HTTPGraphQLResponse to NextResponse.
 */
function toNextResponse(apolloResponse: HTTPGraphQLResponse): NextResponse {
  const headers = new Headers();
  apolloResponse.headers.forEach((value: string, key: string) => {
    headers.set(key, value);
  });

  const status = apolloResponse.status ?? 200;

  const body = apolloResponse.body;
  if (body.kind === "complete") {
    return new NextResponse(body.string, { status, headers });
  }

  // Streaming response
  const iterator = body.asyncIterator;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async pull(controller) {
      const { value, done } = await iterator.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(encoder.encode(value));
      }
    },
  });

  return new NextResponse(stream, { status, headers });
}

/**
 * Create a Next.js App Router handler for an Apollo Server instance.
 *
 * Usage:
 *   const handler = createApolloNextHandler(server, { context });
 *   export { handler as GET, handler as POST };
 */
export function createApolloNextHandler<TContext extends BaseContext>(
  server: ApolloServer<TContext>,
  options?: {
    context?: (request: NextRequest) => Promise<TContext> | TContext;
  },
) {
  // Ensure server is started (non-blocking)
  server.startInBackgroundHandlingStartupErrorsByLoggingAndFailingAllRequests();

  return async function handler(request: NextRequest): Promise<NextResponse> {
    try {
      const apolloRequest = await toApolloRequest(request);
      const context = options?.context ? await options.context(request) : ({} as TContext);

      const apolloResponse = await server.executeHTTPGraphQLRequest({
        httpGraphQLRequest: apolloRequest,
        context: async () => context,
      });

      return toNextResponse(apolloResponse);
    } catch (error) {
      console.error("GraphQL handler error:", error);
      return NextResponse.json({ errors: [{ message: "Internal server error" }] }, { status: 500 });
    }
  };
}
