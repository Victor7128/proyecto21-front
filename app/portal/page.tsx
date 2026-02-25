"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getUser, apiFetch,
  type Huesped, type Reserva, type OrdenHospedaje,
  ESTADO_RESERVA, fmtDate, fmtMoney, calcNochces,
} from "@/lib/portal";

export default function PortalDashboard() {
  const [huesped, setHuesped]   = useState<Huesped | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [activa, setActiva]     = useState<OrdenHospedaje | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    Promise.all([
      apiFetch<Huesped>(`/huespedes/${user.id_huesped}`),
      apiFetch<Reserva[]>(`/reservas?id_huesped=${user.id_huesped}`),
    ])
      .then(async ([h, r]) => {
        setHuesped(h);
        const lista = Array.isArray(r) ? r : [];
        setReservas(lista);

        // estado es STRING — buscar orden activa en reservas "Confirmada"
        const confirmadas = lista.filter(rv => rv.estado === "Confirmada");
        for (const rv of confirmadas) {
          const ordenes = await apiFetch<OrdenHospedaje[]>(`/hospedaje?id_reserva=${rv.id_reserva}`).catch(() => []);
          const act = (Array.isArray(ordenes) ? ordenes : []).find(o => o.estado === 2);
          if (act) { setActiva(act); break; }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // estado es STRING — usar nombres exactos que devuelve el backend
  const proxima   = reservas.find(r => r.estado === "Confirmada" || r.estado === "Pendiente");
  const recientes = reservas.slice(0, 3);

  return (
    <div className="space-y-6">

      {/* Banner bienvenida */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-amber-500 to-yellow-500 rounded-2xl p-7">
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 right-16 w-20 h-20 bg-white/5 rounded-full translate-y-8" />
        <div className="relative">
          {loading ? (
            <div className="h-8 w-48 bg-white/20 rounded-lg animate-pulse mb-2" />
          ) : (
            <>
              <p className="text-amber-100 text-sm mb-1">Bienvenido de vuelta</p>
              <h1 className="text-white text-3xl font-bold tracking-tight">
                {huesped ? `${huesped.nombres} ${huesped.apellidos}` : "—"}
              </h1>
            </>
          )}
          <p className="text-amber-100 text-sm mt-2">Tu portal personal en Hotel EVO</p>
          <Link href="/portal/reservas/nueva"
            className="inline-flex items-center gap-2 mt-4 bg-white text-amber-600 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-amber-50 transition-colors shadow-lg shadow-amber-700/30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva reserva
          </Link>
        </div>
      </div>

      {/* Estadía activa */}
      {activa && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-sm font-semibold">Estadía activa ahora</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold">Check-in realizado</p>
              {activa.fecha_checkin && (
                <p className="text-slate-400 text-sm mt-0.5">
                  Desde: {fmtDate(activa.fecha_checkin)}
                </p>
              )}
            </div>
            <Link href="/portal/hospedaje"
              className="flex items-center gap-1 text-green-400 hover:text-green-300 text-sm font-medium transition-colors">
              Ver detalle
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      )}

      {/* Stats — estados como STRINGS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          {
            label: "Reservas",
            value: loading ? "—" : reservas.length,
            icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            color: "text-amber-400",
          },
          {
            label: "Confirmadas",
            value: loading ? "—" : reservas.filter(r => r.estado === "Confirmada").length,
            icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-green-400",
          },
          {
            label: "Completadas",
            value: loading ? "—" : reservas.filter(r => r.estado === "Completada").length,
            icon: "M5 13l4 4L19 7",
            color: "text-blue-400",
          },
          {
            label: "Total gastado",
            value: loading ? "—" : fmtMoney(reservas.reduce((s, r) => s + Number(r.monto_total), 0)),
            icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
            color: "text-purple-400",
          },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className={`w-4 h-4 ${s.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
              </svg>
              <span className="text-slate-500 text-xs">{s.label}</span>
            </div>
            <p className="text-white font-bold text-xl">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Próxima estadía */}
      {!loading && proxima && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wider">Próxima estadía</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-white text-lg font-semibold">
                {fmtDate(proxima.fecha_entrada, { weekday: "long", day: "numeric", month: "long" })}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Hasta {fmtDate(proxima.fecha_salida, { day: "numeric", month: "long" })}
                {" · "}{calcNochces(proxima.fecha_entrada, proxima.fecha_salida)} noches
                {" · "}{proxima.num_personas} persona{proxima.num_personas !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-white font-bold text-lg">{fmtMoney(proxima.monto_total)}</p>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ESTADO_RESERVA[proxima.estado]?.color}`}>
                {ESTADO_RESERVA[proxima.estado]?.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Reservas recientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-white font-semibold">Reservas recientes</h2>
          <Link href="/portal/reservas" className="text-amber-400 hover:text-amber-300 text-sm transition-colors">
            Ver todas →
          </Link>
        </div>
        {loading ? (
          <div className="py-10 flex justify-center">
            <svg className="w-5 h-5 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : recientes.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-slate-500 mb-4">Aún no tienes reservas</p>
            <Link href="/portal/reservas/nueva"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Hacer primera reserva
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recientes.map(r => (
              <div key={r.id_reserva}
                className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                <div>
                  <p className="text-white text-sm font-medium">Reserva #{r.id_reserva}</p>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {fmtDate(r.fecha_entrada, { day: "numeric", month: "short" })}
                    {" → "}
                    {fmtDate(r.fecha_salida, { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-white text-sm font-medium">{fmtMoney(r.monto_total)}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${ESTADO_RESERVA[r.estado]?.color}`}>
                    {ESTADO_RESERVA[r.estado]?.label ?? r.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/portal/reservas/nueva", label: "Nueva reserva", icon: "M12 4v16m8-8H4",    bg: "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20" },
          { href: "/portal/hospedaje",      label: "Mi estadía",    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", bg: "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20" },
          { href: "/portal/pagos",          label: "Mis pagos",     icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20" },
          { href: "/portal/encuestas",      label: "Encuestas",     icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z", bg: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/20" },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center gap-2.5 p-4 rounded-xl border transition-all text-center ${item.bg}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="text-xs font-medium leading-tight">{item.label}</span>
          </Link>
        ))}
      </div>

    </div>
  );
}