// lib/auth.ts
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "");

// WARNING: si JWT_SECRET no está definido, jose fallará en runtime.
// Asegúrate de definir JWT_SECRET en .env.local o en el entorno de producción.
if (!process.env.JWT_SECRET) {
  // opcional: un aviso para dev
  // eslint-disable-next-line no-console
  console.warn("JWT_SECRET no está definido. Define process.env.JWT_SECRET antes de usar auth.");
}

/**
 * payload: usa Record<string, unknown> para que TypeScript acepte la forma dinámica.
 * casteamos a JWTPayload para cumplir la firma de SignJWT.
 */
export async function createToken(payload: Record<string, unknown>) {
  return await new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("2h")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as JWTPayload;
}