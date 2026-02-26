"use client";

import { useEffect, useState, FormEvent } from "react";
import { getUser, apiFetch, type Huesped } from "@/lib/portal";

// ── Tipo que devuelve GET /catalogos/tipo-documento ───────────────────────────
type TipoDocumento = {
  id_tipo_documento: number;
  codigo: string;       // "DNI", "PAS", "CE", etc.
  descripcion: string;  // "Documento Nacional de Identidad", etc.
};

// ── Reglas de validación por código ──────────────────────────────────────────
// Mapeamos el campo `codigo` de la API a reglas concretas.
// Si llega un tipo nuevo no mapeado, aplica FALLBACK_RULE.
const RULES_BY_CODIGO: Record<string, {
  min: number; max: number; hint: string; onlyDigits: boolean; placeholder: string;
}> = {
  DNI: { min: 8,  max: 8,  hint: "8 dígitos exactos",   onlyDigits: true,  placeholder: "12345678"  },
  PAS: { min: 6,  max: 12, hint: "6 a 12 caracteres",    onlyDigits: false, placeholder: "AB123456"  },
  CE:  { min: 9,  max: 9,  hint: "9 dígitos exactos",    onlyDigits: true,  placeholder: "123456789" },
};
const FALLBACK_RULE = {
  min: 4, max: 20, hint: "4 a 20 caracteres", onlyDigits: false, placeholder: "Nº documento",
};

function getRuleForCodigo(codigo: string) {
  const upper = codigo.toUpperCase().trim();
  if (RULES_BY_CODIGO[upper]) return RULES_BY_CODIGO[upper];
  // Intenta match parcial (ej. "DNI_EXT" → no coincide, usa FALLBACK)
  for (const key of Object.keys(RULES_BY_CODIGO)) {
    if (upper.startsWith(key) || key.startsWith(upper)) return RULES_BY_CODIGO[key];
  }
  return FALLBACK_RULE;
}

// ── Helpers de validación ─────────────────────────────────────────────────────
function validateNombre(v: string) {
  if (!v.trim()) return "Campo obligatorio";
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(v)) return "Solo letras, espacios y guiones";
  if (v.trim().length < 2) return "Mínimo 2 caracteres";
  return "";
}

function validateDocumento(num: string, rule: typeof FALLBACK_RULE) {
  if (!num.trim()) return "Campo obligatorio";
  if (rule.onlyDigits && !/^\d+$/.test(num)) return "Solo se permiten números";
  if (num.length < rule.min || num.length > rule.max) return `Debe tener ${rule.hint}`;
  return "";
}

function validateTelefono(v: string) {
  if (!v) return "";                         // opcional
  if (!/^\d+$/.test(v)) return "Solo se permiten números";
  if (v.length !== 9) return "Debe tener exactamente 9 dígitos";
  return "";
}

function validateEmail(v: string) {
  if (!v.trim()) return "";                  // opcional
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Formato de correo no válido";
  return "";
}

function pwdStrength(pwd: string) {
  if (!pwd) return 0;
  let s = 0;
  if (pwd.length >= 8)           s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}

const STRENGTH_LABEL = ["", "Débil",   "Regular", "Buena",   "Fuerte"  ];
const STRENGTH_COLOR = ["", "#d4451a", "#e8832a", "#c9a96e", "#5a9e6f" ];

