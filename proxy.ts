import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { TOKEN_COOKIE, USER_COOKIE } from "@/lib/auth";

const PUBLIC_ROUTES      = ["/login", "/registro", "/api/auth"];
const PROTECTED_PERSONAL = ["/dashboard"];
const PROTECTED_HUESPED  = ["/portal"];

async function isValidToken(token?: string) {
  if (!token) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token   = req.cookies.get(TOKEN_COOKIE)?.value;
  const userRaw = req.cookies.get(USER_COOKIE)?.value;
  const valid   = await isValidToken(token);

  // Redirigir raíz
  if (pathname === "/") {
    if (!valid) return NextResponse.redirect(new URL("/login", req.url));
    try {
      const user = JSON.parse(userRaw ?? "{}");
      return NextResponse.redirect(
        new URL(user.tipo === "huesped" ? "/portal" : "/dashboard", req.url)
      );
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // Dejar pasar rutas públicas y assets
  if (
    PUBLIC_ROUTES.some(r => pathname.startsWith(r)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    // Si ya está autenticado e intenta ir al login → redirigir
    if (valid && pathname.startsWith("/login")) {
      try {
        const user = JSON.parse(userRaw ?? "{}");
        return NextResponse.redirect(
          new URL(user.tipo === "huesped" ? "/portal" : "/dashboard", req.url)
        );
      } catch {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }
    return NextResponse.next();
  }

  // Sin token válido → login
  if (!valid) {
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.delete(TOKEN_COOKIE);
    res.cookies.delete(USER_COOKIE);
    return res;
  }

  // Verificar tipo de usuario para rutas protegidas
  if (userRaw) {
    try {
      const user = JSON.parse(userRaw);

      if (PROTECTED_PERSONAL.some(r => pathname.startsWith(r)) && user.tipo !== "personal") {
        return NextResponse.redirect(new URL("/portal", req.url));
      }

      if (PROTECTED_HUESPED.some(r => pathname.startsWith(r)) && user.tipo !== "huesped") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } catch {
      const res = NextResponse.redirect(new URL("/login", req.url));
      res.cookies.delete(TOKEN_COOKIE);
      res.cookies.delete(USER_COOKIE);
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};