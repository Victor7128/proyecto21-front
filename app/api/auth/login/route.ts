import { NextRequest, NextResponse } from "next/server";
import { loginPersonal, loginHuesped, TOKEN_COOKIE, USER_COOKIE } from "@/lib/auth";

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

    // Decodificar el JWT (sin verificar firma — solo para leer el payload)
    function decodeJwt(token: string) {
      const payloadBase64 = token.split(".")[1];
      return JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf-8"));
    }

    if (tipo === "huesped") {
      tokenData = await loginHuesped(email, password);

      // ← CORRECCIÓN: también hay que decodificar el JWT del huésped
      const decoded = decodeJwt(tokenData.access_token);
      userPayload = {
        tipo:       "huesped",
        id_huesped: decoded.id_huesped,   // el backend lo incluye en el JWT
      };
    } else {
      // Personal (default)
      tokenData = await loginPersonal(email, password);
      const decoded = decodeJwt(tokenData.access_token);
      userPayload = {
        tipo:        "personal",
        id_personal: decoded.id_personal,
        id_rol:      decoded.id_rol,
        nombre_rol:  decoded.nombre_rol,
      };
    }

    const response = NextResponse.json({ ok: true, tipo: tokenData.tipo });

    // Cookie del token (httpOnly — JS del cliente NO puede leerla)
    response.cookies.set(TOKEN_COOKIE, tokenData.access_token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      path:     "/",
      maxAge:   60 * 60 * 8,
    });

    // Cookie del usuario (NO httpOnly — el cliente sí puede leerla)
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