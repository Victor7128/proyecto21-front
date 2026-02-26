// services/reservaService.ts
// Todas las llamadas van a los Route Handlers de Next.js (/api/...),
// que leen la cookie httpOnly y agregan el Bearer token.

// ── Tipos ────────────────────────────────────────────────────────────────────

/**
 * Coincide con ReservaResponse del backend.
 * sp_GetReserva devuelve el campo `estado` como string (nombre del join)
 * y `huesped` / `habitacion` también como strings enriquecidos.
 */
export interface Reserva {
  id_reserva:     number;
  id_huesped:     number;
  huesped:        string;          // "Nombres Apellidos" – JOIN en el SP
  id_habitacion:  number;
  habitacion:     string;          // "Número PX" – JOIN en el SP
  fecha_entrada:  string;          // "YYYY-MM-DD"
  fecha_salida:   string;          // "YYYY-MM-DD"
  num_personas:   number;
  monto_total:    number;
  estado:         string;          // "Pendiente" | "Confirmada" | "Cancelada" | "No show" | "Completada"
  fecha_creacion: string;
}

/**
 * Payload para crear o actualizar una reserva.
 * estado es el id numérico del EstadoReserva.
 */
export interface ReservaPayload {
  id_huesped:    number;
  id_habitacion: number;
  fecha_entrada: string;
  fecha_salida:  string;
  num_personas:  number;
  monto_total:   number;
  estado:        number;  // 1=Pendiente 2=Confirmada 3=Cancelada 4=No show 5=Completada
}

/** Orden de hospedaje (check-in / check-out). */
export interface OrdenHospedaje {
  id_orden_hospedaje: number;
  id_reserva:         number;
  estado:             number;       // 1=Pendiente 2=Activo 3=Completado (según EstadoOrdenHospedaje)
  nombre_estado?:     string;
  fecha_checkin:      string | null;
  fecha_checkout:     string | null;
}

/** Opción para el selector de huéspedes en el formulario. */
export interface HuespedOpcion {
  id_huesped: number;
  nombres:    string;
  apellidos:  string;
}

/** Opción para el selector de habitaciones en el formulario. */
export interface HabitacionOpcion {
  id_habitacion:    number;
  numero:           string;
  piso:             number;
  tipo_habitacion:  string;   // nombre del tipo (JOIN)
  tarifa_base:      number;
  estado:           string;   // "Disponible" | "Ocupada" | etc.
}

// ── Constantes de estado ─────────────────────────────────────────────────────

/** Mapeo nombre → estilos visuales para badges y tarjetas. */
export const ESTADO_STYLE: Record<
  string,
  { color: string; bg: string; border: string; dot: string }
> = {
  Pendiente:  { color: "#e8832a", bg: "rgba(232,131,42,.1)",  border: "rgba(232,131,42,.3)",  dot: "#e8832a" },
  Confirmada: { color: "#5a9e6f", bg: "rgba(90,158,111,.1)",  border: "rgba(90,158,111,.3)",  dot: "#5a9e6f" },
  Cancelada:  { color: "#d4451a", bg: "rgba(212,69,26,.08)",  border: "rgba(212,69,26,.25)",  dot: "#d4451a" },
  "No show":  { color: "#7a6e5f", bg: "rgba(122,110,95,.08)", border: "rgba(122,110,95,.22)", dot: "#7a6e5f" },
  Completada: { color: "#2a7ae8", bg: "rgba(42,122,232,.08)", border: "rgba(42,122,232,.2)",  dot: "#2a7ae8" },
};

/** Lista ordenada de estados con su id numérico (usado en selects). */
export const ESTADOS_RESERVA = [
  { id: 1, label: "Pendiente"  },
  { id: 2, label: "Confirmada" },
  { id: 3, label: "Cancelada"  },
  { id: 4, label: "No show"    },
  { id: 5, label: "Completada" },
] as const;

// ── fetchApi helper ──────────────────────────────────────────────────────────

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? err.message ?? `Error ${res.status}`);
  }
  return res.json();
}

