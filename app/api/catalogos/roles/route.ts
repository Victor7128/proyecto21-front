// app/api/catalogos/roles/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "@/lib/auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  const res = await fetch(`${BACKEND}/catalogos/rol`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const raw = await res.json().catch(() => []);
  const data = raw.map((r: { id_rol: number; nombre: string }) => ({
    id: r.id_rol,
    label: r.nombre,
  }));

  return NextResponse.json(data, { status: res.status });
}
