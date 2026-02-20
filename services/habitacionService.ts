import { fetchApi } from "@/services/huespedService";

export interface Habitacion {
  id_habitacion: number;
  numero: string;
  piso: number;
  id_tipo_habitacion: number;
  estado: number;
  fecha_creacion: string;
}

export interface HabitacionPayload {
  numero: string;
  piso: number;
  id_tipo_habitacion: number;
  estado: number;
}

export const habitacionService = {
  listar: () =>
    fetchApi<Habitacion[]>("/api/habitaciones"),

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
