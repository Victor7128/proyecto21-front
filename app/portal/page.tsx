"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type HuespedUser = {
  tipo:       "huesped";
  id_huesped: number;
  nombres?:   string;
  apellidos?: string;
};

type Reserva = {
  id_reserva:    number;
  fecha_entrada: string;
  fecha_salida:  string;
  estado:        number;
  monto_total:   number;
  num_personas:  number;
  habitacion?:   string;
};

const ESTADO_RESERVA: Record<number, { label: string; color: string }> = {
  1: { label: "Pendiente",   color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
  2: { label: "Confirmada",  color: "bg-green-500/20 text-green-400 border-green-500/30" },
  3: { label: "Cancelada",   color: "bg-red-500/20 text-red-400 border-red-500/30" },
  4: { label: "Completada",  color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
};

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser]         = useState<HuespedUser | null>(null);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const raw = document.cookie
      .split("; ")
      .find(r => r.startsWith("auth_user="))
      ?.split("=")[1];

    if (raw) {
      try {
        setUser(JSON.parse(decodeURIComponent(raw)));
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!user?.id_huesped) return;

    async function fetchReservas() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/reservas?id_huesped=${user!.id_huesped}`,
          {
            headers: {
              Authorization: `Bearer ${
                document.cookie
                  .split("; ")
                  .find(r => r.startsWith("auth_token="))
                  ?.split("=")[1] ?? ""
              }`,
            },
          }
        );
        if (res.ok) setReservas(await res.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }

    fetchReservas();
  }, [user]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const proximaReserva = reservas.find(r => r.estado === 2 || r.estado === 1);

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="font-bold text-white">Hotel EVO</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-400 text-sm">Portal del Huésped</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Bienvenida */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-500 rounded-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm mb-1">Bienvenido de vuelta</p>
              <h1 className="text-white text-3xl font-bold">
                {user?.nombres ? `${user.nombres} ${user.apellidos ?? ""}` : "Huésped"}
              </h1>
              <p className="text-amber-100 mt-2 text-sm">
                Gestiona tus reservas y estadías desde aquí
              </p>
            </div>
            <div className="hidden md:flex w-16 h-16 bg-white/20 rounded-2xl items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Próxima reserva destacada */}
        {proximaReserva && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <h2 className="text-slate-300 text-sm font-medium">Próxima estadía</h2>
            </div>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-white text-xl font-semibold">
                  {new Date(proximaReserva.fecha_entrada + "T00:00:00").toLocaleDateString("es-PE", {
                    weekday: "long", day: "numeric", month: "long"
                  })}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Check-out: {new Date(proximaReserva.fecha_salida + "T00:00:00").toLocaleDateString("es-PE", {
                    day: "numeric", month: "long"
                  })} · {proximaReserva.num_personas} persona{proximaReserva.num_personas > 1 ? "s" : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-slate-400 text-xs">Total</p>
                  <p className="text-white font-bold text-lg">
                    S/ {Number(proximaReserva.monto_total).toFixed(2)}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${ESTADO_RESERVA[proximaReserva.estado]?.color}`}>
                  {ESTADO_RESERVA[proximaReserva.estado]?.label}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total reservas",   value: reservas.length,                                               icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            { label: "Confirmadas",       value: reservas.filter(r => r.estado === 2).length,                  icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
            { label: "Completadas",       value: reservas.filter(r => r.estado === 4).length,                  icon: "M5 13l4 4L19 7" },
            { label: "Gasto total",       value: `S/ ${reservas.reduce((s, r) => s + Number(r.monto_total), 0).toFixed(0)}`, icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                </svg>
                <span className="text-slate-400 text-xs">{s.label}</span>
              </div>
              <p className="text-white font-bold text-xl">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Lista de reservas */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <h2 className="text-white font-semibold">Mis reservas</h2>
            <span className="text-slate-500 text-sm">{reservas.length} en total</span>
          </div>

          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <svg className="w-6 h-6 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : reservas.length === 0 ? (
            <div className="py-16 text-center">
              <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500">No tienes reservas aún</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {reservas.map(r => (
                <div key={r.id_reserva} className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">Reserva #{r.id_reserva}</p>
                      <p className="text-slate-400 text-xs mt-0.5">
                        {new Date(r.fecha_entrada + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                        {" → "}
                        {new Date(r.fecha_salida + "T00:00:00").toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{r.num_personas} persona{r.num_personas > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-white font-medium text-sm">S/ {Number(r.monto_total).toFixed(2)}</p>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ESTADO_RESERVA[r.estado]?.color ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                      {ESTADO_RESERVA[r.estado]?.label ?? "Desconocido"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}