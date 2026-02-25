"use client";

import { useEffect, useState } from "react";
import {
  getUser, apiFetch,
  type Reserva, type OrdenHospedaje,
  ESTADO_RESERVA, ESTADO_HOSPEDAJE,
  fmtDate, fmtMoney, calcNochces,
} from "@/lib/portal";

type OrdenConserjeria = {
  id_orden_conserj: number; id_reserva: number; id_habitacion: number;
  fecha_inicio: string; fecha_fin: string | null;
  estado: number; descripcion: string; precio: number;
};

const ESTADO_CONS: Record<number, { label: string; bg: string; color: string; border: string }> = {
  1: { label: "Solicitado", bg: "rgba(201,169,110,0.1)",  color: "#c9a96e", border: "rgba(201,169,110,0.3)" },
  2: { label: "En proceso", bg: "rgba(100,140,200,0.1)",  color: "#6490c8", border: "rgba(100,140,200,0.3)" },
  3: { label: "Completado", bg: "rgba(90,158,111,0.1)",   color: "#5a9e6f", border: "rgba(90,158,111,0.3)"  },
  4: { label: "Cancelado",  bg: "rgba(212,69,26,0.1)",    color: "#d4451a", border: "rgba(212,69,26,0.3)"   },
};

type EstadiaCompleta = { reserva: Reserva; hospedaje: OrdenHospedaje[]; servicios: OrdenConserjeria[] };

