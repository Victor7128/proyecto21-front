import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// PUT → actualizar personal
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get("authorization");
    const body = await req.json();

    const res = await fetch(`${API_URL}/personal/${params.id}`, {
      method: "PUT",
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
      { error: "Error al actualizar personal" },
      { status: 500 }
    );
  }
}

// DELETE → eliminar personal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = req.headers.get("authorization");

    const res = await fetch(`${API_URL}/personal/${params.id}`, {
      method: "DELETE",
      headers: {
        Authorization: token || "",
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al eliminar personal" },
      { status: 500 }
    );
  }
}