import type { NextConfig } from "next";

// Apollo Sandbox CDN domains — needed for the GraphQL playground at /api/graphql.
const APOLLO_CDN = "https://*.cdn.apollographql.com";
const APOLLO_SANDBOX = "https://sandbox.embed.apollographql.com";
const APOLLO_EXPLORER = "https://explorer.embed.apollographql.com";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""} ${APOLLO_CDN}`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${APOLLO_CDN}`,
      `img-src 'self' ${APOLLO_CDN} https://lh3.googleusercontent.com data:`,
      "font-src 'self' https://fonts.gstatic.com data:",
      `worker-src 'self' blob: ${APOLLO_CDN}`,
      `frame-src ${APOLLO_SANDBOX} ${APOLLO_EXPLORER} http://localhost:*`,
      `connect-src 'self' https://openrouter.ai ${APOLLO_CDN}`,
      "manifest-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
