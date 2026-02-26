import { NextRequest, NextResponse } from "next/server";
import { getServerToken } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

function unauthorized() {
  return NextResponse.json({ detail: "No autorizado" }, { status: 401 });
}

function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Error desconocido";
  const status = msg.includes("404") ? 404 : msg.includes("403") ? 403 : 500;
  return NextResponse.json({ detail: msg }, { status });
}

/** GET /api/<resource>?filtros */
export async function listHandler(req: NextRequest, basePath: string) {
  const token = await getServerToken();
  if (!token) return unauthorized();
  try {
    const qs = req.nextUrl.searchParams.toString();
    const data = await apiFetch(`${basePath}${qs ? `?${qs}` : ""}`, { token });
    return NextResponse.json(data);
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/<resource> */
export async function createHandler(req: NextRequest, basePath: string) {
  const token = await getServerToken();
  if (!token) return unauthorized();
  try {
    const body = await req.json();
    const data = await apiFetch(basePath, { method: "POST", body, token });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}

/** GET /api/<resource>/[id] */
export async function getByIdHandler(_req: NextRequest, basePath: string, id: string) {
  const token = await getServerToken();
  if (!token) return unauthorized();
  try {
    const data = await apiFetch(`${basePath}/${id}`, { token });
    return NextResponse.json(data);
  } catch (e) {
    return handleError(e);
  }
}

/** PUT /api/<resource>/[id] */
export async function updateHandler(req: NextRequest, basePath: string, id: string) {
  const token = await getServerToken();
  if (!token) return unauthorized();
  try {
    const body = await req.json();
    const data = await apiFetch(`${basePath}/${id}`, { method: "PUT", body, token });
    return NextResponse.json(data);
  } catch (e) {
    return handleError(e);
  }
}

/** DELETE /api/<resource>/[id] */
export async function deleteHandler(_req: NextRequest, basePath: string, id: string) {
  const token = await getServerToken();
  if (!token) return unauthorized();
  try {
    const data = await apiFetch(`${basePath}/${id}`, { method: "DELETE", token });
    return NextResponse.json(data);
  } catch (e) {
    return handleError(e);
  }
}