export default function HospedajePage() {
  const [estadias, setEstadias] = useState<EstadiaCompleta[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    apiFetch<Reserva[]>(`/reservas?id_huesped=${user.id_huesped}`)
      .then(async reservas => {
        const lista = Array.isArray(reservas) ? reservas : [];
        const relevantes = lista.filter(r => r.estado === "Confirmada" || r.estado === "Completada");
        const completas = await Promise.all(
          relevantes.map(async rv => {
            const [hospedaje, servicios] = await Promise.all([
              apiFetch<OrdenHospedaje[]>(`/hospedaje?id_reserva=${rv.id_reserva}`).catch(() => []),
              apiFetch<OrdenConserjeria[]>(`/conserjeria?id_reserva=${rv.id_reserva}`).catch(() => []),
            ]);
            return { reserva: rv, hospedaje: Array.isArray(hospedaje) ? hospedaje : [], servicios: Array.isArray(servicios) ? servicios : [] };
          })
        );
        setEstadias(completas.filter(e => e.hospedaje.length > 0 || e.reserva.estado === "Confirmada"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');

        .hp-page { font-family:'Montserrat',sans-serif; display:flex; flex-direction:column; gap:1.5rem; }

        /* ── PAGE HEADER ── */
        .hp-header { animation: fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
        .hp-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#1a1a14; line-height:1; }
        .hp-title em { font-style:italic; color:#c9a96e; }
        .hp-sub { font-size:.7rem; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:#7a6e5f; margin-top:.35rem; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        /* ── SPINNER ── */
        .hp-loading { padding:5rem; display:flex; justify-content:center; }
        .hp-spin { width:22px;height:22px;border-radius:50%;border:2px solid rgba(201,169,110,.2);border-top-color:#e8832a;animation:spin .7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* ── EMPTY ── */
        .hp-empty { background:#f5efe6; border:1px solid rgba(201,169,110,.2); border-radius:22px; padding:4rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; animation:fadeUp .55s .05s cubic-bezier(.22,1,.36,1) both; }
        .hp-empty-icon { width:60px;height:60px;border-radius:50%;background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.2);display:flex;align-items:center;justify-content:center; }
        .hp-empty-icon svg { width:26px;height:26px;color:#c9a96e; }
        .hp-empty-title { font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:600;color:#1a1a14; }
        .hp-empty-sub { font-size:.72rem;color:#7a6e5f;letter-spacing:.04em; }

        /* ── ESTADIA CARD ── */
        .hp-card { background:#f5efe6; border:1px solid rgba(201,169,110,.18); border-radius:22px; overflow:hidden; animation:fadeUp .6s .06s cubic-bezier(.22,1,.36,1) both; }
        .hp-card-head { padding:1.25rem 1.5rem; border-bottom:1px solid rgba(201,169,110,.15); display:flex; align-items:center; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .hp-card-head.activa { background:rgba(90,158,111,.05); }
        .hp-card-head-left { display:flex; align-items:center; gap:.85rem; }
        .hp-pulse-wrap { position:relative; }
        .hp-pulse { width:9px;height:9px;border-radius:50%;background:#5a9e6f; }
        .hp-pulse::after { content:'';position:absolute;inset:-4px;border-radius:50%;background:rgba(90,158,111,.2);animation:ring 2s ease-in-out infinite; }
        @keyframes ring { 0%,100%{transform:scale(1);opacity:1} 60%{transform:scale(1.8);opacity:0} }
        .hp-reserva-num { font-family:'Cormorant Garamond',serif;font-size:1.15rem;font-weight:600;color:#1a1a14; }
        .hp-reserva-dates { font-size:.68rem;color:#7a6e5f;margin-top:2px; }
        .hp-card-head-right { text-align:right; }
        .hp-monto { font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:600;color:#1a1a14;margin-top:.3rem; }

        .hp-badge { display:inline-flex;align-items:center;padding:.22rem .7rem;border-radius:50px;font-size:.6rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;border:1px solid; }

        /* ── SECCIONES INTERNAS ── */
        .hp-section { padding:1.1rem 1.5rem; border-bottom:1px solid rgba(201,169,110,.12); }
        .hp-section:last-child { border-bottom:none; }
        .hp-section-label { font-size:.58rem;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#c9a96e;margin-bottom:.85rem;display:flex;align-items:center;gap:.6rem; }
        .hp-section-label::after { content:'';flex:1;height:1px;background:rgba(201,169,110,.2); }

        /* ── ORDEN HOSPEDAJE ── */
        .hp-orden { background:white;border:1px solid rgba(201,169,110,.15);border-radius:14px;padding:1rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;flex-wrap:wrap; }
        .hp-orden-num { font-size:.8rem;font-weight:600;color:#1a1a14;margin-bottom:.3rem; }
        .hp-orden-dates { font-size:.68rem;color:#7a6e5f;display:flex;gap:.75rem;flex-wrap:wrap; }
        .hp-checkin-label { font-size:.6rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#7a6e5f;margin-right:.25rem; }

        /* ── SERVICIOS ── */
        .hp-svc-head { display:flex;align-items:center;justify-content:space-between;margin-bottom:.85rem; }
        .hp-svc-total { font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-weight:600;color:#e8832a; }
        .hp-svc-row { background:white;border:1px solid rgba(201,169,110,.12);border-radius:14px;padding:.9rem 1.25rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.5rem; }
        .hp-svc-row:last-child { margin-bottom:0; }
        .hp-svc-desc { font-size:.8rem;font-weight:500;color:#1a1a14; }
        .hp-svc-date { font-size:.65rem;color:#7a6e5f;margin-top:2px; }
        .hp-svc-right { display:flex;align-items:center;gap:.75rem;flex-shrink:0; }
        .hp-svc-price { font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:600;color:#1a1a14; }
        .hp-empty-sub-sm { font-size:.72rem;color:#b8a898; }
      `}</style>

      <div className="hp-page">

        <div className="hp-header">
          <div className="hp-title">Mi <em>Estadía</em></div>
          <div className="hp-sub">Check-in · Habitación · Servicios</div>
        </div>

        {loading ? (
          <div className="hp-loading"><div className="hp-spin" /></div>
        ) : estadias.length === 0 ? (
          <div className="hp-empty">
            <div className="hp-empty-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div className="hp-empty-title">Sin estadías activas</div>
            <div className="hp-empty-sub">Las estadías aparecen cuando el personal realiza el check-in en recepción</div>
          </div>
        ) : (
          estadias.map(({ reserva, hospedaje, servicios }) => {
            const noches   = calcNochces(reserva.fecha_entrada, reserva.fecha_salida);
            const activa   = hospedaje.find(h => h.estado === 2);
            const totalSvc = servicios.reduce((s, sv) => s + Number(sv.precio), 0);
            const badge    = ESTADO_RESERVA[reserva.estado];

            return (
              <div key={reserva.id_reserva} className="hp-card">

                {/* Header */}
                <div className={`hp-card-head ${activa ? "activa" : ""}`}>
                  <div className="hp-card-head-left">
                    {activa && <div className="hp-pulse-wrap"><div className="hp-pulse" /></div>}
                    <div>
                      <div className="hp-reserva-num">Reserva #{reserva.id_reserva}</div>
                      <div className="hp-reserva-dates">
                        {fmtDate(reserva.fecha_entrada, { day: "numeric", month: "short" })}
                        {" → "}
                        {fmtDate(reserva.fecha_salida, { day: "numeric", month: "short", year: "numeric" })}
                        {" · "}{noches} noches
                      </div>
                    </div>
                  </div>
                  <div className="hp-card-head-right">
                    {badge && (
                      <span className="hp-badge" style={{ background: "rgba(201,169,110,0.1)", color: "#7a6e5f", borderColor: "rgba(201,169,110,0.25)" }}>
                        {badge.label}
                      </span>
                    )}
                    <div className="hp-monto">{fmtMoney(reserva.monto_total)}</div>
                  </div>
                </div>

                {/* Registro de estadía */}
                <div className="hp-section">
                  <div className="hp-section-label">Registro de estadía</div>
                  {hospedaje.length === 0 ? (
                    <p className="hp-empty-sub-sm">Check-in pendiente — el personal lo realizará en recepción</p>
                  ) : (
                    hospedaje.map(ord => {
                      const hBadge = ESTADO_HOSPEDAJE[ord.estado];
                      return (
                        <div key={ord.id_orden_hospedaje} className="hp-orden">
                          <div>
                            <div className="hp-orden-num">Orden #{ord.id_orden_hospedaje}</div>
                            <div className="hp-orden-dates">
                              {ord.fecha_checkin && (
                                <span><span className="hp-checkin-label">Entrada</span>{fmtDate(ord.fecha_checkin)}</span>
                              )}
                              {ord.fecha_checkout && (
                                <span><span className="hp-checkin-label">Salida</span>{fmtDate(ord.fecha_checkout)}</span>
                              )}
                            </div>
                          </div>
                          {hBadge && (
                            <span className="hp-badge" style={{
                              background: ord.estado === 2 ? "rgba(90,158,111,.1)" : ord.estado === 3 ? "rgba(100,140,200,.1)" : "rgba(201,169,110,.1)",
                              color:      ord.estado === 2 ? "#5a9e6f"             : ord.estado === 3 ? "#6490c8"             : "#c9a96e",
                              borderColor:ord.estado === 2 ? "rgba(90,158,111,.3)" : ord.estado === 3 ? "rgba(100,140,200,.3)": "rgba(201,169,110,.3)",
                            }}>{hBadge.label}</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Servicios */}
                <div className="hp-section">
                  <div className="hp-svc-head">
                    <div className="hp-section-label" style={{ marginBottom: 0, flex: 1 }}>Servicios adicionales</div>
                    {totalSvc > 0 && <span className="hp-svc-total">{fmtMoney(totalSvc)}</span>}
                  </div>
                  {servicios.length === 0 ? (
                    <p className="hp-empty-sub-sm">Sin servicios adicionales registrados</p>
                  ) : (
                    servicios.map(sv => {
                      const sc = ESTADO_CONS[sv.estado];
                      return (
                        <div key={sv.id_orden_conserj} className="hp-svc-row">
                          <div>
                            <div className="hp-svc-desc">{sv.descripcion || "Servicio de conserjería"}</div>
                            <div className="hp-svc-date">
                              {fmtDate(sv.fecha_inicio, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <div className="hp-svc-right">
                            {sc && (
                              <span className="hp-badge" style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                                {sc.label}
                              </span>
                            )}
                            <span className="hp-svc-price">{fmtMoney(sv.precio)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            );
          })
        )}
      </div>
    </>
  );
}