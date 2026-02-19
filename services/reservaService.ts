export interface Reserva {
  id_reserva: number;
  huesped: string;
  habitacion: string;
  fecha_entrada: string;
  fecha_salida: string;
  num_personas: number;
  monto_total: number;
  estado: string;
  fecha_creacion: string;
  // Estos campos requieren el fix del SP (agregar id_huesped, id_habitacion, id_estado al SELECT)
  id_huesped?: number;
  id_habitacion?: number;
  id_estado?: number;
}

export interface ReservaPayload {
  id_huesped: number;
  id_habitacion: number;
  fecha_entrada: string;
  fecha_salida: string;
  num_personas: number;
  monto_total: number;
  estado: number;
}

export interface HuespedOption {
  id: number;
  label: string;
}

export interface HabitacionOption {
  id: number;
  label: string;
  tarifa_base: number;
  estado: string;
  // capacidad NO está disponible en sp_GetHabitacion
}

export interface EstadoOption {
  id: number;
  label: string;
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail ?? err.message ?? "Error en la solicitud");
  }
  return res.json();
}

export const reservaService = {
  listar: (params?: {
    id_huesped?: number;
    id_habitacion?: number;
    estado?: number;
    fecha_entrada?: string;
    fecha_salida?: string;
  }) => {
    const qs = new URLSearchParams();
    if (params?.id_huesped)    qs.set("id_huesped",    String(params.id_huesped));
    if (params?.id_habitacion) qs.set("id_habitacion", String(params.id_habitacion));
    if (params?.estado)        qs.set("estado",        String(params.estado));
    if (params?.fecha_entrada) qs.set("fecha_entrada", params.fecha_entrada);
    if (params?.fecha_salida)  qs.set("fecha_salida",  params.fecha_salida);
    const q = qs.toString();
    return fetchApi<Reserva[]>(`/api/reservas${q ? `?${q}` : ""}`);
  },

  crear: (data: ReservaPayload) =>
    fetchApi<Reserva>("/api/reservas", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: ReservaPayload) =>
    fetchApi<{ mensaje: string }>(`/api/reservas/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchApi<{ mensaje: string }>(`/api/reservas/${id}`, { method: "DELETE" }),
};

export const reservaCatalogos = {
  huespedes:   () => fetchApi<HuespedOption[]>("/api/reservas/catalogos/huespedes"),
  habitaciones:() => fetchApi<HabitacionOption[]>("/api/reservas/catalogos/habitaciones"),
  estados:     () => fetchApi<EstadoOption[]>("/api/reservas/catalogos/estados"),
};