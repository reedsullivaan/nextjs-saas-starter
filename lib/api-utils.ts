import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

/**
 * Get the authenticated session or return a 401 response.
 * Usage:
 *   const [session, errorResponse] = await requireAuth();
 *   if (errorResponse) return errorResponse;
 */
export async function requireAuth(): Promise<
  [{ user: { id: string; name?: string | null; email?: string | null } }, null] | [null, NextResponse]
> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return [null, NextResponse.json({ error: "Unauthorized" }, { status: 401 })];
  }

  return [session as { user: { id: string; name?: string | null; email?: string | null } }, null];
}

/**
 * Wrap an API handler with consistent error handling.
 */
export function apiHandler(
  handler: (req: Request, context: { params: Record<string, string> }) => Promise<NextResponse>
) {
  return async (req: Request, context: { params: Record<string, string> }) => {
    try {
      return await handler(req, context);
    } catch (error) {
      console.error("API error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  };
}
