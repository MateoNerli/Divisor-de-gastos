import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getAuthUserId } from "./auth";

export const requireAuth = async (request: NextRequest) => {
  const userId = await getAuthUserId(request);
  if (!userId) {
    return {
      userId: null,
      response: NextResponse.json({ error: "No autorizado" }, { status: 401 }),
    };
  }
  return { userId, response: null };
};
