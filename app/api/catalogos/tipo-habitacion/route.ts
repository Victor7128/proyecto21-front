import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "@/lib/auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  const res = await fetch(`${BACKEND}/catalogos/tipo-habitacion`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const raw = await res.json().catch(() => []);
  const mapped = raw.map((t: { id_tipo_habitacion: number; nombre: string }) => ({
    id: t.id_tipo_habitacion,
    label: t.nombre,
  }));

  const seen = new Set<string>();
  const data = mapped.filter((t: { id: number; label: string }) => {
    const key = t.label.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json(data, { status: res.status });
}
