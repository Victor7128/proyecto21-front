"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getUser, apiFetch, type Reserva,
  ESTADO_RESERVA, fmtDate, fmtMoney, calcNochces,
} from "@/lib/portal";

// Estados como strings, tal como los devuelve el backend
const FILTROS = [
  { value: null,        label: "Todas"      },
  { value: "Pendiente", label: "Pendientes" },
  { value: "Confirmada",label: "Confirmadas"},
  { value: "Completada",label: "Completadas"},
  { value: "Cancelada", label: "Canceladas" },
] as { value: string | null; label: string }[];

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filtro, setFiltro]     = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    apiFetch<Reserva[]>(`/reservas?id_huesped=${user.id_huesped}`)
      .then(d => setReservas(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const lista = filtro !== null ? reservas.filter(r => r.estado === filtro) : reservas;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Mis Reservas</h1>
          <p className="text-slate-400 text-sm mt-0.5">{reservas.length} en total</p>
        </div>
        <Link href="/portal/reservas/nueva"
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white font-medium px-4 py-2.5 rounded-xl text-sm transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button key={String(f.value)} onClick={() => setFiltro(f.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all
              ${filtro === f.value
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"}`}>
            {f.label}
            {f.value !== null && (
              <span className="ml-1.5 text-xs opacity-70">
                {reservas.filter(r => r.estado === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <svg className="w-6 h-6 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : lista.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl py-16 text-center">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-slate-400 mb-4">No hay reservas{filtro !== null ? ` con estado "${filtro}"` : ""}</p>
          <Link href="/portal/reservas/nueva"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            Hacer una reserva
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(r => {
            const noches = calcNochces(r.fecha_entrada, r.fecha_salida);
            const badge  = ESTADO_RESERVA[r.estado];
            return (
              <div key={r.id_reserva}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold">Reserva #{r.id_reserva}</p>
                        {badge ? (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                            {badge.label}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border border-slate-600 text-slate-400">
                            {r.estado}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm mt-1">
                        {fmtDate(r.fecha_entrada, { day: "numeric", month: "long", year: "numeric" })}
                        {" → "}
                        {fmtDate(r.fecha_salida, { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                      <div className="flex items-center gap-3 mt-1.5 text-slate-500 text-xs">
                        <span>{noches} noche{noches !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>{r.num_personas} persona{r.num_personas !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>{fmtMoney(Number(r.monto_total) / noches || 0)}/noche</span>
                        {r.habitacion && (
                          <>
                            <span>·</span>
                            <span>{r.habitacion}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="sm:text-right shrink-0">
                    <p className="text-white font-bold text-lg">{fmtMoney(r.monto_total)}</p>
                    <p className="text-slate-500 text-xs">total</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}