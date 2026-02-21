// proxy.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/login"];

async function isValidToken(token?: string) {
  if (!token) return false;

  try {
    await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET)
    );
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  const valid = await isValidToken(token);

  // Redirigir la raíz según si está autenticado o no
  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(valid ? "/dashboard" : "/login", req.url)
    );
  }

  if (!valid && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (valid && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};