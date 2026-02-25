"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type TipoUsuario = "personal" | "huesped";

export default function LoginPage() {
  const router = useRouter();
  const [tipo, setTipo]         = useState<TipoUsuario>("personal");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, tipo }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Credenciales incorrectas."); return; }
      router.push(tipo === "personal" ? "/dashboard" : "/portal");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          display: flex;
          font-family: 'Montserrat', sans-serif;
          background: #1a1a14;
        }

        /* ═══════════════════════════════
           PANEL IMAGEN (izquierda)
        ═══════════════════════════════ */
        .lp-image-panel {
          flex: 0 0 48%;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .lp-image-panel img {
          position: absolute;
          inset: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          object-position: center;
          animation: imgZoom 18s ease-in-out infinite alternate;
        }
        @keyframes imgZoom {
          from { transform: scale(1); }
          to   { transform: scale(1.06); }
        }

        /* capas de overlay */
        .lp-image-panel::before {
          content: '';
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(
            to bottom,
            rgba(26,26,20,0.35) 0%,
            rgba(26,26,20,0.10) 40%,
            rgba(26,26,20,0.55) 75%,
            rgba(26,26,20,0.90) 100%
          );
        }
        .lp-image-panel::after {
          content: '';
          position: absolute; inset: 0; z-index: 1;
          background: radial-gradient(ellipse at 30% 60%, rgba(201,169,110,0.12) 0%, transparent 65%);
        }

        /* contenido sobre la imagen */
        .lp-image-content {
          position: relative; z-index: 2;
          padding: 2.5rem 3rem 3rem;
        }

        .lp-image-logo {
          position: absolute;
          top: 2.5rem; left: 3rem; z-index: 2;
          display: flex; align-items: center; gap: 0.85rem;
        }
        .lp-image-logo-icon {
          width: 44px; height: 44px; border-radius: 50%;
          background: linear-gradient(135deg, #e8832a, #d4451a);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(232,131,42,0.5);
        }
        .lp-image-logo-icon svg { width: 22px; height: 22px; color: #fff; }
        .lp-image-logo-name {
          font-family: 'Cormorant Garamond', serif;
          color: #f5efe6;
          font-size: 1.25rem; font-weight: 400;
          text-shadow: 0 2px 12px rgba(26,26,20,0.6);
        }
        .lp-image-logo-name em { font-style: italic; color: #c9a96e; }

        .lp-ornament-top {
          display: flex; align-items: center; gap: 0.6rem;
          margin-bottom: 1.25rem;
        }
        .lp-orn-line { flex: 0 0 32px; height: 1px; background: rgba(201,169,110,0.6); }
        .lp-orn-diamond {
          width: 6px; height: 6px;
          border: 1px solid rgba(201,169,110,0.9);
          transform: rotate(45deg);
        }
        .lp-orn-text {
          font-size: 0.58rem; font-weight: 600;
          letter-spacing: 0.25em; text-transform: uppercase;
          color: rgba(201,169,110,0.8);
        }

        .lp-image-quote {
          font-family: 'Cormorant Garamond', serif;
          font-style: italic; font-weight: 300;
          font-size: 2.1rem; line-height: 1.25;
          color: #f5efe6;
          text-shadow: 0 2px 24px rgba(26,26,20,0.7);
          margin-bottom: 1rem;
        }
        .lp-image-quote strong {
          font-weight: 600; font-style: normal;
          color: #c9a96e;
        }

        .lp-image-location {
          font-size: 0.62rem; font-weight: 500;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: rgba(245,239,230,0.55);
        }

        /* estrellas decorativas */
        .lp-stars {
          display: flex; gap: 4px; margin-bottom: 1rem;
        }
        .lp-star {
          width: 12px; height: 12px;
          fill: #c9a96e; opacity: 0.85;
        }

        /* franja decorativa lateral derecha de la imagen */
        .lp-image-side-decor {
          position: absolute;
          right: 0; top: 0; bottom: 0;
          width: 1px;
          background: linear-gradient(
            to bottom,
            transparent,
            rgba(201,169,110,0.4) 30%,
            rgba(201,169,110,0.4) 70%,
            transparent
          );
          z-index: 3;
        }

        /* ═══════════════════════════════
           PANEL FORMULARIO (derecha)
        ═══════════════════════════════ */
        .lp-form-panel {
          flex: 1;
          background: #f5efe6;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow-y: auto;
          position: relative;
        }

        /* textura sutil */
        .lp-form-panel::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c9a96e' fill-opacity='0.035' fill-rule='evenodd'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5zM0 20h2v20H0V20zm4 0h2v20H4V20zm4 0h2v20H8V20zm4 0h2v20h-2V20zm4 0h2v20h-2V20zm4 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2zm0 4h20v2H20v-2z'/%3E%3C/g%3E%3C/svg%3E");
        }

        .lp-form-inner {
          position: relative;
          padding: 3rem 3.5rem;
          max-width: 480px;
          width: 100%;
          margin: 0 auto;
          animation: slideInRight 0.65s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .lp-form-eyebrow {
          font-size: 0.6rem; font-weight: 700;
          letter-spacing: 0.3em; text-transform: uppercase;
          color: #e8832a; margin-bottom: 0.5rem;
        }
        .lp-form-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.8rem; font-weight: 600;
          color: #1a1a14; line-height: 1;
          margin-bottom: 0.35rem;
        }
        .lp-form-title em { font-style: italic; color: #c9a96e; }
        .lp-form-subtitle {
          font-size: 0.7rem; font-weight: 400;
          color: #7a6e5f; letter-spacing: 0.08em;
          margin-bottom: 2rem;
        }

        /* separador */
        .lp-sep {
          display: flex; align-items: center; gap: 0.7rem;
          margin-bottom: 1.75rem;
        }
        .lp-sep-line { flex: 1; height: 1px; background: rgba(201,169,110,0.3); }
        .lp-sep-diamond {
          width: 6px; height: 6px;
          border: 1px solid rgba(201,169,110,0.7);
          transform: rotate(45deg);
        }

        /* TABS */
        .lp-tabs {
          display: flex;
          background: rgba(201,169,110,0.1);
          border: 1.5px solid rgba(201,169,110,0.2);
          border-radius: 50px; padding: 4px;
          margin-bottom: 1.75rem; gap: 4px;
        }
        .lp-tab {
          flex: 1; padding: 0.6rem 1rem;
          border-radius: 50px; border: none;
          background: transparent; cursor: pointer;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.66rem; font-weight: 700;
          letter-spacing: 0.2em; text-transform: uppercase;
          color: #7a6e5f;
          display: flex; align-items: center; justify-content: center; gap: 7px;
          transition: all 0.28s cubic-bezier(0.22,1,0.36,1);
        }
        .lp-tab.active {
          background: linear-gradient(135deg, #e8832a, #d4451a);
          color: white;
          box-shadow: 0 4px 18px rgba(232,131,42,0.4);
        }
        .lp-tab:not(.active):hover { color: #4a4035; background: rgba(201,169,110,0.15); }
        .lp-tab svg { width: 13px; height: 13px; }

        /* FORM */
        .lp-form { display: flex; flex-direction: column; gap: 1.1rem; }
        .lp-field { display: flex; flex-direction: column; gap: 0.4rem; }
        .lp-label {
          font-size: 0.61rem; font-weight: 700;
          letter-spacing: 0.22em; text-transform: uppercase;
          color: #7a6e5f;
        }
        .lp-input-wrap { position: relative; }
        .lp-input {
          width: 100%;
          background: white;
          border: 1.5px solid #ddd5c4;
          border-radius: 14px;
          padding: 0.82rem 1.1rem;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.83rem; color: #1a1a14;
          outline: none;
          transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
          box-shadow: 0 1px 3px rgba(74,64,53,0.04);
        }
        .lp-input::placeholder { color: #b8a898; }
        .lp-input:focus {
          border-color: #e8832a;
          box-shadow: 0 0 0 4px rgba(232,131,42,0.11), 0 1px 3px rgba(74,64,53,0.04);
        }
        .lp-input.has-icon { padding-right: 3rem; }
        .lp-eye {
          position: absolute; right: 1rem; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer;
          color: #b8a898; padding: 0; display: flex; align-items: center;
          transition: color 0.2s;
        }
        .lp-eye:hover { color: #7a6e5f; }
        .lp-eye svg { width: 17px; height: 17px; }

        /* ERROR */
        .lp-error {
          display: flex; align-items: flex-start; gap: 0.6rem;
          background: rgba(212,69,26,0.07);
          border: 1px solid rgba(212,69,26,0.2);
          border-radius: 12px; padding: 0.75rem 1rem;
          animation: shakeIn 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes shakeIn {
          0%   { transform: translateX(-8px); opacity: 0; }
          60%  { transform: translateX(4px); }
          100% { transform: translateX(0); opacity: 1; }
        }
        .lp-error svg { width: 14px; height: 14px; color: #d4451a; flex-shrink: 0; margin-top: 1px; }
        .lp-error span { font-size: 0.74rem; color: #d4451a; line-height: 1.4; }

        /* BUTTON */
        .lp-btn {
          position: relative; overflow: hidden;
          width: 100%;
          background: linear-gradient(135deg, #e8832a 0%, #d4451a 100%);
          border: none; border-radius: 50px;
          padding: 0.95rem 2rem; margin-top: 0.4rem;
          color: white;
          font-family: 'Montserrat', sans-serif;
          font-size: 0.72rem; font-weight: 700;
          letter-spacing: 0.25em; text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 6px 22px rgba(232,131,42,0.45);
          transition: all 0.28s cubic-bezier(0.22,1,0.36,1);
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .lp-btn::after {
          content: ''; position: absolute;
          top: 0; left: -100%; width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          transition: left 0.5s ease;
        }
        .lp-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(232,131,42,0.55); }
        .lp-btn:hover:not(:disabled)::after { left: 140%; }
        .lp-btn:active:not(:disabled) { transform: scale(0.98); }
        .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .lp-btn .spin {
          width: 15px; height: 15px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* FOOTER */
        .lp-register-link {
          text-align: center; font-size: 0.73rem; color: #7a6e5f;
          margin-top: 1.5rem;
        }
        .lp-register-link a {
          color: #e8832a; text-decoration: none; font-weight: 600;
          transition: color 0.2s;
        }
        .lp-register-link a:hover { color: #d4451a; }

        .lp-copyright {
          position: absolute; bottom: 1.5rem; left: 0; right: 0;
          text-align: center; font-size: 0.6rem;
          color: #b8a898; letter-spacing: 0.15em;
        }

        /* ═══════════════════════════════
           RESPONSIVE
        ═══════════════════════════════ */
        @media (max-width: 860px) {
          .lp-root { flex-direction: column; }
          .lp-image-panel {
            flex: 0 0 260px;
            min-height: 260px;
          }
          .lp-image-logo { top: 1.5rem; left: 1.5rem; }
          .lp-image-content { padding: 1.5rem 2rem 2rem; }
          .lp-image-quote { font-size: 1.5rem; }
          .lp-image-side-decor { display: none; }
          .lp-form-inner { padding: 2rem 1.75rem 4rem; }
          .lp-form-title { font-size: 2.1rem; }
          .lp-copyright { position: static; padding: 0 0 1.5rem; margin-top: 1rem; }
        }
      `}</style>

      <div className="lp-root">

        {/* ── PANEL IMAGEN ── */}
        <div className="lp-image-panel">
          <img
            src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&q=85&auto=format&fit=crop"
            alt="Hostal Las Mercedes"
          />
          <div className="lp-image-side-decor" />

          {/* Logo superpuesto */}
          <div className="lp-image-logo">
            <div className="lp-image-logo-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="lp-image-logo-name">Hostal <em>Las Mercedes</em></div>
          </div>

          {/* Contenido inferior */}
          <div className="lp-image-content">
            <div className="lp-ornament-top">
              <div className="lp-orn-line" />
              <div className="lp-orn-diamond" />
              <span className="lp-orn-text">Desde 1998</span>
              <div className="lp-orn-diamond" />
              <div className="lp-orn-line" />
            </div>

            <div className="lp-stars">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="lp-star" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>

            <div className="lp-image-quote">
              Donde cada estancia<br />se convierte en un<br /><strong>recuerdo eterno</strong>
            </div>
            <div className="lp-image-location">Trujillo · La Libertad · Perú</div>
          </div>
        </div>

        {/* ── PANEL FORMULARIO ── */}
        <div className="lp-form-panel">
          <div className="lp-form-inner">

            <div className="lp-form-eyebrow">Portal de acceso</div>
            <div className="lp-form-title">Bienvenido<em>.</em></div>
            <div className="lp-form-subtitle">Inicia sesión con tu cuenta para continuar</div>

            <div className="lp-sep">
              <div className="lp-sep-line" />
              <div className="lp-sep-diamond" />
              <div className="lp-sep-line" />
            </div>

            {/* Tabs */}
            <div className="lp-tabs">
              {(["personal", "huesped"] as TipoUsuario[]).map(t => (
                <button
                  key={t} type="button"
                  className={`lp-tab${tipo === t ? " active" : ""}`}
                  onClick={() => { setTipo(t); setError(""); setEmail(""); setPassword(""); }}
                >
                  {t === "personal" ? (
                    <>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Personal
                    </>
                  ) : (
                    <>
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      Huésped
                    </>
                  )}
                </button>
              ))}
            </div>

            <form className="lp-form" onSubmit={handleSubmit}>
              <div className="lp-field">
                <label className="lp-label">
                  {tipo === "personal" ? "Correo electrónico" : "Correo de acceso"}
                </label>
                <input
                  className="lp-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={tipo === "personal" ? "usuario@hostal.com" : "correo@ejemplo.com"}
                  required
                />
              </div>

              <div className="lp-field">
                <label className="lp-label">Contraseña</label>
                <div className="lp-input-wrap">
                  <input
                    className="lp-input has-icon"
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                  />
                  <button type="button" className="lp-eye" onClick={() => setShowPass(!showPass)}>
                    {showPass ? (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="lp-error">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="lp-btn" disabled={loading}>
                {loading ? <><div className="spin" />Ingresando...</> : "Ingresar"}
              </button>
            </form>

            {tipo === "huesped" && (
              <p className="lp-register-link">
                ¿No tienes cuenta?{" "}
                <a href="/registro">Regístrate aquí</a>
              </p>
            )}

            <div className="lp-copyright">© 2026 Hostal Las Mercedes · Todos los derechos reservados</div>
          </div>
        </div>

      </div>
    </>
  );
}