export interface Habitacion {
  id_habitacion: number;
  numero: string;
  piso: number;
  tipo_habitacion?: string;
  id_tipo_habitacion?: number;
  tarifa_base?: number;
  estado: string | number;
  fecha_creacion?: string;
}

export interface HabitacionPayload {
  numero: string;
  piso: number;
  id_tipo_habitacion: number;
  estado: number;
}

export interface TipoHabitacion {
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

export const habitacionService = {
  listar: () => fetchApi<Habitacion[]>("/api/habitaciones"),

  crear: (data: HabitacionPayload) =>
    fetchApi<Habitacion>("/api/habitaciones", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: HabitacionPayload) =>
    fetchApi<{ mensaje: string }>(`/api/habitaciones/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchApi<{ mensaje: string }>(`/api/habitaciones/${id}`, {
      method: "DELETE",
    }),
};

export const catalogoHabitacionService = {
  tiposHabitacion: () => fetchApi<TipoHabitacion[]>("/api/catalogos/tipo-habitacion"),
};
