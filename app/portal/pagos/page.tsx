"use client";

import { useEffect, useState } from "react";
import {
  getUser, apiFetch,
  type Reserva, type Documento, type Pago,
  ESTADO_DOC, METODO_PAGO,
  fmtDate, fmtMoney,
} from "@/lib/portal";

type DocumentoConPagos = { doc: Documento; pagos: Pago[]; reserva: Reserva };

export default function PagosPage() {
  const [items,   setItems]   = useState<DocumentoConPagos[]>([]);
  const [loading, setLoading] = useState(true);
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    apiFetch<Reserva[]>(`/reservas?id_huesped=${user.id_huesped}`)
      .then(async reservas => {
        const lista = Array.isArray(reservas) ? reservas : [];
        const relevantes = lista.filter(r => r.estado === "Confirmada" || r.estado === "Completada");
        const resultados = await Promise.all(
          relevantes.map(async rv => {
            const docs = await apiFetch<Documento[]>(`/documentos?id_reserva=${rv.id_reserva}`).catch(() => [] as Documento[]);
            const docsArr = Array.isArray(docs) ? docs : [];
            const conPagos = await Promise.all(
              docsArr.map(async doc => {
                const pagos = await apiFetch<Pago[]>(`/pagos?id_documento=${doc.id_documento}`).catch(() => [] as Pago[]);
                return { doc, pagos: Array.isArray(pagos) ? pagos : [], reserva: rv };
              })
            );
            return conPagos;
          })
        );
        const todos = resultados.flat();
        todos.sort((a, b) => {
          if (a.doc.estado_documento !== b.doc.estado_documento) return a.doc.estado_documento - b.doc.estado_documento;
          return new Date(b.doc.fecha_emision).getTime() - new Date(a.doc.fecha_emision).getTime();
        });
        setItems(todos);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPendiente = items.filter(i => i.doc.estado_documento === 1).reduce((s, i) => s + Number(i.doc.saldo_pendiente), 0);
  const totalPagado    = items.reduce((s, i) => s + Number(i.doc.monto_pagado), 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        .pg-page { font-family:'Montserrat',sans-serif; display:flex; flex-direction:column; gap:1.5rem; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }

        .pg-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#1a1a14; line-height:1; }
        .pg-title em { font-style:italic; color:#c9a96e; }
        .pg-sub { font-size:.7rem; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:#7a6e5f; margin-top:.35rem; }
        .pg-header { animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }

        /* RESUMEN */
        .pg-resumen { display:grid; grid-template-columns:1fr 1fr; gap:.85rem; animation:fadeUp .55s .04s cubic-bezier(.22,1,.36,1) both; }
        .pg-stat { background:#f5efe6; border:1px solid rgba(201,169,110,.2); border-radius:18px; padding:1.1rem 1.4rem; }
        .pg-stat-label { font-size:.6rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:#7a6e5f; margin-bottom:.5rem; display:flex; align-items:center; gap:.5rem; }
        .pg-stat-label-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
        .pg-stat-value { font-family:'Cormorant Garamond',serif; font-size:1.75rem; font-weight:600; color:#1a1a14; line-height:1; }

        /* EMPTY */
        .pg-empty { background:#f5efe6; border:1px solid rgba(201,169,110,.2); border-radius:22px; padding:4rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; animation:fadeUp .55s .05s cubic-bezier(.22,1,.36,1) both; }
        .pg-empty-icon { width:60px;height:60px;border-radius:50%;background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.2);display:flex;align-items:center;justify-content:center; }
        .pg-empty-icon svg { width:26px; height:26px; color:#c9a96e; }
        .pg-empty-title { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:#1a1a14; }
        .pg-empty-sub { font-size:.72rem; color:#7a6e5f; }

        /* SPINNER */
        .pg-loading { padding:5rem; display:flex; justify-content:center; }
        .pg-spin { width:22px;height:22px;border-radius:50%;border:2px solid rgba(201,169,110,.2);border-top-color:#e8832a;animation:spin .7s linear infinite; }

        /* DOCUMENTO CARD */
        .pg-doc { background:#f5efe6; border:1px solid rgba(201,169,110,.18); border-radius:18px; overflow:hidden; animation:fadeUp .6s .06s cubic-bezier(.22,1,.36,1) both; }

        .pg-doc-btn { width:100%; background:none; border:none; cursor:pointer; padding:1.25rem 1.5rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; text-align:left; transition:background .2s; }
        .pg-doc-btn:hover { background:rgba(201,169,110,.04); }
        .pg-doc-btn-left { display:flex; align-items:flex-start; gap:1rem; }
        .pg-doc-icon { width:42px; height:42px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .pg-doc-icon svg { width:20px; height:20px; }
        .pg-doc-numrow { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; margin-bottom:3px; }
        .pg-doc-num { font-size:.82rem; font-weight:700; color:#1a1a14; }
        .pg-badge { display:inline-flex; align-items:center; padding:.22rem .65rem; border-radius:50px; font-size:.58rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; border:1px solid; }
        .pg-doc-meta { font-size:.65rem; color:#7a6e5f; }
        .pg-doc-desc { font-size:.65rem; color:#b8a898; margin-top:2px; }
        .pg-doc-right { text-align:right; flex-shrink:0; }
        .pg-doc-total { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:#1a1a14; }
        .pg-doc-saldo { font-size:.65rem; color:#d4451a; margin-top:2px; }
        .pg-chevron { width:16px; height:16px; color:#b8a898; margin-top:.5rem; margin-left:auto; display:block; transition:transform .25s; }
        .pg-chevron.open { transform:rotate(180deg); }

        /* DETALLE */
        .pg-detalle { border-top:1px solid rgba(201,169,110,.15); padding:1.25rem 1.5rem; display:flex; flex-direction:column; gap:1.1rem; }

        /* barra progreso */
        .pg-prog-labels { display:flex; justify-content:space-between; font-size:.63rem; color:#7a6e5f; margin-bottom:.4rem; }
        .pg-prog-track { height:5px; background:rgba(201,169,110,.15); border-radius:99px; overflow:hidden; }
        .pg-prog-fill { height:100%; border-radius:99px; background:linear-gradient(to right,#e8832a,#d4451a); transition:width .5s ease; }

        /* pagos */
        .pg-pagos-label { font-size:.58rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:#c9a96e; display:flex; align-items:center; gap:.5rem; margin-bottom:.65rem; }
        .pg-pagos-label::after { content:''; flex:1; height:1px; background:rgba(201,169,110,.2); }
        .pg-pago-row { background:white; border:1px solid rgba(201,169,110,.12); border-radius:12px; padding:.85rem 1.1rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .pg-pago-amount { font-family:'Cormorant Garamond',serif; font-size:1rem; font-weight:600; color:#1a1a14; }
        .pg-pago-meta { font-size:.63rem; color:#7a6e5f; margin-top:2px; }
        .pg-pago-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
        .pg-no-pagos { font-size:.72rem; color:#b8a898; }
      `}</style>

      <div className="pg-page">

        <div className="pg-header">
          <div className="pg-title">Mis <em>Pagos</em></div>
          <div className="pg-sub">Documentos · Historial · Saldos</div>
        </div>

        {loading ? (
          <div className="pg-loading"><div className="pg-spin" /></div>
        ) : (
          <>
            {items.length > 0 && (
              <div className="pg-resumen">
                <div className="pg-stat">
                  <div className="pg-stat-label">
                    <div className="pg-stat-label-dot" style={{ background: totalPendiente > 0 ? "#d4451a" : "#b8a898" }} />
                    Saldo pendiente
                  </div>
                  <div className="pg-stat-value" style={{ color: totalPendiente > 0 ? "#d4451a" : "#1a1a14" }}>
                    {fmtMoney(totalPendiente)}
                  </div>
                </div>
                <div className="pg-stat">
                  <div className="pg-stat-label">
                    <div className="pg-stat-label-dot" style={{ background: "#5a9e6f" }} />
                    Total pagado
                  </div>
                  <div className="pg-stat-value" style={{ color: "#5a9e6f" }}>
                    {fmtMoney(totalPagado)}
                  </div>
                </div>
              </div>
            )}

            {items.length === 0 ? (
              <div className="pg-empty">
                <div className="pg-empty-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div className="pg-empty-title">Sin documentos de pago</div>
                <div className="pg-empty-sub">Se generan al confirmar una reserva o estadía</div>
              </div>
            ) : (
              items.map(({ doc, pagos, reserva }) => {
                const ck = `${reserva.id_reserva}-${doc.id_documento}`;
                const isOpen = abierto === ck;
                const estadoInfo = ESTADO_DOC[doc.estado_documento];
                const saldo = Number(doc.saldo_pendiente ?? (Number(doc.monto_total) - Number(doc.monto_pagado)));
                const pct   = Math.min(100, (Number(doc.monto_pagado) / Number(doc.monto_total)) * 100);

                const iconBg    = doc.estado_documento === 2 ? "rgba(90,158,111,.1)"  : doc.estado_documento === 3 ? "rgba(212,69,26,.1)"  : "rgba(232,131,42,.1)";
                const iconColor = doc.estado_documento === 2 ? "#5a9e6f"              : doc.estado_documento === 3 ? "#d4451a"             : "#e8832a";
                const badgeBg   = doc.estado_documento === 2 ? "rgba(90,158,111,.1)"  : doc.estado_documento === 3 ? "rgba(212,69,26,.1)"  : "rgba(232,131,42,.1)";
                const badgeColor= doc.estado_documento === 2 ? "#5a9e6f"              : doc.estado_documento === 3 ? "#d4451a"             : "#e8832a";
                const badgeBorder=doc.estado_documento === 2 ? "rgba(90,158,111,.3)"  : doc.estado_documento === 3 ? "rgba(212,69,26,.3)"  : "rgba(232,131,42,.3)";

                return (
                  <div key={ck} className="pg-doc">
                    <button className="pg-doc-btn" onClick={() => setAbierto(isOpen ? null : ck)}>
                      <div className="pg-doc-btn-left">
                        <div className="pg-doc-icon" style={{ background: iconBg }}>
                          <svg fill="none" viewBox="0 0 24 24" stroke={iconColor}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <div className="pg-doc-numrow">
                            <span className="pg-doc-num">{doc.numero_documento}</span>
                            {estadoInfo && (
                              <span className="pg-badge" style={{ background: badgeBg, color: badgeColor, borderColor: badgeBorder }}>
                                {estadoInfo.label}
                              </span>
                            )}
                          </div>
                          <div className="pg-doc-meta">
                            Reserva #{reserva.id_reserva} · {doc.tipo_nombre || "Documento"} · {fmtDate(doc.fecha_emision, { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                          {doc.descripcion && <div className="pg-doc-desc">{doc.descripcion}</div>}
                        </div>
                      </div>
                      <div className="pg-doc-right">
                        <div className="pg-doc-total">{fmtMoney(doc.monto_total)}</div>
                        {saldo > 0 && <div className="pg-doc-saldo">Saldo: {fmtMoney(saldo)}</div>}
                        <svg className={`pg-chevron ${isOpen ? "open" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="pg-detalle">
                        {/* Barra progreso */}
                        <div>
                          <div className="pg-prog-labels">
                            <span>Pagado: {fmtMoney(doc.monto_pagado)}</span>
                            <span>Total: {fmtMoney(doc.monto_total)}</span>
                          </div>
                          <div className="pg-prog-track">
                            <div className="pg-prog-fill" style={{ width: `${pct}%` }} />
                          </div>
                        </div>

                        {/* Pagos */}
                        <div>
                          <div className="pg-pagos-label">Pagos registrados ({pagos.length})</div>
                          {pagos.length === 0 ? (
                            <p className="pg-no-pagos">Sin pagos registrados aún</p>
                          ) : (
                            pagos.map(p => (
                              <div key={p.id_pago} className="pg-pago-row" style={{ marginBottom: ".5rem" }}>
                                <div>
                                  <div className="pg-pago-amount">{fmtMoney(p.monto_pagado)}</div>
                                  <div className="pg-pago-meta">
                                    {fmtDate(p.fecha_pago, { day: "numeric", month: "short", year: "numeric" })}
                                    {" · "}{METODO_PAGO[p.metodo] ?? `Método ${p.metodo}`}
                                    {p.numero_operacion && ` · Op. ${p.numero_operacion}`}
                                  </div>
                                </div>
                                <div className="pg-pago-dot" style={{
                                  background: p.estado_pago === 2 ? "#5a9e6f" : p.estado_pago === 3 ? "#d4451a" : "#c9a96e"
                                }} />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </>
  );
}