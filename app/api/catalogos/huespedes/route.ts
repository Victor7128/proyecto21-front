import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  const res = await fetch(`${BACKEND}/huespedes`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const raw = await res.json().catch(() => []);

  // sp_GetHuesped devuelve: id_huesped, nombres, apellidos, tipo_documento, num_documento, telefono, correo, fecha_creacion
  const data = raw.map((h: {
    id_huesped: number;
    nombres: string;
    apellidos: string;
    num_documento: string;
  }) => ({
    id: h.id_huesped,
    label: `${h.nombres} ${h.apellidos} — ${h.num_documento}`,
  }));

  return NextResponse.json(data, { status: res.status });
}