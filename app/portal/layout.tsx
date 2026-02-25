"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUser, apiFetch, type Huesped } from "@/lib/portal";

const NAV = [
  { href: "/portal",           label: "Inicio",       icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/portal/reservas",  label: "Mis Reservas", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
  { href: "/portal/hospedaje", label: "Mi Estadía",   icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { href: "/portal/pagos",     label: "Pagos",        icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" },
  { href: "/portal/encuestas", label: "Encuestas",    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" },
  { href: "/portal/perfil",    label: "Mi Perfil",    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [huesped, setHuesped]   = useState<Huesped | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    apiFetch<Huesped>(`/huespedes/${user.id_huesped}`)
      .then(setHuesped).catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const initials    = huesped ? `${huesped.nombres[0]}${huesped.apellidos[0]}`.toUpperCase() : "H";
  const nombreCorto = huesped ? huesped.nombres.split(" ")[0] : "Huésped";

  function isActive(href: string) {
    return href === "/portal"
      ? pathname === "/portal"
      : pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Variables globales ── */
        :root {
          --warm-black:  #1a1a14;
          --orange:      #e8832a;
          --red:         #d4451a;
          --gold:        #c9a96e;
          --ivory:       #f5efe6;
          --bg:          #f0e9df;
          --gray-toast:  #7a6e5f;
          --brown:       #4a4035;
          --beige:       #b8a898;
          --sidebar-w:   252px;
          --nav-h:       68px;
        }

        /* ══════════════════════════════════
           SHELL
        ══════════════════════════════════ */
        .pl-shell {
          min-height: 100vh;
          display: flex;
          background: var(--bg);
          font-family: 'Montserrat', sans-serif;
        }

        /* ══════════════════════════════════
           SIDEBAR
        ══════════════════════════════════ */
        .pl-sidebar {
          display: none;
          width: var(--sidebar-w);
          flex-direction: column;
          background: var(--warm-black);
          border-right: 1px solid rgba(201,169,110,0.2);
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 40;
          overflow: hidden;
        }

        /* Decoraciones de fondo del sidebar */
        .pl-sidebar::before {
          content: '';
          position: absolute;
          top: -80px; right: -80px;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(232,131,42,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .pl-sidebar::after {
          content: '';
          position: absolute;
          bottom: 20px; left: -60px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(201,169,110,0.05) 0%, transparent 70%);
          pointer-events: none;
        }

        @media (min-width: 768px) {
          .pl-sidebar { display: flex; }
        }

        /* ── Logo ── */
        .pl-logo {
          padding: 1.5rem 1.5rem 1.25rem;
          border-bottom: 1px solid rgba(201,169,110,0.12);
          flex-shrink: 0;
          position: relative;
        }
        .pl-logo-row {
          display: flex; align-items: center; gap: 0.9rem;
        }
        .pl-logo-icon {
          width: 42px; height: 42px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, var(--orange) 0%, var(--red) 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(232,131,42,0.4);
        }
        .pl-logo-icon svg { width: 20px; height: 20px; color: #fff; }
        .pl-logo-name {
          font-family: 'Cormorant Garamond', serif;
          color: var(--ivory); font-size: 1.1rem; font-weight: 400;
          line-height: 1.1;
        }
        .pl-logo-name em { font-style: italic; color: var(--gold); }
        .pl-logo-sub {
          font-size: 0.55rem; font-weight: 600;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(201,169,110,0.45); margin-top: 3px;
        }

        /* ── Avatar ── */
        .pl-avatar {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(201,169,110,0.12);
          flex-shrink: 0;
        }
        .pl-avatar-row {
          display: flex; align-items: center; gap: 0.85rem;
        }
        .pl-avatar-circle {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          background: linear-gradient(135deg, rgba(232,131,42,0.25), rgba(212,69,26,0.2));
          border: 1.5px solid rgba(201,169,110,0.3);
          display: flex; align-items: center; justify-content: center;
        }
        .pl-avatar-initials {
          font-size: 0.72rem; font-weight: 700; color: var(--gold);
          letter-spacing: 0.03em;
        }
        .pl-avatar-name {
          font-size: 0.78rem; font-weight: 600; color: var(--ivory);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .pl-avatar-email {
          font-size: 0.6rem; color: rgba(201,169,110,0.45);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin-top: 1px;
        }

        /* ── Ornamento ── */
        .pl-ornament {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.75rem 1.5rem 0.4rem;
          flex-shrink: 0;
        }
        .pl-orn-line { flex: 1; height: 1px; background: var(--gold); opacity: 0.2; }
        .pl-orn-diamond {
          width: 6px; height: 6px;
          border: 1px solid var(--gold); opacity: 0.5;
          transform: rotate(45deg);
        }

        /* ── Nav ── */
        .pl-nav {
          flex: 1; overflow-y: auto;
          padding: 0.25rem 0.75rem 0.5rem;
          display: flex; flex-direction: column; gap: 2px;
        }
        .pl-nav::-webkit-scrollbar { width: 3px; }
        .pl-nav::-webkit-scrollbar-thumb { background: rgba(201,169,110,0.15); border-radius: 99px; }

        .pl-nav-link {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.65rem 0.9rem;
          border-radius: 12px;
          text-decoration: none;
          font-size: 0.74rem; font-weight: 500;
          letter-spacing: 0.02em;
          color: rgba(201,169,110,0.4);
          border: 1px solid transparent;
          transition: all 0.28s cubic-bezier(0.22,1,0.36,1);
          position: relative;
        }
        .pl-nav-link:hover {
          color: rgba(245,239,230,0.8);
          background: rgba(201,169,110,0.06);
        }
        .pl-nav-link.active {
          color: var(--ivory);
          background: rgba(232,131,42,0.1);
          border-color: rgba(232,131,42,0.2);
        }
        .pl-nav-link svg { width: 15px; height: 15px; flex-shrink: 0; }
        .pl-nav-link:hover svg { color: var(--gold); }
        .pl-nav-link.active svg { color: var(--orange); }

        .pl-nav-dot {
          margin-left: auto; flex-shrink: 0;
          width: 5px; height: 5px; border-radius: 50%;
          background: var(--orange);
          box-shadow: 0 0 8px rgba(232,131,42,0.7);
        }

        /* ── Logout ── */
        .pl-logout {
          padding: 0.75rem;
          border-top: 1px solid rgba(201,169,110,0.1);
          flex-shrink: 0;
        }
        .pl-logout-btn {
          width: 100%;
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.65rem 0.9rem;
          border-radius: 12px;
          background: transparent;
          border: 1px solid transparent;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.72rem; font-weight: 500;
          color: rgba(201,169,110,0.35);
          transition: all 0.28s cubic-bezier(0.22,1,0.36,1);
        }
        .pl-logout-btn svg { width: 15px; height: 15px; }
        /* Botón secundario según spec: borde dorado, hover rojo */
        .pl-logout-btn:hover {
          color: var(--red);
          background: rgba(212,69,26,0.07);
          border-color: rgba(212,69,26,0.15);
        }

        /* ══════════════════════════════════
           NAVBAR MOBILE (altura 68px según spec)
        ══════════════════════════════════ */
        .pl-topbar {
          display: flex;
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          height: var(--nav-h);
          background: var(--warm-black);
          border-bottom: 1px solid rgba(201,169,110,0.25);
          align-items: center;
          padding: 0 1.25rem;
          justify-content: space-between;
        }
        @media (min-width: 768px) {
          .pl-topbar { display: none; }
        }

        .pl-topbar-brand {
          display: flex; align-items: center; gap: 0.7rem;
        }
        .pl-topbar-icon {
          width: 36px; height: 36px; border-radius: 50%;
          background: linear-gradient(135deg, var(--orange), var(--red));
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 3px 10px rgba(232,131,42,0.4);
        }
        .pl-topbar-icon svg { width: 18px; height: 18px; color: white; }
        .pl-topbar-name {
          font-family: 'Cormorant Garamond', serif;
          color: var(--ivory); font-size: 1rem; font-weight: 400;
        }
        .pl-topbar-name em { font-style: italic; color: var(--gold); }

        .pl-topbar-right {
          display: flex; align-items: center; gap: 0.75rem;
        }
        .pl-topbar-avatar {
          width: 34px; height: 34px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(232,131,42,0.3), rgba(212,69,26,0.25));
          border: 1.5px solid rgba(201,169,110,0.3);
          display: flex; align-items: center; justify-content: center;
        }
        .pl-topbar-avatar span {
          font-size: 0.63rem; font-weight: 700; color: var(--gold);
        }
        .pl-topbar-menu {
          background: none; border: none; cursor: pointer;
          color: rgba(201,169,110,0.55); padding: 4px;
          display: flex; align-items: center;
          transition: color 0.2s;
        }
        .pl-topbar-menu:hover { color: var(--gold); }
        .pl-topbar-menu svg { width: 20px; height: 20px; }

        /* ── Mobile dropdown ── */
        .pl-mob-overlay {
          position: fixed; inset: 0; z-index: 45;
          background: rgba(26,26,20,0.5);
          backdrop-filter: blur(3px);
        }
        .pl-mob-menu {
          position: fixed;
          top: var(--nav-h); left: 0; right: 0;
          z-index: 46;
          background: var(--warm-black);
          border-bottom: 1px solid rgba(201,169,110,0.18);
          padding: 0.6rem 0.85rem 1rem;
          animation: menuSlide 0.22s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes menuSlide {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .pl-mob-link {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.7rem 0.9rem;
          border-radius: 10px;
          text-decoration: none;
          font-size: 0.76rem; font-weight: 500;
          color: rgba(201,169,110,0.45);
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        .pl-mob-link svg { width: 15px; height: 15px; flex-shrink: 0; }
        .pl-mob-link:hover { color: var(--ivory); background: rgba(201,169,110,0.06); }
        .pl-mob-link.active {
          color: var(--ivory);
          background: rgba(232,131,42,0.1);
          border-color: rgba(232,131,42,0.2);
        }
        .pl-mob-link.active svg { color: var(--orange); }
        .pl-mob-sep { height: 1px; background: rgba(201,169,110,0.1); margin: 0.5rem 0.9rem; }
        .pl-mob-logout {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.7rem 0.9rem;
          border-radius: 10px;
          background: none; border: 1px solid transparent; cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.74rem; font-weight: 500;
          color: rgba(212,69,26,0.6);
          width: 100%; transition: all 0.2s;
        }
        .pl-mob-logout svg { width: 15px; height: 15px; }
        .pl-mob-logout:hover { color: var(--red); background: rgba(212,69,26,0.07); border-color: rgba(212,69,26,0.15); }

        /* ══════════════════════════════════
           MAIN
        ══════════════════════════════════ */
        .pl-main {
          flex: 1;
          padding-top: var(--nav-h);
          background: var(--bg);
          background-image:
            radial-gradient(ellipse at 5% 5%, rgba(201,169,110,0.07) 0%, transparent 45%),
            radial-gradient(ellipse at 95% 95%, rgba(232,131,42,0.04) 0%, transparent 45%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c9a96e' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          min-height: 100vh;
        }
        @media (min-width: 768px) {
          .pl-main {
            margin-left: var(--sidebar-w);
            padding-top: 0;
          }
        }
        .pl-content {
          padding: 2rem 1.25rem 3rem;
          max-width: 980px;
          margin: 0 auto;
        }
        @media (min-width: 640px) {
          .pl-content { padding: 2.5rem 2rem 3rem; }
        }
      `}</style>

      <div className="pl-shell">

        {/* ══ SIDEBAR ══ */}
        <aside className="pl-sidebar">
          {/* Logo */}
          <div className="pl-logo">
            <div className="pl-logo-row">
              <div className="pl-logo-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <div className="pl-logo-name">Hostal <em>Las Mercedes</em></div>
                <div className="pl-logo-sub">Portal del Huésped</div>
              </div>
            </div>
          </div>

          {/* Avatar */}
          <div className="pl-avatar">
            <div className="pl-avatar-row">
              <div className="pl-avatar-circle">
                <span className="pl-avatar-initials">{initials}</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="pl-avatar-name">{nombreCorto}</div>
                <div className="pl-avatar-email">{huesped?.email_login ?? ""}</div>
              </div>
            </div>
          </div>

          {/* Ornamento */}
          <div className="pl-ornament">
            <div className="pl-orn-line" />
            <div className="pl-orn-diamond" />
            <div className="pl-orn-line" />
          </div>

          {/* Nav */}
          <nav className="pl-nav">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`pl-nav-link${isActive(item.href) ? " active" : ""}`}
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                </svg>
                {item.label}
                {isActive(item.href) && <div className="pl-nav-dot" />}
              </Link>
            ))}
          </nav>

          {/* Logout */}
          <div className="pl-logout">
            <button className="pl-logout-btn" onClick={handleLogout}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* ══ TOPBAR MOBILE ══ */}
        <header className="pl-topbar">
          <div className="pl-topbar-brand">
            <div className="pl-topbar-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <span className="pl-topbar-name">Hostal <em>Las Mercedes</em></span>
          </div>
          <div className="pl-topbar-right">
            <div className="pl-topbar-avatar"><span>{initials}</span></div>
            <button className="pl-topbar-menu" onClick={() => setMenuOpen(!menuOpen)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </header>

        {/* Mobile menu */}
        {menuOpen && (
          <>
            <div className="pl-mob-overlay" onClick={() => setMenuOpen(false)} />
            <nav className="pl-mob-menu">
              {NAV.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`pl-mob-link${isActive(item.href) ? " active" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
              <div className="pl-mob-sep" />
              <button className="pl-mob-logout" onClick={handleLogout}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </nav>
          </>
        )}

        {/* ══ MAIN ══ */}
        <main className="pl-main">
          <div className="pl-content">{children}</div>
        </main>

      </div>
    </>
  );
}