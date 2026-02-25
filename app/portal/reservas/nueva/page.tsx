"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, apiFetch, type Habitacion, fmtMoney, calcNochces } from "@/lib/portal";

export default function NuevaReservaPage() {
  const router = useRouter();
  const [idHuesped,    setIdHuesped]    = useState<number | null>(null);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loadingHab,   setLoadingHab]   = useState(true);
  const [idHabitacion, setIdHabitacion] = useState<number | "">("");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida,  setFechaSalida]  = useState("");
  const [numPersonas,  setNumPersonas]  = useState(1);
  const [enviando,     setEnviando]     = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) { router.replace("/login"); return; }
    setIdHuesped(user.id_huesped);
    apiFetch<Habitacion[]>("/habitaciones?estado=1")
      .then(d => setHabitaciones(Array.isArray(d) ? d : []))
      .catch(() => setHabitaciones([]))
      .finally(() => setLoadingHab(false));
  }, [router]);

  const hab        = habitaciones.find(h => h.id_habitacion === idHabitacion);
  const noches     = fechaEntrada && fechaSalida ? calcNochces(fechaEntrada, fechaSalida) : 0;
  const montoTotal = hab ? noches * hab.tarifa_base : 0;
  const fechaMin   = new Date().toISOString().split("T")[0];
  const formValido = idHuesped !== null && idHabitacion !== "" && fechaEntrada >= fechaMin && fechaSalida > fechaEntrada && numPersonas >= 1 && noches > 0;

  async function handleSubmit() {
    if (!formValido || idHuesped === null) return;
    setEnviando(true); setError(null);
    try {
      await apiFetch("/reservas", { method: "POST", body: JSON.stringify({ id_huesped: idHuesped, id_habitacion: idHabitacion, fecha_entrada: fechaEntrada, fecha_salida: fechaSalida, num_personas: numPersonas, monto_total: montoTotal, estado: 1 }) });
      router.push("/portal/reservas");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al crear la reserva."); }
    finally { setEnviando(false); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        .nr-page { font-family:'Montserrat',sans-serif; display:flex; flex-direction:column; gap:1.5rem; max-width:560px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }

        /* BACK */
        .nr-back { display:inline-flex;align-items:center;gap:.4rem;font-size:.68rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#7a6e5f;background:none;border:none;cursor:pointer;padding:0;transition:color .2s; animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both; }
        .nr-back:hover { color:#4a4035; }
        .nr-back svg { width:14px;height:14px; }

        /* HEADER */
        .nr-header { animation:fadeUp .55s .03s cubic-bezier(.22,1,.36,1) both; }
        .nr-title { font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;color:#1a1a14;line-height:1; }
        .nr-title em { font-style:italic;color:#c9a96e; }
        .nr-sub { font-size:.7rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#7a6e5f;margin-top:.35rem; }

        /* FORM CARD */
        .nr-card { background:#f5efe6;border:1px solid rgba(201,169,110,.18);border-radius:22px;overflow:hidden;animation:fadeUp .6s .06s cubic-bezier(.22,1,.36,1) both; }
        .nr-card-body { padding:1.75rem; display:flex; flex-direction:column; gap:1.25rem; }

        /* SECTION LABEL */
        .nr-sec-label { display:flex;align-items:center;gap:.6rem;font-size:.58rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#c9a96e;margin-bottom:.65rem; }
        .nr-sec-label::after { content:'';flex:1;height:1px;background:rgba(201,169,110,.2); }

        /* FIELD */
        .nr-field { display:flex;flex-direction:column;gap:.4rem; }
        .nr-label { font-size:.61rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#7a6e5f; }
        .nr-grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }

        /* INPUT */
        .nr-input, .nr-select {
          width:100%; background:white; border:1.5px solid #ddd5c4; border-radius:14px;
          padding:.8rem 1.1rem;
          font-family:'Montserrat',sans-serif; font-size:.82rem; color:#1a1a14; outline:none;
          transition:all .25s cubic-bezier(.22,1,.36,1);
          box-shadow:0 1px 3px rgba(74,64,53,.04);
          appearance:none; -webkit-appearance:none;
        }
        .nr-input::placeholder { color:#b8a898; }
        .nr-input:focus, .nr-select:focus { border-color:#e8832a;box-shadow:0 0 0 4px rgba(232,131,42,.11); }
        .nr-input::-webkit-calendar-picker-indicator { opacity:.4;cursor:pointer; }

        .nr-select-wrap { position:relative; }
        .nr-select-wrap::after { content:'';position:absolute;right:1rem;top:50%;transform:translateY(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #b8a898;pointer-events:none; }
        .nr-select-wrap .nr-select { padding-right:2.5rem;cursor:pointer; }

        /* HAB INFO */
        .nr-hab-hint { font-size:.66rem;color:#7a6e5f;margin-top:.4rem;display:flex;align-items:center;gap:.4rem; }
        .nr-hab-hint-dot { width:4px;height:4px;border-radius:50%;background:#c9a96e;flex-shrink:0; }

        /* SKELETON */
        .nr-skeleton { height:48px;background:rgba(201,169,110,.12);border-radius:14px;animation:pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        /* PERSONAS counter */
        .nr-personas-row { display:flex;align-items:center;gap:.75rem; }
        .nr-personas-btn { width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(201,169,110,.3);background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#7a6e5f;font-size:1.1rem;font-weight:500;transition:all .2s;flex-shrink:0; }
        .nr-personas-btn:hover { border-color:#e8832a;color:#e8832a;background:rgba(232,131,42,.06); }
        .nr-personas-btn:disabled { opacity:.35;cursor:default; }
        .nr-personas-val { font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:#1a1a14;min-width:2rem;text-align:center; }
        .nr-personas-hint { font-size:.65rem;color:#7a6e5f; }

        /* RESUMEN */
        .nr-resumen { background:#1a1a14; border:1px solid rgba(201,169,110,.2); border-radius:16px; padding:1.25rem 1.5rem; position:relative; overflow:hidden; }
        .nr-resumen::before { content:'';position:absolute;top:-30px;right:-30px;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(232,131,42,.1),transparent 70%);pointer-events:none; }
        .nr-resumen-row { display:flex;justify-content:space-between;align-items:center;margin-bottom:.5rem; }
        .nr-resumen-row:last-child { margin-bottom:0; }
        .nr-resumen-label { font-size:.66rem;color:rgba(245,239,230,.45);letter-spacing:.06em; }
        .nr-resumen-val { font-size:.82rem;font-weight:500;color:rgba(245,239,230,.75); }
        .nr-resumen-sep { height:1px;background:rgba(201,169,110,.15);margin:.75rem 0; }
        .nr-resumen-total-label { font-size:.62rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(201,169,110,.7); }
        .nr-resumen-total-val { font-family:'Cormorant Garamond',serif;font-size:1.5rem;font-weight:600;color:#c9a96e; }

        /* ERROR */
        .nr-error { display:flex;align-items:flex-start;gap:.6rem;background:rgba(212,69,26,.07);border:1px solid rgba(212,69,26,.2);border-radius:12px;padding:.75rem 1rem;font-size:.73rem;color:#d4451a;line-height:1.4; }
        .nr-error svg { width:14px;height:14px;flex-shrink:0;margin-top:1px; }

        /* BOTÓN */
        .nr-btn {
          position:relative;overflow:hidden;width:100%;
          background:linear-gradient(135deg,#e8832a,#d4451a); border:none; border-radius:50px;
          padding:.95rem 2rem;
          color:white; font-family:'Montserrat',sans-serif; font-size:.72rem; font-weight:700; letter-spacing:.25em; text-transform:uppercase;
          cursor:pointer; box-shadow:0 6px 22px rgba(232,131,42,.45);
          transition:all .28s cubic-bezier(.22,1,.36,1);
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .nr-btn::after { content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);transition:left .5s ease; }
        .nr-btn:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 10px 30px rgba(232,131,42,.55); }
        .nr-btn:hover:not(:disabled)::after { left:140%; }
        .nr-btn:active:not(:disabled) { transform:scale(.98); }
        .nr-btn:disabled { opacity:.45;cursor:not-allowed; }
        .nr-btn-spin { width:15px;height:15px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:white;animation:spin .7s linear infinite; }

        @media (max-width:480px) {
          .nr-grid-2 { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="nr-page">

        {/* Back */}
        <button className="nr-back" onClick={() => router.back()}>
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        {/* Header */}
        <div className="nr-header">
          <div className="nr-title">Nueva <em>Reserva</em></div>
          <div className="nr-sub">Elige habitación, fechas y personas</div>
        </div>

        {/* Form */}
        <div className="nr-card">
          <div className="nr-card-body">

            {/* Habitación */}
            <div>
              <div className="nr-sec-label">Habitación</div>
              <div className="nr-field">
                <label className="nr-label">Habitación disponible</label>
                {loadingHab ? (
                  <div className="nr-skeleton" />
                ) : (
                  <div className="nr-select-wrap">
                    <select
                      className="nr-select"
                      value={idHabitacion}
                      onChange={e => setIdHabitacion(e.target.value === "" ? "" : Number(e.target.value))}
                    >
                      <option value="">Selecciona una habitación…</option>
                      {habitaciones.map(h => (
                        <option key={h.id_habitacion} value={h.id_habitacion}>
                          {h.numero} — {h.tipo_habitacion} — Piso {h.piso} — {fmtMoney(h.tarifa_base)}/noche
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {hab && (
                  <div className="nr-hab-hint">
                    <div className="nr-hab-hint-dot" />
                    {hab.tipo_habitacion} · Piso {hab.piso} · {fmtMoney(hab.tarifa_base)} por noche
                  </div>
                )}
              </div>
            </div>

            {/* Fechas */}
            <div>
              <div className="nr-sec-label">Fechas de estancia</div>
              <div className="nr-grid-2">
                <div className="nr-field">
                  <label className="nr-label">Fecha de entrada</label>
                  <input
                    type="date" className="nr-input"
                    min={fechaMin} value={fechaEntrada}
                    onChange={e => { setFechaEntrada(e.target.value); if (fechaSalida && e.target.value >= fechaSalida) setFechaSalida(""); }}
                  />
                </div>
                <div className="nr-field">
                  <label className="nr-label">Fecha de salida</label>
                  <input
                    type="date" className="nr-input"
                    min={fechaEntrada || fechaMin} value={fechaSalida}
                    onChange={e => setFechaSalida(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Personas */}
            <div>
              <div className="nr-sec-label">Huéspedes</div>
              <div className="nr-field">
                <label className="nr-label">Número de personas</label>
                <div className="nr-personas-row">
                  <button type="button" className="nr-personas-btn"
                    disabled={numPersonas <= 1}
                    onClick={() => setNumPersonas(n => Math.max(1, n - 1))}>−</button>
                  <span className="nr-personas-val">{numPersonas}</span>
                  <button type="button" className="nr-personas-btn"
                    disabled={numPersonas >= 10}
                    onClick={() => setNumPersonas(n => Math.min(10, n + 1))}>+</button>
                  <span className="nr-personas-hint">persona{numPersonas !== 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>

            {/* Resumen */}
            {noches > 0 && hab && (
              <div className="nr-resumen">
                <div className="nr-resumen-row">
                  <span className="nr-resumen-label">Habitación</span>
                  <span className="nr-resumen-val">{hab.numero} · {hab.tipo_habitacion}</span>
                </div>
                <div className="nr-resumen-row">
                  <span className="nr-resumen-label">Duración</span>
                  <span className="nr-resumen-val">{noches} noche{noches !== 1 ? "s" : ""}</span>
                </div>
                <div className="nr-resumen-row">
                  <span className="nr-resumen-label">Tarifa/noche</span>
                  <span className="nr-resumen-val">{fmtMoney(hab.tarifa_base)}</span>
                </div>
                <div className="nr-resumen-sep" />
                <div className="nr-resumen-row">
                  <span className="nr-resumen-total-label">Total estimado</span>
                  <span className="nr-resumen-total-val">{fmtMoney(montoTotal)}</span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="nr-error">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Botón */}
            <button className="nr-btn" onClick={handleSubmit} disabled={!formValido || enviando}>
              {enviando ? (
                <><div className="nr-btn-spin" />Reservando…</>
              ) : (
                <>
                  <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmar reserva
                </>
              )}
            </button>

          </div>
        </div>
      </div>
    </>
  );
}