// ── reservaService ───────────────────────────────────────────────────────────

export const reservaService = {
  /** Lista reservas con filtros opcionales. */
  listar: (filters: {
    id_huesped?:    number;
    id_habitacion?: number;
    estado?:        number;   // id numérico
    fecha_entrada?: string;
    fecha_salida?:  string;
  } = {}) => {
    const p = new URLSearchParams();
    if (filters.id_huesped)    p.set("id_huesped",    String(filters.id_huesped));
    if (filters.id_habitacion) p.set("id_habitacion", String(filters.id_habitacion));
    if (filters.estado != null) p.set("estado",       String(filters.estado));
    if (filters.fecha_entrada) p.set("fecha_entrada", filters.fecha_entrada);
    if (filters.fecha_salida)  p.set("fecha_salida",  filters.fecha_salida);
    const qs = p.toString();
    return fetchApi<Reserva[]>(`/api/reservas${qs ? `?${qs}` : ""}`);
  },

  crear: (data: ReservaPayload) =>
    fetchApi<Reserva>("/api/reservas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  /** Actualización completa (requiere todos los campos). */
  actualizar: (id: number, data: ReservaPayload) =>
    fetchApi<{ mensaje: string }>(`/api/reservas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Cambia solo el estado de una reserva existente,
   * manteniendo el resto de campos sin modificar.
   */
  cambiarEstado: (r: Reserva, nuevoEstadoId: number) => {
    const estadoId = ESTADOS_RESERVA.find(s => s.label === r.estado)?.id ?? 1;
    void estadoId; // se reemplaza con nuevoEstadoId
    return fetchApi<{ mensaje: string }>(`/api/reservas/${r.id_reserva}`, {
      method: "PUT",
      body: JSON.stringify({
        id_huesped:    r.id_huesped,
        id_habitacion: r.id_habitacion,
        fecha_entrada: r.fecha_entrada.slice(0, 10),
        fecha_salida:  r.fecha_salida.slice(0, 10),
        num_personas:  r.num_personas,
        monto_total:   Number(r.monto_total),
        estado:        nuevoEstadoId,
      } satisfies ReservaPayload),
    });
  },

  eliminar: (id: number) =>
    fetchApi<{ mensaje: string }>(`/api/reservas/${id}`, { method: "DELETE" }),
};

// ── hospedajeService ─────────────────────────────────────────────────────────

export const hospedajeService = {
  /** Busca órdenes por reserva. Devuelve array vacío si no hay check-in aún. */
  porReserva: (id_reserva: number) =>
    fetchApi<OrdenHospedaje[]>(`/api/hospedaje?id_reserva=${id_reserva}`),

  /**
   * Registra el check-in: crea la OrdenHospedaje con estado activo (2)
   * y fecha_checkin = ahora.
   */
  checkin: (id_reserva: number) =>
    fetchApi<OrdenHospedaje>("/api/hospedaje", {
      method: "POST",
      body: JSON.stringify({
        id_reserva,
        estado:        2,
        fecha_checkin: new Date().toISOString(),
      }),
    }),

  /**
   * Registra el check-out: actualiza la OrdenHospedaje a estado completado (3)
   * y guarda fecha_checkout = ahora.
   */
  checkout: (id_orden_hospedaje: number, orden: OrdenHospedaje) =>
    fetchApi<{ mensaje: string }>(`/api/hospedaje/${id_orden_hospedaje}`, {
      method: "PUT",
      body: JSON.stringify({
        estado:          3,
        fecha_checkin:   orden.fecha_checkin,
        fecha_checkout:  new Date().toISOString(),
      }),
    }),
};

// ── catálogos ────────────────────────────────────────────────────────────────

export const reservaCatalogos = {
  huespedes: (nombre?: string) => {
    const qs = nombre ? `?nombre=${encodeURIComponent(nombre)}` : "";
    return fetchApi<HuespedOpcion[]>(`/api/huespedes${qs}`);
  },

  habitaciones: () =>
    fetchApi<HabitacionOpcion[]>("/api/habitaciones"),
};