// app/api/auth/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  const backendRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { message: (error as any).detail ?? "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const data = await backendRes.json();
console.log("LOGIN BACKEND RESPONSE:", data);
const access_token = data.access_token;

  const response = NextResponse.json({ ok: true });

  response.cookies.set("token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  return response;
}