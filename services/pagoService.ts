import { fetchApi } from "@/services/huespedService";

export interface Pago {
  id_pago: number;
  id_documento: number;
  monto_pagado: number;
  metodo: number;
  estado_pago: number;
  numero_comprobante?: string;
  numero_operacion?: string;
  observaciones?: string;
  fecha_creacion: string;
}

export interface PagoPayload {
  id_documento: number;
  monto_pagado: number;
  metodo: number;
  estado_pago: number;
  numero_comprobante?: string;
  numero_operacion?: string;
  observaciones?: string;
}

export const pagoService = {
  listar: () =>
    fetchApi<Pago[]>("/api/pagos"),

  crear: (data: PagoPayload) =>
    fetchApi<Pago>("/api/pagos", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  actualizar: (id: number, data: Partial<PagoPayload>) =>
    fetchApi<{ mensaje: string }>(`/api/pagos/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  eliminar: (id: number) =>
    fetchApi<{ mensaje: string }>(`/api/pagos/${id}`, {
      method: "DELETE",
    }),
};