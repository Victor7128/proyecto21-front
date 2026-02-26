"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Tipos ────────────────────────────────────────────────────────────────────
interface Usuario {
  id_personal: number;
  nombre: string;
  email: string | null;
  rol: string;
  activo: boolean;
}

type Reserva = {
  id_reserva: number;
  id_huesped: number;
  nombres?: string;
  apellidos?: string;
  id_habitacion: number;
  habitacion?: string;
  fecha_entrada: string;
  fecha_salida: string;
  num_personas: number;
  monto_total: number;
  estado: number | string;
};

type Encuesta = {
  id_encuesta: number;
  id_orden_hospedaje: number;
  nombres?: string;
  apellidos?: string;
  recomendacion: boolean;
  lugar_origen?: string;
  motivo_viaje?: string;
  calificacion_limpieza: number;
  calificacion_servicio: number;
  calificacion_ubicacion: number;
  calificacion_precio: number;
  comentarios?: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────
async function dashFetch<T>(path: string): Promise<T> {
  const res = await fetch(`/api${path}`, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function fmtFecha(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "2-digit" });
}

function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 0 }).format(n ?? 0);
}

function avgCalif(e: Encuesta) {
  return (e.calificacion_limpieza + e.calificacion_servicio + e.calificacion_ubicacion + e.calificacion_precio) / 4;
}

