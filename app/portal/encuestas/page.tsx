"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  getUser, apiFetch,
  type Reserva, type OrdenHospedaje,
  fmtDate,
} from "@/lib/portal";

type Encuesta = {
  id_encuesta:            number;
  id_orden_hospedaje:     number;
  recomendacion:          boolean;
  descripcion:            string;
  lugar_origen:           string;
  motivo_viaje:           string;
  calificacion_limpieza:  number;
  calificacion_servicio:  number;
  calificacion_ubicacion: number;
  calificacion_precio:    number;
  comentarios:            string;
  fecha_registro?:        string;
};

type EstadiaConEncuesta = {
  orden:    OrdenHospedaje;
  reserva:  Reserva;
  encuesta: Encuesta | null;
};

const MOTIVOS = ["Turismo", "Negocios", "Familia", "Salud", "Educación", "Otro"];

const ASPECTOS: { key: keyof Pick<Encuesta, "calificacion_limpieza"|"calificacion_servicio"|"calificacion_ubicacion"|"calificacion_precio">; label: string; icon: string }[] = [
  { key: "calificacion_limpieza",  label: "Limpieza",  icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { key: "calificacion_servicio",  label: "Servicio",  icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
  { key: "calificacion_ubicacion", label: "Ubicación", icon: "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" },
  { key: "calificacion_precio",    label: "Precio",    icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

const EMPTY_FORM = {
  recomendacion: true, descripcion: "", lugar_origen: "",
  motivo_viaje: "Turismo",
  calificacion_limpieza: 0, calificacion_servicio: 0,
  calificacion_ubicacion: 0, calificacion_precio: 0,
  comentarios: "",
};

export default function EncuestasPage() {
  const [estadias, setEstadias] = useState<EstadiaConEncuesta[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [activo,   setActivo]   = useState<number | null>(null); // id_orden_hospedaje del form abierto
  const [form,     setForm]     = useState({ ...EMPTY_FORM });
  const [enviando, setEnviando] = useState(false);
  const [msgOk,    setMsgOk]    = useState<string | null>(null);
  const [msgErr,   setMsgErr]   = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    apiFetch<Reserva[]>(`/reservas?id_huesped=${user.id_huesped}`)
      .then(async reservas => {
        const lista = Array.isArray(reservas) ? reservas : [];
        const completadas = lista.filter(r => r.estado === "Completada");

        const items: EstadiaConEncuesta[] = [];
        for (const rv of completadas) {
          const ordenes = await apiFetch<OrdenHospedaje[]>(`/hospedaje?id_reserva=${rv.id_reserva}`).catch(() => []);
          const ords = (Array.isArray(ordenes) ? ordenes : []).filter(o => o.estado === 3); // completadas
          for (const ord of ords) {
            const encuestas = await apiFetch<Encuesta[]>(`/encuestas?id_orden_hospedaje=${ord.id_orden_hospedaje}`).catch(() => []);
            const enc = Array.isArray(encuestas) && encuestas.length > 0 ? encuestas[0] : null;
            items.push({ orden: ord, reserva: rv, encuesta: enc });
          }
        }
        setEstadias(items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function abrirForm(idOrden: number) {
    setActivo(idOrden);
    setForm({ ...EMPTY_FORM });
    setMsgOk(null); setMsgErr(null);
  }

  async function handleSubmit(e: FormEvent, idOrden: number) {
    e.preventDefault();
    const missingRating = ASPECTOS.some(a => form[a.key] === 0);
    if (missingRating) { setMsgErr("Por favor califica todos los aspectos."); return; }

    setEnviando(true); setMsgErr(null); setMsgOk(null);
    try {
      const nueva = await apiFetch<Encuesta>("/encuestas", {
        method: "POST",
        body: JSON.stringify({ ...form, id_orden_hospedaje: idOrden }),
      });
      setEstadias(prev => prev.map(e =>
        e.orden.id_orden_hospedaje === idOrden ? { ...e, encuesta: nueva } : e
      ));
      setMsgOk("¡Gracias por tu opinión! Tu encuesta ha sido registrada.");
      setActivo(null);
    } catch (err) {
      setMsgErr(err instanceof Error ? err.message : "Error al enviar la encuesta.");
    } finally {
      setEnviando(false);
    }
  }

  function StarRow({ aspecto }: { aspecto: typeof ASPECTOS[0] }) {
    const val = form[aspecto.key];
    return (
      <div className="eq-star-group">
        <div className="eq-star-label-row">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={aspecto.icon} />
          </svg>
          <span>{aspecto.label}</span>
        </div>
        <div className="eq-stars">
          {[1,2,3,4,5].map(n => (
            <button key={n} type="button"
              className={`eq-star ${n <= val ? "filled" : ""}`}
              onClick={() => setForm(f => ({ ...f, [aspecto.key]: n }))}>
              <svg viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>
          ))}
          {val > 0 && <span className="eq-star-num">{val}/5</span>}
        </div>
      </div>
    );
  }

  // Promedio para mostrar en encuestas ya respondidas
  function promedio(enc: Encuesta) {
    return ((enc.calificacion_limpieza + enc.calificacion_servicio + enc.calificacion_ubicacion + enc.calificacion_precio) / 4).toFixed(1);
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');

        .eq-page { font-family:'Montserrat',sans-serif; display:flex; flex-direction:column; gap:1.5rem; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes slideDown { from{opacity:0;max-height:0} to{opacity:1;max-height:2000px} }

        .eq-header { animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
        .eq-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#1a1a14; line-height:1; }
        .eq-title em { font-style:italic; color:#c9a96e; }
        .eq-sub { font-size:.7rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#7a6e5f;margin-top:.35rem; }

        .eq-loading { padding:5rem; display:flex; justify-content:center; }
        .eq-spin { width:22px;height:22px;border-radius:50%;border:2px solid rgba(201,169,110,.2);border-top-color:#e8832a;animation:spin .7s linear infinite; }

        /* EMPTY */
        .eq-empty { background:#f5efe6;border:1px solid rgba(201,169,110,.2);border-radius:22px;padding:4rem 2rem;text-align:center;display:flex;flex-direction:column;align-items:center;gap:1rem;animation:fadeUp .55s .05s cubic-bezier(.22,1,.36,1) both; }
        .eq-empty-icon { width:60px;height:60px;border-radius:50%;background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.2);display:flex;align-items:center;justify-content:center; }
        .eq-empty-icon svg { width:26px;height:26px;color:#c9a96e; }
        .eq-empty-title { font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:600;color:#1a1a14; }
        .eq-empty-sub { font-size:.72rem;color:#7a6e5f;letter-spacing:.04em; }

        /* CARD ESTADÍA */
        .eq-card { background:#f5efe6;border:1px solid rgba(201,169,110,.18);border-radius:20px;overflow:hidden;animation:fadeUp .6s .06s cubic-bezier(.22,1,.36,1) both; }
        .eq-card-head { padding:1.2rem 1.5rem;border-bottom:1px solid rgba(201,169,110,.15);display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap; }
        .eq-card-head-left { display:flex;align-items:center;gap:.85rem; }
        .eq-card-head-icon { width:40px;height:40px;border-radius:12px;background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .eq-card-head-icon svg { width:18px;height:18px;color:#c9a96e; }
        .eq-card-reserva { font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:#1a1a14; }
        .eq-card-dates { font-size:.68rem;color:#7a6e5f;margin-top:2px; }

        /* BADGE */
        .eq-badge { display:inline-flex;align-items:center;padding:.25rem .75rem;border-radius:50px;font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;border:1px solid; }

        /* ENCUESTA RESPONDIDA */
        .eq-respondida { padding:1.25rem 1.5rem; }
        .eq-sec-label { font-size:.58rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#c9a96e;display:flex;align-items:center;gap:.6rem;margin-bottom:.85rem; }
        .eq-sec-label::after { content:'';flex:1;height:1px;background:rgba(201,169,110,.2); }
        .eq-scores-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:.75rem;margin-bottom:1rem; }
        .eq-score-item { background:white;border:1px solid rgba(201,169,110,.15);border-radius:12px;padding:.85rem 1rem;display:flex;align-items:center;gap:.6rem; }
        .eq-score-icon { width:28px;height:28px;border-radius:8px;background:rgba(201,169,110,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .eq-score-icon svg { width:13px;height:13px;color:#c9a96e; }
        .eq-score-label { font-size:.62rem;color:#7a6e5f;font-weight:500; }
        .eq-score-val { font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:600;color:#1a1a14;display:flex;align-items:baseline;gap:.2rem; }
        .eq-score-val span { font-size:.55rem;font-family:'Montserrat',sans-serif;color:#b8a898;font-weight:400; }
        .eq-promedio-row { display:flex;align-items:center;justify-content:space-between;padding:.85rem 1rem;background:white;border:1px solid rgba(201,169,110,.2);border-radius:12px;margin-bottom:.85rem; }
        .eq-promedio-label { font-size:.62rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#7a6e5f; }
        .eq-promedio-val { font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600;color:#e8832a; }
        .eq-stars-display { display:flex;gap:2px;margin-left:.5rem; }
        .eq-star-display { width:14px;height:14px; }
        .eq-star-display path { fill:rgba(201,169,110,.25); }
        .eq-star-display.on path { fill:#c9a96e; }
        .eq-recomienda { display:flex;align-items:center;gap:.5rem;font-size:.72rem;color:#5a9e6f;font-weight:500; }
        .eq-recomienda svg { width:14px;height:14px; }
        .eq-comentario { font-size:.75rem;color:#4a4035;background:white;border:1px solid rgba(201,169,110,.15);border-radius:12px;padding:.85rem 1rem;line-height:1.5;font-style:italic;margin-top:.75rem; }

        /* BOTÓN RESPONDER */
        .eq-responder-area { padding:1.25rem 1.5rem; }
        .eq-responder-btn {
          width:100%;position:relative;overflow:hidden;
          background:linear-gradient(135deg,#e8832a,#d4451a);border:none;border-radius:50px;
          padding:.82rem 2rem;
          color:white;font-family:'Montserrat',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
          cursor:pointer;box-shadow:0 5px 18px rgba(232,131,42,.4);
          transition:all .25s cubic-bezier(.22,1,.36,1);
          display:flex;align-items:center;justify-content:center;gap:.5rem;
        }
        .eq-responder-btn::after { content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transition:left .45s ease; }
        .eq-responder-btn:hover { transform:translateY(-2px);box-shadow:0 9px 24px rgba(232,131,42,.5); }
        .eq-responder-btn:hover::after { left:140%; }
        .eq-responder-btn svg { width:15px;height:15px; }

        /* FORMULARIO */
        .eq-form-wrap { border-top:1px solid rgba(201,169,110,.15);padding:1.5rem;animation:fadeUp .35s cubic-bezier(.22,1,.36,1) both; }
        .eq-form { display:flex;flex-direction:column;gap:1.25rem; }

        .eq-field { display:flex;flex-direction:column;gap:.4rem; }
        .eq-label { font-size:.61rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#7a6e5f; }
        .eq-input, .eq-select, .eq-textarea {
          width:100%;background:white;border:1.5px solid #ddd5c4;border-radius:14px;
          padding:.78rem 1.1rem;
          font-family:'Montserrat',sans-serif;font-size:.82rem;color:#1a1a14;outline:none;
          transition:all .25s cubic-bezier(.22,1,.36,1);
          box-shadow:0 1px 3px rgba(74,64,53,.04);
          appearance:none;-webkit-appearance:none;
        }
        .eq-input:focus, .eq-select:focus, .eq-textarea:focus { border-color:#e8832a;box-shadow:0 0 0 4px rgba(232,131,42,.11); }
        .eq-textarea { resize:vertical;min-height:90px;line-height:1.5; }

        .eq-select-wrap { position:relative; }
        .eq-select-wrap::after { content:'';position:absolute;right:1rem;top:50%;transform:translateY(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #b8a898;pointer-events:none; }

        /* GRID 2 */
        .eq-grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }

        /* RECOMENDACIÓN toggle */
        .eq-toggle-row { display:flex;gap:.6rem; }
        .eq-toggle-opt { flex:1;padding:.65rem 1rem;border-radius:50px;border:1.5px solid rgba(201,169,110,.3);background:transparent;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:.68rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#7a6e5f;transition:all .22s;display:flex;align-items:center;justify-content:center;gap:.4rem; }
        .eq-toggle-opt:hover { border-color:rgba(201,169,110,.6); }
        .eq-toggle-opt.active-yes { background:rgba(90,158,111,.1);border-color:rgba(90,158,111,.4);color:#5a9e6f; }
        .eq-toggle-opt.active-no  { background:rgba(212,69,26,.08);border-color:rgba(212,69,26,.3);color:#d4451a; }
        .eq-toggle-opt svg { width:13px;height:13px; }

        /* STARS input */
        .eq-stars-grid { display:grid;grid-template-columns:1fr 1fr;gap:.85rem; }
        .eq-star-group { background:white;border:1px solid rgba(201,169,110,.15);border-radius:14px;padding:.9rem 1rem; }
        .eq-star-label-row { display:flex;align-items:center;gap:.4rem;font-size:.62rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#7a6e5f;margin-bottom:.6rem; }
        .eq-star-label-row svg { width:12px;height:12px;color:#c9a96e;flex-shrink:0; }
        .eq-stars { display:flex;align-items:center;gap:2px; }
        .eq-star { background:none;border:none;cursor:pointer;padding:0;width:22px;height:22px;transition:transform .15s; }
        .eq-star:hover { transform:scale(1.15); }
        .eq-star svg { width:20px;height:20px; }
        .eq-star svg path { fill:rgba(201,169,110,.2);transition:fill .15s; }
        .eq-star.filled svg path { fill:#c9a96e; }
        .eq-star-num { font-size:.65rem;font-weight:700;color:#c9a96e;margin-left:.4rem; }

        /* ORNAMENTO */
        .eq-orn { display:flex;align-items:center;gap:.6rem; }
        .eq-orn-line { flex:1;height:1px;background:rgba(201,169,110,.25); }
        .eq-orn-diamond { width:5px;height:5px;border:1px solid rgba(201,169,110,.5);transform:rotate(45deg); }

        /* ALERTAS */
        .eq-alert { display:flex;align-items:flex-start;gap:.6rem;border-radius:12px;padding:.75rem 1rem;font-size:.73rem;line-height:1.4; }
        .eq-alert-ok { background:rgba(90,158,111,.08);border:1px solid rgba(90,158,111,.25);color:#3d7a52; }
        .eq-alert-err { background:rgba(212,69,26,.07);border:1px solid rgba(212,69,26,.2);color:#d4451a; }
        .eq-alert svg { width:14px;height:14px;flex-shrink:0;margin-top:1px; }

        /* SUBMIT */
        .eq-submit-btn {
          position:relative;overflow:hidden;width:100%;
          background:linear-gradient(135deg,#e8832a,#d4451a);border:none;border-radius:50px;
          padding:.9rem 2rem;
          color:white;font-family:'Montserrat',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
          cursor:pointer;box-shadow:0 5px 18px rgba(232,131,42,.4);
          transition:all .28s cubic-bezier(.22,1,.36,1);
          display:flex;align-items:center;justify-content:center;gap:8px;
        }
        .eq-submit-btn:disabled { opacity:.5;cursor:not-allowed; }
        .eq-submit-btn:not(:disabled):hover { transform:translateY(-2px);box-shadow:0 9px 24px rgba(232,131,42,.5); }
        .eq-btn-spin { width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:white;animation:spin .7s linear infinite; }

        .eq-cancel-btn { width:100%;background:transparent;border:1.5px solid rgba(201,169,110,.3);border-radius:50px;padding:.85rem;color:#7a6e5f;font-family:'Montserrat',sans-serif;font-size:.7rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;cursor:pointer;transition:all .22s; }
        .eq-cancel-btn:hover { border-color:rgba(201,169,110,.6);color:#4a4035; }

        @media (max-width:480px) {
          .eq-scores-grid, .eq-stars-grid, .eq-grid-2 { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="eq-page">

        <div className="eq-header">
          <div className="eq-title">Mis <em>Encuestas</em></div>
          <div className="eq-sub">Califica tu experiencia en cada estadía</div>
        </div>

        {loading ? (
          <div className="eq-loading"><div className="eq-spin" /></div>
        ) : estadias.length === 0 ? (
          <div className="eq-empty">
            <div className="eq-empty-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div className="eq-empty-title">Sin estadías completadas</div>
            <div className="eq-empty-sub">Las encuestas se habilitan al finalizar una estadía</div>
          </div>
        ) : (
          estadias.map(({ orden, reserva, encuesta }) => (
            <div key={orden.id_orden_hospedaje} className="eq-card">

              {/* Header */}
              <div className="eq-card-head">
                <div className="eq-card-head-left">
                  <div className="eq-card-head-icon">
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <div>
                    <div className="eq-card-reserva">Reserva #{reserva.id_reserva}</div>
                    <div className="eq-card-dates">
                      {fmtDate(reserva.fecha_entrada, { day: "numeric", month: "short" })}
                      {" → "}
                      {fmtDate(reserva.fecha_salida, { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                </div>
                {encuesta ? (
                  <span className="eq-badge" style={{ background: "rgba(90,158,111,.1)", color: "#5a9e6f", borderColor: "rgba(90,158,111,.3)" }}>
                    Respondida
                  </span>
                ) : (
                  <span className="eq-badge" style={{ background: "rgba(232,131,42,.1)", color: "#e8832a", borderColor: "rgba(232,131,42,.3)" }}>
                    Pendiente
                  </span>
                )}
              </div>

              {/* Resultado de encuesta ya respondida */}
              {encuesta && (
                <div className="eq-respondida">
                  <div className="eq-sec-label">Tu calificación</div>

                  <div className="eq-promedio-row">
                    <span className="eq-promedio-label">Promedio general</span>
                    <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
                      <div className="eq-stars-display">
                        {[1,2,3,4,5].map(n => (
                          <svg key={n} className={`eq-star-display ${n <= Math.round(parseFloat(promedio(encuesta))) ? "on" : ""}`} viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        ))}
                      </div>
                      <span className="eq-promedio-val">{promedio(encuesta)}</span>
                    </div>
                  </div>

                  <div className="eq-scores-grid">
                    {ASPECTOS.map(a => (
                      <div key={a.key} className="eq-score-item">
                        <div className="eq-score-icon">
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={a.icon} />
                          </svg>
                        </div>
                        <div>
                          <div className="eq-score-label">{a.label}</div>
                          <div className="eq-score-val">{encuesta[a.key]}<span>/5</span></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {encuesta.recomendacion && (
                    <div className="eq-recomienda">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                      Recomendarías Hostal Las Mercedes
                    </div>
                  )}

                  {encuesta.comentarios && (
                    <div className="eq-comentario">"{encuesta.comentarios}"</div>
                  )}
                </div>
              )}

              {/* Botón abrir formulario */}
              {!encuesta && activo !== orden.id_orden_hospedaje && (
                <div className="eq-responder-area">
                  <button className="eq-responder-btn" onClick={() => abrirForm(orden.id_orden_hospedaje)}>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    Completar encuesta
                  </button>
                </div>
              )}

              {/* Formulario */}
              {!encuesta && activo === orden.id_orden_hospedaje && (
                <div className="eq-form-wrap">
                  <form className="eq-form" onSubmit={e => handleSubmit(e, orden.id_orden_hospedaje)}>

                    {/* Calificaciones */}
                    <div>
                      <div className="eq-sec-label">Calificaciones</div>
                      <div className="eq-stars-grid">
                        {ASPECTOS.map(a => <StarRow key={a.key} aspecto={a} />)}
                      </div>
                    </div>

                    {/* Recomendación */}
                    <div className="eq-field">
                      <label className="eq-label">¿Recomendarías el hostal?</label>
                      <div className="eq-toggle-row">
                        <button type="button"
                          className={`eq-toggle-opt ${form.recomendacion ? "active-yes" : ""}`}
                          onClick={() => setForm(f => ({ ...f, recomendacion: true }))}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Sí, claro
                        </button>
                        <button type="button"
                          className={`eq-toggle-opt ${!form.recomendacion ? "active-no" : ""}`}
                          onClick={() => setForm(f => ({ ...f, recomendacion: false }))}>
                          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          No por ahora
                        </button>
                      </div>
                    </div>

                    {/* Datos del viaje */}
                    <div className="eq-grid-2">
                      <div className="eq-field">
                        <label className="eq-label">Lugar de origen</label>
                        <input className="eq-input" value={form.lugar_origen}
                          onChange={e => setForm(f => ({ ...f, lugar_origen: e.target.value }))}
                          placeholder="Ej: Lima, Perú" maxLength={80} />
                      </div>
                      <div className="eq-field">
                        <label className="eq-label">Motivo del viaje</label>
                        <div className="eq-select-wrap">
                          <select className="eq-select" value={form.motivo_viaje}
                            onChange={e => setForm(f => ({ ...f, motivo_viaje: e.target.value }))}>
                            {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="eq-field">
                      <label className="eq-label">Descripción de tu experiencia</label>
                      <input className="eq-input" value={form.descripcion}
                        onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                        placeholder="Breve descripción de tu estadía" maxLength={200} />
                    </div>

                    {/* Comentarios */}
                    <div className="eq-field">
                      <label className="eq-label">Comentarios adicionales <span style={{ color:"#b8a898",fontWeight:400,textTransform:"none",letterSpacing:0 }}>· opcional</span></label>
                      <textarea className="eq-textarea" value={form.comentarios}
                        onChange={e => setForm(f => ({ ...f, comentarios: e.target.value }))}
                        placeholder="¿Algo que quieras contarnos?" maxLength={500} />
                    </div>

                    {msgOk  && <div className="eq-alert eq-alert-ok"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>{msgOk}</div>}
                    {msgErr && <div className="eq-alert eq-alert-err"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{msgErr}</div>}

                    <div className="eq-orn"><div className="eq-orn-line"/><div className="eq-orn-diamond"/><div className="eq-orn-line"/></div>

                    <button type="submit" className="eq-submit-btn" disabled={enviando}>
                      {enviando ? <><div className="eq-btn-spin"/>Enviando…</> : "Enviar encuesta"}
                    </button>
                    <button type="button" className="eq-cancel-btn" onClick={() => setActivo(null)}>
                      Cancelar
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </>
  );
}