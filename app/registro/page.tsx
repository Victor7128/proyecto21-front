"use client";

import { useState, FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";

// ─── Reglas por tipo de documento ───────────────────────────────────────────
const DOC_RULES: Record<string, { min: number; max: number; pattern: RegExp; hint: string; placeholder: string }> = {
  "1": { min: 8,  max: 8,  pattern: /^\d{8}$/,          hint: "8 dígitos numéricos",         placeholder: "12345678"   },
  "2": { min: 6,  max: 12, pattern: /^[A-Z0-9]{6,12}$/i, hint: "6–12 caracteres alfanuméricos", placeholder: "AB123456"  },
  "3": { min: 9,  max: 9,  pattern: /^\d{9}$/,           hint: "9 dígitos numéricos",         placeholder: "123456789"  },
};

// ─── Evaluador de fortaleza de contraseña ───────────────────────────────────
function evalPassword(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score: 1, label: "Muy débil",  color: "#d4451a" };
  if (score === 2) return { score: 2, label: "Débil",      color: "#e8832a" };
  if (score === 3) return { score: 3, label: "Aceptable",  color: "#c9a96e" };
  if (score === 4) return { score: 4, label: "Fuerte",     color: "#5a9e6f" };
  return              { score: 5, label: "Muy fuerte",  color: "#2e7d5a" };
}

// ─── Validadores por campo ───────────────────────────────────────────────────
function validateField(name: string, value: string, tipo_doc: string): string {
  switch (name) {
    case "nombres":
    case "apellidos": {
      const label = name === "nombres" ? "Nombres" : "Apellidos";
      if (!value.trim()) return `${label} es requerido`;
      if (value.trim().length < 2) return `${label} debe tener al menos 2 caracteres`;
      if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'-]+$/.test(value))
        return "Solo se permiten letras, espacios, apóstrofes y guiones";
      return "";
    }
    case "num_documento": {
      const rule = DOC_RULES[tipo_doc];
      if (!value) return "El número de documento es requerido";
      if (!rule.pattern.test(value)) return rule.hint;
      return "";
    }
    case "telefono": {
      if (!value) return ""; // opcional
      const digits = value.replace(/\s/g, "");
      if (!/^9\d{8}$/.test(digits))
        return "Debe iniciar con 9 y tener 9 dígitos (ej: 987654321)";
      return "";
    }
    case "email_login": {
      if (!value) return "El correo es requerido";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value))
        return "Ingresa un correo válido (ej: nombre@correo.com)";
      return "";
    }
    case "password": {
      if (!value) return "La contraseña es requerida";
      if (value.length < 8)  return "Mínimo 8 caracteres";
      if (value.length > 64) return "Máximo 64 caracteres";
      if (!/[A-Z]/.test(value)) return "Debe incluir al menos una mayúscula";
      if (!/[0-9]/.test(value)) return "Debe incluir al menos un número";
      return "";
    }
    default: return "";
  }
}

