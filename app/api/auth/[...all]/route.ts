// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth/config";
import { toNextJsHandler } from "better-auth/next-js";

const handler = toNextJsHandler(auth);

async function loggedHandler(request: Request) {
  try {
    return await handler.GET(request);
  } catch (err: any) {
    console.error("[auth] GET error:", err?.message ?? err);
    return Response.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

async function loggedPostHandler(request: Request) {
  try {
    return await handler.POST(request);
  } catch (err: any) {
    console.error("[auth] POST error:", err?.message ?? err);
    return Response.json({ error: err?.message ?? "Internal error" }, { status: 500 });
  }
}

export { loggedHandler as GET, loggedPostHandler as POST };
