"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  getUser, apiFetch,
  type Reserva, type OrdenHospedaje, type Encuesta,
  fmtDate,
} from "@/lib/portal";

type EstadiaParaEncuesta = {
  reserva:   Reserva;
  orden:     OrdenHospedaje;
  encuesta:  Encuesta | null;
};

// Campo de rating reutilizable
function RatingField({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-slate-300 text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-xl text-sm font-bold border transition-all
              ${value === n
                ? "bg-amber-500 border-amber-500 text-white"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500/50"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function EncuestasPage() {
  const [estadias, setEstadias] = useState<EstadiaParaEncuesta[]>([]);
  const [loading, setLoading]   = useState(true);

  // Formulario activo
  const [formOpen, setFormOpen]   = useState<number | null>(null); // id_orden_hospedaje
  const [enviando, setEnviando]   = useState(false);
  const [error, setError]         = useState("");
  const [exito, setExito]         = useState("");

  const [form, setForm] = useState({
    recomendacion:           5,
    calificacion_limpieza:   5,
    calificacion_servicio:   5,
    calificacion_ubicacion:  5,
    calificacion_precio:     5,
    motivo_viaje:            "",
    lugar_origen:            "",
    descripcion:             "",
    comentarios:             "",
  });

  function resetForm() {
    setForm({
      recomendacion: 5, calificacion_limpieza: 5, calificacion_servicio: 5,
      calificacion_ubicacion: 5, calificacion_precio: 5,
      motivo_viaje: "", lugar_origen: "", descripcion: "", comentarios: "",
    });
    setError(""); setExito("");
  }

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    apiFetch<Reserva[]>(`/reservas?id_huesped=${user.id_huesped}`)
      .then(async reservas => {
        const lista = Array.isArray(reservas) ? reservas : [];
        // Solo reservas completadas tienen encuesta disponible
        const completadas = lista.filter(r => r.estado === "Completada");

        const resultado: EstadiaParaEncuesta[] = [];

        for (const rv of completadas) {
          const ordenes = await apiFetch<OrdenHospedaje[]>(
            `/hospedaje?id_reserva=${rv.id_reserva}`
          ).catch(() => [] as OrdenHospedaje[]);

          const finalizadas = (Array.isArray(ordenes) ? ordenes : [])
            .filter(o => o.estado === 3); // 3 = Finalizado

          for (const orden of finalizadas) {
            const encuestas = await apiFetch<Encuesta[]>(
              `/encuestas?id_orden_hospedaje=${orden.id_orden_hospedaje}`
            ).catch(() => [] as Encuesta[]);

            const enc = Array.isArray(encuestas) && encuestas.length > 0
              ? encuestas[0]
              : null;

            resultado.push({ reserva: rv, orden, encuesta: enc });
          }
        }

        setEstadias(resultado);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent, id_orden_hospedaje: number) {
    e.preventDefault();
    setError(""); setExito(""); setEnviando(true);

    try {
      await apiFetch("/encuestas", {
        method: "POST",
        body: JSON.stringify({ id_orden_hospedaje, ...form }),
      });
      setExito("¡Gracias por tu opinión! Tu encuesta fue enviada.");
      setFormOpen(null);
      // Recargar para mostrar la encuesta completada
      setEstadias(prev => prev.map(e =>
        e.orden.id_orden_hospedaje === id_orden_hospedaje
          ? { ...e, encuesta: { id_encuesta: 0, id_orden_hospedaje, ...form, fecha_encuesta: new Date().toISOString() } as Encuesta }
          : e
      ));
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar la encuesta.");
    } finally {
      setEnviando(false);
    }
  }

  const pendientes  = estadias.filter(e => !e.encuesta);
  const completadas = estadias.filter(e =>  e.encuesta);

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
        <h1 className="text-white text-2xl font-bold">Encuestas</h1>
        <p className="text-slate-400 text-sm mt-0.5">Cuéntanos tu experiencia en Hotel EVO</p>
      </div>

      {exito && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl px-5 py-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-400 text-sm">{exito}</p>
        </div>
      )}

      {estadias.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl py-16 text-center">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p className="text-slate-400">Las encuestas estarán disponibles al finalizar tu estadía</p>
        </div>
      ) : (
        <>
          {/* Pendientes */}
          {pendientes.length > 0 && (
            <div className="space-y-4">
              <p className="text-white font-semibold flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full inline-block" />
                Pendientes de responder ({pendientes.length})
              </p>

              {pendientes.map(({ reserva, orden }) => {
                const isOpen = formOpen === orden.id_orden_hospedaje;
                return (
                  <div key={orden.id_orden_hospedaje}
                    className="bg-slate-900 border border-amber-500/20 rounded-2xl overflow-hidden">

                    {/* Card header */}
                    <div className="px-5 py-4 flex items-center justify-between">
                      <div>
                        <p className="text-white font-semibold">Estadía — Reserva #{reserva.id_reserva}</p>
                        <p className="text-slate-400 text-sm mt-0.5">
                          {fmtDate(reserva.fecha_entrada, { day: "numeric", month: "long" })}
                          {" → "}
                          {fmtDate(reserva.fecha_salida, { day: "numeric", month: "long", year: "numeric" })}
                          {reserva.habitacion && ` · ${reserva.habitacion}`}
                        </p>
                      </div>
                      <button
                        onClick={() => { resetForm(); setFormOpen(isOpen ? null : orden.id_orden_hospedaje); }}
                        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0">
                        {isOpen ? "Cancelar" : (
                          <>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                            Responder
                          </>
                        )}
                      </button>
                    </div>

                    {/* Formulario */}
                    {isOpen && (
                      <form
                        onSubmit={e => handleSubmit(e, orden.id_orden_hospedaje)}
                        className="border-t border-slate-800 px-5 py-5 space-y-5">

                        {/* Calificaciones numéricas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                          <RatingField label="¿Recomendarías el hotel? (1–10)"
                            value={form.recomendacion}
                            onChange={v => setForm({ ...form, recomendacion: v })} />
                          <RatingField label="Limpieza (1–5)"
                            value={form.calificacion_limpieza}
                            onChange={v => setForm({ ...form, calificacion_limpieza: v })} />
                          <RatingField label="Servicio (1–5)"
                            value={form.calificacion_servicio}
                            onChange={v => setForm({ ...form, calificacion_servicio: v })} />
                          <RatingField label="Ubicación (1–5)"
                            value={form.calificacion_ubicacion}
                            onChange={v => setForm({ ...form, calificacion_ubicacion: v })} />
                          <RatingField label="Precio/Valor (1–5)"
                            value={form.calificacion_precio}
                            onChange={v => setForm({ ...form, calificacion_precio: v })} />
                        </div>

                        {/* Recomendación (1–10) necesita más botones */}
                        {/* La recomendación ya está arriba, solo que con máx 5 — ajustar: */}
                        <div>
                          <label className="block text-slate-300 text-sm font-medium mb-2">
                            ¿Qué tan probable es que recomiendes el hotel? (1–10)
                          </label>
                          <div className="flex gap-1.5 flex-wrap">
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <button key={n} type="button" onClick={() => setForm({ ...form, recomendacion: n })}
                                className={`w-9 h-9 rounded-xl text-xs font-bold border transition-all
                                  ${form.recomendacion === n
                                    ? "bg-amber-500 border-amber-500 text-white"
                                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-amber-500/50"}`}>
                                {n}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Campos de texto */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-slate-300 text-sm font-medium mb-1.5">Motivo del viaje</label>
                            <select
                              value={form.motivo_viaje}
                              onChange={e => setForm({ ...form, motivo_viaje: e.target.value })}
                              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500">
                              <option value="">Seleccionar...</option>
                              <option value="Turismo">Turismo</option>
                              <option value="Negocios">Negocios</option>
                              <option value="Familia">Familia</option>
                              <option value="Evento">Evento</option>
                              <option value="Otro">Otro</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-300 text-sm font-medium mb-1.5">Ciudad de origen</label>
                            <input
                              value={form.lugar_origen}
                              onChange={e => setForm({ ...form, lugar_origen: e.target.value })}
                              placeholder="Lima, Arequipa..."
                              className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-slate-300 text-sm font-medium mb-1.5">Descripción general</label>
                          <textarea
                            rows={2}
                            value={form.descripcion}
                            onChange={e => setForm({ ...form, descripcion: e.target.value })}
                            placeholder="Describe brevemente tu experiencia..."
                            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500 resize-none" />
                        </div>

                        <div>
                          <label className="block text-slate-300 text-sm font-medium mb-1.5">Comentarios adicionales</label>
                          <textarea
                            rows={3}
                            value={form.comentarios}
                            onChange={e => setForm({ ...form, comentarios: e.target.value })}
                            placeholder="¿Qué mejorarías? ¿Qué destacarías?"
                            className="w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-amber-500 resize-none" />
                        </div>

                        {error && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                            {error}
                          </div>
                        )}

                        <button type="submit" disabled={enviando}
                          className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                          {enviando ? (
                            <>
                              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Enviando...
                            </>
                          ) : "Enviar encuesta"}
                        </button>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Encuestas ya respondidas */}
          {completadas.length > 0 && (
            <div className="space-y-3">
              <p className="text-slate-400 font-medium text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Encuestas respondidas ({completadas.length})
              </p>

              {completadas.map(({ reserva, encuesta }) => encuesta && (
                <div key={encuesta.id_encuesta}
                  className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-white font-medium text-sm">Reserva #{reserva.id_reserva}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        Enviada el {fmtDate(encuesta.fecha_encuesta, { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="text-amber-400 font-bold text-sm">{encuesta.recomendacion}/10</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: "Limpieza",  val: encuesta.calificacion_limpieza },
                      { label: "Servicio",  val: encuesta.calificacion_servicio },
                      { label: "Ubicación", val: encuesta.calificacion_ubicacion },
                      { label: "Precio",    val: encuesta.calificacion_precio },
                    ].map(({ label, val }) => (
                      <div key={label} className="bg-slate-800 rounded-xl py-2.5">
                        <p className="text-white font-bold text-lg">{val}</p>
                        <p className="text-slate-500 text-xs">{label}</p>
                      </div>
                    ))}
                  </div>

                  {encuesta.comentarios && (
                    <p className="text-slate-400 text-sm mt-3 italic">"{encuesta.comentarios}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}