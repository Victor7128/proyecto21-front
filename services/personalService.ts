// services/personalService.ts
// Todas las llamadas van a los Route Handlers de Next.js (/api/...),
// que se encargan de leer la cookie httpOnly y agregar el Bearer token.

export interface Personal {
  id_personal: number;
  nombre: string;
  tipo_documento: string;   // descripción del join (ej: "DNI")
  num_documento: string;
  email: string;
  rol: string;              // descripción del rol
  activo: boolean;
}

export interface PersonalPayload {
  nombre: string;
  tipo_documento: number;   // id numérico
  num_documento: string;
  email: string;
  password?: string;        // requerido en crear, omitido en editar
  id_rol: number;
  activo: boolean;
}

export interface Rol {
  id: number;
  label: string;
}

export interface TipoDocumento {
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

export const personalService = {
  listar: (nombre?: string, activo?: boolean) => {
    const params = new URLSearchParams();
    if (nombre)           params.set("nombre", nombre);
    if (activo !== undefined) params.set("activo", String(activo));
    const qs = params.toString();
    return fetchApi<Personal[]>(`/api/personal${qs ? `?${qs}` : ""}`);
  },

  crear: (data: PersonalPayload) =>
    fetchApi<Personal>("/api/personal", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Omit<PersonalPayload, "password">) =>
    fetchApi<{ mensaje: string }>(`/api/personal/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchApi<{ mensaje: string }>(`/api/personal/${id}`, { method: "DELETE" }),
};

export const catalogoService = {
  tiposDocumento: () =>
    fetchApi<TipoDocumento[]>("/api/catalogos/tipo-documento"),

  roles: () =>
    fetchApi<Rol[]>("/api/catalogos/roles"),
};