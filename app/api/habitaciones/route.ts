    import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL;

async function getToken() {
  return (await cookies()).get("token")?.value;
}

export async function GET(req: NextRequest) {
  const token = await getToken();
  const search = req.nextUrl.search; // preserva ?nombre=...&num_documento=...

  const res = await fetch(`${BACKEND}/habitaciones${search}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const token = await getToken();
  const body = await req.json();

  const res = await fetch(`${BACKEND}/habitaciones`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}