function StarBar({ val, max = 5 }: { val: number; max?: number }) {
  const pct = Math.min((val / max) * 100, 100);
  const color = val >= 4.5 ? "#5a9e6f" : val >= 3.5 ? "#7aab8a" : val >= 2.5 ? "#c9a96e" : val >= 1.5 ? "#e8832a" : "#d4451a";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".5rem", flex: 1 }}>
      <div style={{ flex: 1, height: 5, background: "rgba(201,169,110,.15)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width .6s ease" }} />
      </div>
      <span style={{ fontSize: ".68rem", fontWeight: 700, color, minWidth: 24 }}>{val.toFixed(1)}</span>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [usuario,   setUsuario]   = useState<Usuario | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  const [reservas,  setReservas]  = useState<Reserva[]>([]);
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [loadingR,  setLoadingR]  = useState(true);
  const [loadingE,  setLoadingE]  = useState(true);
  const [encTab,    setEncTab]    = useState<"lista" | "resumen">("lista");

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => { if (!res.ok) throw new Error("No autorizado"); return res.json(); })
      .then(data => setUsuario(data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  // Reservas pendientes (estado=1 → pendiente de confirmación)
  useEffect(() => {
    if (!usuario) return;
    dashFetch<Reserva[]>("/reservas?estado=1")
      .then(d => setReservas(Array.isArray(d) ? d : []))
      .catch(() => setReservas([]))
      .finally(() => setLoadingR(false));
  }, [usuario]);

  // Encuestas más recientes (últimas 30)
  useEffect(() => {
    if (!usuario) return;
    dashFetch<Encuesta[]>("/encuestas")
      .then(d => setEncuestas(Array.isArray(d) ? d.slice(0, 30) : []))
      .catch(() => setEncuestas([]))
      .finally(() => setLoadingE(false));
  }, [usuario]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  // Promedios para la vista resumen
  const totales = encuestas.length > 0 ? {
    limpieza:     encuestas.reduce((s, e) => s + e.calificacion_limpieza,  0) / encuestas.length,
    servicio:     encuestas.reduce((s, e) => s + e.calificacion_servicio,  0) / encuestas.length,
    ubicacion:    encuestas.reduce((s, e) => s + e.calificacion_ubicacion, 0) / encuestas.length,
    precio:       encuestas.reduce((s, e) => s + e.calificacion_precio,    0) / encuestas.length,
    recomiendan:  encuestas.filter(e => e.recomendacion).length,
    general:      encuestas.reduce((s, e) => s + avgCalif(e), 0) / encuestas.length,
  } : null;

  const cards = [
    { label: "Reservas",     icon: "🗓️", href: "/dashboard/reservas",     accent: "#e8832a", grad: "linear-gradient(135deg,#e8832a,#d4451a)", desc: "Gestiona las reservas activas" },
    { label: "Habitaciones", icon: "🛏️", href: "/dashboard/habitaciones", accent: "#2a7ae8", grad: "linear-gradient(135deg,#2a7ae8,#1a4fd4)", desc: "Estado y disponibilidad" },
    { label: "Huéspedes",    icon: "👤", href: "/dashboard/huespedes",     accent: "#8b2ae8", grad: "linear-gradient(135deg,#8b2ae8,#5a1ad4)", desc: "Registro de huéspedes" },
    { label: "Pagos",        icon: "💳", href: "/dashboard/pagos",         accent: "#c9a96e", grad: "linear-gradient(135deg,#c9a96e,#a07840)", desc: "Control de facturación" },
    { label: "Personal",     icon: "🧑‍💼", href: "/dashboard/personal",     accent: "#d4451a", grad: "linear-gradient(135deg,#d4451a,#a02810)", desc: "Administración del equipo" },
    { label: "Conserjería",  icon: "🛎️", href: "/dashboard/conserjeria",   accent: "#2ab5a0", grad: "linear-gradient(135deg,#2ab5a0,#1a8070)", desc: "Solicitudes y servicios" },
    { label: "Hospedaje",    icon: "🏨", href: "/dashboard/hospedaje",     accent: "#1a7ad4", grad: "linear-gradient(135deg,#1a7ad4,#0a50a0)", desc: "Control de estadías" },
  ];

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Montserrat:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .loading-root { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f0e9df; font-family:'Montserrat',sans-serif; }
        .loading-spinner { width:40px; height:40px; border:3px solid rgba(201,169,110,0.25); border-top-color:#e8832a; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 1rem; }
        .loading-text { font-size:0.65rem; letter-spacing:0.25em; text-transform:uppercase; color:#7a6e5f; text-align:center; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
      <div className="loading-root">
        <div><div className="loading-spinner" /><p className="loading-text">Cargando...</p></div>
      </div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }

        .dash-root { min-height:100vh; background:#f0e9df; font-family:'Montserrat',sans-serif; }

        /* ── Navbar ── */
        .dash-nav { background:#1a1a14; border-bottom:1px solid rgba(201,169,110,0.25); position:sticky; top:0; z-index:50; }
        .dash-nav-inner { max-width:1280px; margin:0 auto; padding:0 2rem; height:68px; display:flex; align-items:center; justify-content:space-between; }
        .nav-logo { display:flex; align-items:center; gap:0.75rem; text-decoration:none; }
        .nav-logo-icon { width:38px; height:38px; background:linear-gradient(135deg,#e8832a,#d4451a); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 10px rgba(232,131,42,0.4); flex-shrink:0; }
        .nav-logo-icon svg { width:18px; height:18px; fill:#fff; }
        .nav-logo-text { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:#f5efe6; letter-spacing:0.04em; }
        .nav-logo-sub { font-size:0.55rem; letter-spacing:0.2em; text-transform:uppercase; color:#c9a96e; font-weight:500; line-height:1; }
        .nav-right { display:flex; align-items:center; gap:1.25rem; }
        .nav-user-info { text-align:right; }
        .nav-user-name { font-size:0.82rem; font-weight:600; color:#f5efe6; line-height:1.3; }
        .nav-user-email { font-size:0.68rem; color:rgba(245,239,230,0.5); }
        .nav-avatar { width:38px; height:38px; border-radius:50%; background:linear-gradient(135deg,#e8832a,#d4451a); display:flex; align-items:center; justify-content:center; font-size:0.85rem; font-weight:700; color:#fff; border:2px solid rgba(201,169,110,0.4); }
        .nav-logout { display:flex; align-items:center; gap:0.5rem; padding:0.55rem 1.1rem; background:transparent; color:rgba(245,239,230,0.7); border:1px solid rgba(201,169,110,0.3); border-radius:50px; font-family:'Montserrat',sans-serif; font-size:0.68rem; letter-spacing:0.12em; text-transform:uppercase; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .nav-logout:hover { background:rgba(212,69,26,0.15); border-color:#d4451a; color:#f5c4b0; }
        .nav-logout svg { width:14px; height:14px; stroke:currentColor; }

        /* ── Main ── */
        .dash-main { max-width:1280px; margin:0 auto; padding:3rem 2rem 5rem; }

        .ornament { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem; }
        .ornament-line { flex:1; height:1px; background:#c9a96e; opacity:0.35; }
        .ornament-diamond { width:7px; height:7px; border:1px solid #c9a96e; transform:rotate(45deg); opacity:0.7; }

        .dash-header { margin-bottom:3rem; }
        .dash-welcome { font-family:'Cormorant Garamond',serif; font-size:2.2rem; font-weight:300; color:#1a1a14; line-height:1.2; margin-bottom:0.4rem; }
        .dash-welcome em { font-style:italic; color:#e8832a; }
        .dash-subtitle { font-size:0.72rem; letter-spacing:0.18em; text-transform:uppercase; color:#7a6e5f; }

        /* ── Grid nav cards ── */
        .dash-grid { display:grid; grid-template-columns:repeat(12,1fr); gap:1.25rem; }
        .dash-card-wrap:nth-child(1) { grid-column:span 7; }
        .dash-card-wrap:nth-child(2) { grid-column:span 5; }
        .dash-card-wrap:nth-child(3) { grid-column:span 4; }
        .dash-card-wrap:nth-child(4) { grid-column:span 4; }
        .dash-card-wrap:nth-child(5) { grid-column:span 4; }
        .dash-card-wrap:nth-child(6) { grid-column:span 5; }
        .dash-card-wrap:nth-child(7) { grid-column:span 7; }
        @media (max-width:900px) { .dash-card-wrap:nth-child(n) { grid-column:span 6; } }
        @media (max-width:580px) { .dash-card-wrap:nth-child(n) { grid-column:span 12; } }

        .dash-card { display:flex; flex-direction:column; justify-content:space-between; padding:2rem 1.75rem; min-height:170px; background:#fff; border:1px solid rgba(201,169,110,0.15); border-radius:24px; text-decoration:none; position:relative; overflow:hidden; cursor:pointer; animation:cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both; transition:transform 0.3s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s cubic-bezier(0.22,1,0.36,1), background 0.3s; will-change:transform; }
        .dash-card-wrap:nth-child(1) .dash-card { animation-delay:0.05s; }
        .dash-card-wrap:nth-child(2) .dash-card { animation-delay:0.1s; }
        .dash-card-wrap:nth-child(3) .dash-card { animation-delay:0.15s; }
        .dash-card-wrap:nth-child(4) .dash-card { animation-delay:0.2s; }
        .dash-card-wrap:nth-child(5) .dash-card { animation-delay:0.25s; }
        .dash-card-wrap:nth-child(6) .dash-card { animation-delay:0.3s; }
        .dash-card-wrap:nth-child(7) .dash-card { animation-delay:0.35s; }
        @keyframes cardIn { from{opacity:0;transform:translateY(28px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
        .dash-card::before { content:''; position:absolute; bottom:-50px; right:-50px; width:160px; height:160px; border-radius:50%; background:var(--grad); opacity:0.07; transition:opacity 0.35s, transform 0.45s cubic-bezier(0.22,1,0.36,1); }
        .dash-card::after  { content:''; position:absolute; top:0; left:0; right:0; height:3px; background:var(--grad); opacity:0; border-radius:24px 24px 0 0; transition:opacity 0.25s; }
        .dash-card:hover { transform:translateY(-7px) scale(1.012); box-shadow:0 24px 56px rgba(26,26,20,0.14),0 8px 18px rgba(26,26,20,0.08),0 0 0 1.5px var(--accent); background:#fffdf9; }
        .dash-card:hover::before { opacity:0.15; transform:scale(1.35) rotate(10deg); }
        .dash-card:hover::after  { opacity:1; }
        .dash-card:hover .card-icon-wrap { transform:rotate(-8deg) scale(1.18); box-shadow:0 8px 20px var(--accent-shadow); }
        .dash-card:hover .card-arrow { transform:translate(4px,-4px); opacity:1; }
        .dash-card:hover .card-label { color:var(--accent); }
        .dash-card:hover .card-cta   { opacity:1; transform:translateY(0); }
        .dash-card:active { transform:translateY(-2px) scale(0.975); box-shadow:0 6px 18px rgba(26,26,20,0.1); transition:transform 0.1s,box-shadow 0.1s; }
        .card-pop { animation:popEffect 0.4s cubic-bezier(0.22,1,0.36,1) !important; }
        @keyframes popEffect { 0%{transform:scale(1)} 35%{transform:scale(0.95) translateY(3px)} 65%{transform:scale(1.04) translateY(-5px)} 100%{transform:scale(1) translateY(-7px)} }
        .card-top { display:flex; align-items:flex-start; justify-content:space-between; }
        .card-icon-wrap { width:54px; height:54px; border-radius:16px; display:flex; align-items:center; justify-content:center; font-size:1.5rem; background:var(--accent-bg); transition:transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s; flex-shrink:0; }
        .card-arrow { font-size:1rem; color:var(--accent); opacity:0; transition:transform 0.25s,opacity 0.25s; align-self:flex-start; margin-top:2px; }
        .card-bottom { margin-top:1.25rem; }
        .card-label { font-size:1rem; font-weight:700; color:#1a1a14; letter-spacing:0.01em; transition:color 0.2s; margin-bottom:0.3rem; }
        .card-desc { font-size:0.7rem; color:#b8a898; letter-spacing:0.03em; line-height:1.5; }
        .card-cta { display:inline-flex; align-items:center; gap:0.4rem; margin-top:0.9rem; font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; font-weight:700; color:var(--accent); opacity:0; transition:opacity 0.25s,transform 0.25s; transform:translateY(6px); }

        /* ═══════════════════════════════════
           SEPARADOR DE SECCIÓN
        ═══════════════════════════════════ */
        .section-sep { display:flex; align-items:center; gap:1rem; margin:2.75rem 0 1.75rem; }
        .section-sep-line { flex:1; height:1px; background:rgba(201,169,110,.3); }
        .section-sep-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:#7a6e5f; letter-spacing:.08em; white-space:nowrap; }
        .section-sep-diamond { width:6px; height:6px; border:1px solid rgba(201,169,110,.5); transform:rotate(45deg); flex-shrink:0; }

        /* ═══════════════════════════════════
           PANELES
        ═══════════════════════════════════ */
        .panels-grid { display:grid; grid-template-columns:1.1fr 1fr; gap:1.5rem; }
        @media (max-width:1000px) { .panels-grid { grid-template-columns:1fr; } }

        .panel { background:#fff; border:1px solid rgba(201,169,110,.18); border-radius:24px; overflow:hidden; animation:cardIn .65s .45s cubic-bezier(.22,1,.36,1) both; }

        /* Cabecera del panel */
        .panel-hd { padding:1.1rem 1.5rem; border-bottom:1px solid rgba(201,169,110,.1); display:flex; align-items:center; justify-content:space-between; gap:.75rem; }
        .panel-hd-left { display:flex; align-items:center; gap:.7rem; }
        .panel-hd-icon { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:.95rem; flex-shrink:0; }
        .panel-hd-icon.rv { background:rgba(232,131,42,.1); }
        .panel-hd-icon.enc { background:rgba(201,169,110,.1); }
        .panel-hd-title { font-family:'Cormorant Garamond',serif; font-size:1.05rem; font-weight:600; color:#1a1a14; }
        .panel-hd-right { display:flex; align-items:center; gap:.6rem; }
        .panel-badge { font-size:.58rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; padding:.22rem .65rem; border-radius:50px; white-space:nowrap; }
        .panel-badge.rv  { background:rgba(232,131,42,.1); color:#e8832a; border:1px solid rgba(232,131,42,.18); }
        .panel-badge.enc { background:rgba(201,169,110,.1); color:#c9a96e; border:1px solid rgba(201,169,110,.22); }
        .panel-badge.green { background:rgba(90,158,111,.08); color:#5a9e6f; border:1px solid rgba(90,158,111,.2); }

        /* Tabs (encuestas) */
        .enc-tabs { display:flex; gap:.25rem; background:rgba(201,169,110,.06); border-radius:50px; padding:3px; border:1px solid rgba(201,169,110,.15); }
        .enc-tab { padding:.25rem .75rem; border-radius:50px; border:none; background:none; cursor:pointer; font-family:'Montserrat',sans-serif; font-size:.6rem; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:#b8a898; transition:all .2s; }
        .enc-tab.active { background:#fff; color:#7a6e5f; box-shadow:0 1px 4px rgba(74,64,53,.1); }

        /* Spinner y vacío */
        .panel-loading { padding:3.5rem; display:flex; justify-content:center; }
        .panel-spin { width:20px; height:20px; border-radius:50%; border:2px solid rgba(201,169,110,.2); border-top-color:#e8832a; animation:spin .7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .panel-empty { padding:3rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:.65rem; }
        .panel-empty-icon { width:44px; height:44px; border-radius:50%; background:rgba(201,169,110,.07); border:1px solid rgba(201,169,110,.15); display:flex; align-items:center; justify-content:center; font-size:1.2rem; }
        .panel-empty-txt { font-size:.7rem; color:#b8a898; }

        /* ── TABLA RESERVAS ── */
        .rv-wrap { overflow-y:auto; max-height:400px; }
        .rv-wrap::-webkit-scrollbar { width:4px; }
        .rv-wrap::-webkit-scrollbar-thumb { background:rgba(201,169,110,.2); border-radius:99px; }
        .rv-table { width:100%; border-collapse:collapse; }
        .rv-table thead tr { position:sticky; top:0; background:#fff; z-index:1; }
        .rv-table th { padding:.6rem 1rem; font-size:.56rem; font-weight:700; letter-spacing:.2em; text-transform:uppercase; color:#b8a898; text-align:left; border-bottom:1px solid rgba(201,169,110,.12); white-space:nowrap; }
        .rv-table tbody tr { border-bottom:1px solid rgba(201,169,110,.07); transition:background .15s; }
        .rv-table tbody tr:last-child { border-bottom:none; }
        .rv-table tbody tr:hover { background:rgba(201,169,110,.04); }
        .rv-table td { padding:.8rem 1rem; font-size:.75rem; color:#1a1a14; vertical-align:middle; }
        .rv-id { font-family:'Cormorant Garamond',serif; font-size:.95rem; font-weight:600; color:#e8832a; }
        .rv-guest-name { font-weight:600; font-size:.75rem; white-space:nowrap; }
        .rv-guest-sub { font-size:.6rem; color:#b8a898; margin-top:1px; }
        .rv-date-in { font-size:.68rem; color:#4a4035; white-space:nowrap; }
        .rv-date-out { font-size:.62rem; color:#b8a898; margin-top:1px; white-space:nowrap; }
        .rv-hab { display:inline-block; background:rgba(42,122,232,.07); color:#2a7ae8; border:1px solid rgba(42,122,232,.18); border-radius:6px; padding:.15rem .45rem; font-size:.62rem; font-weight:600; }
        .rv-monto { font-family:'Cormorant Garamond',serif; font-size:1rem; font-weight:600; color:#1a1a14; white-space:nowrap; }
        .rv-pend { display:inline-flex; align-items:center; gap:.3rem; background:rgba(232,131,42,.08); color:#e8832a; border:1px solid rgba(232,131,42,.18); border-radius:50px; padding:.18rem .6rem; font-size:.57rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; white-space:nowrap; }
        .rv-pend::before { content:''; width:5px; height:5px; border-radius:50%; background:#e8832a; animation:pulse 1.5s ease infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .rv-btn-ver { background:rgba(201,169,110,.1); color:#7a6e5f; border:1px solid rgba(201,169,110,.25); border-radius:8px; padding:.28rem .65rem; font-size:.59rem; font-weight:700; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; transition:all .2s; font-family:'Montserrat',sans-serif; white-space:nowrap; }
        .rv-btn-ver:hover { background:rgba(201,169,110,.18); color:#4a4035; }
        .rv-footer { padding:.8rem 1.25rem; border-top:1px solid rgba(201,169,110,.1); display:flex; justify-content:flex-end; }
        .rv-link-all { font-size:.61rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#e8832a; text-decoration:none; display:inline-flex; align-items:center; gap:.3rem; transition:gap .2s; }
        .rv-link-all:hover { gap:.55rem; }

        /* ── ENCUESTAS LISTA ── */
        .enc-lista { overflow-y:auto; max-height:400px; }
        .enc-lista::-webkit-scrollbar { width:4px; }
        .enc-lista::-webkit-scrollbar-thumb { background:rgba(201,169,110,.2); border-radius:99px; }
        .enc-item { padding:1rem 1.25rem; border-bottom:1px solid rgba(201,169,110,.07); transition:background .15s; }
        .enc-item:last-child { border-bottom:none; }
        .enc-item:hover { background:rgba(201,169,110,.03); }

        .enc-item-top { display:flex; align-items:flex-start; justify-content:space-between; gap:.75rem; margin-bottom:.6rem; }
        .enc-guest { font-size:.76rem; font-weight:600; color:#1a1a14; }
        .enc-origin { font-size:.62rem; color:#b8a898; margin-top:2px; }
        .enc-right { display:flex; flex-direction:column; align-items:flex-end; gap:.3rem; flex-shrink:0; }
        .enc-score { font-family:'Cormorant Garamond',serif; font-size:1.4rem; font-weight:600; line-height:1; }
        .enc-stars { display:flex; gap:1px; font-size:.65rem; }
        .enc-star-filled { color:#e8832a; }
        .enc-star-empty  { color:rgba(201,169,110,.25); }
        .enc-recom { display:inline-flex; align-items:center; gap:.3rem; font-size:.57rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; padding:.16rem .5rem; border-radius:50px; white-space:nowrap; }
        .enc-recom.yes { background:rgba(90,158,111,.08); color:#5a9e6f; border:1px solid rgba(90,158,111,.18); }
        .enc-recom.no  { background:rgba(212,69,26,.06); color:#d4451a; border:1px solid rgba(212,69,26,.15); }

        .enc-bars { display:grid; grid-template-columns:1fr 1fr; gap:.4rem .85rem; margin-bottom:.55rem; }
        .enc-bar-row { display:flex; align-items:center; gap:.5rem; }
        .enc-bar-lbl { font-size:.58rem; color:#b8a898; letter-spacing:.06em; text-transform:uppercase; width:52px; flex-shrink:0; }

        .enc-comment { font-size:.7rem; color:#7a6e5f; line-height:1.55; font-style:italic; padding:.45rem .7rem; background:rgba(201,169,110,.05); border-left:2px solid rgba(201,169,110,.28); border-radius:0 6px 6px 0; }

        /* ── ENCUESTAS RESUMEN ── */
        .enc-resumen { padding:1.5rem; display:flex; flex-direction:column; gap:1.25rem; }
        .enc-res-kpis { display:grid; grid-template-columns:repeat(3,1fr); gap:.85rem; }
        .enc-kpi { background:rgba(201,169,110,.06); border:1px solid rgba(201,169,110,.14); border-radius:14px; padding:.9rem 1rem; text-align:center; }
        .enc-kpi-num { font-family:'Cormorant Garamond',serif; font-size:1.8rem; font-weight:600; color:#1a1a14; line-height:1; }
        .enc-kpi-num.accent { color:#e8832a; }
        .enc-kpi-num.green  { color:#5a9e6f; }
        .enc-kpi-lbl { font-size:.58rem; letter-spacing:.12em; text-transform:uppercase; color:#b8a898; margin-top:.3rem; }

        .enc-res-bars { display:flex; flex-direction:column; gap:.75rem; }
        .enc-res-row { display:flex; align-items:center; gap:.85rem; }
        .enc-res-lbl { font-size:.64rem; font-weight:600; color:#7a6e5f; width:72px; flex-shrink:0; }
        .enc-res-bar-bg { flex:1; height:7px; background:rgba(201,169,110,.13); border-radius:99px; overflow:hidden; }
        .enc-res-bar-fill { height:100%; background:linear-gradient(90deg,#e8832a,#c9a96e); border-radius:99px; transition:width .7s ease; }
        .enc-res-val { font-size:.72rem; font-weight:700; color:#1a1a14; width:24px; text-align:right; }

        .enc-recom-card { background:rgba(90,158,111,.06); border:1px solid rgba(90,158,111,.18); border-radius:14px; padding:.9rem 1.25rem; display:flex; align-items:center; justify-content:space-between; gap:1rem; }
        .enc-recom-card-txt { font-size:.72rem; color:#5a9e6f; font-weight:600; line-height:1.4; }
        .enc-recom-card-pct { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#5a9e6f; }
      `}</style>

      <div className="dash-root">

        {/* ── Navbar ── */}
        <header className="dash-nav">
          <div className="dash-nav-inner">
            <div className="nav-logo">
              <div className="nav-logo-icon">
                <svg viewBox="0 0 24 24"><path d="M12.65 10A6 6 0 1 0 11 14.54V17H9v2h2v2h2v-2h2v-2h-2v-2.46A6 6 0 0 0 12.65 10zM7 10a4 4 0 1 1 4 4 4 4 0 0 1-4-4z"/></svg>
              </div>
              <div>
                <div className="nav-logo-text">Hostal Las Mercedes</div>
                <div className="nav-logo-sub">Panel de Administración</div>
              </div>
            </div>

            <div className="nav-right">
              <div className="nav-user-info">
                <p className="nav-user-name">{usuario?.nombre}</p>
                <p className="nav-user-email">{usuario?.email}</p>
              </div>
              <div className="nav-avatar">{usuario?.nombre?.charAt(0).toUpperCase()}</div>
              <button onClick={handleLogout} className="nav-logout">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
                </svg>
                Salir
              </button>
            </div>
          </div>
        </header>

        {/* ── Main ── */}
        <main className="dash-main">
          <div className="dash-header">
            <div className="ornament">
              <div className="ornament-line" />
              <div className="ornament-diamond" />
              <div className="ornament-line" />
            </div>
            <h1 className="dash-welcome">
              Bienvenido, <em>{usuario?.nombre?.split(" ")[0]}</em>
            </h1>
            <p className="dash-subtitle">Resumen de actividad del hotel</p>
          </div>

          {/* Cards de navegación */}
          <div className="dash-grid">
            {cards.map(item => (
              <div key={item.label} className="dash-card-wrap">
                <Link
                  href={item.href}
                  className={`dash-card${activeCard === item.label ? " card-pop" : ""}`}
                  style={{
                    "--accent":        item.accent,
                    "--accent-bg":     `${item.accent}18`,
                    "--accent-shadow": `${item.accent}40`,
                    "--grad":          item.grad,
                  } as React.CSSProperties}
                  onMouseDown={() => setActiveCard(item.label)}
                  onAnimationEnd={() => setActiveCard(null)}
                >
                  <div className="card-top">
                    <div className="card-icon-wrap">{item.icon}</div>
                    <span className="card-arrow">↗</span>
                  </div>
                  <div className="card-bottom">
                    <p className="card-label">{item.label}</p>
                    <p className="card-desc">{item.desc}</p>
                    <span className="card-cta">Abrir módulo →</span>
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* ════════════════════════════════════
              SEPARADOR
          ════════════════════════════════════ */}
          <div className="section-sep">
            <div className="section-sep-line" />
            <div className="section-sep-diamond" />
            <span className="section-sep-title">Actividad reciente</span>
            <div className="section-sep-diamond" />
            <div className="section-sep-line" />
          </div>

          {/* ════════════════════════════════════
              PANELES
          ════════════════════════════════════ */}
          <div className="panels-grid">

            {/* ── PANEL RESERVAS PENDIENTES ── */}
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-hd-left">
                  <div className="panel-hd-icon rv">🗓️</div>
                  <span className="panel-hd-title">Reservas pendientes</span>
                </div>
                <div className="panel-hd-right">
                  {!loadingR && (
                    <span className={`panel-badge ${reservas.length > 0 ? "rv" : "enc"}`}>
                      {reservas.length} {reservas.length === 1 ? "pendiente" : "pendientes"}
                    </span>
                  )}
                </div>
              </div>

              {loadingR ? (
                <div className="panel-loading"><div className="panel-spin" /></div>
              ) : reservas.length === 0 ? (
                <div className="panel-empty">
                  <div className="panel-empty-icon">✓</div>
                  <p className="panel-empty-txt">No hay reservas pendientes de confirmación</p>
                </div>
              ) : (
                <>
                  <div className="rv-wrap">
                    <table className="rv-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Huésped</th>
                          <th>Entrada</th>
                          <th>Hab.</th>
                          <th>Total</th>
                          <th>Estado</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservas.map(r => (
                          <tr key={r.id_reserva}>
                            <td><span className="rv-id">#{r.id_reserva}</span></td>
                            <td>
                              <div className="rv-guest-name">
                                {r.nombres ? `${r.nombres} ${r.apellidos ?? ""}`.trim() : `Huésped #${r.id_huesped}`}
                              </div>
                              <div className="rv-guest-sub">{r.num_personas} {r.num_personas === 1 ? "persona" : "personas"}</div>
                            </td>
                            <td>
                              <div className="rv-date-in">{fmtFecha(r.fecha_entrada)}</div>
                              <div className="rv-date-out">hasta {fmtFecha(r.fecha_salida)}</div>
                            </td>
                            <td>
                              {r.habitacion
                                ? <span className="rv-hab">{r.habitacion}</span>
                                : <span style={{color:"#ddd5c4",fontSize:".65rem"}}>—</span>}
                            </td>
                            <td><span className="rv-monto">{fmtMoney(r.monto_total)}</span></td>
                            <td><span className="rv-pend">Pendiente</span></td>
                            <td>
                              <Link href={`/dashboard/reservas?id=${r.id_reserva}`} className="rv-btn-ver">
                                Ver
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="rv-footer">
                    <Link href="/dashboard/reservas" className="rv-link-all">
                      Ver todas las reservas <span>→</span>
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* ── PANEL ENCUESTAS ── */}
            <div className="panel">
              <div className="panel-hd">
                <div className="panel-hd-left">
                  <div className="panel-hd-icon enc">⭐</div>
                  <span className="panel-hd-title">Encuestas de huéspedes</span>
                </div>
                <div className="panel-hd-right">
                  {!loadingE && encuestas.length > 0 && (
                    <span className="panel-badge green">
                      {encuestas.length} respuesta{encuestas.length !== 1 ? "s" : ""}
                    </span>
                  )}
                  <div className="enc-tabs">
                    <button
                      className={`enc-tab${encTab === "lista" ? " active" : ""}`}
                      onClick={() => setEncTab("lista")}
                    >Lista</button>
                    <button
                      className={`enc-tab${encTab === "resumen" ? " active" : ""}`}
                      onClick={() => setEncTab("resumen")}
                    >Resumen</button>
                  </div>
                </div>
              </div>

              {loadingE ? (
                <div className="panel-loading"><div className="panel-spin" /></div>
              ) : encuestas.length === 0 ? (
                <div className="panel-empty">
                  <div className="panel-empty-icon">⭐</div>
                  <p className="panel-empty-txt">Aún no hay encuestas respondidas</p>
                </div>
              ) : encTab === "lista" ? (

                // ── VISTA LISTA ──────────────────────────
                <div className="enc-lista">
                  {encuestas.map(e => {
                    const avg = avgCalif(e);
                    const avgRnd = Math.round(avg);
                    const scoreColor = avg >= 4.5 ? "#5a9e6f" : avg >= 3.5 ? "#7aab8a" : avg >= 2.5 ? "#c9a96e" : "#e8832a";
                    return (
                      <div key={e.id_encuesta} className="enc-item">
                        <div className="enc-item-top">
                          <div>
                            <div className="enc-guest">
                              {e.nombres
                                ? `${e.nombres} ${e.apellidos ?? ""}`.trim()
                                : `Orden hospedaje #${e.id_orden_hospedaje}`}
                            </div>
                            <div className="enc-origin">
                              {[e.lugar_origen, e.motivo_viaje].filter(Boolean).join(" · ") || "Sin detalle"}
                            </div>
                          </div>
                          <div className="enc-right">
                            <span className="enc-score" style={{ color: scoreColor }}>{avg.toFixed(1)}</span>
                            <div className="enc-stars">
                              {[1,2,3,4,5].map(n => (
                                <span key={n} className={n <= avgRnd ? "enc-star-filled" : "enc-star-empty"}>★</span>
                              ))}
                            </div>
                            <span className={`enc-recom ${e.recomendacion ? "yes" : "no"}`}>
                              {e.recomendacion ? "✓ Recomienda" : "✗ No recomienda"}
                            </span>
                          </div>
                        </div>

                        <div className="enc-bars">
                          {([
                            { lbl: "Limpieza",  val: e.calificacion_limpieza  },
                            { lbl: "Servicio",  val: e.calificacion_servicio  },
                            { lbl: "Ubicación", val: e.calificacion_ubicacion },
                            { lbl: "Precio",    val: e.calificacion_precio    },
                          ] as const).map(c => (
                            <div key={c.lbl} className="enc-bar-row">
                              <span className="enc-bar-lbl">{c.lbl}</span>
                              <StarBar val={c.val} />
                            </div>
                          ))}
                        </div>

                        {e.comentarios && (
                          <div className="enc-comment">"{e.comentarios}"</div>
                        )}
                      </div>
                    );
                  })}
                </div>

              ) : (

                // ── VISTA RESUMEN ────────────────────────
                <div className="enc-resumen">
                  {totales && (
                    <>
                      <div className="enc-res-kpis">
                        <div className="enc-kpi">
                          <div className="enc-kpi-num accent">{totales.general.toFixed(1)}</div>
                          <div className="enc-kpi-lbl">Prom. general</div>
                        </div>
                        <div className="enc-kpi">
                          <div className="enc-kpi-num">{encuestas.length}</div>
                          <div className="enc-kpi-lbl">Respuestas</div>
                        </div>
                        <div className="enc-kpi">
                          <div className="enc-kpi-num green">{Math.round((totales.recomiendan / encuestas.length) * 100)}%</div>
                          <div className="enc-kpi-lbl">Recomiendan</div>
                        </div>
                      </div>

                      <div className="enc-res-bars">
                        {([
                          { lbl: "Limpieza",  val: totales.limpieza  },
                          { lbl: "Servicio",  val: totales.servicio  },
                          { lbl: "Ubicación", val: totales.ubicacion },
                          { lbl: "Precio",    val: totales.precio    },
                        ] as const).map(c => (
                          <div key={c.lbl} className="enc-res-row">
                            <span className="enc-res-lbl">{c.lbl}</span>
                            <div className="enc-res-bar-bg">
                              <div className="enc-res-bar-fill" style={{ width: `${(c.val / 5) * 100}%` }} />
                            </div>
                            <span className="enc-res-val">{c.val.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="enc-recom-card">
                        <div className="enc-recom-card-txt">
                          {totales.recomiendan} de {encuestas.length} huéspedes recomendarían el hostal
                        </div>
                        <div className="enc-recom-card-pct">
                          {Math.round((totales.recomiendan / encuestas.length) * 100)}%
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

          </div>{/* /panels-grid */}
        </main>
      </div>
    </>
  );
}