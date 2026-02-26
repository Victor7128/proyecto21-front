import { NextRequest, NextResponse } from "next/server";
import { getServerToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  const token = await getServerToken();
  if (!token) return NextResponse.json({ detail: "No autorizado" }, { status: 401 });
  try {
    const { id } = await params;
    const body = await req.json();
    const data = await apiFetch(`/personal/${id}/password`, { method: "PUT", body, token });
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}