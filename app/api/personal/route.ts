import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// GET → listar personal
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");

    const res = await fetch(`${API_URL}/personal`, {
      headers: {
        Authorization: token || "",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener personal" },
      { status: 500 }
    );
  }
}

// POST → crear personal
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");
    const body = await req.json();

    const res = await fetch(`${API_URL}/personal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token || "",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al crear personal" },
      { status: 500 }
    );
  }
}