import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  // ✔ En route handlers SIEMPRE await
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  // validar firma y expiración
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
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!backendRes.ok) {
    return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
  }

  const usuario = await backendRes.json();

  return NextResponse.json({
    id_personal: usuario.id_personal,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    activo: usuario.activo,
  });
}