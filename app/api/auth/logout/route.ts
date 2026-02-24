import { NextResponse } from "next/server";
import { TOKEN_COOKIE, USER_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(TOKEN_COOKIE);  // "auth_token"
  response.cookies.delete(USER_COOKIE);   // "auth_user"
  return response;
}