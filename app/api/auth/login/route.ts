import { NextRequest, NextResponse } from "next/server";
import { loginPersonal, loginHuesped, TOKEN_COOKIE, USER_COOKIE } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { email, password, tipo } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y contraseña son requeridos." },
        { status: 400 }
      );
    }

    let tokenData: { access_token: string; tipo: string };
    let userPayload: Record<string, unknown>;

    if (tipo === "huesped") {
      tokenData = await loginHuesped(email, password);
      userPayload = { tipo: "huesped" };
    } else {
      // Personal (default)
      tokenData = await loginPersonal(email, password);

      // Decodificar el JWT para obtener id_personal e id_rol
      const payloadBase64 = tokenData.access_token.split(".")[1];
      const decoded = JSON.parse(
        Buffer.from(payloadBase64, "base64url").toString("utf-8")
      );
      userPayload = {
        tipo:        "personal",
        id_personal: decoded.id_personal,
        id_rol:      decoded.id_rol,
        nombre_rol:  decoded.nombre_rol,
      };
    }

    const response = NextResponse.json({ ok: true, tipo: tokenData.tipo });

    // Cookie del token (httpOnly — JS del cliente no puede leerla)
    response.cookies.set(TOKEN_COOKIE, tokenData.access_token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 8, // 8 horas
    });

    // Cookie del usuario (no httpOnly — el cliente puede leerla para mostrar info)
    response.cookies.set(USER_COOKIE, JSON.stringify(userPayload), {
      httpOnly: false,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 8,
    });

    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al iniciar sesión.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}