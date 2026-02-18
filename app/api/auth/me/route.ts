import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  if (!token) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  try {
    // 1. Decodificar el payload del JWT para sacar el id_personal desde "sub"
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));

    const id_personal = decoded.sub ?? decoded.id_personal;

    if (!id_personal) {
      return NextResponse.json({ message: "Token sin identidad" }, { status: 401 });
    }

    // 2. Llamar al backend con el token para obtener los datos completos del usuario
    const backendRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/personal/${id_personal}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        // Evita que Next.js cachee esta respuesta
        cache: "no-store",
      }
    );

    if (!backendRes.ok) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 });
    }

    // 3. PersonalResponse devuelve: id_personal, nombre, email, rol, activo, etc.
    const usuario = await backendRes.json();

    return NextResponse.json({
      id_personal: usuario.id_personal,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo,
    });

  } catch {
    return NextResponse.json({ message: "Token inválido" }, { status: 401 });
  }
}