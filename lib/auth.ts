import { SignJWT, jwtVerify } from "jose";
import type { NextRequest, NextResponse } from "next/server";

const TOKEN_NAME = "auth_token";
const TOKEN_TTL = "7d";

const getJwtSecret = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret");

export const getAuthCookieName = () => TOKEN_NAME;

export const signAuthToken = async (userId: string) => {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getJwtSecret());
};

export const verifyAuthToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (!payload.sub || typeof payload.sub !== "string") {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
};

export const getAuthUserId = async (request: NextRequest) => {
  const token = request.cookies.get(TOKEN_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifyAuthToken(token);
};

export const setAuthCookie = async (
  response: NextResponse,
  userId: string
) => {
  const token = await signAuthToken(userId);
  response.cookies.set(TOKEN_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
};

export const clearAuthCookie = (response: NextResponse) => {
  response.cookies.set(TOKEN_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
};
