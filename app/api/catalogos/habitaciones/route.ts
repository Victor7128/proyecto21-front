import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  const res = await fetch(`${BACKEND}/habitaciones`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const raw = await res.json().catch(() => []);

  // sp_GetHabitacion devuelve: id_habitacion, numero, piso, tipo_habitacion, tarifa_base, estado
  // NO devuelve capacidad_personas
  const data = raw.map((h: {
    id_habitacion: number;
    numero: string;
    piso: number;
    tipo_habitacion: string;
    tarifa_base: number;
    estado: string;
  }) => ({
    id: h.id_habitacion,
    label: `Hab. ${h.numero} — Piso ${h.piso} — ${h.tipo_habitacion}`,
    tarifa_base: h.tarifa_base,
    estado: h.estado,
  }));

  return NextResponse.json(data, { status: res.status });
}