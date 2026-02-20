import { fetchApi } from "@/services/huespedService";

export interface Reserva {
  id_reserva: number;
  huesped: string;
  habitacion: string;
  fecha_entrada: string;
  fecha_salida: string;
  num_personas: number;
  monto_total: number;
  estado: string;
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

export const reservaService = {
  listar: () =>
    fetchApi<Reserva[]>("/api/reservas"),

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
    fetchApi<{ mensaje: string }>(`/api/reservas/${id}`, {
      method: "DELETE",
    }),
};