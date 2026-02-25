"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getUser, apiFetch, type Reserva,
  ESTADO_RESERVA, fmtDate, fmtMoney, calcNochces,
} from "@/lib/portal";

const FILTROS = [
  { value: null,         label: "Todas"       },
  { value: "Pendiente",  label: "Pendientes"  },
  { value: "Confirmada", label: "Confirmadas" },
  { value: "Completada", label: "Completadas" },
  { value: "Cancelada",  label: "Canceladas"  },
] as { value: string | null; label: string }[];

// Color por estado para las tarjetas
const CARD_ACCENT: Record<string, { border: string; iconBg: string; iconColor: string }> = {
  Pendiente:  { border: "rgba(201,169,110,.3)",   iconBg: "rgba(201,169,110,.12)", iconColor: "#c9a96e" },
  Confirmada: { border: "rgba(90,158,111,.25)",    iconBg: "rgba(90,158,111,.1)",  iconColor: "#5a9e6f" },
  Completada: { border: "rgba(100,140,200,.25)",   iconBg: "rgba(100,140,200,.1)", iconColor: "#6490c8" },
  Cancelada:  { border: "rgba(212,69,26,.2)",      iconBg: "rgba(212,69,26,.08)", iconColor: "#d4451a" },
};

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filtro,   setFiltro]   = useState<string | null>(null);

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        .rv-page { font-family:'Montserrat',sans-serif; display:flex; flex-direction:column; gap:1.5rem; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* HEADER */
        .rv-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
        .rv-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#1a1a14; line-height:1; }
        .rv-title em { font-style:italic; color:#c9a96e; }
        .rv-sub { font-size:.7rem; font-weight:500; letter-spacing:.14em; text-transform:uppercase; color:#7a6e5f; margin-top:.35rem; }
        .rv-nueva-btn {
          display:inline-flex; align-items:center; gap:.5rem;
          position:relative; overflow:hidden;
          background:linear-gradient(135deg,#e8832a,#d4451a); color:white; text-decoration:none;
          font-family:'Montserrat',sans-serif; font-size:.66rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase;
          padding:.65rem 1.4rem; border-radius:50px;
          box-shadow:0 5px 18px rgba(232,131,42,.4);
          transition:all .25s cubic-bezier(.22,1,.36,1);
        }
        .rv-nueva-btn::after { content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);transition:left .4s ease; }
        .rv-nueva-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(232,131,42,.5); }
        .rv-nueva-btn:hover::after { left:140%; }
        .rv-nueva-btn svg { width:13px; height:13px; }

        /* FILTROS */
        .rv-filtros { display:flex; gap:.5rem; flex-wrap:wrap; animation:fadeUp .55s .04s cubic-bezier(.22,1,.36,1) both; }
        .rv-filtro {
          padding:.38rem 1rem; border-radius:50px;
          border:1.5px solid rgba(201,169,110,.22);
          background:transparent; cursor:pointer;
          font-family:'Montserrat',sans-serif; font-size:.63rem; font-weight:600;
          letter-spacing:.14em; text-transform:uppercase; color:#7a6e5f;
          transition:all .22s cubic-bezier(.22,1,.36,1);
        }
        .rv-filtro:hover { color:#4a4035; background:rgba(201,169,110,.08); }
        .rv-filtro.active { background:linear-gradient(135deg,#e8832a,#d4451a); color:white; border-color:transparent; box-shadow:0 3px 12px rgba(232,131,42,.35); }
        .rv-filtro-count { margin-left:.4rem; opacity:.65; font-weight:400; }

        /* LOADING */
        .rv-loading { padding:5rem; display:flex; justify-content:center; }
        .rv-spin { width:22px;height:22px;border-radius:50%;border:2px solid rgba(201,169,110,.2);border-top-color:#e8832a;animation:spin .7s linear infinite; }

        /* EMPTY */
        .rv-empty { background:#f5efe6; border:1px solid rgba(201,169,110,.2); border-radius:22px; padding:4rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .rv-empty-icon { width:56px;height:56px;border-radius:50%;background:rgba(201,169,110,.1);border:1px solid rgba(201,169,110,.2);display:flex;align-items:center;justify-content:center; }
        .rv-empty-icon svg { width:24px;height:24px;color:#c9a96e; }
        .rv-empty-title { font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:600;color:#1a1a14; }
        .rv-empty-sub { font-size:.72rem;color:#7a6e5f; }
        .rv-empty-btn {
          display:inline-flex; align-items:center; gap:.5rem;
          background:linear-gradient(135deg,#e8832a,#d4451a); color:white; text-decoration:none;
          font-family:'Montserrat',sans-serif; font-size:.64rem; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
          padding:.65rem 1.35rem; border-radius:50px;
          box-shadow:0 4px 14px rgba(232,131,42,.35);
          transition:all .22s cubic-bezier(.22,1,.36,1);
        }
        .rv-empty-btn:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(232,131,42,.45); }

        /* CARDS */
        .rv-lista { display:flex; flex-direction:column; gap:.85rem; animation:fadeUp .6s .06s cubic-bezier(.22,1,.36,1) both; }
        .rv-card { background:#f5efe6; border-radius:20px; overflow:hidden; border:1px solid; transition:transform .22s cubic-bezier(.22,1,.36,1), box-shadow .22s; }
        .rv-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(74,64,53,.1); }
        .rv-card-inner { padding:1.25rem 1.5rem; display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .rv-card-left { display:flex; align-items:flex-start; gap:1rem; }
        .rv-card-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .rv-card-icon svg { width:20px; height:20px; }
        .rv-card-numrow { display:flex; align-items:center; gap:.6rem; flex-wrap:wrap; margin-bottom:.3rem; }
        .rv-card-num { font-size:.85rem; font-weight:700; color:#1a1a14; }
        .rv-badge { display:inline-flex; align-items:center; padding:.22rem .65rem; border-radius:50px; font-size:.58rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; border:1px solid; }
        .rv-card-dates { font-size:.72rem; color:#7a6e5f; margin-bottom:.4rem; }
        .rv-card-meta { display:flex; align-items:center; gap:.4rem; font-size:.65rem; color:#b8a898; flex-wrap:wrap; }
        .rv-card-meta-dot { width:3px; height:3px; border-radius:50%; background:#ddd5c4; flex-shrink:0; }
        .rv-card-right { text-align:right; flex-shrink:0; }
        .rv-card-price { font-family:'Cormorant Garamond',serif; font-size:1.35rem; font-weight:600; color:#1a1a14; }
        .rv-card-price-label { font-size:.6rem; color:#b8a898; letter-spacing:.08em; }
      `}</style>

      <div className="rv-page">

        {/* Header */}
        <div className="rv-header">
          <div>
            <div className="rv-title">Mis <em>Reservas</em></div>
            <div className="rv-sub">{reservas.length} en total</div>
          </div>
          <Link href="/portal/reservas/nueva" className="rv-nueva-btn">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Nueva reserva
          </Link>
        </div>

        {/* Filtros */}
        <div className="rv-filtros">
          {FILTROS.map(f => (
            <button
              key={String(f.value)}
              className={`rv-filtro ${filtro === f.value ? "active" : ""}`}
              onClick={() => setFiltro(f.value)}
            >
              {f.label}
              {f.value !== null && (
                <span className="rv-filtro-count">
                  {reservas.filter(r => r.estado === f.value).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className="rv-loading"><div className="rv-spin" /></div>
        ) : lista.length === 0 ? (
          <div className="rv-empty">
            <div className="rv-empty-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="rv-empty-title">Sin reservas{filtro ? ` "${filtro}"` : ""}</div>
            <div className="rv-empty-sub">Haz tu primera reserva en Hostal Las Mercedes</div>
            <Link href="/portal/reservas/nueva" className="rv-empty-btn">Reservar ahora</Link>
          </div>
        ) : (
          <div className="rv-lista">
            {lista.map(r => {
              const noches = calcNochces(r.fecha_entrada, r.fecha_salida);
              const badge  = ESTADO_RESERVA[r.estado];
              const accent = CARD_ACCENT[r.estado] ?? CARD_ACCENT["Pendiente"];

              const badgeBg    = r.estado === "Confirmada" ? "rgba(90,158,111,.1)"  : r.estado === "Completada" ? "rgba(100,140,200,.1)" : r.estado === "Cancelada" ? "rgba(212,69,26,.08)" : "rgba(201,169,110,.1)";
              const badgeColor = r.estado === "Confirmada" ? "#5a9e6f"              : r.estado === "Completada" ? "#6490c8"              : r.estado === "Cancelada" ? "#d4451a"             : "#c9a96e";
              const badgeBrd   = r.estado === "Confirmada" ? "rgba(90,158,111,.3)"  : r.estado === "Completada" ? "rgba(100,140,200,.3)" : r.estado === "Cancelada" ? "rgba(212,69,26,.25)": "rgba(201,169,110,.3)";

              return (
                <div key={r.id_reserva} className="rv-card" style={{ borderColor: accent.border }}>
                  <div className="rv-card-inner">
                    <div className="rv-card-left">
                      <div className="rv-card-icon" style={{ background: accent.iconBg }}>
                        <svg fill="none" viewBox="0 0 24 24" stroke={accent.iconColor}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </div>
                      <div>
                        <div className="rv-card-numrow">
                          <span className="rv-card-num">Reserva #{r.id_reserva}</span>
                          {badge ? (
                            <span className="rv-badge" style={{ background: badgeBg, color: badgeColor, borderColor: badgeBrd }}>{badge.label}</span>
                          ) : (
                            <span className="rv-badge" style={{ background: "rgba(201,169,110,.1)", color: "#7a6e5f", borderColor: "rgba(201,169,110,.25)" }}>{r.estado}</span>
                          )}
                        </div>
                        <div className="rv-card-dates">
                          {fmtDate(r.fecha_entrada, { day: "numeric", month: "long", year: "numeric" })}
                          {" → "}
                          {fmtDate(r.fecha_salida, { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                        <div className="rv-card-meta">
                          <span>{noches} noche{noches !== 1 ? "s" : ""}</span>
                          <div className="rv-card-meta-dot" />
                          <span>{r.num_personas} persona{r.num_personas !== 1 ? "s" : ""}</span>
                          <div className="rv-card-meta-dot" />
                          <span>{fmtMoney(Number(r.monto_total) / noches || 0)}/noche</span>
                          {r.habitacion && (
                            <><div className="rv-card-meta-dot" /><span>{r.habitacion}</span></>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="rv-card-right">
                      <div className="rv-card-price">{fmtMoney(r.monto_total)}</div>
                      <div className="rv-card-price-label">total</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}