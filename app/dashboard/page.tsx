"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ── Tipos ─────────────────────────────────────────────────────────────────────
interface Usuario {
  id_personal: number;
  nombre: string;
  email: string | null;
  rol: string;
  activo: boolean;
}

type Reserva = {
  id_reserva:    number;
  id_huesped:    number;
  nombres?:      string;
  apellidos?:    string;
  id_habitacion: number;
  habitacion?:   string;
  fecha_entrada: string;
  fecha_salida:  string;
  num_personas:  number;
  monto_total:   number;
  estado:        number | string;
};

type Encuesta = {
  id_encuesta:            number;
  id_orden_hospedaje:     number;
  nombres?:               string;
  apellidos?:             string;
  recomendacion:          boolean;
  lugar_origen?:          string;
  motivo_viaje?:          string;
  calificacion_limpieza:  number;
  calificacion_servicio:  number;
  calificacion_ubicacion: number;
  calificacion_precio:    number;
  comentarios?:           string;
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
  const pct   = Math.min((val / max) * 100, 100);
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
  const [usuario,       setUsuario]       = useState<Usuario | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [sideCollapsed, setSideCollapsed] = useState(false);

  const [reservas,  setReservas]  = useState<Reserva[]>([]);
  const [encuestas, setEncuestas] = useState<Encuesta[]>([]);
  const [loadingR,  setLoadingR]  = useState(true);
  const [loadingE,  setLoadingE]  = useState(true);
  const [encTab,    setEncTab]    = useState<"lista" | "resumen">("lista");

  // Calendario
  const [calReservas, setCalReservas] = useState<Reserva[]>([]);
  const [calMes,      setCalMes]      = useState<Date>(() => { const d = new Date(); d.setDate(1); return d; });
  const [calHab,      setCalHab]      = useState<string>("todas");
  const [calTooltip,  setCalTooltip]  = useState<{ day: Date; reservas: Reserva[] } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => { if (!res.ok) throw new Error("No autorizado"); return res.json(); })
      .then(data => setUsuario(data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!usuario) return;
    dashFetch<Reserva[]>("/reservas?estado=1")
      .then(d => setReservas(Array.isArray(d) ? d : []))
      .catch(() => setReservas([]))
      .finally(() => setLoadingR(false));
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    dashFetch<Encuesta[]>("/encuestas")
      .then(d => setEncuestas(Array.isArray(d) ? d.slice(0, 30) : []))
      .catch(() => setEncuestas([]))
      .finally(() => setLoadingE(false));
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;
    dashFetch<Reserva[]>("/reservas")
      .then(d => setCalReservas(Array.isArray(d) ? d : []))
      .catch(() => setCalReservas([]));
  }, [usuario]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const totales = encuestas.length > 0 ? {
    limpieza:    encuestas.reduce((s, e) => s + e.calificacion_limpieza,  0) / encuestas.length,
    servicio:    encuestas.reduce((s, e) => s + e.calificacion_servicio,  0) / encuestas.length,
    ubicacion:   encuestas.reduce((s, e) => s + e.calificacion_ubicacion, 0) / encuestas.length,
    precio:      encuestas.reduce((s, e) => s + e.calificacion_precio,    0) / encuestas.length,
    recomiendan: encuestas.filter(e => e.recomendacion).length,
    general:     encuestas.reduce((s, e) => s + avgCalif(e), 0) / encuestas.length,
  } : null;

  const navItems = [
    { label: "Reservas",     icon: "🗓️", href: "/dashboard/reservas",     roles: ["administrador","recepcionista","mantenimiento"] },
    { label: "Habitaciones", icon: "🛏️", href: "/dashboard/habitaciones", roles: ["administrador"] },
    { label: "Huéspedes",    icon: "👤", href: "/dashboard/huespedes",     roles: ["administrador","recepcionista"] },
    { label: "Pagos",        icon: "💳", href: "/dashboard/pagos",         roles: ["administrador","recepcionista","conserjeria"] },
    { label: "Personal",     icon: "🧑‍💼", href: "/dashboard/personal",     roles: ["administrador"] },
    { label: "Conserjería",  icon: "🛎️", href: "/dashboard/conserjeria",   roles: ["administrador","recepcionista","conserjeria"] },
    { label: "Hospedaje",    icon: "🏨", href: "/dashboard/hospedaje",     roles: ["administrador","recepcionista","mantenimiento"] },
  ];

  const rolNorm     = (usuario?.rol ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const visibleNavs = navItems.filter(n => n.roles.includes(rolNorm));

  // ── Calendario helpers ─────────────────────────────────────────────────────
  const MESES       = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DIAS_SEMANA = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
  const BAND_COLORS: Record<string, { bg: string; text: string }> = {
    "Confirmada": { bg: "rgba(90,158,111,.8)",   text: "#fff" },
    "Pendiente":  { bg: "rgba(232,131,42,.8)",   text: "#fff" },
    "Completada": { bg: "rgba(100,140,200,.7)",  text: "#fff" },
    "Cancelada":  { bg: "rgba(180,170,160,.35)", text: "#7a6e5f" },
  };

  function toMid(iso: string) { return new Date(iso.includes("T") ? iso : iso + "T12:00:00"); }
  function sameDay(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function dayKey(d: Date) { return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }

  const habitaciones      = Array.from(new Set(calReservas.map(r => r.habitacion).filter(Boolean))).sort() as string[];
  const reservasFiltradas = calHab === "todas" ? calReservas : calReservas.filter(r => r.habitacion === calHab);

  const año         = calMes.getFullYear();
  const mes         = calMes.getMonth();
  const primero     = new Date(año, mes, 1);
  const ultimo      = new Date(año, mes + 1, 0);
  const offsetLunes = (primero.getDay() + 6) % 7;
  const filas       = Math.ceil((offsetLunes + ultimo.getDate()) / 7);
  const hoy         = new Date();

  const bandCache: Record<string, { reserva: Reserva; isStart: boolean; isEnd: boolean }[]> = {};
  reservasFiltradas.forEach(r => {
    if (!r.fecha_entrada || !r.fecha_salida) return;
    const entrada = toMid(r.fecha_entrada);
    const salida  = toMid(r.fecha_salida);
    const cur = new Date(entrada);
    while (cur < salida) {
      const k = dayKey(cur);
      if (!bandCache[k]) bandCache[k] = [];
      bandCache[k].push({ reserva: r, isStart: sameDay(cur, entrada), isEnd: sameDay(new Date(cur.getTime() + 86400000), salida) });
      cur.setDate(cur.getDate() + 1);
    }
  });

  const reservasMes     = reservasFiltradas.filter(r => { const e = toMid(r.fecha_entrada); const s = toMid(r.fecha_salida); return e <= new Date(año, mes + 1, 0) && s >= new Date(año, mes, 1); });
  const statConfirmadas = reservasMes.filter(r => r.estado === "Confirmada").length;
  const statPendientes  = reservasMes.filter(r => r.estado === "Pendiente").length;
  const statCompletadas = reservasMes.filter(r => r.estado === "Completada").length;
  const statCanceladas  = reservasMes.filter(r => r.estado === "Cancelada").length;

  if (loading) return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .lr{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f0e9df;font-family:'Montserrat',sans-serif}
        .ls{width:40px;height:40px;border:3px solid rgba(201,169,110,.25);border-top-color:#e8832a;border-radius:50%;animation:sp .8s linear infinite;margin:0 auto 1rem}
        .lt{font-size:.65rem;letter-spacing:.25em;text-transform:uppercase;color:#7a6e5f;text-align:center}
        @keyframes sp{to{transform:rotate(360deg)}}
      `}</style>
      <div className="lr"><div><div className="ls"/><p className="lt">Cargando...</p></div></div>
    </>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

        /* ══ SHELL ══ */
        .shell{display:flex;min-height:100vh;background:#eee8df;font-family:'Montserrat',sans-serif}

        /* ══ SIDEBAR ══ */
        .sidebar{
          width:${sideCollapsed ? "68px" : "230px"};
          min-height:100vh;flex-shrink:0;
          background:#1c1c14;
          border-right:1px solid rgba(201,169,110,.14);
          display:flex;flex-direction:column;
          position:sticky;top:0;height:100vh;
          transition:width .28s cubic-bezier(.22,1,.36,1);
          overflow:hidden;z-index:40;
        }

        .sb-top{padding:1.1rem .85rem .85rem;border-bottom:1px solid rgba(201,169,110,.1)}
        .sb-logo-row{display:flex;align-items:center;gap:.7rem;margin-bottom:.9rem;overflow:hidden;white-space:nowrap}
        .sb-logo-icon{width:34px;height:34px;flex-shrink:0;background:linear-gradient(135deg,#e8832a,#d4451a);border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(232,131,42,.4)}
        .sb-logo-icon svg{width:15px;height:15px;fill:#fff}
        .sb-logo-txt{font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:600;color:#f5efe6;letter-spacing:.03em;line-height:1.1}
        .sb-logo-sub{font-size:.46rem;letter-spacing:.18em;text-transform:uppercase;color:#c9a96e;font-weight:500}

        .sb-user-row{display:flex;align-items:center;gap:.65rem;overflow:hidden;white-space:nowrap}
        .sb-avatar{width:30px;height:30px;flex-shrink:0;border-radius:50%;background:linear-gradient(135deg,#e8832a,#d4451a);display:flex;align-items:center;justify-content:center;font-size:.72rem;font-weight:700;color:#fff;border:1.5px solid rgba(201,169,110,.3)}
        .sb-user-name{font-size:.7rem;font-weight:600;color:#f5efe6;overflow:hidden;text-overflow:ellipsis;line-height:1.3}
        .sb-user-rol{font-size:.54rem;color:rgba(201,169,110,.65);letter-spacing:.08em;text-transform:uppercase}

        /* Nav */
        .sb-mid{flex:1;padding:.65rem .55rem;display:flex;flex-direction:column;gap:2px;overflow-y:auto;overflow-x:hidden}
        .sb-mid::-webkit-scrollbar{width:0}
        .sb-section-lbl{font-size:.47rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:rgba(201,169,110,.3);padding:.5rem .5rem .2rem;white-space:nowrap;overflow:hidden}
        .sb-item{
          display:flex;align-items:center;gap:.7rem;
          padding:.58rem .6rem;border-radius:10px;
          text-decoration:none;
          color:rgba(245,239,230,.5);
          font-size:.7rem;font-weight:600;letter-spacing:.01em;
          white-space:nowrap;overflow:hidden;
          transition:background .18s,color .18s;
          position:relative;
        }
        .sb-item:hover{background:rgba(201,169,110,.1);color:rgba(245,239,230,.88)}
        .sb-item-icon{font-size:1rem;flex-shrink:0;width:20px;text-align:center}
        .sb-item-txt{flex:1;overflow:hidden;text-overflow:ellipsis}
        .sb-item-arr{font-size:.65rem;opacity:0;flex-shrink:0;transition:opacity .18s,transform .18s}
        .sb-item:hover .sb-item-arr{opacity:.45;transform:translateX(2px)}

        /* Toggle & Logout */
        .sb-bot{padding:.65rem .55rem 1rem;border-top:1px solid rgba(201,169,110,.1);display:flex;flex-direction:column;gap:.35rem}
        .sb-toggle{display:flex;align-items:center;gap:.7rem;width:100%;padding:.5rem .6rem;border-radius:10px;border:none;background:transparent;cursor:pointer;color:rgba(201,169,110,.4);font-family:'Montserrat',sans-serif;font-size:.68rem;font-weight:600;white-space:nowrap;overflow:hidden;transition:background .18s,color .18s}
        .sb-toggle:hover{background:rgba(201,169,110,.08);color:rgba(201,169,110,.7)}
        .sb-toggle svg{width:14px;height:14px;flex-shrink:0;transition:transform .28s}
        .sb-logout{display:flex;align-items:center;gap:.7rem;width:100%;padding:.5rem .6rem;border-radius:10px;border:none;background:transparent;cursor:pointer;color:rgba(245,239,230,.35);font-family:'Montserrat',sans-serif;font-size:.7rem;font-weight:600;white-space:nowrap;overflow:hidden;transition:background .18s,color .18s}
        .sb-logout:hover{background:rgba(212,69,26,.1);color:#f5c4b0}
        .sb-logout svg{width:14px;height:14px;stroke:currentColor;flex-shrink:0}

        /* ══ BODY ══ */
        .dash-body{flex:1;min-width:0;display:flex;flex-direction:column;min-height:100vh}

        /* Topbar */
        .topbar{height:58px;background:#fff;border-bottom:1px solid rgba(201,169,110,.15);padding:0 1.75rem;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:30;flex-shrink:0}
        .tb-title{font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:600;color:#1a1a14;line-height:1.1}
        .tb-title em{font-style:italic;color:#e8832a}
        .tb-sub{font-size:.58rem;letter-spacing:.16em;text-transform:uppercase;color:#b8a898;margin-top:1px}
        .tb-date{font-size:.62rem;color:#b8a898;letter-spacing:.04em}

        /* Scroll */
        .dash-scroll{flex:1;padding:1.5rem 1.75rem 3.5rem;display:flex;flex-direction:column;gap:1.25rem;overflow-y:auto}

        /* ══ KPI STRIP ══ */
        .kpi-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:.85rem;animation:fadeUp .45s both}
        @media(max-width:860px){.kpi-strip{grid-template-columns:repeat(2,1fr)}}
        .kpi-card{background:#fff;border:1px solid rgba(201,169,110,.14);border-radius:16px;padding:1rem 1.1rem;display:flex;align-items:center;gap:.85rem}
        .kpi-icon{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0}
        .kpi-num{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600;color:#1a1a14;line-height:1}
        .kpi-lbl{font-size:.56rem;letter-spacing:.1em;text-transform:uppercase;color:#b8a898;margin-top:2px}

        /* ══ CALENDAR ══ */
        .cal-panel{background:#fff;border:1px solid rgba(201,169,110,.16);border-radius:20px;overflow:visible;animation:fadeUp .45s .05s both}
        .cal-hd{padding:1rem 1.4rem;border-bottom:1px solid rgba(201,169,110,.1);display:flex;align-items:center;justify-content:space-between;gap:.85rem;flex-wrap:wrap}
        .cal-hd-left{display:flex;align-items:center;gap:.55rem}
        .cal-hd-icon{width:30px;height:30px;border-radius:8px;background:rgba(232,131,42,.1);display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0}
        .cal-hd-title{font-family:'Cormorant Garamond',serif;font-size:.95rem;font-weight:600;color:#1a1a14}
        .cal-hd-right{display:flex;align-items:center;gap:.65rem;flex-wrap:wrap}
        .cal-legend{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}
        .cal-leg-item{display:flex;align-items:center;gap:.28rem;font-size:.54rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;color:#7a6e5f}
        .cal-leg-dot{width:8px;height:8px;border-radius:2.5px;flex-shrink:0}
        .cal-hab-select{appearance:none;background:rgba(201,169,110,.06);border:1.5px solid rgba(201,169,110,.22);border-radius:50px;padding:.28rem 1.8rem .28rem .75rem;font-family:'Montserrat',sans-serif;font-size:.6rem;font-weight:600;letter-spacing:.07em;color:#4a4035;cursor:pointer;outline:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23c9a96e' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right .6rem center;transition:border-color .2s}
        .cal-hab-select:focus{border-color:#c9a96e}
        .cal-nav{display:flex;align-items:center;gap:.4rem}
        .cal-nav-btn{width:26px;height:26px;border-radius:50%;border:1.5px solid rgba(201,169,110,.22);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#7a6e5f;transition:all .18s;flex-shrink:0}
        .cal-nav-btn:hover{background:rgba(201,169,110,.1);border-color:#c9a96e;color:#4a4035}
        .cal-nav-mes{font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:600;color:#1a1a14;min-width:148px;text-align:center;letter-spacing:.02em}

        .cal-body{padding:.85rem 1.1rem 1.1rem}
        .cal-weekdays{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:.35rem}
        .cal-wd{text-align:center;font-size:.52rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#b8a898;padding:.22rem 0}
        .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}

        .cal-day{min-height:72px;border-radius:9px;border:1px solid rgba(201,169,110,.1);background:#faf7f3;padding:.32rem .35rem .28rem;display:flex;flex-direction:column;gap:2px;position:relative;cursor:default;transition:border-color .14s,background .14s}
        .cal-day:hover{border-color:rgba(201,169,110,.32);background:#f6f0e8;z-index:2}
        .cal-day-empty{min-height:72px;background:transparent;border:none;pointer-events:none}
        .cal-day-today .cal-day-num-wrap{background:linear-gradient(135deg,#e8832a,#d4451a);border-radius:50%;width:19px;height:19px;display:flex;align-items:center;justify-content:center}
        .cal-day-today .cal-day-num{color:#fff!important;font-weight:700}
        .cal-day-num-wrap{display:inline-flex;margin-bottom:1px}
        .cal-day-num{font-size:.65rem;font-weight:600;color:#4a4035;line-height:1;display:block;padding:2px 3px}

        .cal-bands{display:flex;flex-direction:column;gap:2px}
        .cal-band{height:12px;border-radius:2px;display:flex;align-items:center;padding:0 3px;overflow:hidden}
        .cal-band-lbl{font-size:.46rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1}
        .cal-band-start{border-radius:5px 2px 2px 5px}
        .cal-band-end{border-radius:2px 5px 5px 2px}
        .cal-band-solo{border-radius:5px}
        .cal-band-mid{border-radius:2px}

        .cal-tooltip{position:absolute;top:calc(100% + 5px);left:50%;transform:translateX(-50%);z-index:200;background:#1a1a14;color:#f5efe6;border-radius:10px;padding:.55rem .75rem;min-width:165px;max-width:220px;box-shadow:0 8px 22px rgba(0,0,0,.28);pointer-events:none}
        .cal-tooltip::before{content:'';position:absolute;top:-4px;left:50%;transform:translateX(-50%);border:4px solid transparent;border-top:0;border-bottom-color:#1a1a14}
        .cal-tt-date{font-size:.54rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:rgba(201,169,110,.75);margin-bottom:.35rem}
        .cal-tt-item{display:flex;align-items:center;gap:.38rem;padding:.25rem 0;border-top:1px solid rgba(255,255,255,.07)}
        .cal-tt-dot{width:7px;height:7px;border-radius:2px;flex-shrink:0}
        .cal-tt-num{font-size:.6rem;font-weight:700;color:#c9a96e}
        .cal-tt-hab{font-size:.55rem;color:rgba(245,239,230,.52)}

        .cal-stats{display:flex;gap:.6rem;padding:.75rem 1.1rem;border-top:1px solid rgba(201,169,110,.1);flex-wrap:wrap}
        .cal-stat{flex:1;min-width:65px;text-align:center;padding:.5rem .35rem;border-radius:9px;background:rgba(201,169,110,.05);border:1px solid rgba(201,169,110,.1)}
        .cal-stat-num{font-family:'Cormorant Garamond',serif;font-size:1.35rem;font-weight:600;color:#1a1a14;line-height:1}
        .cal-stat-lbl{font-size:.49rem;letter-spacing:.09em;text-transform:uppercase;color:#b8a898;margin-top:.12rem}

        /* ══ PANELS ══ */
        .panels-grid{display:grid;grid-template-columns:1.1fr 1fr;gap:1.1rem;animation:fadeUp .45s .1s both}
        @media(max-width:860px){.panels-grid{grid-template-columns:1fr}}
        .panel{background:#fff;border:1px solid rgba(201,169,110,.16);border-radius:20px;overflow:hidden}
        .panel-hd{padding:.9rem 1.3rem;border-bottom:1px solid rgba(201,169,110,.1);display:flex;align-items:center;justify-content:space-between;gap:.55rem}
        .panel-hd-left{display:flex;align-items:center;gap:.55rem}
        .panel-hd-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.85rem;flex-shrink:0}
        .panel-hd-icon.rv{background:rgba(232,131,42,.1)}
        .panel-hd-icon.enc{background:rgba(201,169,110,.1)}
        .panel-hd-title{font-family:'Cormorant Garamond',serif;font-size:.95rem;font-weight:600;color:#1a1a14}
        .panel-hd-right{display:flex;align-items:center;gap:.45rem}
        .panel-badge{font-size:.54rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;padding:.18rem .55rem;border-radius:50px;white-space:nowrap}
        .panel-badge.rv{background:rgba(232,131,42,.1);color:#e8832a;border:1px solid rgba(232,131,42,.18)}
        .panel-badge.enc{background:rgba(201,169,110,.1);color:#c9a96e;border:1px solid rgba(201,169,110,.22)}
        .panel-badge.green{background:rgba(90,158,111,.08);color:#5a9e6f;border:1px solid rgba(90,158,111,.2)}
        .panel-loading{padding:2.75rem;display:flex;justify-content:center}
        .panel-spin{width:17px;height:17px;border-radius:50%;border:2px solid rgba(201,169,110,.2);border-top-color:#e8832a;animation:spin .7s linear infinite}
        .panel-empty{padding:2.25rem 1.5rem;text-align:center;display:flex;flex-direction:column;align-items:center;gap:.5rem}
        .panel-empty-icon{width:38px;height:38px;border-radius:50%;background:rgba(201,169,110,.07);border:1px solid rgba(201,169,110,.15);display:flex;align-items:center;justify-content:center;font-size:1rem}
        .panel-empty-txt{font-size:.66rem;color:#b8a898}

        .enc-tabs{display:flex;gap:.18rem;background:rgba(201,169,110,.06);border-radius:50px;padding:2px;border:1px solid rgba(201,169,110,.14)}
        .enc-tab{padding:.2rem .65rem;border-radius:50px;border:none;background:none;cursor:pointer;font-family:'Montserrat',sans-serif;font-size:.56rem;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:#b8a898;transition:all .18s}
        .enc-tab.active{background:#fff;color:#7a6e5f;box-shadow:0 1px 3px rgba(74,64,53,.1)}

        .rv-wrap{overflow-y:auto;max-height:360px}
        .rv-wrap::-webkit-scrollbar{width:3px}
        .rv-wrap::-webkit-scrollbar-thumb{background:rgba(201,169,110,.18);border-radius:99px}
        .rv-table{width:100%;border-collapse:collapse}
        .rv-table thead tr{position:sticky;top:0;background:#fff;z-index:1}
        .rv-table th{padding:.5rem .85rem;font-size:.52rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#b8a898;text-align:left;border-bottom:1px solid rgba(201,169,110,.1);white-space:nowrap}
        .rv-table tbody tr{border-bottom:1px solid rgba(201,169,110,.06);transition:background .14s}
        .rv-table tbody tr:last-child{border-bottom:none}
        .rv-table tbody tr:hover{background:rgba(201,169,110,.035)}
        .rv-table td{padding:.65rem .85rem;font-size:.7rem;color:#1a1a14;vertical-align:middle}
        .rv-id{font-family:'Cormorant Garamond',serif;font-size:.88rem;font-weight:600;color:#e8832a}
        .rv-guest-name{font-weight:600;font-size:.7rem;white-space:nowrap}
        .rv-guest-sub{font-size:.57rem;color:#b8a898;margin-top:1px}
        .rv-date-in{font-size:.63rem;color:#4a4035;white-space:nowrap}
        .rv-date-out{font-size:.58rem;color:#b8a898;margin-top:1px;white-space:nowrap}
        .rv-hab{display:inline-block;background:rgba(42,122,232,.07);color:#2a7ae8;border:1px solid rgba(42,122,232,.17);border-radius:5px;padding:.1rem .38rem;font-size:.58rem;font-weight:600}
        .rv-monto{font-family:'Cormorant Garamond',serif;font-size:.9rem;font-weight:600;color:#1a1a14;white-space:nowrap}
        .rv-pend{display:inline-flex;align-items:center;gap:.25rem;background:rgba(232,131,42,.08);color:#e8832a;border:1px solid rgba(232,131,42,.17);border-radius:50px;padding:.13rem .5rem;font-size:.53rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;white-space:nowrap}
        .rv-pend::before{content:'';width:4px;height:4px;border-radius:50%;background:#e8832a;animation:pulse 1.5s ease infinite}
        .rv-btn-ver{background:rgba(201,169,110,.09);color:#7a6e5f;border:1px solid rgba(201,169,110,.22);border-radius:6px;padding:.22rem .55rem;font-size:.55rem;font-weight:700;letter-spacing:.07em;text-transform:uppercase;cursor:pointer;transition:all .18s;font-family:'Montserrat',sans-serif;white-space:nowrap;text-decoration:none;display:inline-block}
        .rv-btn-ver:hover{background:rgba(201,169,110,.17);color:#4a4035}
        .rv-footer{padding:.65rem 1rem;border-top:1px solid rgba(201,169,110,.08);display:flex;justify-content:flex-end}
        .rv-link-all{font-size:.57rem;font-weight:700;letter-spacing:.13em;text-transform:uppercase;color:#e8832a;text-decoration:none;display:inline-flex;align-items:center;gap:.25rem;transition:gap .18s}
        .rv-link-all:hover{gap:.45rem}

        .enc-lista{overflow-y:auto;max-height:360px}
        .enc-lista::-webkit-scrollbar{width:3px}
        .enc-lista::-webkit-scrollbar-thumb{background:rgba(201,169,110,.18);border-radius:99px}
        .enc-item{padding:.85rem 1.15rem;border-bottom:1px solid rgba(201,169,110,.06);transition:background .14s}
        .enc-item:last-child{border-bottom:none}
        .enc-item:hover{background:rgba(201,169,110,.025)}
        .enc-item-top{display:flex;align-items:flex-start;justify-content:space-between;gap:.55rem;margin-bottom:.45rem}
        .enc-guest{font-size:.7rem;font-weight:600;color:#1a1a14}
        .enc-origin{font-size:.58rem;color:#b8a898;margin-top:1px}
        .enc-right{display:flex;flex-direction:column;align-items:flex-end;gap:.22rem;flex-shrink:0}
        .enc-score{font-family:'Cormorant Garamond',serif;font-size:1.25rem;font-weight:600;line-height:1}
        .enc-stars{display:flex;gap:1px;font-size:.6rem}
        .enc-star-filled{color:#e8832a}
        .enc-star-empty{color:rgba(201,169,110,.22)}
        .enc-recom{display:inline-flex;align-items:center;gap:.22rem;font-size:.52rem;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:.12rem .42rem;border-radius:50px;white-space:nowrap}
        .enc-recom.yes{background:rgba(90,158,111,.08);color:#5a9e6f;border:1px solid rgba(90,158,111,.17)}
        .enc-recom.no{background:rgba(212,69,26,.06);color:#d4451a;border:1px solid rgba(212,69,26,.14)}
        .enc-bars{display:grid;grid-template-columns:1fr 1fr;gap:.32rem .7rem;margin-bottom:.4rem}
        .enc-bar-row{display:flex;align-items:center;gap:.4rem}
        .enc-bar-lbl{font-size:.54rem;color:#b8a898;letter-spacing:.05em;text-transform:uppercase;width:48px;flex-shrink:0}
        .enc-comment{font-size:.65rem;color:#7a6e5f;line-height:1.5;font-style:italic;padding:.38rem .6rem;background:rgba(201,169,110,.05);border-left:2px solid rgba(201,169,110,.26);border-radius:0 4px 4px 0}
        .enc-resumen{padding:1.1rem;display:flex;flex-direction:column;gap:1rem}
        .enc-res-kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:.65rem}
        .enc-kpi{background:rgba(201,169,110,.06);border:1px solid rgba(201,169,110,.13);border-radius:11px;padding:.75rem .85rem;text-align:center}
        .enc-kpi-num{font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600;color:#1a1a14;line-height:1}
        .enc-kpi-num.accent{color:#e8832a}
        .enc-kpi-num.green{color:#5a9e6f}
        .enc-kpi-lbl{font-size:.53rem;letter-spacing:.11em;text-transform:uppercase;color:#b8a898;margin-top:.22rem}
        .enc-res-bars{display:flex;flex-direction:column;gap:.6rem}
        .enc-res-row{display:flex;align-items:center;gap:.7rem}
        .enc-res-lbl{font-size:.6rem;font-weight:600;color:#7a6e5f;width:65px;flex-shrink:0}
        .enc-res-bar-bg{flex:1;height:5px;background:rgba(201,169,110,.12);border-radius:99px;overflow:hidden}
        .enc-res-bar-fill{height:100%;background:linear-gradient(90deg,#e8832a,#c9a96e);border-radius:99px;transition:width .7s ease}
        .enc-res-val{font-size:.67rem;font-weight:700;color:#1a1a14;width:20px;text-align:right}
        .enc-recom-card{background:rgba(90,158,111,.06);border:1px solid rgba(90,158,111,.17);border-radius:11px;padding:.75rem 1rem;display:flex;align-items:center;justify-content:space-between;gap:.65rem}
        .enc-recom-card-txt{font-size:.65rem;color:#5a9e6f;font-weight:600;line-height:1.4}
        .enc-recom-card-pct{font-family:'Cormorant Garamond',serif;font-size:1.7rem;font-weight:600;color:#5a9e6f}
      `}</style>

      <div className="shell">

        {/* ════════════════════════
            SIDEBAR
        ════════════════════════ */}
        <aside className="sidebar">

          {/* Logo + usuario */}
          <div className="sb-top">
            <div className="sb-logo-row">
              <div className="sb-logo-icon">
                <svg viewBox="0 0 24 24"><path d="M12.65 10A6 6 0 1 0 11 14.54V17H9v2h2v2h2v-2h2v-2h-2v-2.46A6 6 0 0 0 12.65 10zM7 10a4 4 0 1 1 4 4 4 4 0 0 1-4-4z"/></svg>
              </div>
              {!sideCollapsed && (
                <div>
                  <div className="sb-logo-txt">Las Mercedes</div>
                  <div className="sb-logo-sub">Administración</div>
                </div>
              )}
            </div>
            <div className="sb-user-row">
              <div className="sb-avatar">{usuario?.nombre?.charAt(0).toUpperCase()}</div>
              {!sideCollapsed && (
                <div style={{ overflow: "hidden" }}>
                  <div className="sb-user-name">{usuario?.nombre?.split(" ")[0]}</div>
                  <div className="sb-user-rol">{usuario?.rol}</div>
                </div>
              )}
            </div>
          </div>

          {/* Nav items */}
          <nav className="sb-mid">
            {!sideCollapsed && <div className="sb-section-lbl">Módulos</div>}
            {visibleNavs.map(item => (
              <Link
                key={item.label}
                href={item.href}
                className="sb-item"
                title={sideCollapsed ? item.label : undefined}
              >
                <span className="sb-item-icon">{item.icon}</span>
                {!sideCollapsed && (
                  <>
                    <span className="sb-item-txt">{item.label}</span>
                    <span className="sb-item-arr">›</span>
                  </>
                )}
              </Link>
            ))}
          </nav>

          {/* Toggle + Logout */}
          <div className="sb-bot">
            <button
              className="sb-toggle"
              onClick={() => setSideCollapsed(v => !v)}
              title={sideCollapsed ? "Expandir" : "Colapsar"}
            >
              <svg fill="none" viewBox="0 0 14 14" stroke="currentColor" style={{ transform: sideCollapsed ? "scaleX(-1)" : "none" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9 2L4 7l5 5M5 7h7"/>
              </svg>
              {!sideCollapsed && <span>Colapsar menú</span>}
            </button>
            <button className="sb-logout" onClick={handleLogout} title={sideCollapsed ? "Cerrar sesión" : undefined}>
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
              </svg>
              {!sideCollapsed && <span>Cerrar sesión</span>}
            </button>
          </div>
        </aside>

        {/* ════════════════════════
            CONTENIDO
        ════════════════════════ */}
        <div className="dash-body">

          {/* Topbar */}
          <div className="topbar">
            <div>
              <div className="tb-title">Bienvenido, <em>{usuario?.nombre?.split(" ")[0]}</em></div>
              <div className="tb-sub">Panel de administración</div>
            </div>
            <span className="tb-date">
              {new Date().toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>

          <div className="dash-scroll">

            {/* ── KPI STRIP ── */}
            <div className="kpi-strip">
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: "rgba(232,131,42,.1)" }}>🗓️</div>
                <div><div className="kpi-num">{loadingR ? "—" : reservas.length}</div><div className="kpi-lbl">Reservas pendientes</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: "rgba(90,158,111,.1)" }}>✅</div>
                <div><div className="kpi-num" style={{ color: "#5a9e6f" }}>{calReservas.filter(r => r.estado === "Confirmada").length || "—"}</div><div className="kpi-lbl">Confirmadas</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: "rgba(100,140,200,.1)" }}>🏨</div>
                <div><div className="kpi-num" style={{ color: "#6490c8" }}>{calReservas.filter(r => r.estado === "Completada").length || "—"}</div><div className="kpi-lbl">Completadas</div></div>
              </div>
              <div className="kpi-card">
                <div className="kpi-icon" style={{ background: "rgba(201,169,110,.1)" }}>⭐</div>
                <div><div className="kpi-num" style={{ color: "#c9a96e" }}>{loadingE ? "—" : encuestas.length}</div><div className="kpi-lbl">Encuestas recibidas</div></div>
              </div>
            </div>

            {/* ── CALENDARIO ── */}
            <div className="cal-panel">
              <div className="cal-hd">
                <div className="cal-hd-left">
                  <div className="cal-hd-icon">📅</div>
                  <span className="cal-hd-title">Calendario de ocupación</span>
                </div>
                <div className="cal-hd-right">
                  <div className="cal-legend">
                    {(["Confirmada","Pendiente","Completada","Cancelada"] as const).map(e => (
                      <div key={e} className="cal-leg-item">
                        <div className="cal-leg-dot" style={{ background: BAND_COLORS[e]?.bg }}/>
                        {e}
                      </div>
                    ))}
                  </div>
                  <select className="cal-hab-select" value={calHab} onChange={e => setCalHab(e.target.value)}>
                    <option value="todas">Todas las hab.</option>
                    {habitaciones.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                  <div className="cal-nav">
                    <button className="cal-nav-btn" onClick={() => setCalMes(d => new Date(d.getFullYear(), d.getMonth()-1, 1))}>
                      <svg width="8" height="8" fill="none" viewBox="0 0 8 8"><path d="M5.5 1L2 4l3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <span className="cal-nav-mes">{MESES[mes]} {año}</span>
                    <button className="cal-nav-btn" onClick={() => setCalMes(d => new Date(d.getFullYear(), d.getMonth()+1, 1))}>
                      <svg width="8" height="8" fill="none" viewBox="0 0 8 8"><path d="M2.5 1L6 4l-3.5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>

              <div className="cal-body">
                <div className="cal-weekdays">
                  {DIAS_SEMANA.map(d => <div key={d} className="cal-wd">{d}</div>)}
                </div>
                <div className="cal-grid">
                  {Array.from({ length: filas * 7 }).map((_, idx) => {
                    const dayNum   = idx - offsetLunes + 1;
                    const esDelMes = dayNum >= 1 && dayNum <= ultimo.getDate();
                    if (!esDelMes) return <div key={idx} className="cal-day-empty"/>;
                    const fecha   = new Date(año, mes, dayNum);
                    const k       = dayKey(fecha);
                    const esHoy   = sameDay(fecha, hoy);
                    const bandas  = bandCache[k] ?? [];
                    const hasTt   = calTooltip && sameDay(calTooltip.day, fecha);
                    return (
                      <div
                        key={idx}
                        className={`cal-day${esHoy ? " cal-day-today" : ""}`}
                        onMouseEnter={() => bandas.length > 0 && setCalTooltip({ day: fecha, reservas: bandas.map(b => b.reserva) })}
                        onMouseLeave={() => setCalTooltip(null)}
                      >
                        <div className="cal-day-num-wrap"><span className="cal-day-num">{dayNum}</span></div>
                        {bandas.length > 0 && (
                          <div className="cal-bands">
                            {bandas.slice(0, 3).map((b, bi) => {
                              const c  = BAND_COLORS[String(b.reserva.estado)] ?? { bg: "rgba(180,170,160,.32)", text: "#7a6e5f" };
                              const rc = b.isStart && b.isEnd ? "cal-band-solo" : b.isStart ? "cal-band-start" : b.isEnd ? "cal-band-end" : "cal-band-mid";
                              const ms: React.CSSProperties = b.isStart ? {} : b.isEnd ? { marginLeft: "-4px" } : { marginLeft: "-4px", marginRight: "-4px" };
                              return (
                                <div key={`${b.reserva.id_reserva}-${bi}`} className={`cal-band ${rc}`} style={{ background: c.bg, ...ms }}>
                                  {b.isStart && <span className="cal-band-lbl" style={{ color: c.text }}>{b.reserva.habitacion ?? `#${b.reserva.id_reserva}`}</span>}
                                </div>
                              );
                            })}
                            {bandas.length > 3 && <span style={{ fontSize: ".45rem", color: "#b8a898", paddingLeft: "2px" }}>+{bandas.length - 3}</span>}
                          </div>
                        )}
                        {hasTt && calTooltip && (
                          <div className="cal-tooltip">
                            <div className="cal-tt-date">{fecha.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long" })}</div>
                            {calTooltip.reservas.map(r => {
                              const c = BAND_COLORS[String(r.estado)] ?? { bg: "rgba(180,170,160,.32)", text: "#7a6e5f" };
                              return (
                                <div key={r.id_reserva} className="cal-tt-item">
                                  <div className="cal-tt-dot" style={{ background: c.bg }}/>
                                  <div>
                                    <div className="cal-tt-num">Reserva #{r.id_reserva}</div>
                                    {r.habitacion && <div className="cal-tt-hab">{r.habitacion}</div>}
                                    <div className="cal-tt-hab">
                                      {new Date(r.fecha_entrada+"T12:00:00").toLocaleDateString("es-PE",{day:"numeric",month:"short"})}
                                      {" → "}
                                      {new Date(r.fecha_salida+"T12:00:00").toLocaleDateString("es-PE",{day:"numeric",month:"short"})}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="cal-stats">
                <div className="cal-stat"><div className="cal-stat-num">{reservasMes.length}</div><div className="cal-stat-lbl">Total en el mes</div></div>
                <div className="cal-stat"><div className="cal-stat-num" style={{color:"#5a9e6f"}}>{statConfirmadas}</div><div className="cal-stat-lbl">Confirmadas</div></div>
                <div className="cal-stat"><div className="cal-stat-num" style={{color:"#e8832a"}}>{statPendientes}</div><div className="cal-stat-lbl">Pendientes</div></div>
                <div className="cal-stat"><div className="cal-stat-num" style={{color:"#6490c8"}}>{statCompletadas}</div><div className="cal-stat-lbl">Completadas</div></div>
                <div className="cal-stat"><div className="cal-stat-num" style={{color:"#b8a898"}}>{statCanceladas}</div><div className="cal-stat-lbl">Canceladas</div></div>
              </div>
            </div>

            {/* ── PANELS ── */}
            <div className="panels-grid">

              {/* Reservas pendientes */}
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
                  <div className="panel-loading"><div className="panel-spin"/></div>
                ) : reservas.length === 0 ? (
                  <div className="panel-empty">
                    <div className="panel-empty-icon">✓</div>
                    <p className="panel-empty-txt">No hay reservas pendientes de confirmación</p>
                  </div>
                ) : (
                  <>
                    <div className="rv-wrap">
                      <table className="rv-table">
                        <thead><tr><th>#</th><th>Huésped</th><th>Entrada</th><th>Hab.</th><th>Total</th><th>Estado</th><th></th></tr></thead>
                        <tbody>
                          {reservas.map(r => (
                            <tr key={r.id_reserva}>
                              <td><span className="rv-id">#{r.id_reserva}</span></td>
                              <td>
                                <div className="rv-guest-name">{r.nombres ? `${r.nombres} ${r.apellidos ?? ""}`.trim() : `Huésped #${r.id_huesped}`}</div>
                                <div className="rv-guest-sub">{r.num_personas} {r.num_personas === 1 ? "persona" : "personas"}</div>
                              </td>
                              <td>
                                <div className="rv-date-in">{fmtFecha(r.fecha_entrada)}</div>
                                <div className="rv-date-out">hasta {fmtFecha(r.fecha_salida)}</div>
                              </td>
                              <td>{r.habitacion ? <span className="rv-hab">{r.habitacion}</span> : <span style={{color:"#ddd5c4",fontSize:".6rem"}}>—</span>}</td>
                              <td><span className="rv-monto">{fmtMoney(r.monto_total)}</span></td>
                              <td><span className="rv-pend">Pendiente</span></td>
                              <td><Link href={`/dashboard/reservas?id=${r.id_reserva}`} className="rv-btn-ver">Ver</Link></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="rv-footer">
                      <Link href="/dashboard/reservas" className="rv-link-all">Ver todas las reservas <span>→</span></Link>
                    </div>
                  </>
                )}
              </div>

              {/* Encuestas */}
              <div className="panel">
                <div className="panel-hd">
                  <div className="panel-hd-left">
                    <div className="panel-hd-icon enc">⭐</div>
                    <span className="panel-hd-title">Encuestas de huéspedes</span>
                  </div>
                  <div className="panel-hd-right">
                    {!loadingE && encuestas.length > 0 && (
                      <span className="panel-badge green">{encuestas.length} respuesta{encuestas.length !== 1 ? "s" : ""}</span>
                    )}
                    <div className="enc-tabs">
                      <button className={`enc-tab${encTab==="lista"?" active":""}`} onClick={() => setEncTab("lista")}>Lista</button>
                      <button className={`enc-tab${encTab==="resumen"?" active":""}`} onClick={() => setEncTab("resumen")}>Resumen</button>
                    </div>
                  </div>
                </div>
                {loadingE ? (
                  <div className="panel-loading"><div className="panel-spin"/></div>
                ) : encuestas.length === 0 ? (
                  <div className="panel-empty">
                    <div className="panel-empty-icon">⭐</div>
                    <p className="panel-empty-txt">Aún no hay encuestas respondidas</p>
                  </div>
                ) : encTab === "lista" ? (
                  <div className="enc-lista">
                    {encuestas.map(e => {
                      const avg    = avgCalif(e);
                      const avgRnd = Math.round(avg);
                      const sc     = avg >= 4.5 ? "#5a9e6f" : avg >= 3.5 ? "#7aab8a" : avg >= 2.5 ? "#c9a96e" : "#e8832a";
                      return (
                        <div key={e.id_encuesta} className="enc-item">
                          <div className="enc-item-top">
                            <div>
                              <div className="enc-guest">{e.nombres ? `${e.nombres} ${e.apellidos ?? ""}`.trim() : `Orden #${e.id_orden_hospedaje}`}</div>
                              <div className="enc-origin">{[e.lugar_origen, e.motivo_viaje].filter(Boolean).join(" · ") || "Sin detalle"}</div>
                            </div>
                            <div className="enc-right">
                              <span className="enc-score" style={{ color: sc }}>{avg.toFixed(1)}</span>
                              <div className="enc-stars">{[1,2,3,4,5].map(n => <span key={n} className={n<=avgRnd?"enc-star-filled":"enc-star-empty"}>★</span>)}</div>
                              <span className={`enc-recom ${e.recomendacion?"yes":"no"}`}>{e.recomendacion?"✓ Recomienda":"✗ No recomienda"}</span>
                            </div>
                          </div>
                          <div className="enc-bars">
                            {([{lbl:"Limpieza",val:e.calificacion_limpieza},{lbl:"Servicio",val:e.calificacion_servicio},{lbl:"Ubicación",val:e.calificacion_ubicacion},{lbl:"Precio",val:e.calificacion_precio}] as const).map(c => (
                              <div key={c.lbl} className="enc-bar-row">
                                <span className="enc-bar-lbl">{c.lbl}</span>
                                <StarBar val={c.val}/>
                              </div>
                            ))}
                          </div>
                          {e.comentarios && <div className="enc-comment">"{e.comentarios}"</div>}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="enc-resumen">
                    {totales && (
                      <>
                        <div className="enc-res-kpis">
                          <div className="enc-kpi"><div className="enc-kpi-num accent">{totales.general.toFixed(1)}</div><div className="enc-kpi-lbl">Prom. general</div></div>
                          <div className="enc-kpi"><div className="enc-kpi-num">{encuestas.length}</div><div className="enc-kpi-lbl">Respuestas</div></div>
                          <div className="enc-kpi"><div className="enc-kpi-num green">{Math.round((totales.recomiendan/encuestas.length)*100)}%</div><div className="enc-kpi-lbl">Recomiendan</div></div>
                        </div>
                        <div className="enc-res-bars">
                          {([{lbl:"Limpieza",val:totales.limpieza},{lbl:"Servicio",val:totales.servicio},{lbl:"Ubicación",val:totales.ubicacion},{lbl:"Precio",val:totales.precio}] as const).map(c => (
                            <div key={c.lbl} className="enc-res-row">
                              <span className="enc-res-lbl">{c.lbl}</span>
                              <div className="enc-res-bar-bg"><div className="enc-res-bar-fill" style={{width:`${(c.val/5)*100}%`}}/></div>
                              <span className="enc-res-val">{c.val.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="enc-recom-card">
                          <div className="enc-recom-card-txt">{totales.recomiendan} de {encuestas.length} huéspedes recomendarían el hostal</div>
                          <div className="enc-recom-card-pct">{Math.round((totales.recomiendan/encuestas.length)*100)}%</div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

            </div>{/* /panels-grid */}
          </div>{/* /dash-scroll */}
        </div>{/* /dash-body */}
      </div>{/* /shell */}
    </>
  );
}