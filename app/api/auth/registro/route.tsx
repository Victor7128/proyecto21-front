import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";
import { TOKEN_COOKIE, USER_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const data = await apiFetch<{
      access_token: string;
      token_type:   string;
      tipo:         string;
      id_huesped:   number;
    }>("/auth/registro", { method: "POST", body });

    const userPayload = {
      tipo:       "huesped",
      id_huesped: data.id_huesped,
    };

    const response = NextResponse.json({ ok: true });

    response.cookies.set(TOKEN_COOKIE, data.access_token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 8,
    });

    response.cookies.set(USER_COOKIE, JSON.stringify(userPayload), {
      httpOnly: false,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 8,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al registrarse.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}