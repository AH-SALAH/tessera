// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

// Wrap to satisfy Next.js App Router signature (NextRequest + context).
export async function GET(request: Request) {
  return handler.GET(request);
}

export async function POST(request: Request) {
  return handler.POST(request);
}