// ── Componente principal ──────────────────────────────────────────────────────
export default function PerfilPage() {
  const [huesped,   setHuesped]   = useState<Huesped | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [tiposDocs, setTiposDocs] = useState<TipoDocumento[]>([]);

  const [savingD, setSavingD] = useState(false);
  const [savingP, setSavingP] = useState(false);
  const [msgD,    setMsgD]    = useState("");
  const [errD,    setErrD]    = useState("");
  const [msgP,    setMsgP]    = useState("");
  const [errP,    setErrP]    = useState("");
  const [showPass, setShowPass] = useState({ actual: false, nuevo: false, confirmar: false });

  const [datos, setDatos] = useState({
    nombres: "", apellidos: "",
    tipo_documento: "",          // string: valor del <select> (id como string)
    num_documento: "", telefono: "", correo: "",
  });
  const [pass, setPass] = useState({
    password_actual: "", password_nuevo: "", confirmar: "",
  });

  const [touchedD, setTouchedD] = useState<Record<string, boolean>>({});
  const [touchedP, setTouchedP] = useState<Record<string, boolean>>({});

  // Regla activa según el tipo seleccionado en el select
  const tipoActivo = tiposDocs.find(t => String(t.id_tipo_documento) === datos.tipo_documento);
  const activeRule = tipoActivo ? getRuleForCodigo(tipoActivo.codigo) : FALLBACK_RULE;

  // Errores en tiempo real
  const erroresD = {
    nombres:       validateNombre(datos.nombres),
    apellidos:     validateNombre(datos.apellidos),
    num_documento: validateDocumento(datos.num_documento, activeRule),
    telefono:      validateTelefono(datos.telefono),
    correo:        validateEmail(datos.correo),
  };

  const strength = pwdStrength(pass.password_nuevo);
  const erroresP = {
    password_actual: !pass.password_actual ? "Campo obligatorio" : "",
    password_nuevo:  pass.password_nuevo.length > 0 && pass.password_nuevo.length < 8
      ? "Mínimo 8 caracteres" : "",
    confirmar: pass.confirmar && pass.confirmar !== pass.password_nuevo
      ? "Las contraseñas no coinciden" : "",
  };

  const datosValidos = Object.values(erroresD).every(e => !e);
  const passValidos  = !erroresP.password_actual && !erroresP.password_nuevo && !erroresP.confirmar
    && pass.password_actual && pass.password_nuevo && pass.confirmar;

  // ── Carga inicial: huésped + catálogo de tipos de documento ──────────────
  useEffect(() => {
    const user = getUser();
    if (!user) return;
    Promise.all([
      apiFetch<Huesped>(`/huespedes/${user.id_huesped}`),
      apiFetch<TipoDocumento[]>("/catalogos/tipo-documento"),
    ])
      .then(([h, tipos]) => {
        const lista = Array.isArray(tipos) ? tipos : [];
        setTiposDocs(lista);
        setHuesped(h);

        // Resolver tipo_documento: buscar el id exacto en la lista cargada.
        // Si no viene del huesped o no coincide, usar el primero de la lista.
        const idRaw = h.tipo_documento != null ? Number(h.tipo_documento) : null;
        const existe = idRaw !== null && lista.some(t => t.id_tipo_documento === idRaw);
        const tipoFinal = existe
          ? String(idRaw)
          : lista.length > 0 ? String(lista[0].id_tipo_documento) : "";

        setDatos({
          nombres:        h.nombres       ?? "",
          apellidos:      h.apellidos     ?? "",
          tipo_documento: tipoFinal,
          num_documento:  h.num_documento ?? "",
          telefono:       h.telefono      ?? "",
          correo:         h.correo        ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Guardar datos personales ──────────────────────────────────────────────
  async function handleGuardar(e: FormEvent) {
    e.preventDefault(); setErrD(""); setMsgD("");
    setTouchedD({ nombres: true, apellidos: true, num_documento: true, telefono: true, correo: true });
    if (!datosValidos) { setErrD("Corrige los errores antes de guardar."); return; }
    const user = getUser(); if (!user) return;
    setSavingD(true);
    try {
      await apiFetch(`/huespedes/${user.id_huesped}`, {
        method: "PUT",
        body: JSON.stringify({ ...datos, tipo_documento: parseInt(datos.tipo_documento) }),
      });
      setMsgD("Perfil actualizado correctamente.");
      setTouchedD({});
    } catch (err) {
      setErrD(err instanceof Error ? err.message : "Error al actualizar.");
    } finally { setSavingD(false); }
  }

  // ── Cambiar contraseña ────────────────────────────────────────────────────
  async function handlePassword(e: FormEvent) {
    e.preventDefault(); setErrP(""); setMsgP("");
    setTouchedP({ password_actual: true, password_nuevo: true, confirmar: true });
    if (!passValidos) { setErrP("Corrige los errores antes de continuar."); return; }
    const user = getUser(); if (!user) return;
    setSavingP(true);
    try {
      await apiFetch(`/huespedes/${user.id_huesped}/password`, {
        method: "PUT",
        body: JSON.stringify({
          password_actual: pass.password_actual,
          password_nuevo:  pass.password_nuevo,
        }),
      });
      setMsgP("Contraseña actualizada correctamente.");
      setPass({ password_actual: "", password_nuevo: "", confirmar: "" });
      setTouchedP({});
    } catch (err) {
      setErrP(err instanceof Error ? err.message : "Error al cambiar contraseña.");
    } finally { setSavingP(false); }
  }

  function touchD(f: string) { setTouchedD(t => ({ ...t, [f]: true })); }
  function touchP(f: string) { setTouchedP(t => ({ ...t, [f]: true })); }

  // Al cambiar tipo de documento → limpia el número y quita el touched
  function changeTipoDoc(id: string) {
    setDatos(d => ({ ...d, tipo_documento: id, num_documento: "" }));
    setTouchedD(t => ({ ...t, num_documento: false }));
  }

  // Teléfono: solo dígitos, máximo 9
  function changeTelefono(v: string) {
    const clean = v.replace(/\D/g, "").slice(0, 9);
    setDatos(d => ({ ...d, telefono: clean }));
  }

  // Documento: filtra según la regla del tipo activo
  function changeDocNum(v: string) {
    const val = activeRule.onlyDigits
      ? v.replace(/\D/g, "").slice(0, activeRule.max)
      : v.slice(0, activeRule.max);
    setDatos(d => ({ ...d, num_documento: val }));
  }

  // Estado visual de un input (neutro / valid / invalid)
  function cls(base: string, touched: boolean, err: string, optional = false, value = "") {
    if (!touched) return base;
    if (err) return `${base} invalid`;
    if (optional && !value) return base;    // opcional vacío → neutro
    return `${base} valid`;
  }

  const initials = huesped
    ? `${huesped.nombres?.[0] ?? ""}${huesped.apellidos?.[0] ?? ""}`.toUpperCase()
    : "H";

  // Contador de dígitos del documento
  const docLen   = datos.num_documento.length;
  const docOk    = docLen >= activeRule.min && docLen <= activeRule.max;
  const docExact = activeRule.min === activeRule.max;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');

        .pf-page { font-family:'Montserrat',sans-serif;display:flex;flex-direction:column;gap:1.5rem;max-width:560px; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes shake  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 60%{transform:translateX(5px)} }

        .pf-title { font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:600;color:#1a1a14;line-height:1;animation:fadeUp .55s cubic-bezier(.22,1,.36,1) both; }
        .pf-title em { font-style:italic;color:#c9a96e; }
        .pf-sub { font-size:.7rem;font-weight:500;letter-spacing:.14em;text-transform:uppercase;color:#7a6e5f;margin-top:.35rem; }
        .pf-loading { padding:5rem;display:flex;justify-content:center; }
        .pf-spin { width:22px;height:22px;border-radius:50%;border:2px solid rgba(201,169,110,.2);border-top-color:#e8832a;animation:spin .7s linear infinite; }

        /* AVATAR */
        .pf-avatar-card { background:#f5efe6;border:1px solid rgba(201,169,110,.2);border-radius:20px;padding:1.5rem;display:flex;align-items:center;gap:1.25rem;animation:fadeUp .55s .04s cubic-bezier(.22,1,.36,1) both; }
        .pf-avatar-circle { width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,rgba(232,131,42,.25),rgba(212,69,26,.2));border:2px solid rgba(201,169,110,.3);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
        .pf-avatar-initials { font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600;color:#c9a96e; }
        .pf-avatar-name { font-family:'Cormorant Garamond',serif;font-size:1.3rem;font-weight:600;color:#1a1a14;line-height:1.1; }
        .pf-avatar-email { font-size:.68rem;color:#7a6e5f;margin-top:3px; }
        .pf-avatar-status { display:flex;align-items:center;gap:.4rem;margin-top:.4rem; }
        .pf-status-dot { width:6px;height:6px;border-radius:50%;background:#5a9e6f; }
        .pf-status-label { font-size:.6rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5a9e6f; }

        /* CARD */
        .pf-card { background:#f5efe6;border:1px solid rgba(201,169,110,.18);border-radius:20px;overflow:hidden;animation:fadeUp .6s .08s cubic-bezier(.22,1,.36,1) both; }
        .pf-card-header { padding:1.2rem 1.5rem;border-bottom:1px solid rgba(201,169,110,.15);display:flex;align-items:center;gap:.75rem; }
        .pf-card-header-icon { width:34px;height:34px;border-radius:10px;background:rgba(201,169,110,.12);border:1px solid rgba(201,169,110,.2);display:flex;align-items:center;justify-content:center; }
        .pf-card-header-icon svg { width:16px;height:16px;color:#c9a96e; }
        .pf-card-title { font-family:'Cormorant Garamond',serif;font-size:1.1rem;font-weight:600;color:#1a1a14; }
        .pf-card-body { padding:1.5rem; }

        /* FORM */
        .pf-form { display:flex;flex-direction:column;gap:1rem; }
        .pf-grid-2 { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }
        .pf-field { display:flex;flex-direction:column;gap:.35rem; }
        .pf-label-row { display:flex;align-items:center;justify-content:space-between;gap:.5rem; }
        .pf-label { font-size:.61rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#7a6e5f; }
        .pf-label-hint { font-size:.59rem;color:#b8a898;letter-spacing:.04em;font-style:italic; }

        /* INPUTS */
        .pf-input,.pf-select {
          width:100%;background:white;border:1.5px solid #ddd5c4;border-radius:14px;
          padding:.78rem 1.1rem;
          font-family:'Montserrat',sans-serif;font-size:.82rem;color:#1a1a14;outline:none;
          transition:all .25s cubic-bezier(.22,1,.36,1);
          box-shadow:0 1px 3px rgba(74,64,53,.04);
          appearance:none;-webkit-appearance:none;
        }
        .pf-input::placeholder { color:#b8a898; }
        .pf-input:focus,.pf-select:focus { border-color:#e8832a;box-shadow:0 0 0 4px rgba(232,131,42,.11); }
        .pf-input.has-icon { padding-right:3rem; }
        .pf-input.valid,.pf-select.valid   { border-color:rgba(90,158,111,.55); }
        .pf-input.invalid,.pf-select.invalid { border-color:rgba(212,69,26,.55);box-shadow:0 0 0 3px rgba(212,69,26,.09);animation:shake .22s ease; }

        .pf-select-wrap { position:relative; }
        .pf-select-wrap::after { content:'';position:absolute;right:1rem;top:50%;transform:translateY(-50%);width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:5px solid #b8a898;pointer-events:none; }

        .pf-input-wrap { position:relative; }
        .pf-eye { position:absolute;right:.9rem;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#b8a898;padding:0;display:flex;align-items:center;transition:color .2s; }
        .pf-eye:hover { color:#7a6e5f; }
        .pf-eye svg { width:16px;height:16px; }

        /* CONTADOR */
        .pf-counter-row { display:flex;justify-content:flex-end; }
        .pf-counter { font-size:.58rem;letter-spacing:.04em; }
        .pf-counter.neutral { color:#b8a898; }
        .pf-counter.warn    { color:#e8832a; }
        .pf-counter.ok      { color:#5a9e6f; }

        /* MENSAJES CAMPO */
        .pf-field-err { font-size:.62rem;color:#d4451a;display:flex;align-items:center;gap:.3rem; }
        .pf-field-err svg { width:11px;height:11px;flex-shrink:0; }
        .pf-field-ok  { font-size:.62rem;color:#5a9e6f;display:flex;align-items:center;gap:.3rem; }
        .pf-field-ok  svg { width:11px;height:11px;flex-shrink:0; }

        /* FORTALEZA */
        .pf-strength { display:flex;align-items:center;gap:.6rem;margin-top:.15rem; }
        .pf-strength-bars { display:flex;gap:3px;flex:1; }
        .pf-strength-bar { height:3px;flex:1;border-radius:99px;background:rgba(201,169,110,.15);transition:background .3s; }
        .pf-strength-txt { font-size:.6rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;min-width:42px;text-align:right;transition:color .3s; }
        .pf-match-bar { height:2px;border-radius:99px;margin-top:.25rem;transition:all .3s; }

        /* REQUISITOS */
        .pf-reqs { display:flex;flex-wrap:wrap;gap:.3rem .75rem;margin-top:.25rem; }
        .pf-req  { font-size:.6rem;display:flex;align-items:center;gap:.25rem;transition:color .2s; }
        .pf-req svg { width:10px;height:10px; }

        /* ALERTS */
        .pf-alert { display:flex;align-items:flex-start;gap:.6rem;border-radius:12px;padding:.75rem 1rem;font-size:.73rem;line-height:1.4; }
        .pf-alert svg { width:14px;height:14px;flex-shrink:0;margin-top:1px; }
        .pf-alert-ok  { background:rgba(90,158,111,.08);border:1px solid rgba(90,158,111,.25);color:#3d7a52; }
        .pf-alert-err { background:rgba(212,69,26,.07);border:1px solid rgba(212,69,26,.2);color:#d4451a; }

        /* ORNAMENTO */
        .pf-orn { display:flex;align-items:center;gap:.6rem;margin:.25rem 0; }
        .pf-orn-line { flex:1;height:1px;background:rgba(201,169,110,.25); }
        .pf-orn-diamond { width:5px;height:5px;border:1px solid rgba(201,169,110,.5);transform:rotate(45deg); }

        /* BOTONES */
        .pf-btn-primary {
          position:relative;overflow:hidden;width:100%;
          background:linear-gradient(135deg,#e8832a,#d4451a);border:none;border-radius:50px;
          padding:.88rem 2rem;
          color:white;font-family:'Montserrat',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
          cursor:pointer;box-shadow:0 5px 18px rgba(232,131,42,.4);
          transition:all .25s cubic-bezier(.22,1,.36,1);
          display:flex;align-items:center;justify-content:center;gap:7px;
        }
        .pf-btn-primary::after { content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);transition:left .45s ease; }
        .pf-btn-primary:hover:not(:disabled) { transform:translateY(-2px);box-shadow:0 9px 24px rgba(232,131,42,.5); }
        .pf-btn-primary:hover:not(:disabled)::after { left:140%; }
        .pf-btn-primary:disabled { opacity:.55;cursor:not-allowed; }

        .pf-btn-secondary {
          position:relative;overflow:hidden;width:100%;
          background:transparent;border:1.5px solid rgba(201,169,110,.4);border-radius:50px;
          padding:.88rem 2rem;
          color:#4a4035;font-family:'Montserrat',sans-serif;font-size:.7rem;font-weight:700;letter-spacing:.22em;text-transform:uppercase;
          cursor:pointer;transition:all .25s cubic-bezier(.22,1,.36,1);
          display:flex;align-items:center;justify-content:center;gap:7px;
        }
        .pf-btn-secondary:hover:not(:disabled) { background:rgba(201,169,110,.08);border-color:rgba(201,169,110,.7); }
        .pf-btn-secondary:disabled { opacity:.55;cursor:not-allowed; }

        .pf-btn-spin      { width:14px;height:14px;border-radius:50%;border:2px solid rgba(255,255,255,.3);border-top-color:white;animation:spin .7s linear infinite; }
        .pf-btn-spin-dark { width:14px;height:14px;border-radius:50%;border:2px solid rgba(74,64,53,.25);border-top-color:#7a6e5f;animation:spin .7s linear infinite; }

        @media (max-width:480px) { .pf-grid-2 { grid-template-columns:1fr; } }
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
            {/* ── AVATAR ── */}
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

            {/* ════════════ DATOS PERSONALES ════════════ */}
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

                  {/* Nombres / Apellidos */}
                  <div className="pf-grid-2">
                    {(["nombres", "apellidos"] as const).map(field => (
                      <div key={field} className="pf-field">
                        <label className="pf-label">
                          {field === "nombres" ? "Nombres" : "Apellidos"}
                        </label>
                        <input
                          className={cls("pf-input", !!touchedD[field], erroresD[field])}
                          value={datos[field]}
                          placeholder={field === "nombres" ? "Juan Carlos" : "García López"}
                          onChange={e => {
                            const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]/g, "");
                            setDatos(d => ({ ...d, [field]: val }));
                          }}
                          onBlur={() => touchD(field)}
                          required
                        />
                        {touchedD[field] && erroresD[field] && <FieldErr msg={erroresD[field]} />}
                      </div>
                    ))}
                  </div>

                  {/* Tipo documento (dinámico) / Nº documento */}
                  <div className="pf-grid-2">

                    {/* SELECT cargado desde /catalogos/tipo-documento */}
                    <div className="pf-field">
                      <label className="pf-label">Tipo documento</label>
                      <div className="pf-select-wrap">
                        <select
                          className="pf-select pf-input"
                          value={datos.tipo_documento}
                          onChange={e => changeTipoDoc(e.target.value)}
                        >
                          {tiposDocs.length === 0 ? (
                            <option value="" disabled>Cargando…</option>
                          ) : (
                            tiposDocs.map(t => (
                              <option key={t.id_tipo_documento} value={String(t.id_tipo_documento)}>
                                {t.codigo} — {t.descripcion}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Nº documento con validación dinámica */}
                    <div className="pf-field">
                      <div className="pf-label-row">
                        <label className="pf-label">Nº documento</label>
                        <span className="pf-label-hint">{activeRule.hint}</span>
                      </div>
                      <input
                        className={cls("pf-input", !!touchedD.num_documento, erroresD.num_documento)}
                        value={datos.num_documento}
                        placeholder={activeRule.placeholder}
                        inputMode={activeRule.onlyDigits ? "numeric" : "text"}
                        maxLength={activeRule.max}
                        onChange={e => changeDocNum(e.target.value)}
                        onBlur={() => touchD("num_documento")}
                        required
                      />
                      {/* Contador: solo cuando el tipo ya está cargado y coincide */}
                      {datos.num_documento && tipoActivo && (
                        <div className="pf-counter-row">
                          <span className={`pf-counter ${docOk ? "ok" : "neutral"}`}>
                            {docLen}
                            {docExact ? `/${activeRule.max}` : `/${activeRule.min}–${activeRule.max}`}
                          </span>
                        </div>
                      )}
                      {touchedD.num_documento && erroresD.num_documento
                        ? <FieldErr msg={erroresD.num_documento} />
                        : touchedD.num_documento && !erroresD.num_documento && datos.num_documento
                          && <FieldOk msg="Correcto" />
                      }
                    </div>
                  </div>

                  {/* Teléfono / Correo */}
                  <div className="pf-grid-2">
                    <div className="pf-field">
                      <div className="pf-label-row">
                        <label className="pf-label">Teléfono</label>
                        <span className="pf-label-hint">9 dígitos · opcional</span>
                      </div>
                      <input
                        className={cls("pf-input", !!touchedD.telefono, erroresD.telefono, true, datos.telefono)}
                        value={datos.telefono}
                        placeholder="987654321"
                        inputMode="numeric"
                        maxLength={9}
                        onChange={e => changeTelefono(e.target.value)}
                        onBlur={() => touchD("telefono")}
                      />
                      {/* Contador dígitos */}
                      {datos.telefono && (
                        <div className="pf-counter-row">
                          <span className={`pf-counter ${datos.telefono.length === 9 ? "ok" : "warn"}`}>
                            {datos.telefono.length}/9 dígitos
                          </span>
                        </div>
                      )}
                      {touchedD.telefono && erroresD.telefono
                        ? <FieldErr msg={erroresD.telefono} />
                        : touchedD.telefono && !erroresD.telefono && datos.telefono
                          && <FieldOk msg="Correcto" />
                      }
                    </div>

                    <div className="pf-field">
                      <div className="pf-label-row">
                        <label className="pf-label">Correo contacto</label>
                        <span className="pf-label-hint">opcional</span>
                      </div>
                      <input
                        className={cls("pf-input", !!touchedD.correo, erroresD.correo, true, datos.correo)}
                        type="email"
                        value={datos.correo}
                        placeholder="ejemplo@correo.com"
                        onChange={e => setDatos(d => ({ ...d, correo: e.target.value }))}
                        onBlur={() => touchD("correo")}
                      />
                      {touchedD.correo && erroresD.correo && <FieldErr msg={erroresD.correo} />}
                    </div>
                  </div>

                  {msgD && <Alert type="ok"  msg={msgD} />}
                  {errD  && <Alert type="err" msg={errD} />}

                  <div className="pf-orn">
                    <div className="pf-orn-line" /><div className="pf-orn-diamond" /><div className="pf-orn-line" />
                  </div>
                  <button type="submit" className="pf-btn-primary" disabled={savingD}>
                    {savingD ? <><div className="pf-btn-spin" />Guardando…</> : "Guardar cambios"}
                  </button>
                </form>
              </div>
            </div>

            {/* ════════════ CAMBIAR CONTRASEÑA ════════════ */}
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

                  {/* Contraseña actual */}
                  <div className="pf-field">
                    <label className="pf-label">Contraseña actual</label>
                    <div className="pf-input-wrap">
                      <input
                        type={showPass.actual ? "text" : "password"}
                        value={pass.password_actual}
                        className={cls("pf-input has-icon", !!touchedP.password_actual, erroresP.password_actual)}
                        placeholder="••••••••"
                        onChange={e => setPass(p => ({ ...p, password_actual: e.target.value }))}
                        onBlur={() => touchP("password_actual")}
                        autoComplete="current-password"
                        required
                      />
                      <button type="button" className="pf-eye"
                        onClick={() => setShowPass(s => ({ ...s, actual: !s.actual }))}>
                        <EyeIcon open={showPass.actual} />
                      </button>
                    </div>
                    {touchedP.password_actual && erroresP.password_actual
                      && <FieldErr msg={erroresP.password_actual} />}
                  </div>

                  {/* Nueva contraseña + fortaleza */}
                  <div className="pf-field">
                    <div className="pf-label-row">
                      <label className="pf-label">Nueva contraseña</label>
                      <span className="pf-label-hint">mínimo 8 caracteres</span>
                    </div>
                    <div className="pf-input-wrap">
                      <input
                        type={showPass.nuevo ? "text" : "password"}
                        value={pass.password_nuevo}
                        className={cls("pf-input has-icon",
                          !!touchedP.password_nuevo && !!pass.password_nuevo,
                          erroresP.password_nuevo)}
                        placeholder="••••••••"
                        onChange={e => setPass(p => ({ ...p, password_nuevo: e.target.value }))}
                        onBlur={() => touchP("password_nuevo")}
                        autoComplete="new-password"
                        required
                      />
                      <button type="button" className="pf-eye"
                        onClick={() => setShowPass(s => ({ ...s, nuevo: !s.nuevo }))}>
                        <EyeIcon open={showPass.nuevo} />
                      </button>
                    </div>

                    {/* Barra de fortaleza */}
                    {pass.password_nuevo && (
                      <div className="pf-strength">
                        <div className="pf-strength-bars">
                          {[1,2,3,4].map(n => (
                            <div key={n} className="pf-strength-bar"
                              style={{ background: strength >= n ? STRENGTH_COLOR[strength] : undefined }} />
                          ))}
                        </div>
                        <span className="pf-strength-txt" style={{ color: STRENGTH_COLOR[strength] }}>
                          {STRENGTH_LABEL[strength]}
                        </span>
                      </div>
                    )}

                    {/* Checklist de requisitos */}
                    {pass.password_nuevo && (
                      <div className="pf-reqs">
                        {[
                          { ok: pass.password_nuevo.length >= 8,          label: "8+ chars"  },
                          { ok: /[A-Z]/.test(pass.password_nuevo),         label: "Mayúscula" },
                          { ok: /[0-9]/.test(pass.password_nuevo),         label: "Número"    },
                          { ok: /[^A-Za-z0-9]/.test(pass.password_nuevo),  label: "Símbolo"   },
                        ].map(r => (
                          <span key={r.label} className="pf-req"
                            style={{ color: r.ok ? "#5a9e6f" : "#b8a898" }}>
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              {r.ok
                                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                              }
                            </svg>
                            {r.label}
                          </span>
                        ))}
                      </div>
                    )}

                    {touchedP.password_nuevo && erroresP.password_nuevo
                      && <FieldErr msg={erroresP.password_nuevo} />}
                  </div>

                  {/* Confirmar contraseña */}
                  <div className="pf-field">
                    <label className="pf-label">Confirmar nueva contraseña</label>
                    <div className="pf-input-wrap">
                      <input
                        type={showPass.confirmar ? "text" : "password"}
                        value={pass.confirmar}
                        className={cls("pf-input has-icon",
                          !!touchedP.confirmar && !!pass.confirmar,
                          erroresP.confirmar)}
                        placeholder="••••••••"
                        onChange={e => setPass(p => ({ ...p, confirmar: e.target.value }))}
                        onBlur={() => touchP("confirmar")}
                        autoComplete="new-password"
                        required
                      />
                      <button type="button" className="pf-eye"
                        onClick={() => setShowPass(s => ({ ...s, confirmar: !s.confirmar }))}>
                        <EyeIcon open={showPass.confirmar} />
                      </button>
                    </div>

                    {/* Barra progresiva de coincidencia */}
                    {pass.confirmar && pass.password_nuevo && (
                      <div className="pf-match-bar" style={{
                        background: pass.confirmar === pass.password_nuevo
                          ? "rgba(90,158,111,.5)" : "rgba(212,69,26,.4)",
                        width: `${Math.min((pass.confirmar.length / pass.password_nuevo.length) * 100, 100)}%`,
                      }} />
                    )}

                    {touchedP.confirmar && pass.confirmar && (
                      erroresP.confirmar
                        ? <FieldErr msg="Las contraseñas no coinciden" />
                        : <FieldOk  msg="Las contraseñas coinciden" />
                    )}
                  </div>

                  {msgP && <Alert type="ok"  msg={msgP} />}
                  {errP  && <Alert type="err" msg={errP} />}

                  <div className="pf-orn">
                    <div className="pf-orn-line" /><div className="pf-orn-diamond" /><div className="pf-orn-line" />
                  </div>
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

// ── Sub-componentes ───────────────────────────────────────────────────────────

function FieldErr({ msg }: { msg: string }) {
  return (
    <span className="pf-field-err">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01" />
      </svg>
      {msg}
    </span>
  );
}

function FieldOk({ msg }: { msg: string }) {
  return (
    <span className="pf-field-ok">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
      {msg}
    </span>
  );
}

function Alert({ type, msg }: { type: "ok" | "err"; msg: string }) {
  return (
    <div className={`pf-alert pf-alert-${type}`}>
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {type === "ok"
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
      </svg>
      {msg}
    </div>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
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
  );
}