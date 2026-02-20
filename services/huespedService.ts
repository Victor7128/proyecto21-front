// Todas las llamadas van a los Route Handlers de Next.js (/api/...),
// que se encargan de leer la cookie httpOnly y agregar el Bearer token.

export interface Huesped {
  id_huesped: number;
  nombres: string;
  apellidos: string;
  tipo_documento: string;   // descripción del join (ej: "DNI")
  num_documento: string;
  telefono: string | null;
  correo: string | null;
  fecha_creacion: string;
}

export interface HuespedPayload {
  nombres: string;
  apellidos: string;
  tipo_documento: number;   // id numérico
  num_documento: string;
  telefono?: string;
  correo?: string;
}

export interface TipoDocumento {
  id: number;
  label: string;
}

export async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
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

export const huespedService = {
  listar: (nombre?: string, num_documento?: string) => {
    const params = new URLSearchParams();
    if (nombre)        params.set("nombre", nombre);
    if (num_documento) params.set("num_documento", num_documento);
    const qs = params.toString();
    return fetchApi<Huesped[]>(`/api/huespedes${qs ? `?${qs}` : ""}`);
  },

  crear: (data: HuespedPayload) =>
    fetchApi<Huesped>("/api/huespedes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: HuespedPayload) =>
    fetchApi<{ mensaje: string }>(`/api/huespedes/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchApi<{ mensaje: string }>(`/api/huespedes/${id}`, { method: "DELETE" }),
};

export const catalogoService = {
  tiposDocumento: () =>
    fetchApi<TipoDocumento[]>("/api/catalogos/tipo-documento"),
};