import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  // Ruta correcta según catalogos_router.py: /catalogos/estado-reserva
  const res = await fetch(`${BACKEND}/catalogos/estado-reserva`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const raw = await res.json().catch(() => []);

  // EstadoReservaResponse: { id_estado_reserva, nombre }
  const data = raw.map((e: { id_estado_reserva: number; nombre: string }) => ({
    id: e.id_estado_reserva,
    label: e.nombre,
  }));

  return NextResponse.json(data, { status: res.status });
}