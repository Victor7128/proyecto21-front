import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const backendRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  );

  if (!backendRes.ok) {
    const error = await backendRes.json().catch(() => ({}));
    return NextResponse.json(
      { message: error.detail ?? "Credenciales inválidas" },
      { status: 401 }
    );
  }

  const { access_token } = await backendRes.json();

  const response = NextResponse.json({ ok: true });

  // Cookie httpOnly: JS no puede leerla, solo el servidor
  response.cookies.set("token", access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 horas
  });

  return response;
}