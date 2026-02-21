"use client";

import { useState, FormEvent } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? "Error al iniciar sesión");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Montserrat', sans-serif;
          background-color: #0a0a08;
          overflow: hidden;
        }

        /* ── Panel izquierdo (conservado) ── */
        .login-left {
          flex: 1;
          position: relative;
          display: none;
        }
        @media (min-width: 900px) { .login-left { display: block; } }

        .login-left-bg {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(160deg, rgba(10,10,8,0.55) 0%, rgba(10,10,8,0.2) 60%, rgba(10,10,8,0.7) 100%),
            url('https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80') center/cover no-repeat;
        }

        .login-left-content {
          position: relative;
          z-index: 2;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 3rem;
        }

        .hotel-tagline {
          font-family: 'Cormorant Garamond', serif;
          font-size: 3rem;
          font-weight: 300;
          color: #f5efe6;
          line-height: 1.15;
          letter-spacing: 0.01em;
          margin-bottom: 1rem;
        }
        .hotel-tagline em { font-style: italic; color: #c9a96e; }

        .hotel-divider {
          width: 48px;
          height: 1px;
          background: #c9a96e;
          margin-bottom: 1rem;
        }

        .hotel-subtitle {
          font-size: 0.75rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: rgba(245,239,230,0.6);
          font-weight: 400;
        }

        /* ── Panel derecho ── */
        .login-right {
          width: 100%;
          max-width: 480px;
          background: #f5efe6;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem;
          position: relative;
        }
        @media (min-width: 900px) { .login-right { padding: 4rem 3.5rem; } }

        /* Ornamento */
        .ornament {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.5rem;
        }
        .ornament-line { flex: 1; height: 1px; background: #c9a96e; opacity: 0.5; }
        .ornament-diamond {
          width: 8px; height: 8px;
          border: 1px solid #c9a96e;
          transform: rotate(45deg);
          flex-shrink: 0;
        }

        /* Logo */
        .login-logo { text-align: center; margin-bottom: 2.5rem; }
        .login-logo-icon {
          width: 56px; height: 56px;
          background: linear-gradient(135deg, #1a1a14, #2e2e22);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1rem;
          border: 1.5px solid #c9a96e;
          box-shadow: 0 4px 16px rgba(201,169,110,0.2);
        }
        .login-logo-icon svg { width: 24px; height: 24px; fill: #c9a96e; }

        .login-hotel-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.6rem;
          font-weight: 600;
          color: #1a1a14;
          letter-spacing: 0.04em;
        }
        .login-hotel-sub {
          font-size: 0.65rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #c9a96e;
          margin-top: 0.3rem;
          font-weight: 500;
        }

        .login-form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.1rem;
          font-weight: 400;
          color: #4a4035;
          text-align: center;
          margin-bottom: 2rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-style: italic;
        }

        /* ── Inputs con bordes redondeados ── */
        .field { margin-bottom: 1.25rem; }
        .field label {
          display: block;
          font-size: 0.65rem;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #7a6e5f;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        .field input {
          width: 100%;
          padding: 0.85rem 1.1rem;
          background: #fff;
          border: 1.5px solid #ddd5c4;
          border-radius: 14px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.875rem;
          color: #1a1a14;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field input:focus {
          border-color: #e8832a;
          box-shadow: 0 0 0 4px rgba(232,131,42,0.12);
        }
        .field input::placeholder { color: #b8a898; font-size: 0.8rem; }

        /* ── Error ── */
        .login-error {
          font-size: 0.78rem;
          color: #8b2020;
          background: #fff0f0;
          border: 1px solid #f0d0d0;
          border-left: 3px solid #c0392b;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          margin-bottom: 1.25rem;
        }

        /* ── Botón principal — moderno, redondeado y vibrante ── */
        .login-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #e8832a 0%, #d4451a 100%);
          color: #fff;
          border: none;
          border-radius: 50px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.72rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.75rem;
          box-shadow:
            0 6px 20px rgba(232,131,42,0.45),
            0 2px 6px rgba(0,0,0,0.12),
            inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.18s, box-shadow 0.18s, filter 0.18s;
          position: relative;
          overflow: hidden;
        }
        .login-btn::before {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          transition: left 0.5s;
        }
        .login-btn:hover:not(:disabled)::before { left: 100%; }
        .login-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow:
            0 12px 30px rgba(232,131,42,0.55),
            0 4px 10px rgba(0,0,0,0.15),
            inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .login-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 4px 12px rgba(232,131,42,0.35);
        }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          display: inline-block;
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .login-footer { margin-top: 2.5rem; text-align: center; }
        .login-footer-line {
          display: flex; align-items: center;
          gap: 0.75rem; margin-bottom: 1rem;
        }
        .login-footer-line .ornament-line { opacity: 0.3; }
        .login-footer p {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #b8a898;
        }
      `}</style>

      <div className="login-root">

        {/* Panel izquierdo — conservado */}
        <div className="login-left">
          <div className="login-left-bg" />
          <div className="login-left-content">
            <p className="hotel-tagline">
              Donde cada<br />detalle cuenta<br /><em>una historia.</em>
            </p>
            <div className="hotel-divider" />
            <p className="hotel-subtitle">Trujillo, La Libertad — Perú</p>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="login-right">

          <div className="ornament">
            <div className="ornament-line" />
            <div className="ornament-diamond" />
            <div className="ornament-line" />
          </div>

          <div className="login-logo">
            <div className="login-logo-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.65 10A6 6 0 1 0 11 14.54V17H9v2h2v2h2v-2h2v-2h-2v-2.46A6 6 0 0 0 12.65 10zM7 10a4 4 0 1 1 4 4 4 4 0 0 1-4-4z"/>
              </svg>
            </div>
            <div className="login-hotel-name">Hostal Las Mercedes</div>
            <div className="login-hotel-sub">Panel de Administración</div>
          </div>

          <div className="login-form-title">Acceso al Sistema</div>

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Correo Electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@hotel.com"
              />
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button type="submit" disabled={loading} className="login-btn">
              {loading && <span className="spinner" />}
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>

          <div className="login-footer">
            <div className="login-footer-line">
              <div className="ornament-line" />
              <div className="ornament-diamond" />
              <div className="ornament-line" />
            </div>
            <p>© 2025 Hostal Las Mercedes — Uso interno</p>
          </div>

        </div>
      </div>
    </>
  );
}