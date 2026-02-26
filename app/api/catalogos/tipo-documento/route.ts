import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { TOKEN_COOKIE } from "@/lib/auth";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

export async function GET() {
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;

  const res = await fetch(`${BACKEND}/catalogos/tipo-documento`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    return NextResponse.json(error, { status: res.status });
  }

  const raw = await res.json();

  if (!Array.isArray(raw)) {
    return NextResponse.json([], { status: 200 });
  }

  const data = raw.map((t) => ({
    id: t.id_tipo_documento,
    label: t.descripcion,
  }));

  return NextResponse.json(data);
}