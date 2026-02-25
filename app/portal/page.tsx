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

  const proxima   = reservas.find(r => r.estado === "Confirmada" || r.estado === "Pendiente");
  const recientes = reservas.slice(0, 3);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');

        :root {
          --orange:     #e8832a;
          --red:        #d4451a;
          --gold:       #c9a96e;
          --ivory:      #f5efe6;
          --bg:         #f0e9df;
          --gray:       #7a6e5f;
          --brown:      #4a4035;
          --beige:      #b8a898;
          --black:      #1a1a14;
        }

        /* ── Animación de entrada (spec) ── */
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes ringPulse {
          0%,100%{ transform: scale(1); opacity: 1; }
          60%    { transform: scale(2); opacity: 0; }
        }

        /* ══════════════════
           STACK ROOT
        ══════════════════ */
        .pd-stack {
          display: flex; flex-direction: column; gap: 1.25rem;
          font-family: 'Montserrat', sans-serif;
        }

        /* ══════════════════
           BANNER (card spec: radius 24, fondo oscuro, no #fff)
        ══════════════════ */
        .pd-banner {
          position: relative; overflow: hidden;
          background: var(--black);
          border: 1px solid rgba(201,169,110,0.2);
          border-radius: 24px;
          padding: 2.25rem 2.5rem 2rem;
          animation: cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        /* Blob decorativo (esquina inferior derecha, spec) */
        .pd-banner-blob {
          position: absolute;
          bottom: -40px; right: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,131,42,0.18) 0%, transparent 65%);
          pointer-events: none;
        }
        .pd-banner-blob2 {
          position: absolute;
          top: -60px; right: 40px;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,169,110,0.1) 0%, transparent 65%);
          pointer-events: none;
        }
        /* Letra M decorativa */
        .pd-banner-m {
          position: absolute;
          right: 2rem; top: 50%; transform: translateY(-50%);
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-weight: 300;
          font-size: 9rem; line-height: 1;
          color: rgba(201,169,110,0.07);
          user-select: none; pointer-events: none;
          letter-spacing: -0.05em;
        }
        .pd-banner-inner { position: relative; z-index: 1; }
        .pd-eyebrow {
          font-size: 0.58rem; font-weight: 700;
          letter-spacing: 0.28em; text-transform: uppercase;
          color: rgba(201,169,110,0.6); margin-bottom: 0.35rem;
        }
        .pd-banner-skel {
          height: 2.2rem; width: 13rem;
          background: rgba(245,239,230,0.07);
          border-radius: 8px; margin-bottom: 0.4rem;
          animation: pulse 1.4s ease-in-out infinite;
        }
        .pd-banner-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.3rem; font-weight: 600;
          color: var(--ivory); line-height: 1.1; margin-bottom: 0.25rem;
        }
        .pd-banner-title em { font-style: italic; color: var(--gold); }
        .pd-banner-sub {
          font-size: 0.65rem; font-weight: 400;
          color: rgba(245,239,230,0.35); letter-spacing: 0.12em;
          margin-bottom: 1.5rem;
        }

        /* Botón principal (spec exacto) */
        .pd-btn-primary {
          display: inline-flex; align-items: center; gap: 0.5rem;
          position: relative; overflow: hidden;
          background: linear-gradient(135deg, var(--orange) 0%, var(--red) 100%);
          color: white; text-decoration: none;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          padding: 0.72rem 1.6rem;
          border-radius: 50px;
          box-shadow: 0 6px 20px rgba(232,131,42,0.45);
          transition: all 0.28s cubic-bezier(0.22,1,0.36,1);
          border: none; cursor: pointer;
        }
        .pd-btn-primary::after {
          content: '';
          position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.45s ease;
        }
        .pd-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(232,131,42,0.55);
        }
        .pd-btn-primary:hover::after { left: 140%; }
        .pd-btn-primary:active { transform: scale(0.98); }
        .pd-btn-primary svg { width: 14px; height: 14px; }

        /* ══════════════════
           ESTADÍA ACTIVA
        ══════════════════ */
        .pd-activa {
          background: #fff;
          border: 1px solid rgba(90,158,111,0.25);
          border-radius: 24px;
          padding: 1.25rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          gap: 1rem; flex-wrap: wrap;
          position: relative; overflow: hidden;
          animation: cardIn 0.62s 0.05s cubic-bezier(0.22,1,0.36,1) both;
        }
        /* blob verde (acento de la card) */
        .pd-activa::after {
          content: '';
          position: absolute; bottom: -30px; right: -30px;
          width: 120px; height: 120px; border-radius: 50%;
          background: radial-gradient(circle, rgba(90,158,111,0.12) 0%, transparent 65%);
          pointer-events: none;
        }
        .pd-activa-left { display: flex; align-items: center; gap: 0.85rem; }
        .pd-activa-dot-wrap { position: relative; flex-shrink: 0; width: 10px; height: 10px; }
        .pd-activa-dot {
          width: 10px; height: 10px; border-radius: 50%; background: #5a9e6f;
          position: relative;
        }
        .pd-activa-dot::after {
          content: '';
          position: absolute; inset: -4px; border-radius: 50%;
          background: rgba(90,158,111,0.25);
          animation: ringPulse 2s ease-in-out infinite;
        }
        .pd-activa-tag {
          font-size: 0.59rem; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase;
          color: #5a9e6f; margin-bottom: 2px;
        }
        .pd-activa-title { font-size: 0.85rem; font-weight: 600; color: var(--black); }
        .pd-activa-date  { font-size: 0.7rem; color: var(--gray); margin-top: 1px; }
        .pd-activa-link {
          display: flex; align-items: center; gap: 4px;
          font-size: 0.66rem; font-weight: 700;
          letter-spacing: 0.14em; text-transform: uppercase;
          color: #5a9e6f; text-decoration: none;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          position: relative; z-index: 1;
        }
        .pd-activa-link:hover { gap: 8px; }
        .pd-activa-link svg { width: 13px; height: 13px; }

        /* ══════════════════
           STATS GRID
           Cards con blob decorativo + hover (spec)
        ══════════════════ */
        .pd-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.9rem;
        }
        @media (min-width: 640px) {
          .pd-stats { grid-template-columns: repeat(4, 1fr); }
        }

        /* card base (spec: radius 24, fondo #fff, borde rgba(201,169,110,0.15)) */
        .pd-stat {
          --accent: #e8832a;
          --accent-bg: rgba(232,131,42,0.1);
          --grad: linear-gradient(135deg, #e8832a, #d4451a);

          background: #fff;
          border: 1px solid rgba(201,169,110,0.15);
          border-radius: 24px;
          padding: 1.15rem 1.2rem 1rem;
          position: relative; overflow: hidden;
          /* animación escalonada (spec) */
          animation: cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                      border-color 0.3s,
                      box-shadow 0.3s;
        }
        /* Blob decorativo esquina inferior derecha (spec) */
        .pd-stat::after {
          content: '';
          position: absolute; bottom: -24px; right: -24px;
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--grad);
          opacity: 0.08;
          pointer-events: none;
          transition: opacity 0.3s;
        }
        /* Hover (spec: translateY(-7px) scale(1.012) + borde acento + sombra multicapa) */
        .pd-stat:hover {
          transform: translateY(-7px) scale(1.012);
          border-color: var(--accent);
          box-shadow:
            0 8px 24px rgba(0,0,0,0.06),
            0 2px 8px rgba(0,0,0,0.04),
            0 0 0 1px var(--accent);
        }
        .pd-stat:hover::after { opacity: 0.14; }

        .pd-stat:nth-child(1) { animation-delay: 0s;    --accent: #e8832a; --accent-bg: rgba(232,131,42,0.1); --grad: linear-gradient(135deg,#e8832a,#d4451a); }
        .pd-stat:nth-child(2) { animation-delay: 0.05s; --accent: #5a9e6f; --accent-bg: rgba(90,158,111,0.1); --grad: linear-gradient(135deg,#5a9e6f,#3d7a52); }
        .pd-stat:nth-child(3) { animation-delay: 0.10s; --accent: #6490c8; --accent-bg: rgba(100,144,200,0.1); --grad: linear-gradient(135deg,#6490c8,#3a6aab); }
        .pd-stat:nth-child(4) { animation-delay: 0.15s; --accent: #c9a96e; --accent-bg: rgba(201,169,110,0.12); --grad: linear-gradient(135deg,#c9a96e,#a07c3e); }

        .pd-stat-top {
          display: flex; align-items: center; gap: 0.55rem; margin-bottom: 0.7rem;
        }
        .pd-stat-icon-wrap {
          width: 30px; height: 30px; border-radius: 9px; flex-shrink: 0;
          background: var(--accent-bg);
          display: flex; align-items: center; justify-content: center;
        }
        .pd-stat-icon-wrap svg { width: 14px; height: 14px; color: var(--accent); }
        .pd-stat-label {
          font-size: 0.59rem; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--gray);
        }
        .pd-stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem; font-weight: 600;
          color: var(--black); line-height: 1;
          position: relative; z-index: 1;
        }
        .pd-stat-value-sm {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.4rem; font-weight: 600;
          color: var(--black); line-height: 1;
          position: relative; z-index: 1;
        }
        .pd-stat-skel {
          height: 1.8rem; width: 2.5rem;
          background: rgba(201,169,110,0.12); border-radius: 6px;
          animation: pulse 1.4s ease-in-out infinite;
        }

        /* ══════════════════
           CARD GENÉRICA
        ══════════════════ */
        .pd-card {
          background: #fff;
          border: 1px solid rgba(201,169,110,0.15);
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          animation: cardIn 0.65s 0.08s cubic-bezier(0.22,1,0.36,1) both;
        }
        /* blob decorativo dorado */
        .pd-card::after {
          content: '';
          position: absolute; bottom: -30px; right: -30px;
          width: 130px; height: 130px; border-radius: 50%;
          background: radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 65%);
          pointer-events: none;
        }
        .pd-card-head {
          padding: 1.1rem 1.5rem;
          border-bottom: 1px solid rgba(201,169,110,0.13);
          display: flex; align-items: center; justify-content: space-between;
          position: relative; z-index: 1;
        }
        .pd-card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem; font-weight: 600;
          color: var(--black); letter-spacing: 0.01em;
        }
        .pd-card-action {
          font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: var(--orange); text-decoration: none;
          transition: color 0.2s;
        }
        .pd-card-action:hover { color: var(--red); }

        /* Ornamento spec */
        .pd-orn {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0 1.5rem;
        }
        .pd-orn-line { flex: 1; height: 1px; background: var(--gold); opacity: 0.35; }
        .pd-orn-diamond {
          width: 7px; height: 7px;
          border: 1px solid var(--gold);
          transform: rotate(45deg); opacity: 0.7;
        }

        /* ══════════════════
           PRÓXIMA ESTADÍA
        ══════════════════ */
        .pd-proxima-body { padding: 1.25rem 1.5rem; position: relative; z-index: 1; }
        .pd-proxima-date {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.3rem; font-weight: 600;
          color: var(--black); text-transform: capitalize;
          margin-bottom: 0.3rem;
        }
        .pd-proxima-meta { font-size: 0.72rem; color: var(--gray); margin-bottom: 1rem; }
        .pd-proxima-row {
          display: flex; align-items: center; justify-content: space-between;
          gap: 1rem; flex-wrap: wrap;
        }
        .pd-proxima-price {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem; font-weight: 600; color: var(--black);
        }

        /* Badge estado */
        .pd-badge {
          display: inline-flex; align-items: center;
          padding: 0.22rem 0.7rem; border-radius: 50px;
          font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.12em; text-transform: uppercase;
          border: 1px solid;
        }

        /* ══════════════════
           RESERVAS LISTA
        ══════════════════ */
        .pd-reserva {
          padding: 1rem 1.5rem;
          display: flex; align-items: center; justify-content: space-between;
          gap: 1rem;
          border-bottom: 1px solid rgba(201,169,110,0.1);
          position: relative; z-index: 1;
          transition: background 0.2s;
        }
        .pd-reserva:last-child { border-bottom: none; }
        .pd-reserva:hover { background: rgba(201,169,110,0.04); }
        .pd-reserva-id {
          font-size: 0.78rem; font-weight: 600; color: var(--black); margin-bottom: 2px;
        }
        .pd-reserva-dates { font-size: 0.67rem; color: var(--gray); }
        .pd-reserva-right {
          display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0;
        }
        .pd-reserva-monto {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.05rem; font-weight: 600; color: var(--black);
        }

        /* Empty state */
        .pd-empty {
          padding: 3rem 1.5rem;
          display: flex; flex-direction: column; align-items: center;
          gap: 0.85rem; text-align: center; position: relative; z-index: 1;
        }
        .pd-empty-icon {
          width: 52px; height: 52px; border-radius: 50%;
          background: rgba(201,169,110,0.1);
          border: 1px solid rgba(201,169,110,0.2);
          display: flex; align-items: center; justify-content: center;
        }
        .pd-empty-icon svg { width: 22px; height: 22px; color: var(--gold); }
        .pd-empty-txt { font-size: 0.76rem; color: var(--gray); }

        /* Spinner */
        .pd-spinner {
          display: flex; justify-content: center; padding: 2.5rem;
        }
        .pd-spin {
          width: 22px; height: 22px; border-radius: 50%;
          border: 2px solid rgba(201,169,110,0.2);
          border-top-color: var(--orange);
          animation: spin 0.7s linear infinite;
        }

        /* ══════════════════
           ACCESOS RÁPIDOS
           Cards con blob y hover (spec completo)
        ══════════════════ */
        .pd-accesos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.9rem;
          animation: cardIn 0.65s 0.15s cubic-bezier(0.22,1,0.36,1) both;
        }
        @media (min-width: 640px) {
          .pd-accesos { grid-template-columns: repeat(4, 1fr); }
        }

        .pd-acceso {
          --accent:    #e8832a;
          --accent-bg: rgba(232,131,42,0.1);
          --grad:      linear-gradient(135deg,#e8832a,#d4451a);

          background: #fff;
          border: 1px solid rgba(201,169,110,0.15);
          border-radius: 24px;
          padding: 1.25rem 0.75rem 1.1rem;
          display: flex; flex-direction: column; align-items: center;
          gap: 0.7rem;
          text-decoration: none; text-align: center;
          position: relative; overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                      border-color 0.3s,
                      box-shadow 0.3s;
          animation: cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
        }
        /* blob (spec) */
        .pd-acceso::after {
          content: '';
          position: absolute; bottom: -20px; right: -20px;
          width: 80px; height: 80px; border-radius: 50%;
          background: var(--grad); opacity: 0.07;
          pointer-events: none; transition: opacity 0.3s;
        }
        /* hover (spec) */
        .pd-acceso:hover {
          transform: translateY(-7px) scale(1.012);
          border-color: var(--accent);
          box-shadow:
            0 8px 24px rgba(0,0,0,0.07),
            0 2px 6px rgba(0,0,0,0.04),
            0 0 0 1px var(--accent);
        }
        .pd-acceso:hover::after { opacity: 0.13; }
        .pd-acceso:active { transform: scale(0.98); }

        .pd-acceso:nth-child(1) { animation-delay:0.00s; --accent:#e8832a; --accent-bg:rgba(232,131,42,0.1); --grad:linear-gradient(135deg,#e8832a,#d4451a); }
        .pd-acceso:nth-child(2) { animation-delay:0.05s; --accent:#5a9e6f; --accent-bg:rgba(90,158,111,0.1); --grad:linear-gradient(135deg,#5a9e6f,#3d7a52); }
        .pd-acceso:nth-child(3) { animation-delay:0.10s; --accent:#6490c8; --accent-bg:rgba(100,144,200,0.1); --grad:linear-gradient(135deg,#6490c8,#3a6aab); }
        .pd-acceso:nth-child(4) { animation-delay:0.15s; --accent:#c9a96e; --accent-bg:rgba(201,169,110,0.12); --grad:linear-gradient(135deg,#c9a96e,#a07c3e); }

        .pd-acceso-icon {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent-bg);
          display: flex; align-items: center; justify-content: center;
          transition: background 0.3s;
        }
        .pd-acceso:hover .pd-acceso-icon { background: var(--accent-bg); }
        .pd-acceso-icon svg { width: 18px; height: 18px; color: var(--accent); }
        .pd-acceso-label {
          font-size: 0.65rem; font-weight: 600;
          letter-spacing: 0.06em;
          color: var(--brown);
          position: relative; z-index: 1;
          transition: color 0.25s;
        }
        .pd-acceso:hover .pd-acceso-label { color: var(--accent); }
      `}</style>

      <div className="pd-stack">

        {/* ══ BANNER ══ */}
        <div className="pd-banner">
          <div className="pd-banner-blob" />
          <div className="pd-banner-blob2" />
          <div className="pd-banner-m">M</div>
          <div className="pd-banner-inner">
            <div className="pd-eyebrow">Portal del Huésped · Hostal Las Mercedes</div>
            {loading ? (
              <div className="pd-banner-skel" />
            ) : (
              <div className="pd-banner-title">
                Bienvenido, <em>{huesped ? `${huesped.nombres} ${huesped.apellidos}` : "—"}</em>
              </div>
            )}
            <div className="pd-banner-sub">Trujillo, La Libertad — Perú</div>
            <Link href="/portal/reservas/nueva" className="pd-btn-primary">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nueva reserva
            </Link>
          </div>
        </div>

        {/* ══ ESTADÍA ACTIVA ══ */}
        {activa && (
          <div className="pd-activa">
            <div className="pd-activa-left">
              <div className="pd-activa-dot-wrap">
                <div className="pd-activa-dot" />
              </div>
              <div>
                <div className="pd-activa-tag">Estadía activa ahora</div>
                <div className="pd-activa-title">Check-in realizado</div>
                {activa.fecha_checkin && (
                  <div className="pd-activa-date">Desde: {fmtDate(activa.fecha_checkin)}</div>
                )}
              </div>
            </div>
            <Link href="/portal/hospedaje" className="pd-activa-link">
              Ver detalle
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}

        {/* ══ STATS — cards con blob + hover ══ */}
        <div className="pd-stats">
          {[
            { label: "Reservas",   icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
              value: loading ? null : String(reservas.length) },
            { label: "Confirmadas", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
              value: loading ? null : String(reservas.filter(r => r.estado === "Confirmada").length) },
            { label: "Completadas", icon: "M5 13l4 4L19 7",
              value: loading ? null : String(reservas.filter(r => r.estado === "Completada").length) },
            { label: "Total gastado", icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
              value: loading ? null : fmtMoney(reservas.reduce((s, r) => s + Number(r.monto_total), 0)), small: true },
          ].map((s, i) => (
            <div key={i} className="pd-stat">
              <div className="pd-stat-top">
                <div className="pd-stat-icon-wrap">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={s.icon} />
                  </svg>
                </div>
                <span className="pd-stat-label">{s.label}</span>
              </div>
              {s.value === null
                ? <div className="pd-stat-skel" />
                : s.small
                  ? <div className="pd-stat-value-sm">{s.value}</div>
                  : <div className="pd-stat-value">{s.value}</div>
              }
            </div>
          ))}
        </div>

        {/* ══ PRÓXIMA ESTADÍA ══ */}
        {!loading && proxima && (
          <div className="pd-card">
            <div className="pd-card-head">
              <span className="pd-card-title">Próxima estadía</span>
              <span className={`pd-badge ${ESTADO_RESERVA[proxima.estado]?.color}`}>
                {ESTADO_RESERVA[proxima.estado]?.label}
              </span>
            </div>
            <div className="pd-proxima-body">
              <div className="pd-proxima-date">
                {fmtDate(proxima.fecha_entrada, { weekday: "long", day: "numeric", month: "long" })}
              </div>
              <div className="pd-proxima-meta">
                Hasta {fmtDate(proxima.fecha_salida, { day: "numeric", month: "long" })}
                {" · "}{calcNochces(proxima.fecha_entrada, proxima.fecha_salida)} noches
                {" · "}{proxima.num_personas} persona{proxima.num_personas !== 1 ? "s" : ""}
              </div>
              <div className="pd-proxima-row">
                <div className="pd-orn" style={{ padding: 0, flex: 1 }}>
                  <div className="pd-orn-line" />
                  <div className="pd-orn-diamond" />
                  <div className="pd-orn-line" />
                </div>
                <span className="pd-proxima-price">{fmtMoney(proxima.monto_total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* ══ RESERVAS RECIENTES ══ */}
        <div className="pd-card">
          <div className="pd-card-head">
            <span className="pd-card-title">Reservas recientes</span>
            <Link href="/portal/reservas" className="pd-card-action">Ver todas →</Link>
          </div>

          {loading ? (
            <div className="pd-spinner"><div className="pd-spin" /></div>
          ) : recientes.length === 0 ? (
            <div className="pd-empty">
              <div className="pd-empty-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="pd-empty-txt">Aún no tienes reservas registradas</p>
              <Link href="/portal/reservas/nueva" className="pd-btn-primary" style={{ marginTop: "0.25rem" }}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Hacer primera reserva
              </Link>
            </div>
          ) : (
            <>
              {recientes.map(r => (
                <div key={r.id_reserva} className="pd-reserva">
                  <div>
                    <div className="pd-reserva-id">Reserva #{r.id_reserva}</div>
                    <div className="pd-reserva-dates">
                      {fmtDate(r.fecha_entrada, { day: "numeric", month: "short" })}
                      {" → "}
                      {fmtDate(r.fecha_salida, { day: "numeric", month: "short", year: "numeric" })}
                    </div>
                  </div>
                  <div className="pd-reserva-right">
                    <span className="pd-reserva-monto">{fmtMoney(r.monto_total)}</span>
                    <span className={`pd-badge ${ESTADO_RESERVA[r.estado]?.color}`}>
                      {ESTADO_RESERVA[r.estado]?.label ?? r.estado}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ══ ACCESOS RÁPIDOS — cards con blob + hover (spec) ══ */}
        <div className="pd-accesos">
          {[
            { href: "/portal/reservas/nueva", label: "Nueva reserva",
              icon: "M12 4v16m8-8H4" },
            { href: "/portal/hospedaje",      label: "Mi estadía",
              icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
            { href: "/portal/pagos",          label: "Mis pagos",
              icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
            { href: "/portal/encuestas",      label: "Encuestas",
              icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
          ].map(item => (
            <Link key={item.href} href={item.href} className="pd-acceso">
              <div className="pd-acceso-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                </svg>
              </div>
              <span className="pd-acceso-label">{item.label}</span>
            </Link>
          ))}
        </div>

      </div>
    </>
  );
}