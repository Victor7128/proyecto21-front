"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getUser, apiFetch,
  type Habitacion, fmtMoney, calcNochces,
} from "@/lib/portal";

export default function NuevaReservaPage() {
  const router = useRouter();

  // Usuario — se carga en useEffect para evitar id_huesped = undefined
  const [idHuesped, setIdHuesped] = useState<number | null>(null);

  // Catálogo de habitaciones disponibles
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loadingHab, setLoadingHab]     = useState(true);

  // Formulario
  const [idHabitacion, setIdHabitacion] = useState<number | "">("");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida,  setFechaSalida]  = useState("");
  const [numPersonas,  setNumPersonas]  = useState(1);

  // Estado de envío
  const [enviando, setEnviando] = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Cargar usuario y habitaciones disponibles
  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setIdHuesped(user.id_huesped);

    apiFetch<Habitacion[]>("/habitaciones?estado=1")   // estado 1 = Disponible
      .then(d => setHabitaciones(Array.isArray(d) ? d : []))
      .catch(() => setHabitaciones([]))
      .finally(() => setLoadingHab(false));
  }, [router]);

  // Habitación seleccionada para mostrar datos
  const hab = habitaciones.find(h => h.id_habitacion === idHabitacion);

  // Cálculo del monto total
  const noches     = fechaEntrada && fechaSalida ? calcNochces(fechaEntrada, fechaSalida) : 0;
  const montoTotal = hab ? noches * hab.tarifa_base : 0;

  // Validación mínima del formulario
  const fechaMin = new Date().toISOString().split("T")[0];
  const formValido =
    idHuesped !== null &&
    idHabitacion !== "" &&
    fechaEntrada >= fechaMin &&
    fechaSalida > fechaEntrada &&
    numPersonas >= 1 &&
    noches > 0;

  async function handleSubmit() {
    if (!formValido || idHuesped === null) return;
    setEnviando(true);
    setError(null);

    try {
      await apiFetch("/reservas", {
        method: "POST",
        body: JSON.stringify({
          id_huesped:    idHuesped,
          id_habitacion: idHabitacion,
          fecha_entrada: fechaEntrada,
          fecha_salida:  fechaSalida,
          num_personas:  numPersonas,
          monto_total:   montoTotal,
          estado:        1,           // 1 = Pendiente
        }),
      });
      router.push("/portal/reservas");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear la reserva.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="space-y-6 max-w-xl">

      {/* Header */}
      <div>
        <button onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm mb-4 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>
        <h1 className="text-white text-2xl font-bold">Nueva reserva</h1>
        <p className="text-slate-400 text-sm mt-0.5">Selecciona habitación y fechas para continuar</p>
      </div>

      {/* Formulario */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">

        {/* Habitación */}
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">
            Habitación disponible
          </label>
          {loadingHab ? (
            <div className="h-10 bg-slate-800 rounded-xl animate-pulse" />
          ) : (
            <select
              value={idHabitacion}
              onChange={e => setIdHabitacion(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500">
              <option value="">Selecciona una habitación...</option>
              {habitaciones.map(h => (
                <option key={h.id_habitacion} value={h.id_habitacion}>
                  {h.numero} — {h.tipo_habitacion} — Piso {h.piso} — {fmtMoney(h.tarifa_base)}/noche
                </option>
              ))}
            </select>
          )}
          {hab && (
            <p className="mt-1.5 text-xs text-slate-500">
              {hab.tipo_habitacion} · Piso {hab.piso} · Tarifa base: {fmtMoney(hab.tarifa_base)}/noche
            </p>
          )}
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Fecha de entrada</label>
            <input
              type="date"
              min={fechaMin}
              value={fechaEntrada}
              onChange={e => {
                setFechaEntrada(e.target.value);
                // Resetear salida si queda inválida
                if (fechaSalida && e.target.value >= fechaSalida) setFechaSalida("");
              }}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Fecha de salida</label>
            <input
              type="date"
              min={fechaEntrada || fechaMin}
              value={fechaSalida}
              onChange={e => setFechaSalida(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
          </div>
        </div>

        {/* Personas */}
        <div>
          <label className="block text-slate-300 text-sm font-medium mb-2">Número de personas</label>
          <input
            type="number"
            min={1}
            max={10}
            value={numPersonas}
            onChange={e => setNumPersonas(Math.max(1, Number(e.target.value)))}
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500" />
        </div>

        {/* Resumen */}
        {noches > 0 && hab && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Noches</span>
              <span className="text-white">{noches}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Tarifa por noche</span>
              <span className="text-white">{fmtMoney(hab.tarifa_base)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-amber-500/20 pt-1.5 mt-1.5">
              <span className="text-amber-300">Total estimado</span>
              <span className="text-amber-400 text-base">{fmtMoney(montoTotal)}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Botón */}
        <button
          onClick={handleSubmit}
          disabled={!formValido || enviando}
          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
          {enviando ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Reservando...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirmar reserva
            </>
          )}
        </button>
      </div>
    </div>
  );
}