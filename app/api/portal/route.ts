/**
 * app/api/portal/route.ts
 *
 * Proxy catch-all para el portal del huésped.
 * El navegador no puede leer cookies httpOnly, por lo que apiFetch
 * llama a este endpoint en lugar de ir directo a FastAPI.
 * Aquí sí podemos leer la cookie y reenviar el Bearer token.
 *
 * Uso: apiFetch("/habitaciones?estado=1")
 *   → fetch("/api/portal?path=/habitaciones&estado=1")
 *   → fetch(`${FASTAPI_URL}/habitaciones?estado=1`, { Authorization: Bearer <token> })
 */

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

async function handler(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value ?? "";

  // Reconstruir la URL del backend:
  // El frontend envía /api/portal?path=/habitaciones&estado=1
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") ?? "/";
  searchParams.delete("path");

  const qs = searchParams.toString();
  const backendUrl = `${API_URL}${path}${qs ? `?${qs}` : ""}`;

  // Reenviar el body si existe
  let body: BodyInit | undefined;
  const contentType = req.headers.get("content-type") ?? "";
  if (["POST", "PUT", "PATCH"].includes(req.method) && contentType.includes("application/json")) {
    body = await req.text();
  }

  try {
    const res = await fetch(backendUrl, {
      method:  req.method,
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${token}`,
      },
      ...(body ? { body } : {}),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error de conexión con el backend";
    return NextResponse.json({ detail: msg }, { status: 502 });
  }
}

export const GET    = handler;
export const POST   = handler;
export const PUT    = handler;
export const DELETE = handler;
export const PATCH  = handler;