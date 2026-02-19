import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const token = (await cookies()).get("token")?.value;

  const res = await fetch(`${BACKEND}/catalogos/tipo-documento`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const raw = await res.json().catch(() => []);
  const data = raw.map((t: { id_tipo_documento: number; descripcion: string }) => ({
    id: t.id_tipo_documento,
    label: t.descripcion,
  }));

  return NextResponse.json(data, { status: res.status });
}