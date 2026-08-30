// app/api/graphql/route.ts
//
// Production-safe GraphQL endpoint.
//
// Architecture decision (why NOT @as-integrations/next):
//   The official adapter calls getBody() on EVERY request including GET.
//   GET requests have no body → crashes with "Unexpected end of JSON input".
//   Apollo Server 5 already handles GET (landing page) and POST (execution)
//   correctly via executeHTTPGraphQLRequest — we wire it directly.
//
// Landing page:
//   Dev: Apollo's default sandbox (loaded from CDN — fine for local dev).
//   Prod: Landing page disabled. Use Apollo Studio or a typed client instead.
//         If you need a playground in staging, set APOLLO_LANDING_PAGE=true.

import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import depthLimit from "graphql-depth-limit";
import { typeDefs } from "@/lib/graphql-schema/typeDefs";
import { projectResolvers } from "@/lib/graphql-schema/resolvers/project";
import { postResolvers } from "@/lib/graphql-schema/resolvers/post";
import { testimonialResolvers } from "@/lib/graphql-schema/resolvers/testimonial";
import { userResolvers } from "@/lib/graphql-schema/resolvers/user";
import { aiResolvers } from "@/lib/graphql-schema/resolvers/ai";
import { getServerSession } from "@/lib/auth/session";
import { createApolloNextHandler } from "@/lib/graphql-schema/apollo-next-adapter";
import { NextRequest } from "next/server";

// FR-003: per-IP token-bucket rate limiter (single-instance, in-memory).
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitBuckets = new Map<string, RateLimitBucket>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const bucket = rateLimitBuckets.get(ip) ?? {
    tokens: RATE_LIMIT_MAX_REQUESTS,
    lastRefill: now,
  };

  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((elapsed / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_MAX_REQUESTS);
  bucket.tokens = Math.min(RATE_LIMIT_MAX_REQUESTS, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    rateLimitBuckets.set(ip, bucket);
    return { allowed: true };
  }

  const retryAfterMs = Math.ceil(
    ((1 - bucket.tokens) / RATE_LIMIT_MAX_REQUESTS) * RATE_LIMIT_WINDOW_MS,
  );
  rateLimitBuckets.set(ip, bucket);
  return { allowed: false, retryAfterMs };
}

// FR-003: query depth limiting protects the free-tier DB from expensive nested queries.
const server = new ApolloServer({
  typeDefs,
  resolvers: [projectResolvers, postResolvers, testimonialResolvers, userResolvers, aiResolvers],
  introspection: true,
  validationRules: [depthLimit(8)],
  // Production: disable self-hosted landing page (Apollo CDN dependency).
  // Dev: use Apollo's default sandbox — loaded from CDN, fine locally.
  // Override with APOLLO_LANDING_PAGE=true env var for staging previews.
  plugins: [
    ...(process.env.NODE_ENV === "production" && process.env.APOLLO_LANDING_PAGE !== "true"
      ? [ApolloServerPluginLandingPageDisabled()]
      : []),
  ],
});

// Direct adapter — calls Apollo Server's executeHTTPGraphQLRequest.
// GET → landing page (or 404 in prod). POST → GraphQL execution.
const baseHandler = createApolloNextHandler(server, {
  context: async (request: NextRequest) => {
    const session = await getServerSession(request as unknown as Request);
    return { session };
  },
});

// Wrap with rate limiting
async function handler(request: NextRequest) {
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = checkRateLimit(ip);

  if (!allowed) {
    return Response.json(
      {
        errors: [
          {
            message: "Rate limit exceeded",
            extensions: { code: "RATE_LIMITED", retryAfterMs },
          },
        ],
      },
      {
        status: 429,
        headers: {
          "retry-after": String(Math.ceil((retryAfterMs ?? 60000) / 1000)),
        },
      },
    );
  }

  return baseHandler(request);
}

export { handler as GET, handler as POST };
