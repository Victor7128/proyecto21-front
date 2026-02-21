"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Usuario {
  id_personal: number;
  nombre: string;
  email: string | null;
  rol: string;
  activo: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("No autorizado");
        return res.json();
      })
      .then((data) => setUsuario(data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const cards = [
    { label: "Reservas",     icon: "🗓️", href: "/dashboard/reservas",     accent: "#e8832a", grad: "linear-gradient(135deg,#e8832a,#d4451a)", desc: "Gestiona las reservas activas" },
    { label: "Habitaciones", icon: "🛏️", href: "/dashboard/habitaciones", accent: "#2a7ae8", grad: "linear-gradient(135deg,#2a7ae8,#1a4fd4)", desc: "Estado y disponibilidad" },
    { label: "Huéspedes",    icon: "👤", href: "/dashboard/huespedes",     accent: "#8b2ae8", grad: "linear-gradient(135deg,#8b2ae8,#5a1ad4)", desc: "Registro de huéspedes" },
    { label: "Pagos",        icon: "💳", href: "/dashboard/pagos",         accent: "#c9a96e", grad: "linear-gradient(135deg,#c9a96e,#a07840)", desc: "Control de facturación" },
    { label: "Personal",     icon: "🧑‍💼", href: "/dashboard/personal",     accent: "#d4451a", grad: "linear-gradient(135deg,#d4451a,#a02810)", desc: "Administración del equipo" },
    { label: "Conserjería",  icon: "🛎️", href: "/dashboard/conserjeria",   accent: "#2ab5a0", grad: "linear-gradient(135deg,#2ab5a0,#1a8070)", desc: "Solicitudes y servicios" },
    { label: "Hospedaje",    icon: "🏨", href: "/dashboard/hospedaje",     accent: "#1a7ad4", grad: "linear-gradient(135deg,#1a7ad4,#0a50a0)", desc: "Control de estadías" },
  ];

  if (loading) {
    return (
      <>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Montserrat:wght@300;400;500;600;700&display=swap');
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          .loading-root { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#f0e9df; font-family:'Montserrat',sans-serif; }
          .loading-spinner { width:40px; height:40px; border:3px solid rgba(201,169,110,0.25); border-top-color:#e8832a; border-radius:50%; animation:spin 0.8s linear infinite; margin:0 auto 1rem; }
          .loading-text { font-size:0.65rem; letter-spacing:0.25em; text-transform:uppercase; color:#7a6e5f; text-align:center; }
          @keyframes spin { to { transform:rotate(360deg); } }
        `}</style>
        <div className="loading-root">
          <div><div className="loading-spinner"/><p className="loading-text">Cargando...</p></div>
        </div>
      </>
    );
  }

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
        .dash-main { max-width:1280px; margin:0 auto; padding:3rem 2rem; }

        .ornament { display:flex; align-items:center; gap:0.75rem; margin-bottom:0.5rem; }
        .ornament-line { flex:1; height:1px; background:#c9a96e; opacity:0.35; }
        .ornament-diamond { width:7px; height:7px; border:1px solid #c9a96e; transform:rotate(45deg); opacity:0.7; }

        .dash-header { margin-bottom:3rem; }
        .dash-welcome { font-family:'Cormorant Garamond',serif; font-size:2.2rem; font-weight:300; color:#1a1a14; line-height:1.2; margin-bottom:0.4rem; }
        .dash-welcome em { font-style:italic; color:#e8832a; }
        .dash-subtitle { font-size:0.72rem; letter-spacing:0.18em; text-transform:uppercase; color:#7a6e5f; }

        /* ── Grid asimétrico ── */
        .dash-grid {
          display:grid;
          grid-template-columns:repeat(12,1fr);
          gap:1.25rem;
        }
        .dash-card-wrap:nth-child(1) { grid-column:span 7; }
        .dash-card-wrap:nth-child(2) { grid-column:span 5; }
        .dash-card-wrap:nth-child(3) { grid-column:span 4; }
        .dash-card-wrap:nth-child(4) { grid-column:span 4; }
        .dash-card-wrap:nth-child(5) { grid-column:span 4; }
        .dash-card-wrap:nth-child(6) { grid-column:span 5; }
        .dash-card-wrap:nth-child(7) { grid-column:span 7; }

        @media (max-width:900px)  { .dash-card-wrap:nth-child(n) { grid-column:span 6; } }
        @media (max-width:580px)  { .dash-card-wrap:nth-child(n) { grid-column:span 12; } }

        /* ── Card ── */
        .dash-card {
          display:flex; flex-direction:column; justify-content:space-between;
          padding:2rem 1.75rem; min-height:170px;
          background:#fff;
          border:1px solid rgba(201,169,110,0.15);
          border-radius:24px;
          text-decoration:none;
          position:relative; overflow:hidden;
          cursor:pointer;
          animation:cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both;
          transition:
            transform 0.3s cubic-bezier(0.22,1,0.36,1),
            box-shadow 0.3s cubic-bezier(0.22,1,0.36,1),
            background 0.3s;
          will-change: transform;
        }

        /* Entrada escalonada */
        .dash-card-wrap:nth-child(1) .dash-card { animation-delay:0.05s; }
        .dash-card-wrap:nth-child(2) .dash-card { animation-delay:0.1s; }
        .dash-card-wrap:nth-child(3) .dash-card { animation-delay:0.15s; }
        .dash-card-wrap:nth-child(4) .dash-card { animation-delay:0.2s; }
        .dash-card-wrap:nth-child(5) .dash-card { animation-delay:0.25s; }
        .dash-card-wrap:nth-child(6) .dash-card { animation-delay:0.3s; }
        .dash-card-wrap:nth-child(7) .dash-card { animation-delay:0.35s; }

        @keyframes cardIn {
          from { opacity:0; transform:translateY(28px) scale(0.96); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }

        /* Blob decorativo */
        .dash-card::before {
          content:''; position:absolute;
          bottom:-50px; right:-50px;
          width:160px; height:160px;
          border-radius:50%;
          background:var(--grad);
          opacity:0.07;
          transition:opacity 0.35s, transform 0.45s cubic-bezier(0.22,1,0.36,1);
        }

        /* Línea top acento */
        .dash-card::after {
          content:''; position:absolute;
          top:0; left:0; right:0; height:3px;
          background:var(--grad);
          opacity:0;
          border-radius:24px 24px 0 0;
          transition:opacity 0.25s;
        }

        /* ── Hover ── */
        .dash-card:hover {
          transform:translateY(-7px) scale(1.012);
          box-shadow:
            0 24px 56px rgba(26,26,20,0.14),
            0 8px 18px rgba(26,26,20,0.08),
            0 0 0 1.5px var(--accent);
          background:#fffdf9;
        }
        .dash-card:hover::before { opacity:0.15; transform:scale(1.35) rotate(10deg); }
        .dash-card:hover::after  { opacity:1; }
        .dash-card:hover .card-icon-wrap { transform:rotate(-8deg) scale(1.18); box-shadow:0 8px 20px var(--accent-shadow); }
        .dash-card:hover .card-arrow { transform:translate(4px,-4px); opacity:1; }
        .dash-card:hover .card-label { color:var(--accent); }
        .dash-card:hover .card-cta   { opacity:1; transform:translateY(0); }

        /* ── Click ── */
        .dash-card:active { transform:translateY(-2px) scale(0.975); box-shadow:0 6px 18px rgba(26,26,20,0.1); transition:transform 0.1s,box-shadow 0.1s; }
        .card-pop { animation:popEffect 0.4s cubic-bezier(0.22,1,0.36,1) !important; }
        @keyframes popEffect {
          0%  { transform:scale(1); }
          35% { transform:scale(0.95) translateY(3px); }
          65% { transform:scale(1.04) translateY(-5px); }
          100%{ transform:scale(1) translateY(-7px); }
        }

        /* Contenido */
        .card-top { display:flex; align-items:flex-start; justify-content:space-between; }
        .card-icon-wrap {
          width:54px; height:54px; border-radius:16px;
          display:flex; align-items:center; justify-content:center;
          font-size:1.5rem;
          background:var(--accent-bg);
          transition:transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s;
          flex-shrink:0;
        }
        .card-arrow { font-size:1rem; color:var(--accent); opacity:0; transition:transform 0.25s,opacity 0.25s; align-self:flex-start; margin-top:2px; }
        .card-bottom { margin-top:1.25rem; }
        .card-label { font-size:1rem; font-weight:700; color:#1a1a14; letter-spacing:0.01em; transition:color 0.2s; margin-bottom:0.3rem; }
        .card-desc { font-size:0.7rem; color:#b8a898; letter-spacing:0.03em; line-height:1.5; }
        .card-cta {
          display:inline-flex; align-items:center; gap:0.4rem;
          margin-top:0.9rem;
          font-size:0.62rem; letter-spacing:0.18em; text-transform:uppercase; font-weight:700;
          color:var(--accent); opacity:0;
          transition:opacity 0.25s,transform 0.25s;
          transform:translateY(6px);
        }
      `}</style>

      <div className="dash-root">

        {/* Navbar */}
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
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"/>
                </svg>
                Salir
              </button>
            </div>
          </div>
        </header>

        {/* Main */}
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

          <div className="dash-grid">
            {cards.map((item) => (
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
        </main>
      </div>
    </>
  );
}