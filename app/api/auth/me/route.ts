import { NextResponse } from "next/server";
import { getServerToken, verifyToken } from "@/lib/auth";  // ← usar getServerToken

export async function GET() {
  const token = await getServerToken();  // ← lee la cookie "auth_token" correctamente

  if (!token) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  let payload;
  try {
    payload = await verifyToken(token);
  } catch {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }

  const id_personal =
    (payload.sub as string | undefined) ??
    (payload.id_personal as string | undefined);

  if (!id_personal) {
    return NextResponse.json({ message: "Token sin identidad" }, { status: 401 });
  }

  const backendRes = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/personal/${encodeURIComponent(id_personal)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }
  );

  if (!backendRes.ok) {
    return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
  }

  const usuario = await backendRes.json();

  return NextResponse.json({
    id_personal: usuario.id_personal,
    nombre:      usuario.nombre,
    email:       usuario.email,
    rol:         usuario.rol,
    activo:      usuario.activo,
  });
}