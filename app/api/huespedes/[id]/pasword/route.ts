import { NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = await apiFetch("/personal/bootstrap", { method: "POST", body });
    return NextResponse.json(data, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ detail: msg }, { status: 500 });
  }
}