"use client";

import { useState, FormEvent } from "react";

type Mode = "login" | "register";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Register state
  const [regNombre, setRegNombre] = useState("");
  const [regApellido, setRegApellido] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regDocumento, setRegDocumento] = useState("");
  const [regTelefono, setRegTelefono] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // ── Hint visible state
  const [showHint, setShowHint] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
        
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Error al iniciar sesión"); return; }
      window.location.href = "/dashboard";
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombres: regNombre,
          apellidos: regApellido,
          email: regEmail,
          num_documento: regDocumento,
          telefono: regTelefono,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? "Error al registrarse"); return; }
      setSuccess("¡Cuenta creada! Ya puedes iniciar sesión.");
      setMode("login");
      setEmail(regEmail);
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

        /* ── Panel izquierdo ── */
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

        .hotel-divider { width: 48px; height: 1px; background: #c9a96e; margin-bottom: 1rem; }

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
          padding: 2.5rem;
          position: relative;
          overflow-y: auto;
        }
        @media (min-width: 900px) { .login-right { padding: 3rem 3.5rem; } }

        /* ── Ornament ── */
        .ornament {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }
        .ornament-line { flex: 1; height: 1px; background: #c9a96e; opacity: 0.5; }
        .ornament-diamond {
          width: 8px; height: 8px;
          border: 1px solid #c9a96e;
          transform: rotate(45deg);
          flex-shrink: 0;
        }

        /* ── Logo ── */
        .login-logo { text-align: center; margin-bottom: 1.75rem; }
        .login-logo-icon {
          width: 52px; height: 52px;
          background: linear-gradient(135deg, #1a1a14, #2e2e22);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 0.85rem;
          border: 1.5px solid #c9a96e;
          box-shadow: 0 4px 16px rgba(201,169,110,0.2);
        }
        .login-logo-icon svg { width: 24px; height: 24px; fill: #c9a96e; }
        .login-hotel-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #1a1a14;
          letter-spacing: 0.04em;
        }
        .login-hotel-sub {
          font-size: 0.62rem;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #c9a96e;
          margin-top: 0.25rem;
          font-weight: 500;
        }

        /* ── Mode Toggle Pill ── */
        .mode-toggle {
          display: flex;
          background: #ede7db;
          border-radius: 50px;
          padding: 4px;
          margin-bottom: 1.75rem;
          position: relative;
        }
        .mode-toggle-btn {
          flex: 1;
          padding: 0.6rem 1rem;
          border: none;
          background: transparent;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 600;
          color: #9a8c7a;
          cursor: pointer;
          border-radius: 50px;
          transition: color 0.25s;
          position: relative;
          z-index: 1;
        }
        .mode-toggle-btn.active { color: #1a1a14; }
        .mode-toggle-slider {
          position: absolute;
          top: 4px; bottom: 4px;
          width: calc(50% - 4px);
          background: #fff;
          border-radius: 50px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
        }
        .mode-toggle-slider.register { transform: translateX(calc(100% + 0px)); }

        /* ── Form title ── */
        .login-form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-weight: 400;
          color: #4a4035;
          text-align: center;
          margin-bottom: 1.5rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-style: italic;
        }

        /* ── Fields ── */
        .field { margin-bottom: 1.1rem; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1.1rem; }

        .field label {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.62rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #7a6e5f;
          margin-bottom: 0.45rem;
          font-weight: 500;
        }
        .field label .credential-badge {
          background: linear-gradient(135deg, #e8832a, #d4451a);
          color: #fff;
          font-size: 0.5rem;
          letter-spacing: 0.12em;
          padding: 2px 6px;
          border-radius: 20px;
          font-weight: 700;
          text-transform: uppercase;
        }

        .field input {
          width: 100%;
          padding: 0.8rem 1rem;
          background: #fff;
          border: 1.5px solid #ddd5c4;
          border-radius: 14px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.85rem;
          color: #1a1a14;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .field input:focus {
          border-color: #e8832a;
          box-shadow: 0 0 0 4px rgba(232,131,42,0.12);
        }
        .field input::placeholder { color: #b8a898; font-size: 0.78rem; }

        /* ── Hint box ── */
        .hint-toggle-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          color: #c9a96e;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 1rem;
          padding: 0;
          transition: color 0.2s;
        }
        .hint-toggle-btn:hover { color: #e8832a; }
        .hint-toggle-btn svg { transition: transform 0.3s; }
        .hint-toggle-btn.open svg { transform: rotate(180deg); }

        .hint-box {
          background: linear-gradient(135deg, #1a1a14 0%, #2a2a1e 100%);
          border-radius: 16px;
          padding: 1.1rem 1.25rem;
          margin-bottom: 1.25rem;
          border: 1px solid rgba(201,169,110,0.3);
          overflow: hidden;
          max-height: 0;
          opacity: 0;
          transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s, padding 0.3s;
          padding-top: 0; padding-bottom: 0;
        }
        .hint-box.open {
          max-height: 200px;
          opacity: 1;
          padding: 1.1rem 1.25rem;
        }

        .hint-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem;
          color: #c9a96e;
          font-weight: 600;
          letter-spacing: 0.06em;
          margin-bottom: 0.6rem;
          font-style: italic;
        }
        .hint-row {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          margin-bottom: 0.45rem;
        }
        .hint-icon {
          width: 20px; height: 20px;
          background: rgba(201,169,110,0.15);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }
        .hint-icon svg { width: 10px; height: 10px; fill: #c9a96e; }
        .hint-text {
          font-size: 0.72rem;
          color: rgba(245,239,230,0.75);
          line-height: 1.5;
        }
        .hint-text strong { color: #f5efe6; font-weight: 600; }

        /* ── Error / Success ── */
        .login-error {
          font-size: 0.76rem;
          color: #8b2020;
          background: #fff0f0;
          border: 1px solid #f0d0d0;
          border-left: 3px solid #c0392b;
          border-radius: 10px;
          padding: 0.7rem 1rem;
          margin-bottom: 1rem;
        }
        .login-success {
          font-size: 0.76rem;
          color: #1a5c2a;
          background: #f0fff4;
          border: 1px solid #c3e6cb;
          border-left: 3px solid #28a745;
          border-radius: 10px;
          padding: 0.7rem 1rem;
          margin-bottom: 1rem;
        }

        /* ── Button ── */
        .login-btn {
          width: 100%;
          padding: 1rem 1.5rem;
          background: linear-gradient(135deg, #e8832a 0%, #d4451a 100%);
          color: #fff;
          border: none;
          border-radius: 50px;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.7rem;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-weight: 700;
          cursor: pointer;
          margin-top: 0.5rem;
          box-shadow: 0 6px 20px rgba(232,131,42,0.4), inset 0 1px 0 rgba(255,255,255,0.2);
          transition: transform 0.18s, box-shadow 0.18s;
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
          box-shadow: 0 12px 30px rgba(232,131,42,0.5), inset 0 1px 0 rgba(255,255,255,0.2);
        }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          display: inline-block;
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .login-footer { margin-top: 1.75rem; text-align: center; }
        .login-footer-line {
          display: flex; align-items: center;
          gap: 0.75rem; margin-bottom: 0.85rem;
        }
        .login-footer-line .ornament-line { opacity: 0.3; }
        .login-footer p {
          font-size: 0.62rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #b8a898;
        }
      `}</style>

      <div className="login-root">

        {/* Panel izquierdo */}
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

          {/* Logo */}
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.65 10A6 6 0 1 0 11 14.54V17H9v2h2v2h2v-2h2v-2h-2v-2.46A6 6 0 0 0 12.65 10zM7 10a4 4 0 1 1 4 4 4 4 0 0 1-4-4z"/>
              </svg>
            </div>
            <div className="login-hotel-name">Hostal Las Mercedes</div>
            <div className="login-hotel-sub">Portal de Huéspedes</div>
          </div>

          {/* Toggle pill */}
          <div className="mode-toggle">
            <div className={`mode-toggle-slider ${mode === "register" ? "register" : ""}`} />
            <button
              className={`mode-toggle-btn ${mode === "login" ? "active" : ""}`}
              onClick={() => { setMode("login"); setError(""); setSuccess(""); }}
            >
              Iniciar Sesión
            </button>
            <button
              className={`mode-toggle-btn ${mode === "register" ? "active" : ""}`}
              onClick={() => { setMode("register"); setError(""); setSuccess(""); }}
            >
              Registrarse
            </button>
          </div>

          {/* ── Hint toggle ── */}
          <button
            className={`hint-toggle-btn ${showHint ? "open" : ""}`}
            onClick={() => setShowHint(v => !v)}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            {mode === "login" ? "¿Cuáles son mis credenciales?" : "¿Cómo se crean mis credenciales?"}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Hint box */}
          <div className={`hint-box ${showHint ? "open" : ""}`}>
            {mode === "login" ? (
              <>
                <div className="hint-title">Sus credenciales de acceso</div>
                <div className="hint-row">
                  <div className="hint-icon">
                    <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  </div>
                  <div className="hint-text"><strong>Usuario:</strong> Su correo electrónico registrado en el hostal</div>
                </div>
                <div className="hint-row">
                  <div className="hint-icon">
                    <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  </div>
                  <div className="hint-text"><strong>Contraseña:</strong> Su número de documento de identidad (DNI)</div>
                </div>
              </>
            ) : (
              <>
                <div className="hint-title">¿Cómo funcionan sus credenciales?</div>
                <div className="hint-row">
                  <div className="hint-icon">
                    <svg viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                  </div>
                  <div className="hint-text">El <strong>correo que ingrese</strong> será su usuario para iniciar sesión</div>
                </div>
                <div className="hint-row">
                  <div className="hint-icon">
                    <svg viewBox="0 0 24 24"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  </div>
                  <div className="hint-text">Su <strong>número de documento</strong> será su contraseña automáticamente</div>
                </div>
              </>
            )}
          </div>

          {/* Form title */}
          <div className="login-form-title">
            {mode === "login" ? "Acceso al Sistema" : "Crear una Cuenta"}
          </div>

          {/* ── LOGIN FORM ── */}
          {mode === "login" && (
            <form onSubmit={handleLogin}>
              <div className="field">
                <label>
                  Correo Electrónico
                  <span className="credential-badge">Usuario</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@hotel.com"
                />
              </div>
              <div className="field">
                <label>
                  Contraseña
                  <span className="credential-badge">N° Documento</span>
                </label>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su número de documento"
                />
              </div>
              {error && <div className="login-error">{error}</div>}
              {success && <div className="login-success">{success}</div>}
              <button type="submit" disabled={loading} className="login-btn">
                {loading && <span className="spinner" />}
                {loading ? "Verificando..." : "Ingresar"}
              </button>
            </form>
          )}

          {/* ── REGISTER FORM ── */}
          {mode === "register" && (
            <form onSubmit={handleRegister}>
              <div className="field-row">
                <div className="field">
                  <label>Nombres</label>
                  <input
                    type="text"
                    required
                    value={regNombre}
                    onChange={(e) => setRegNombre(e.target.value)}
                    placeholder="Carlos"
                  />
                </div>
                <div className="field">
                  <label>Apellidos</label>
                  <input
                    type="text"
                    required
                    value={regApellido}
                    onChange={(e) => setRegApellido(e.target.value)}
                    placeholder="Ramírez Torres"
                  />
                </div>
              </div>
              <div className="field">
                <label>
                  Correo Electrónico
                  <span className="credential-badge">Será su usuario</span>
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="field">
                <label>
                  Número de Documento (DNI)
                  <span className="credential-badge">Será su contraseña</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={regDocumento}
                  onChange={(e) => setRegDocumento(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ej: 45678901"
                />
              </div>
              <div className="field">
                <label>Teléfono</label>
                <input
                  type="tel"
                  value={regTelefono}
                  onChange={(e) => setRegTelefono(e.target.value)}
                  placeholder="987 654 399"
                />
              </div>
              {error && <div className="login-error">{error}</div>}
              {success && <div className="login-success">{success}</div>}
              <button type="submit" disabled={loading} className="login-btn">
                {loading && <span className="spinner" />}
                {loading ? "Registrando..." : "Crear Cuenta"}
              </button>
            </form>
          )}

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