import { NextRequest } from "next/server";
import { listHandler, createHandler } from "@/lib/route-handler";

export const GET  = (req: NextRequest) => listHandler(req, "/encuestas");
export const POST = (req: NextRequest) => createHandler(req, "/encuestas");