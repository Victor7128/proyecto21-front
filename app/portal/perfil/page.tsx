"use client";

import { useEffect, useState, FormEvent } from "react";
import { getUser, apiFetch, type Huesped } from "@/lib/portal";

export default function PerfilPage() {
  const [huesped, setHuesped]   = useState<Huesped | null>(null);
  const [loading, setLoading]   = useState(true);
  const [savingD, setSavingD]   = useState(false);
  const [savingP, setSavingP]   = useState(false);
  const [msgD,    setMsgD]      = useState("");
  const [errD,    setErrD]      = useState("");
  const [msgP,    setMsgP]      = useState("");
  const [errP,    setErrP]      = useState("");
  const [showPass, setShowPass] = useState({ actual: false, nuevo: false, confirmar: false });

  const [datos, setDatos] = useState({ nombres: "", apellidos: "", tipo_documento: "1", num_documento: "", telefono: "", correo: "" });
  const [pass,  setPass]  = useState({ password_actual: "", password_nuevo: "", confirmar: "" });

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    apiFetch<Huesped>(`/huespedes/${user.id_huesped}`)
      .then(h => {
        setHuesped(h);
        setDatos({ nombres: h.nombres ?? "", apellidos: h.apellidos ?? "", tipo_documento: String(h.tipo_documento ?? 1), num_documento: h.num_documento ?? "", telefono: h.telefono ?? "", correo: h.correo ?? "" });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleGuardar(e: FormEvent) {
    e.preventDefault(); setErrD(""); setMsgD("");
    const user = getUser(); if (!user) return;
    setSavingD(true);
    try {
      await apiFetch(`/huespedes/${user.id_huesped}`, { method: "PUT", body: JSON.stringify({ ...datos, tipo_documento: parseInt(datos.tipo_documento) }) });
      setMsgD("Perfil actualizado correctamente.");
    } catch (err) { setErrD(err instanceof Error ? err.message : "Error al actualizar."); }
    finally { setSavingD(false); }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault(); setErrP(""); setMsgP("");
    if (pass.password_nuevo !== pass.confirmar) { setErrP("Las contraseñas nuevas no coinciden."); return; }
    if (pass.password_nuevo.length < 8) { setErrP("La contraseña debe tener al menos 8 caracteres."); return; }
    const user = getUser(); if (!user) return;
    setSavingP(true);
    try {
      await apiFetch(`/huespedes/${user.id_huesped}/password`, { method: "PUT", body: JSON.stringify({ password_actual: pass.password_actual, password_nuevo: pass.password_nuevo }) });
      setMsgP("Contraseña actualizada correctamente.");
      setPass({ password_actual: "", password_nuevo: "", confirmar: "" });
    } catch (err) { setErrP(err instanceof Error ? err.message : "Error al cambiar contraseña."); }
    finally { setSavingP(false); }
  }

  const initials = huesped ? `${huesped.nombres[0]}${huesped.apellidos[0]}`.toUpperCase() : "H";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        .pf-page { font-family:'Montserrat',sans-serif; display:flex; flex-direction:column; gap:1.5rem; max-width:560px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }

        .pf-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#1a1a14; line-height:1; animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
        .pf-title em { font-style:italic; color:#c9a96e; }
        .pf-sub { font-size:.7rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#7a6e5f;margin-top:.35rem; }
        .pf-loading { padding:5rem; display:flex; justify-content:center; }
        .pf-spin { width:22px;height:22px;border-radius:50%;border:2px solid rgba(201,169,110,.2);border-top-color:#e8832a;animation:spin .7s linear infinite; }

        /* AVATAR CARD */
        .pf-avatar-card { background:#f5efe6; border:1px solid rgba(201,169,110,.2); border-radius:20px; padding:1.5rem; display:flex; align-items:center; gap:1.25rem; animation:fadeUp .55s .04s cubic-bezier(.22,1,.36,1) both; }
        .pf-avatar-circle { width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(232,131,42,.25),rgba(212,69,26,.2));border:2px solid rgba(201,169,110,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .pf-avatar-initials { font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600;color:#c9a96e; }
        .pf-avatar-name { font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:600;color:#1a1a14;line-height:1.1; }
        .pf-avatar-email { font-size:.68rem;color:#7a6e5f;margin-top:3px; }
        .pf-avatar-status { display:flex;align-items:center;gap:.4rem;margin-top:.4rem; }
        .pf-status-dot { width:6px;height:6px;border-radius:50%;background:#5a9e6f; }
        .pf-status-label { font-size:.6rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5a9e6f; }

        /* FORM CARD */
        .pf-card { background:#f5efe6; border:1px solid rgba(201,169,110,.18); border-radius:20px; overflow:hidden; animation:fadeUp .6s .08s cubic-bezier(.22,1,.36,1) both; }
        .pf-card-header { padding:1.2rem 1.5rem; border-bottom:1px solid rgba(201,169,110,.15); display:flex; align-items:center; gap:.75rem; }
        .pf-card-header-icon { width:34px;height:34px;border-radius:10px;background:rgba(201,169,110,.12);border:1px solid rgba(201,169,110,.2);display:flex;align-items:center;justify-content:center; }
        .pf-card-header-icon svg { width:16px;height:16px;color:#c9a96e; }
        .pf-card-title { font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:#1a1a14; }
        .pf-card-body { padding:1.5rem; }

        /* FORM */
        .pf-form { display:flex; flex-direction:column; gap:1rem; }
        .pf-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .pf-field { display:flex; flex-direction:column; gap:.4rem; }
        .pf-label { font-size:.61rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#7a6e5f; }

        .pf-input, .pf-select {
          width:100%; background:white; border:1.5px solid #ddd5c4; border-radius:14px;
          padding:.78rem 1.1rem;
          font-family:'Montserrat',sans-serif; font-size:.82rem; color:#1a1a14; outline:none;
          transition:all .25s cubic-bezier(.22,1,.36,1);
          box-shadow:0 1px 3px rgba(74,64,53,.04);
          appearance:none; -webkit-appearance:none;
        }
        .pf-input::placeholder { color:#b8a898; }
        .pf-input:focus, .pf-select:focus { border-color:#e8832a; box-shadow:0 0 0 4px rgba(232,131,42,.11); }
        .pf-input.has-icon { padding-right:3rem; }

        .pf-select-wrap { position:relative; }
        .pf-select-wrap::after { content:'';position:absolute;right:1rem;top:50%;transform:translateY(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #b8a898;pointer-events:none; }

        .pf-input-wrap { position:relative; }
        .pf-eye { position:absolute;right:.9rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#b8a898;padding:0;display:flex;align-items:center;transition:color .2s; }
        .pf-eye:hover { color:#7a6e5f; }
        .pf-eye svg { width:16px;height:16px; }

        /* ALERTS */
        .pf-alert { display:flex;align-items:flex-start;gap:.6rem;border-radius:12px;padding:.75rem 1rem;font-size:.73rem;line-height:1.4; }
        .pf-alert-ok { background:rgba(90,158,111,.08);border:1px solid rgba(90,158,111,.25);color:#3d7a52; }
        .pf-alert-err { background:rgba(212,69,26,.07);border:1px solid rgba(212,69,26,.2);color:#d4451a; }
        .pf-alert svg { width:14px;height:14px;flex-shrink:0;margin-top:1px; }

        /* ORNAMENTO */
        .pf-orn { display:flex;align-items:center;gap:.6rem;margin:.25rem 0; }
        .pf-orn-line { flex:1;height:1px;background:rgba(201,169,110,.25); }
        .pf-orn-diamond { width:5px;height:5px;border:1px solid rgba(201,169,110,.5);transform:rotate(45deg); }

        /* BOTONES */
        .pf-btn-primary {
          position:relative; overflow:hidden; width:100%;
          background:linear-gradient(135deg,#e8832a,#d4451a); border:none; border-radius:50px;
          padding:.88rem 2rem;
          color:white; font-family:'Montserrat',sans-serif; font-size:.7rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase;
          cursor:pointer; box-shadow:0 5px 18px rgba(232,131,42,.4);
          transition:all .25s cubic-bezier(.22,1,.36,1);
          display:flex; align-items:center; justify-content:center; gap:7px;
        }
        .pf-btn-primary::after { content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);transition:left .45s ease; }
        .pf-btn-primary:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 9px 24px rgba(232,131,42,.5); }
        .pf-btn-primary:hover:not(:disabled)::after { left:140%; }
        .pf-btn-primary:disabled { opacity:.55;cursor:not-allowed; }

        .pf-btn-secondary {
          position:relative; overflow:hidden; width:100%;
          background:transparent; border:1.5px solid rgba(201,169,110,.4); border-radius:50px;
          padding:.88rem 2rem;
          color:#4a4035; font-family:'Montserrat',sans-serif; font-size:.7rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase;
          cursor:pointer;
          transition:all .25s cubic-bezier(.22,1,.36,1);
          display:flex; align-items:center; justify-content:center; gap:7px;
        }
        .pf-btn-secondary:hover:not(:disabled) { background:rgba(201,169,110,.08); border-color:rgba(201,169,110,.7); }
        .pf-btn-secondary:disabled { opacity:.55;cursor:not-allowed; }

        .pf-btn-spin { width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:white;animation:spin .7s linear infinite; }
        .pf-btn-spin-dark { width:14px;height:14px;border-radius:50%;border:2px solid rgba(74,64,53,.25);border-top-color:#7a6e5f;animation:spin .7s linear infinite; }

        @media (max-width:480px) {
          .pf-grid-2 { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="pf-page">

        <div>
          <div className="pf-title">Mi <em>Perfil</em></div>
          <div className="pf-sub">Administra tu información personal</div>
        </div>

        {loading ? (
          <div className="pf-loading"><div className="pf-spin" /></div>
        ) : (
          <>
            {/* Avatar */}
            <div className="pf-avatar-card">
              <div className="pf-avatar-circle">
                <span className="pf-avatar-initials">{initials}</span>
              </div>
              <div>
                <div className="pf-avatar-name">{huesped?.nombres} {huesped?.apellidos}</div>
                <div className="pf-avatar-email">{huesped?.email_login}</div>
                <div className="pf-avatar-status">
                  <div className="pf-status-dot" />
                  <span className="pf-status-label">Cuenta activa</span>
                </div>
              </div>
            </div>

            {/* Datos personales */}
            <div className="pf-card">
              <div className="pf-card-header">
                <div className="pf-card-header-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="pf-card-title">Datos personales</span>
              </div>
              <div className="pf-card-body">
                <form className="pf-form" onSubmit={handleGuardar}>
                  <div className="pf-grid-2">
                    <div className="pf-field">
                      <label className="pf-label">Nombres</label>
                      <input className="pf-input" value={datos.nombres} onChange={e => setDatos({ ...datos, nombres: e.target.value })} required />
                    </div>
                    <div className="pf-field">
                      <label className="pf-label">Apellidos</label>
                      <input className="pf-input" value={datos.apellidos} onChange={e => setDatos({ ...datos, apellidos: e.target.value })} required />
                    </div>
                  </div>
                  <div className="pf-grid-2">
                    <div className="pf-field">
                      <label className="pf-label">Tipo documento</label>
                      <div className="pf-select-wrap">
                        <select className="pf-select pf-input" value={datos.tipo_documento} onChange={e => setDatos({ ...datos, tipo_documento: e.target.value })}>
                          <option value="1">DNI</option>
                          <option value="2">Pasaporte</option>
                          <option value="3">Carné extranjería</option>
                        </select>
                      </div>
                    </div>
                    <div className="pf-field">
                      <label className="pf-label">Nº documento</label>
                      <input className="pf-input" value={datos.num_documento} onChange={e => setDatos({ ...datos, num_documento: e.target.value })} required />
                    </div>
                  </div>
                  <div className="pf-grid-2">
                    <div className="pf-field">
                      <label className="pf-label">Teléfono</label>
                      <input className="pf-input" value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })} placeholder="999 888 777" />
                    </div>
                    <div className="pf-field">
                      <label className="pf-label">Correo contacto</label>
                      <input className="pf-input" type="email" value={datos.correo} onChange={e => setDatos({ ...datos, correo: e.target.value })} />
                    </div>
                  </div>

                  {msgD && <div className="pf-alert pf-alert-ok"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{msgD}</div>}
                  {errD && <div className="pf-alert pf-alert-err"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{errD}</div>}

                  <div className="pf-orn"><div className="pf-orn-line" /><div className="pf-orn-diamond" /><div className="pf-orn-line" /></div>

                  <button type="submit" className="pf-btn-primary" disabled={savingD}>
                    {savingD ? <><div className="pf-btn-spin" />Guardando…</> : "Guardar cambios"}
                  </button>
                </form>
              </div>
            </div>

            {/* Cambiar contraseña */}
            <div className="pf-card" style={{ animationDelay: ".12s" }}>
              <div className="pf-card-header">
                <div className="pf-card-header-icon">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="pf-card-title">Cambiar contraseña</span>
              </div>
              <div className="pf-card-body">
                <form className="pf-form" onSubmit={handlePassword}>
                  {(["actual", "nuevo", "confirmar"] as const).map(key => {
                    const labels   = { actual: "Contraseña actual", nuevo: "Nueva contraseña", confirmar: "Confirmar nueva" };
                    const passKeys = { actual: "password_actual", nuevo: "password_nuevo", confirmar: "confirmar" } as const;
                    return (
                      <div key={key} className="pf-field">
                        <label className="pf-label">{labels[key]}</label>
                        <div className="pf-input-wrap">
                          <input
                            type={showPass[key] ? "text" : "password"}
                            value={pass[passKeys[key]]}
                            onChange={e => setPass({ ...pass, [passKeys[key]]: e.target.value })}
                            placeholder="••••••••" required
                            className="pf-input has-icon"
                          />
                          <button type="button" className="pf-eye" onClick={() => setShowPass(s => ({ ...s, [key]: !s[key] }))}>
                            {showPass[key]
                              ? <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                              : <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            }
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {msgP && <div className="pf-alert pf-alert-ok"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{msgP}</div>}
                  {errP && <div className="pf-alert pf-alert-err"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{errP}</div>}

                  <div className="pf-orn"><div className="pf-orn-line" /><div className="pf-orn-diamond" /><div className="pf-orn-line" /></div>

                  <button type="submit" className="pf-btn-secondary" disabled={savingP}>
                    {savingP ? <><div className="pf-btn-spin-dark" />Cambiando…</> : "Cambiar contraseña"}
                  </button>
                </form>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}