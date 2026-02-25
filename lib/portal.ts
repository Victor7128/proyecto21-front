// lib/portal.ts
// Helpers del lado del cliente para el portal del huésped

export type AuthUser = {
  tipo:       "huesped";
  id_huesped: number;
};

/**
 * Lee el usuario autenticado de la cookie del navegador.
 * auth_user NO es httpOnly, así que sí podemos leerla en el cliente.
 * auth_token SÍ es httpOnly — nunca intentes leerla aquí.
 */
export function getUser(): AuthUser | null {
  if (typeof document === "undefined") return null; // SSR guard

  const raw = document.cookie
    .split("; ")
    .find(r => r.startsWith("auth_user="));

  if (!raw) return null;

  // Usar slice(1).join("=") en vez de [1] para no perder "=" dentro del valor
  const value = raw.split("=").slice(1).join("=");
  if (!value) return null;

  try {
    return JSON.parse(decodeURIComponent(value));
  } catch {
    return null;
  }
}

/**
 * Fetch autenticado al backend FastAPI.
 *
 * En lugar de llamar a FastAPI directamente (lo que requeriría leer
 * la cookie httpOnly desde el navegador, cosa que el navegador bloquea),
 * llamamos al proxy de Next.js en /api/portal que sí puede leerla.
 *
 * El path se pasa como query param ?path= para que el proxy sepa
 * a qué endpoint de FastAPI dirigir la petición.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  // Separar el path de sus propios query params
  // ej: "/habitaciones?estado=1" → path="/habitaciones", qs="estado=1"
  const [basePath, qs] = path.split("?");
  const proxyUrl = `/api/portal?path=${encodeURIComponent(basePath)}${qs ? `&${qs}` : ""}`;

  const res = await fetch(proxyUrl, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const detail = err.detail;

    let message: string;
    if (typeof detail === "string") {
      // Error simple de negocio (el más común)
      message = detail;
    } else if (Array.isArray(detail)) {
      // Error de validación FastAPI: [{loc, msg, type}, ...]
      // Esto es lo que causaba "[object Object]"
      message = detail
        .map((d: { loc?: string[]; msg?: string }) => {
          const campo = d.loc?.slice(1).join(".") ?? "";
          return campo ? `${campo}: ${d.msg}` : (d.msg ?? JSON.stringify(d));
        })
        .join(" | ");
    } else {
      message = `Error ${res.status}`;
    }

    throw new Error(message);
  }

  return res.json();
}

// ── Tipos del dominio ─────────────────────────────────────────────────────────

export type Huesped = {
  id_huesped:     number;
  nombres:        string;
  apellidos:      string;
  tipo_documento: number;
  num_documento:  string;
  telefono:       string;
  correo:         string;
  email_login:    string;
  activo:         boolean;
};

// Campos exactos que devuelve sp_GetHabitacion:
// id_habitacion, numero, piso, tipo_habitacion (th.nombre), tarifa_base, estado (eh.nombre)
// NOTA: capacidad_personas NO viene del SP — está en TipoHabitacion pero el SP no la incluye
export type Habitacion = {
  id_habitacion:   number;
  numero:          string;
  piso:            number;
  tipo_habitacion: string;  // nombre del join con TipoHabitacion
  tarifa_base:     number;
  estado:          string;  // nombre del join con EstadoHabitacion, ej: "Disponible"
};

export type Reserva = {
  id_reserva:     number;
  id_huesped:     number;
  id_habitacion:  number;
  huesped:        string;   // nombres + apellidos del join
  habitacion:     string;   // numero + piso formateado del join
  fecha_entrada:  string;
  fecha_salida:   string;
  estado:         string;   // nombre del estado (join con EstadoReserva)
  monto_total:    number;
  num_personas:   number;
  fecha_creacion: string;
};

export type OrdenHospedaje = {
  id_orden_hospedaje: number;
  id_reserva:         number;
  estado:             number;
  fecha_checkin:      string | null;
  fecha_checkout:     string | null;
};

export type Documento = {
  id_documento:     number;
  numero_documento: string;
  tipo_documento:   number;
  tipo_nombre:      string;
  monto_total:      number;
  monto_pagado:     number;
  saldo_pendiente:  number;
  estado_documento: number;
  fecha_emision:    string;
  descripcion:      string;
};

export type Pago = {
  id_pago:          number;
  id_documento:     number;
  fecha_pago:       string;
  monto_pagado:     number;
  metodo:           number;
  estado_pago:      number;
  numero_operacion: string;
};

export type Encuesta = {
  id_encuesta:             number;
  id_orden_hospedaje:      number;
  recomendacion:           number;
  calificacion_limpieza:   number;
  calificacion_servicio:   number;
  calificacion_ubicacion:  number;
  calificacion_precio:     number;
  motivo_viaje:            string;
  lugar_origen:            string;
  descripcion:             string;
  comentarios:             string;
  fecha_encuesta:          string;
};

// ── Constantes de catálogo ────────────────────────────────────────────────────

/**
 * IMPORTANTE: el backend devuelve estado como STRING (nombre del join),
 * no como número. Usar el nombre exacto que devuelve sp_GetReserva.
 * Verifica los nombres en tu tabla EstadoReserva si algo no coincide.
 */
export const ESTADO_RESERVA: Record<string, { label: string; color: string }> = {
  "Pendiente":  { label: "Pendiente",  color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  "Confirmada": { label: "Confirmada", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  "Cancelada":  { label: "Cancelada",  color: "bg-red-500/20 text-red-400 border-red-500/30" },
  "Completada": { label: "Completada", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

export const ESTADO_HOSPEDAJE: Record<number, { label: string; color: string }> = {
  1: { label: "Check-in pendiente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  2: { label: "Activo",             color: "bg-green-500/20 text-green-400 border-green-500/30" },
  3: { label: "Finalizado",         color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

export const ESTADO_DOC: Record<number, { label: string; color: string }> = {
  1: { label: "Pendiente", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  2: { label: "Pagado",    color: "bg-green-500/20 text-green-400 border-green-500/30" },
  3: { label: "Vencido",   color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

export const METODO_PAGO: Record<number, string> = {
  1: "Efectivo", 2: "Tarjeta", 3: "Transferencia", 4: "Yape/Plin",
};

// ── Utils ─────────────────────────────────────────────────────────────────────

export function calcNochces(entrada: string, salida: string): number {
  const diff = new Date(salida).getTime() - new Date(entrada).getTime();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
}

export function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(iso + (iso.includes("T") ? "" : "T12:00:00"))
    .toLocaleDateString("es-PE", opts ?? { day: "numeric", month: "long", year: "numeric" });
}

export function fmtMoney(val: number | string): string {
  return `S/ ${Number(val).toFixed(2)}`;
}