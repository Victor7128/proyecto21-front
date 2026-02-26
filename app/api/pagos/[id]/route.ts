import { NextRequest } from "next/server";
import { getByIdHandler, updateHandler, deleteHandler } from "@/lib/route-handler";

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return getByIdHandler(req, "/pagos", id);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return updateHandler(req, "/pagos", id);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  return deleteHandler(req, "/pagos", id);
}