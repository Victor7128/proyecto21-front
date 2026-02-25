"use client";

import { useEffect, useState } from "react";
import {
  getUser, apiFetch,
  type Reserva, type OrdenHospedaje,
  ESTADO_RESERVA, ESTADO_HOSPEDAJE,
  fmtDate, fmtMoney, calcNochces,
} from "@/lib/portal";

type OrdenConserjeria = {
  id_orden_conserj: number;
  id_reserva:       number;
  id_habitacion:    number;
  fecha_inicio:     string;
  fecha_fin:        string | null;
  estado:           number;
  descripcion:      string;
  precio:           number;
};

const ESTADO_CONS: Record<number, { label: string; color: string }> = {
  1: { label: "Solicitado", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  2: { label: "En proceso", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  3: { label: "Completado", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  4: { label: "Cancelado",  color: "bg-red-500/20 text-red-400 border-red-500/30" },
};

type EstadiaCompleta = {
  reserva:   Reserva;
  hospedaje: OrdenHospedaje[];
  servicios: OrdenConserjeria[];
};

export default function HospedajePage() {
  const [estadias, setEstadias] = useState<EstadiaCompleta[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    apiFetch<Reserva[]>(`/reservas?id_huesped=${user.id_huesped}`)
      .then(async reservas => {
        const lista = Array.isArray(reservas) ? reservas : [];
        // estado es STRING — usar nombres exactos
        const relevantes = lista.filter(r =>
          r.estado === "Confirmada" || r.estado === "Completada"
        );

        const completas = await Promise.all(
          relevantes.map(async rv => {
            const [hospedaje, servicios] = await Promise.all([
              apiFetch<OrdenHospedaje[]>(`/hospedaje?id_reserva=${rv.id_reserva}`).catch(() => []),
              apiFetch<OrdenConserjeria[]>(`/conserjeria?id_reserva=${rv.id_reserva}`).catch(() => []),
            ]);
            return {
              reserva:   rv,
              hospedaje: Array.isArray(hospedaje) ? hospedaje : [],
              servicios: Array.isArray(servicios) ? servicios : [],
            };
          })
        );

        setEstadias(
          completas.filter(e =>
            e.hospedaje.length > 0 || e.reserva.estado === "Confirmada"
          )
        );
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="py-24 flex justify-center">
      <svg className="w-6 h-6 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Mi Estadía</h1>
        <p className="text-slate-400 text-sm mt-0.5">Check-in, check-out y servicios de habitación</p>
      </div>

      {estadias.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl py-16 text-center">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <p className="text-slate-400 mb-1">No tienes estadías activas ni recientes</p>
          <p className="text-slate-600 text-sm">Las estadías aparecen cuando el personal realiza el check-in</p>
        </div>
      ) : (
        estadias.map(({ reserva, hospedaje, servicios }) => {
          const noches   = calcNochces(reserva.fecha_entrada, reserva.fecha_salida);
          const activa   = hospedaje.find(h => h.estado === 2);
          const totalSvc = servicios.reduce((s, sv) => s + Number(sv.precio), 0);

          return (
            <div key={reserva.id_reserva} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

              {/* Header reserva */}
              <div className={`px-5 py-4 border-b border-slate-800 flex items-center justify-between ${activa ? "bg-green-500/5" : ""}`}>
                <div className="flex items-center gap-3">
                  {activa && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
                  <div>
                    <p className="text-white font-semibold">Reserva #{reserva.id_reserva}</p>
                    <p className="text-slate-400 text-sm">
                      {fmtDate(reserva.fecha_entrada, { day: "numeric", month: "short" })}
                      {" → "}
                      {fmtDate(reserva.fecha_salida, { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}{noches} noches
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ESTADO_RESERVA[reserva.estado]?.color}`}>
                    {ESTADO_RESERVA[reserva.estado]?.label ?? reserva.estado}
                  </span>
                  <p className="text-white font-bold mt-1">{fmtMoney(reserva.monto_total)}</p>
                </div>
              </div>

              {/* Órdenes de hospedaje */}
              <div className="px-5 py-4 border-b border-slate-800">
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Registro de estadía</p>
                {hospedaje.length === 0 ? (
                  <p className="text-slate-600 text-sm">Check-in pendiente — el personal lo realizará en recepción</p>
                ) : (
                  <div className="space-y-3">
                    {hospedaje.map(ord => (
                      <div key={ord.id_orden_hospedaje}
                        className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-white text-sm font-medium">Orden #{ord.id_orden_hospedaje}</p>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_HOSPEDAJE[ord.estado]?.color}`}>
                              {ESTADO_HOSPEDAJE[ord.estado]?.label}
                            </span>
                          </div>
                          <div className="text-slate-400 text-xs mt-1 flex gap-3">
                            {ord.fecha_checkin  && <span>Check-in:  {fmtDate(ord.fecha_checkin)}</span>}
                            {ord.fecha_checkout && <span>Check-out: {fmtDate(ord.fecha_checkout)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Servicios de conserjería */}
              <div className="px-5 py-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Servicios solicitados</p>
                  {totalSvc > 0 && <p className="text-amber-400 text-sm font-medium">{fmtMoney(totalSvc)}</p>}
                </div>
                {servicios.length === 0 ? (
                  <p className="text-slate-600 text-sm">Sin servicios adicionales</p>
                ) : (
                  <div className="space-y-2">
                    {servicios.map(sv => (
                      <div key={sv.id_orden_conserj}
                        className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
                        <div>
                          <p className="text-white text-sm">{sv.descripcion || "Servicio de conserjería"}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {fmtDate(sv.fecha_inicio, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ESTADO_CONS[sv.estado]?.color}`}>
                            {ESTADO_CONS[sv.estado]?.label}
                          </span>
                          <p className="text-white text-sm font-medium">{fmtMoney(sv.precio)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          );
        })
      )}
    </div>
  );
}