type FormFields = {
  nombres: string; apellidos: string;
  tipo_documento: string; num_documento: string;
  email_login: string; password: string; telefono: string;
};

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState("");
  const [touched, setTouched]   = useState<Partial<Record<keyof FormFields, boolean>>>({});

  const [form, setForm] = useState<FormFields>({
    nombres: "", apellidos: "", tipo_documento: "1",
    num_documento: "", email_login: "", password: "", telefono: "",
  });

  // Errors computed on every render (no stale state)
  const errors: Partial<Record<keyof FormFields, string>> = {
    nombres:       validateField("nombres",       form.nombres,       form.tipo_documento),
    apellidos:     validateField("apellidos",     form.apellidos,     form.tipo_documento),
    num_documento: validateField("num_documento", form.num_documento, form.tipo_documento),
    telefono:      validateField("telefono",      form.telefono,      form.tipo_documento),
    email_login:   validateField("email_login",   form.email_login,   form.tipo_documento),
    password:      validateField("password",      form.password,      form.tipo_documento),
  };

  const hasErrors = Object.values(errors).some(Boolean);
  const pwStrength = evalPassword(form.password);
  const docRule = DOC_RULES[form.tipo_documento];

  // Forzar solo números en campos numéricos
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    let { name, value } = e.target;

    if (name === "num_documento") {
      const numericTypes = ["1", "3"];
      if (numericTypes.includes(form.tipo_documento)) {
        value = value.replace(/\D/g, "");
      } else {
        value = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
      }
      value = value.slice(0, docRule.max);
    }
    if (name === "telefono") {
      value = value.replace(/\D/g, "").slice(0, 9);
    }
    if (name === "tipo_documento") {
      // Reset documento al cambiar tipo
      setForm(f => ({ ...f, tipo_documento: value, num_documento: "" }));
      setTouched(t => ({ ...t, num_documento: false }));
      return;
    }
    if (name === "password") {
      value = value.slice(0, 64);
    }

    setForm(f => ({ ...f, [name]: value }));
  }

  function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
    setTouched(t => ({ ...t, [e.target.name]: true }));
  }

  // Marcar todos como tocados al intentar enviar
  function touchAll() {
    setTouched({
      nombres: true, apellidos: true, num_documento: true,
      telefono: true, email_login: true, password: true,
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    touchAll();
    if (hasErrors) return;

    setApiError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          tipo_documento: parseInt(form.tipo_documento),
          correo: form.email_login,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error || "Error al registrarse."); return; }
      router.push("/portal");
      router.refresh();
    } catch {
      setApiError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  // Helper: estado visual del campo
  function fieldState(name: keyof FormFields) {
    if (!touched[name]) return "idle";
    return errors[name] ? "error" : "ok";
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Montserrat:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .rg-root {
          min-height: 100vh; display: flex;
          font-family: 'Montserrat', sans-serif;
          background: #1a1a14;
        }

        /* ══ PANEL IMAGEN ══ */
        .rg-image-panel {
          flex: 0 0 42%; position: sticky; top: 0;
          height: 100vh; overflow: hidden;
          display: flex; flex-direction: column; justify-content: flex-end;
        }
        .rg-image-panel img {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; object-position: center 30%;
          animation: imgZoom 20s ease-in-out infinite alternate;
        }
        @keyframes imgZoom { from{transform:scale(1)} to{transform:scale(1.05)} }
        .rg-image-panel::before {
          content:''; position:absolute; inset:0; z-index:1;
          background: linear-gradient(to bottom, rgba(26,26,20,.4) 0%, rgba(26,26,20,.08) 35%, rgba(26,26,20,.5) 70%, rgba(26,26,20,.92) 100%);
        }
        .rg-image-panel::after {
          content:''; position:absolute; inset:0; z-index:1;
          background: radial-gradient(ellipse at 70% 40%, rgba(201,169,110,.1) 0%, transparent 60%);
        }
        .rg-side-line {
          position:absolute; right:0; top:0; bottom:0; width:1px; z-index:3;
          background: linear-gradient(to bottom, transparent, rgba(201,169,110,.4) 30%, rgba(201,169,110,.4) 70%, transparent);
        }
        .rg-img-logo {
          position:absolute; top:2.5rem; left:2.5rem; z-index:2;
          display:flex; align-items:center; gap:.85rem;
        }
        .rg-img-logo-icon {
          width:44px; height:44px; border-radius:50%;
          background:linear-gradient(135deg,#e8832a,#d4451a);
          display:flex; align-items:center; justify-content:center;
          box-shadow:0 4px 20px rgba(232,131,42,.5);
        }
        .rg-img-logo-icon svg { width:22px; height:22px; color:white; }
        .rg-img-logo-name {
          font-family:'Cormorant Garamond',serif; color:#f5efe6;
          font-size:1.2rem; font-weight:400;
          text-shadow:0 2px 12px rgba(26,26,20,.5);
        }
        .rg-img-logo-name em { font-style:italic; color:#c9a96e; }
        .rg-img-content { position:relative; z-index:2; padding:2rem 2.5rem 3rem; }
        .rg-img-badges { display:flex; gap:.75rem; margin-bottom:1.5rem; flex-wrap:wrap; }
        .rg-img-badge {
          border:1px solid rgba(201,169,110,.45); border-radius:50px;
          padding:.3rem .85rem; font-size:.58rem; font-weight:600;
          letter-spacing:.18em; text-transform:uppercase;
          color:rgba(245,239,230,.7); backdrop-filter:blur(4px);
          background:rgba(26,26,20,.3);
        }
        .rg-img-orn {
          display:flex; align-items:center; gap:.6rem; margin-bottom:.8rem;
        }
        .rg-img-orn-line { height:1px; background:rgba(201,169,110,.45); width:28px; }
        .rg-img-orn-dot { width:5px; height:5px; border-radius:50%; background:rgba(201,169,110,.7); }
        .rg-img-orn-text { font-size:.58rem; font-weight:600; letter-spacing:.22em; text-transform:uppercase; color:rgba(201,169,110,.75); }
        .rg-img-headline {
          font-family:'Cormorant Garamond',serif; font-style:italic; font-weight:300;
          font-size:1.85rem; line-height:1.3; color:#f5efe6;
          text-shadow:0 2px 20px rgba(26,26,20,.6); margin-bottom:.75rem;
        }
        .rg-img-headline strong { font-weight:600; font-style:normal; color:#c9a96e; display:block; font-size:2.2rem; }
        .rg-img-perks { display:flex; flex-direction:column; gap:.5rem; }
        .rg-img-perk { display:flex; align-items:center; gap:.6rem; font-size:.68rem; color:rgba(245,239,230,.65); }
        .rg-img-perk-dot { width:4px; height:4px; border-radius:50%; background:#c9a96e; flex-shrink:0; }

        /* ══ PANEL FORMULARIO ══ */
        .rg-form-panel {
          flex:1; background:#f5efe6; overflow-y:auto; position:relative;
        }
        .rg-form-panel::before {
          content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
          background-image:url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23c9a96e' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='M20 20.5V18H0v-2h20v-2H0v-2h20v-2H0V8h20V6H0V4h20V2H0V0h22v20h2V0h2v20h2V0h2v20h2V0h2v22H20v-1.5z'/%3E%3C/g%3E%3C/svg%3E");
        }
        .rg-form-inner {
          position:relative; z-index:1;
          padding:3.5rem 3.5rem 4rem;
          max-width:520px; width:100%; margin:0 auto;
          animation:slideIn .65s cubic-bezier(.22,1,.36,1) both;
        }
        @keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }

        .rg-eyebrow { font-size:.6rem; font-weight:700; letter-spacing:.3em; text-transform:uppercase; color:#e8832a; margin-bottom:.45rem; }
        .rg-title { font-family:'Cormorant Garamond',serif; font-size:2.6rem; font-weight:600; color:#1a1a14; line-height:1; margin-bottom:.35rem; }
        .rg-title em { font-style:italic; color:#c9a96e; }
        .rg-sub { font-size:.7rem; color:#7a6e5f; letter-spacing:.08em; margin-bottom:2rem; }

        /* Separador de sección */
        .rg-sec {
          display:flex; align-items:center; gap:.75rem; margin:1.6rem 0 1.1rem;
        }
        .rg-sec-short { flex:0 0 20px; height:1px; background:rgba(201,169,110,.4); }
        .rg-sec-label { font-size:.59rem; font-weight:700; letter-spacing:.24em; text-transform:uppercase; color:#c9a96e; white-space:nowrap; }
        .rg-sec-full { flex:1; height:1px; background:rgba(201,169,110,.25); }

        /* Grid */
        .rg-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .rg-grid-doc { display:grid; grid-template-columns:3fr 2fr; gap:1rem; }

        /* Campo */
        .rg-field { display:flex; flex-direction:column; gap:.35rem; }
        .rg-label-row { display:flex; align-items:center; justify-content:space-between; }
        .rg-label { font-size:.61rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase; color:#7a6e5f; }
        .rg-optional { color:#b8a898; font-size:.57rem; letter-spacing:.06em; font-weight:400; text-transform:none; }
        .rg-counter { font-size:.57rem; color:#b8a898; font-variant-numeric:tabular-nums; }
        .rg-counter.warn { color:#e8832a; }

        /* Input */
        .rg-input-wrap { position:relative; }
        .rg-input {
          width:100%; background:white;
          border:1.5px solid #ddd5c4; border-radius:14px;
          padding:.8rem 1.1rem;
          font-family:'Montserrat',sans-serif; font-size:.83rem; color:#1a1a14;
          outline:none; transition:all .25s cubic-bezier(.22,1,.36,1);
          box-shadow:0 1px 3px rgba(74,64,53,.04);
          appearance:none; -webkit-appearance:none;
        }
        .rg-input::placeholder { color:#b8a898; }
        .rg-input:focus { border-color:#e8832a; box-shadow:0 0 0 4px rgba(232,131,42,.11); }
        .rg-input.state-ok { border-color:#5a9e6f; background:#f8fff9; }
        .rg-input.state-ok:focus { box-shadow:0 0 0 4px rgba(90,158,111,.1); }
        .rg-input.state-error { border-color:#d4451a; background:#fff8f7; }
        .rg-input.state-error:focus { box-shadow:0 0 0 4px rgba(212,69,26,.1); }
        .rg-input.has-icon { padding-right:2.8rem; }
        .rg-input.has-status { padding-right:2.8rem; }

        /* Select custom arrow */
        .rg-select-wrap { position:relative; }
        .rg-select-wrap::after {
          content:''; position:absolute; right:1rem; top:50%; transform:translateY(-50%);
          width:0; height:0; border-left:4px solid transparent; border-right:4px solid transparent;
          border-top:5px solid #b8a898; pointer-events:none;
        }
        .rg-select-wrap .rg-input { padding-right:2.5rem; cursor:pointer; }

        /* Icono dentro del input */
        .rg-input-icon {
          position:absolute; right:.9rem; top:50%; transform:translateY(-50%);
          background:none; border:none; cursor:pointer; padding:0;
          display:flex; align-items:center; transition:color .2s;
          color:#b8a898;
        }
        .rg-input-icon:hover { color:#7a6e5f; }
        .rg-input-icon svg { width:16px; height:16px; }

        /* Ícono de estado (ok / error) — no clickeable */
        .rg-status-icon {
          position:absolute; right:.9rem; top:50%; transform:translateY(-50%);
          pointer-events:none; display:flex; align-items:center;
        }
        .rg-status-icon svg { width:15px; height:15px; }

        /* Mensaje de error inline */
        .rg-field-error {
          display:flex; align-items:center; gap:.35rem;
          font-size:.65rem; color:#d4451a; line-height:1.3;
          animation:errIn .2s ease both;
        }
        @keyframes errIn { from{opacity:0;transform:translateY(-3px)} to{opacity:1;transform:translateY(0)} }
        .rg-field-error svg { width:11px; height:11px; flex-shrink:0; }

        /* Hint de documento */
        .rg-field-hint { font-size:.62rem; color:#7a6e5f; letter-spacing:.05em; }

        /* ── PASSWORD STRENGTH BAR ── */
        .rg-pw-meta { display:flex; flex-direction:column; gap:.5rem; }
        .rg-pw-bar-track {
          display:grid; grid-template-columns:repeat(5,1fr); gap:3px;
          height:4px;
        }
        .rg-pw-bar-seg {
          border-radius:99px; background:#e8e0d6;
          transition:background .3s ease;
        }
        .rg-pw-info-row {
          display:flex; align-items:flex-start; justify-content:space-between; gap:.5rem;
        }
        .rg-pw-reqs { display:flex; flex-wrap:wrap; gap:.35rem .75rem; }
        .rg-pw-req {
          display:flex; align-items:center; gap:.3rem;
          font-size:.6rem; color:#b8a898; transition:color .2s;
        }
        .rg-pw-req.met { color:#5a9e6f; }
        .rg-pw-req svg { width:10px; height:10px; }
        .rg-pw-strength-label {
          font-size:.62rem; font-weight:700; white-space:nowrap;
          transition:color .3s;
        }

        /* ── API ERROR ── */
        .rg-api-error {
          display:flex; align-items:flex-start; gap:.6rem;
          background:rgba(212,69,26,.07); border:1px solid rgba(212,69,26,.2);
          border-radius:12px; padding:.75rem 1rem;
          animation:shakeIn .35s cubic-bezier(.22,1,.36,1);
        }
        @keyframes shakeIn { 0%{transform:translateX(-8px);opacity:0} 60%{transform:translateX(4px)} 100%{transform:translateX(0);opacity:1} }
        .rg-api-error svg { width:14px; height:14px; color:#d4451a; flex-shrink:0; margin-top:1px; }
        .rg-api-error span { font-size:.74rem; color:#d4451a; line-height:1.4; }

        /* ── BOTÓN ── */
        .rg-btn {
          position:relative; overflow:hidden; width:100%;
          background:linear-gradient(135deg,#e8832a 0%,#d4451a 100%);
          border:none; border-radius:50px; padding:.95rem 2rem; margin-top:.4rem;
          color:white; font-family:'Montserrat',sans-serif;
          font-size:.72rem; font-weight:700; letter-spacing:.25em; text-transform:uppercase;
          cursor:pointer; box-shadow:0 6px 22px rgba(232,131,42,.45);
          transition:all .28s cubic-bezier(.22,1,.36,1);
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .rg-btn::after {
          content:''; position:absolute; top:0; left:-100%; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent);
          transition:left .5s ease;
        }
        .rg-btn:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 30px rgba(232,131,42,.55); }
        .rg-btn:hover:not(:disabled)::after { left:140%; }
        .rg-btn:active:not(:disabled) { transform:scale(.98); }
        .rg-btn:disabled { opacity:.55; cursor:not-allowed; }
        .rg-spin { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,.3); border-top-color:white; animation:spin .7s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* ── FOOTER ── */
        .rg-login-link { text-align:center; font-size:.73rem; color:#7a6e5f; margin-top:1.5rem; }
        .rg-login-link a { color:#e8832a; text-decoration:none; font-weight:600; transition:color .2s; }
        .rg-login-link a:hover { color:#d4451a; }
        .rg-copyright {
          text-align:center; font-size:.6rem; color:#b8a898; letter-spacing:.14em;
          margin-top:2rem; padding-top:1.5rem;
          border-top:1px solid rgba(201,169,110,.18);
        }

        /* ── RESPONSIVE ── */
        @media (max-width:860px) {
          .rg-root { flex-direction:column; }
          .rg-image-panel { position:relative; height:260px; flex:0 0 260px; }
          .rg-side-line { display:none; }
          .rg-img-logo { top:1.25rem; left:1.25rem; }
          .rg-img-content { padding:1.25rem 1.5rem 1.75rem; }
          .rg-img-headline { font-size:1.4rem; }
          .rg-img-headline strong { font-size:1.7rem; }
          .rg-form-inner { padding:2rem 1.5rem 3rem; }
          .rg-title { font-size:2rem; }
          .rg-grid-2, .rg-grid-doc { grid-template-columns:1fr; }
        }
      `}</style>

      <div className="rg-root">

        {/* ══ PANEL IMAGEN ══ */}
        <div className="rg-image-panel">
          <img
            src="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=85&auto=format&fit=crop"
            alt="Hostal Las Mercedes"
          />
          <div className="rg-side-line" />
          <div className="rg-img-logo">
            <div className="rg-img-logo-icon">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div className="rg-img-logo-name">Hostal <em>Las Mercedes</em></div>
          </div>
          <div className="rg-img-content">
            <div className="rg-img-badges">
              <span className="rg-img-badge">Wifi gratuito</span>
              <span className="rg-img-badge">Check-in 24h</span>
              <span className="rg-img-badge">Trujillo</span>
            </div>
            <div className="rg-img-orn">
              <div className="rg-img-orn-line" /><div className="rg-img-orn-dot" />
              <span className="rg-img-orn-text">Tu hogar en Trujillo</span>
              <div className="rg-img-orn-dot" /><div className="rg-img-orn-line" />
            </div>
            <div className="rg-img-headline">
              Crea tu cuenta y disfruta de
              <strong>todos los beneficios</strong>
            </div>
            <div className="rg-img-perks">
              {["Gestiona tus reservas en línea","Accede a tu historial de estadías","Consulta tus documentos y pagos"].map(p => (
                <div className="rg-img-perk" key={p}>
                  <div className="rg-img-perk-dot" />{p}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ PANEL FORMULARIO ══ */}
        <div className="rg-form-panel">
          <div className="rg-form-inner">

            <div className="rg-eyebrow">Nuevo huésped</div>
            <div className="rg-title">Regístrate<em>.</em></div>
            <div className="rg-sub">Completa tus datos para crear tu cuenta de acceso</div>

            <form onSubmit={handleSubmit} noValidate style={{ display:"flex", flexDirection:"column", gap:".9rem" }}>

              {/* ── DATOS PERSONALES ── */}
              <div className="rg-sec">
                <div className="rg-sec-short" />
                <span className="rg-sec-label">Datos personales</span>
                <div className="rg-sec-full" />
              </div>

              <div className="rg-grid-2">
                {/* Nombres */}
                <div className="rg-field">
                  <div className="rg-label-row">
                    <label className="rg-label">Nombres</label>
                  </div>
                  <div className="rg-input-wrap">
                    <input
                      className={`rg-input has-status ${fieldState("nombres") === "ok" ? "state-ok" : fieldState("nombres") === "error" ? "state-error" : ""}`}
                      name="nombres" value={form.nombres} onChange={handleChange} onBlur={handleBlur}
                      placeholder="Juan" maxLength={60} autoComplete="given-name"
                    />
                    {fieldState("nombres") === "ok" && <StatusOk />}
                    {fieldState("nombres") === "error" && <StatusErr />}
                  </div>
                  {touched.nombres && errors.nombres && <FieldError msg={errors.nombres} />}
                </div>

                {/* Apellidos */}
                <div className="rg-field">
                  <div className="rg-label-row">
                    <label className="rg-label">Apellidos</label>
                  </div>
                  <div className="rg-input-wrap">
                    <input
                      className={`rg-input has-status ${fieldState("apellidos") === "ok" ? "state-ok" : fieldState("apellidos") === "error" ? "state-error" : ""}`}
                      name="apellidos" value={form.apellidos} onChange={handleChange} onBlur={handleBlur}
                      placeholder="Pérez García" maxLength={80} autoComplete="family-name"
                    />
                    {fieldState("apellidos") === "ok" && <StatusOk />}
                    {fieldState("apellidos") === "error" && <StatusErr />}
                  </div>
                  {touched.apellidos && errors.apellidos && <FieldError msg={errors.apellidos} />}
                </div>
              </div>

              {/* Documento */}
              <div className="rg-grid-doc">
                <div className="rg-field">
                  <label className="rg-label">Tipo de documento</label>
                  <div className="rg-select-wrap">
                    <select className="rg-input" name="tipo_documento"
                      value={form.tipo_documento} onChange={handleChange} onBlur={handleBlur}>
                      <option value="1">DNI</option>
                      <option value="2">Pasaporte</option>
                      <option value="3">Carné de extranjería</option>
                    </select>
                  </div>
                </div>
                <div className="rg-field">
                  <div className="rg-label-row">
                    <label className="rg-label">Número</label>
                    <span className={`rg-counter ${form.num_documento.length === docRule.max ? "warn" : ""}`}>
                      {form.num_documento.length}/{docRule.max}
                    </span>
                  </div>
                  <div className="rg-input-wrap">
                    <input
                      className={`rg-input has-status ${fieldState("num_documento") === "ok" ? "state-ok" : fieldState("num_documento") === "error" ? "state-error" : ""}`}
                      name="num_documento" value={form.num_documento}
                      onChange={handleChange} onBlur={handleBlur}
                      placeholder={docRule.placeholder}
                      maxLength={docRule.max}
                      inputMode={form.tipo_documento !== "2" ? "numeric" : "text"}
                      autoComplete="off"
                    />
                    {fieldState("num_documento") === "ok" && <StatusOk />}
                    {fieldState("num_documento") === "error" && <StatusErr />}
                  </div>
                  {!touched.num_documento && <span className="rg-field-hint">{docRule.hint}</span>}
                  {touched.num_documento && errors.num_documento && <FieldError msg={errors.num_documento} />}
                </div>
              </div>

              {/* Teléfono */}
              <div className="rg-field">
                <div className="rg-label-row">
                  <label className="rg-label">Teléfono <span className="rg-optional">· opcional</span></label>
                  <span className={`rg-counter ${form.telefono.length === 9 ? "warn" : ""}`}>
                    {form.telefono.length > 0 ? `${form.telefono.length}/9` : ""}
                  </span>
                </div>
                <div className="rg-input-wrap">
                  <input
                    className={`rg-input has-status ${fieldState("telefono") === "ok" ? "state-ok" : fieldState("telefono") === "error" ? "state-error" : ""}`}
                    name="telefono" value={form.telefono}
                    onChange={handleChange} onBlur={handleBlur}
                    placeholder="987654321" maxLength={9} inputMode="numeric" autoComplete="tel"
                  />
                  {fieldState("telefono") === "ok" && <StatusOk />}
                  {fieldState("telefono") === "error" && <StatusErr />}
                </div>
                {!touched.telefono && <span className="rg-field-hint">Celular peruano, 9 dígitos, empieza con 9</span>}
                {touched.telefono && errors.telefono && <FieldError msg={errors.telefono} />}
              </div>

              {/* ── ACCESO AL PORTAL ── */}
              <div className="rg-sec">
                <div className="rg-sec-short" />
                <span className="rg-sec-label">Acceso al portal</span>
                <div className="rg-sec-full" />
              </div>

              {/* Email */}
              <div className="rg-field">
                <label className="rg-label">Correo de acceso</label>
                <div className="rg-input-wrap">
                  <input
                    className={`rg-input has-status ${fieldState("email_login") === "ok" ? "state-ok" : fieldState("email_login") === "error" ? "state-error" : ""}`}
                    name="email_login" type="email" value={form.email_login}
                    onChange={handleChange} onBlur={handleBlur}
                    placeholder="correo@ejemplo.com" autoComplete="email"
                  />
                  {fieldState("email_login") === "ok" && <StatusOk />}
                  {fieldState("email_login") === "error" && <StatusErr />}
                </div>
                {touched.email_login && errors.email_login && <FieldError msg={errors.email_login} />}
              </div>

              {/* Contraseña */}
              <div className="rg-field">
                <div className="rg-label-row">
                  <label className="rg-label">Contraseña</label>
                  <span className={`rg-counter ${form.password.length > 56 ? "warn" : ""}`}>
                    {form.password.length > 0 ? `${form.password.length}/64` : ""}
                  </span>
                </div>
                <div className="rg-input-wrap">
                  <input
                    className={`rg-input has-icon ${fieldState("password") === "ok" ? "state-ok" : fieldState("password") === "error" ? "state-error" : ""}`}
                    name="password" type={showPass ? "text" : "password"}
                    value={form.password} onChange={handleChange} onBlur={handleBlur}
                    placeholder="Mín. 8 caracteres" maxLength={64} autoComplete="new-password"
                  />
                  <button type="button" className="rg-input-icon" onClick={() => setShowPass(!showPass)}
                    style={{ right: form.password.length > 0 ? "2.4rem" : ".9rem" }}>
                    {showPass
                      ? <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      : <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    }
                  </button>
                </div>

                {/* Barra de fortaleza + requisitos */}
                {form.password.length > 0 && (
                  <div className="rg-pw-meta">
                    <div className="rg-pw-bar-track">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="rg-pw-bar-seg"
                          style={{ background: i <= pwStrength.score ? pwStrength.color : "#e8e0d6" }} />
                      ))}
                    </div>
                    <div className="rg-pw-info-row">
                      <div className="rg-pw-reqs">
                        <PwReq met={form.password.length >= 8}  label="8+ caracteres" />
                        <PwReq met={/[A-Z]/.test(form.password)} label="Mayúscula" />
                        <PwReq met={/[0-9]/.test(form.password)} label="Número" />
                        <PwReq met={/[^A-Za-z0-9]/.test(form.password)} label="Símbolo" />
                      </div>
                      <span className="rg-pw-strength-label" style={{ color: pwStrength.color }}>
                        {pwStrength.label}
                      </span>
                    </div>
                  </div>
                )}

                {touched.password && errors.password && <FieldError msg={errors.password} />}
              </div>

              {/* Error de API */}
              {apiError && (
                <div className="rg-api-error">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{apiError}</span>
                </div>
              )}

              <button type="submit" className="rg-btn" disabled={loading}>
                {loading ? <><div className="rg-spin" />Creando cuenta...</> : "Crear cuenta"}
              </button>
            </form>

            <p className="rg-login-link">
              ¿Ya tienes cuenta?{" "}<a href="/login">Inicia sesión aquí</a>
            </p>
            <div className="rg-copyright">© 2026 Hostal Las Mercedes · Trujillo, La Libertad · Perú</div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Subcomponentes pequeños ── */

function FieldError({ msg }: { msg: string }) {
  return (
    <div className="rg-field-error">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {msg}
    </div>
  );
}

function StatusOk() {
  return (
    <div className="rg-status-icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="#5a9e6f" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}

function StatusErr() {
  return (
    <div className="rg-status-icon">
      <svg fill="none" viewBox="0 0 24 24" stroke="#d4451a" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </div>
  );
}

function PwReq({ met, label }: { met: boolean; label: string }) {
  return (
    <span className={`rg-pw-req ${met ? "met" : ""}`}>
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {met
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        }
      </svg>
      {label}
    </span>
  );
}