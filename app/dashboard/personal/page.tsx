"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  personalService,
  catalogoService,
  Personal,
  PersonalPayload,
  TipoDocumento,
  Rol,
} from "@/services/personalService";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM: PersonalPayload = {
  nombre: "",
  tipo_documento: 0,
  num_documento: "",
  email: "",
  password: "",
  id_rol: 0,
  activo: true,
};

// ─────────────────────────────────────────────────────────────────────────────
// Validación de documentos (v2: normaliza tildes, cubre más tipos)
// ─────────────────────────────────────────────────────────────────────────────
type ReglaDocumento = {
  min: number;
  max: number;
  label: string;
  soloNumeros: boolean;
};

function getLongitudDocumento(
  tiposDocumento: TipoDocumento[],
  idTipo: number
): ReglaDocumento | null {
  const tipo = tiposDocumento.find((t) => t.id === idTipo);
  if (!tipo) return null;
  const norm = (s: string) =>
    s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const l = norm(tipo.label);
  if (l.includes("documento nacional") || l.includes("nacional de identidad") || l === "dni")
    return { min: 8,  max: 8,  label: "DNI",               soloNumeros: true  };
  if (l.includes("carnet") || l.includes("extranjeria"))
    return { min: 9,  max: 9,  label: "Carnet extranjería", soloNumeros: true  };
  if (l.includes("pasaporte"))
    return { min: 9,  max: 9,  label: "Pasaporte",          soloNumeros: false };
  if (l.includes("ruc"))
    return { min: 11, max: 11, label: "RUC",                soloNumeros: true  };
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

function Ornament() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: ".75rem", margin: ".25rem 0" }}>
      <div style={{ flex: 1, height: 1, background: "#c9a96e", opacity: .35 }} />
      <div style={{ width: 7, height: 7, border: "1px solid #c9a96e", transform: "rotate(45deg)", opacity: .7 }} />
      <div style={{ flex: 1, height: 1, background: "#c9a96e", opacity: .35 }} />
    </div>
  );
}

function Modal({ title, subtitle = "", onClose, children }: {
  title: string; subtitle?: string; onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(26,26,20,.65)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24, width: "100%", maxWidth: 520,
        maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 32px 80px rgba(26,26,20,.28), 0 8px 24px rgba(26,26,20,.14)",
        animation: "slideUp .32s cubic-bezier(.22,1,.36,1) both",
      }}>
        {title && (
          <div style={{
            padding: "1.4rem 1.75rem 1.1rem",
            borderBottom: "1px solid rgba(201,169,110,.18)",
            display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem",
            flexShrink: 0,
          }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.25rem", fontWeight: 600, color: "#1a1a14", fontStyle: "italic" }}>
                {title}
              </div>
              {subtitle && <div style={{ fontSize: ".6rem", color: "#b8a898", letterSpacing: ".14em", marginTop: 3 }}>{subtitle}</div>}
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "1px solid rgba(201,169,110,.4)", cursor: "pointer",
              color: "#7a6e5f", fontSize: ".85rem", width: 32, height: 32, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all .2s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.cssText += ";background:rgba(212,69,26,.08);color:#d4451a;border-color:#d4451a"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.cssText += ";background:none;color:#7a6e5f;border-color:rgba(201,169,110,.4)"; }}
            >✕</button>
          </div>
        )}
        <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{
        fontSize: ".6rem", fontWeight: 600, letterSpacing: ".22em",
        textTransform: "uppercase", color: "#7a6e5f",
        fontFamily: "'Montserrat',sans-serif",
        display: "flex", alignItems: "center", gap: ".4rem",
      }}>
        {label}
        {hint && <span style={{ fontSize: ".58rem", letterSpacing: ".06em", color: "#b8a898", fontWeight: 400, textTransform: "none" }}>({hint})</span>}
      </label>
      {children}
      {error && <span style={{ fontSize: ".65rem", color: "#d4451a" }}>⚠ {error}</span>}
    </div>
  );
}

function inputSt(hasError?: boolean, focused?: boolean): React.CSSProperties {
  return {
    width: "100%", padding: ".6rem 1rem",
    border: `1.5px solid ${hasError ? "#d4451a" : focused ? "#e8832a" : "#ddd5c4"}`,
    borderRadius: 14, fontSize: ".82rem", color: "#1a1a14",
    background: hasError ? "rgba(212,69,26,.04)" : "#fff",
    fontFamily: "'Montserrat',sans-serif", outline: "none",
    transition: "border-color .2s, box-shadow .2s", boxSizing: "border-box" as const,
    boxShadow: focused && !hasError ? "0 0 0 4px rgba(232,131,42,.12)" : undefined,
  };
}

function FInput({ hasError, valid, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean; valid?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        {...props}
        style={{ ...inputSt(hasError, focused), paddingRight: (valid || hasError) ? "2.2rem" : undefined }}
        onFocus={e => { setFocused(true); props.onFocus?.(e); }}
        onBlur={e => { setFocused(false); props.onBlur?.(e); }}
      />
      {(valid || hasError) && (
        <span style={{
          position: "absolute", right: ".75rem", top: "50%", transform: "translateY(-50%)",
          fontSize: ".75rem", pointerEvents: "none", color: valid ? "#16a34a" : "#d4451a",
        }}>
          {valid ? "✓" : "✕"}
        </span>
      )}
    </div>
  );
}

function FSelect({ hasError, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputSt(hasError, focused),
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%237a6e5f' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 1rem center",
        paddingRight: "2.5rem", cursor: "pointer",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulario
// ─────────────────────────────────────────────────────────────────────────────
function PersonalForm({ initial, tiposDocumento, roles, onSubmit, loading, esEdicion }: {
  initial: PersonalPayload; tiposDocumento: TipoDocumento[]; roles: Rol[];
  onSubmit: (data: PersonalPayload) => void; loading: boolean; esEdicion: boolean;
}) {
  const [form, setForm] = useState<PersonalPayload>(initial);
  const [docError, setDocError] = useState("");

  const set = (k: keyof PersonalPayload, v: string | number | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  useEffect(() => { setForm(initial); setDocError(""); }, [initial]);
  useEffect(() => {
    if (tiposDocumento.length > 0 && form.tipo_documento === 0)
      setForm(f => ({ ...f, tipo_documento: tiposDocumento[0].id }));
  }, [tiposDocumento]);
  useEffect(() => {
    if (roles.length > 0 && form.id_rol === 0)
      setForm(f => ({ ...f, id_rol: roles[0].id }));
  }, [roles]);

  const handleTipoDocumentoChange = (idTipo: number) => {
    set("tipo_documento", idTipo);
    set("num_documento", "");
    setDocError("");
  };

  const handleNumDocumentoChange = (valor: string) => {
    const regla = getLongitudDocumento(tiposDocumento, form.tipo_documento);
    const limpio = regla?.soloNumeros === false
      ? valor.replace(/[^a-zA-Z0-9]/g, "").toUpperCase()
      : valor.replace(/\D/g, "");
    set("num_documento", limpio);
    if (regla && limpio.length > 0) {
      const tipo = regla.soloNumeros === false ? "caracteres" : "dígitos";
      if (limpio.length < regla.min)
        setDocError(`${regla.label}: faltan ${regla.min - limpio.length} ${tipo}`);
      else if (limpio.length > regla.max)
        setDocError(`${regla.label}: máximo ${regla.max} ${tipo}`);
      else setDocError("");
    } else setDocError("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const regla = getLongitudDocumento(tiposDocumento, form.tipo_documento);
    if (regla && form.num_documento.length !== regla.min) {
      const tipo = regla.soloNumeros === false ? "caracteres" : "dígitos";
      setDocError(`${regla.label} debe tener exactamente ${regla.min} ${tipo}`);
      return;
    }
    onSubmit(form);
  };

  const reglaActual = getLongitudDocumento(tiposDocumento, form.tipo_documento);
  const docValido = reglaActual
    ? form.num_documento.length === reglaActual.min && !docError
    : form.num_documento.length >= 4;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

      <Field label="Nombre completo *">
        <FInput required placeholder="Ej. María López Herrera"
          value={form.nombre} onChange={e => set("nombre", e.target.value)} />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Tipo documento *">
          <FSelect value={form.tipo_documento}
            onChange={e => handleTipoDocumentoChange(Number(e.target.value))}>
            {tiposDocumento.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </FSelect>
        </Field>
        <Field
          label="Nº documento *"
          hint={reglaActual ? `${reglaActual.min} ${reglaActual.soloNumeros === false ? "caracteres" : "dígitos"}` : undefined}
          error={docError}
        >
          <FInput
            required
            value={form.num_documento}
            onChange={e => handleNumDocumentoChange(e.target.value)}
            inputMode={reglaActual?.soloNumeros === false ? "text" : "numeric"}
            maxLength={reglaActual?.max}
            hasError={!!docError}
            valid={form.num_documento.length > 0 && docValido && !docError}
            placeholder={reglaActual?.soloNumeros ? "0".repeat(reglaActual.min) : ""}
          />
        </Field>
      </div>

      <Field label="Correo electrónico *">
        <FInput required type="email" placeholder="correo@hostal.com"
          value={form.email} onChange={e => set("email", e.target.value)} />
      </Field>

      {!esEdicion && (
        <Field label="Contraseña *">
          <FInput required type="password" placeholder="••••••••"
            value={form.password ?? ""} onChange={e => set("password", e.target.value)} />
        </Field>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Rol *">
          <FSelect value={form.id_rol} onChange={e => set("id_rol", Number(e.target.value))}>
            {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
          </FSelect>
        </Field>
        <Field label="Estado">
          <FSelect value={form.activo ? "1" : "0"} onChange={e => set("activo", e.target.value === "1")}>
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </FSelect>
        </Field>
      </div>

      <Ornament />

      <button type="submit"
        disabled={loading || tiposDocumento.length === 0 || roles.length === 0 || !!docError}
        style={{
          padding: ".82rem 1.5rem", width: "100%",
          background: (loading || !!docError) ? "rgba(232,131,42,.4)" : "linear-gradient(135deg,#e8832a 0%,#d4451a 100%)",
          color: "#fff", border: "none", borderRadius: 50,
          cursor: (loading || !!docError) ? "not-allowed" : "pointer",
          fontFamily: "'Montserrat',sans-serif", fontSize: ".7rem", fontWeight: 700,
          letterSpacing: ".22em", textTransform: "uppercase",
          boxShadow: (loading || !!docError) ? "none" : "0 6px 20px rgba(232,131,42,.45)",
          transition: "all .25s cubic-bezier(.22,1,.36,1)",
        }}>
        {loading
          ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
              <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
              Guardando…
            </span>
          : esEdicion ? "Guardar cambios" : "Crear personal"}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function PersonalPage() {
  const [personal,       setPersonal]       = useState<Personal[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [roles,          setRoles]          = useState<Rol[]>([]);
  const [busqueda,       setBusqueda]       = useState("");
  const [loadingData,    setLoadingData]    = useState(true);
  const [loadingForm,    setLoadingForm]    = useState(false);
  const [error,          setError]          = useState("");
  const [modalCrear,     setModalCrear]     = useState(false);
  const [editando,       setEditando]       = useState<Personal | null>(null);
  const [eliminando,     setEliminando]     = useState<Personal | null>(null);

  useEffect(() => {
    Promise.all([catalogoService.tiposDocumento(), catalogoService.roles()])
      .then(([tipos, rols]) => { setTiposDocumento(tipos); setRoles(rols); })
      .catch(() => setError("No se pudieron cargar los catálogos"));
  }, []);

  const cargar = useCallback(async (nombre?: string) => {
    setLoadingData(true); setError("");
    try { setPersonal(await personalService.listar(nombre || undefined)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al cargar personal"); }
    finally { setLoadingData(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda), 400);
    return () => clearTimeout(t);
  }, [busqueda, cargar]);

  async function handleCrear(data: PersonalPayload) {
    setLoadingForm(true);
    try { await personalService.crear(data); setModalCrear(false); cargar(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al crear personal"); }
    finally { setLoadingForm(false); }
  }

  async function handleEditar(data: PersonalPayload) {
    if (!editando) return;
    setLoadingForm(true);
    try {
      const { password: _, ...payload } = data;
      await personalService.actualizar(editando.id_personal, payload);
      setEditando(null); cargar();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al actualizar personal"); }
    finally { setLoadingForm(false); }
  }

  async function handleEliminar() {
    if (!eliminando) return;
    setLoadingForm(true);
    try { await personalService.eliminar(eliminando.id_personal); setEliminando(null); cargar(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al eliminar personal"); }
    finally { setLoadingForm(false); }
  }

  function buscarIdCatalogo(catalogo: { id: number; label: string }[], nombreRecibido: string): number {
    const norm = (s: string) => s.toLowerCase().trim();
    const recibido = norm(nombreRecibido);
    let encontrado = catalogo.find(c => norm(c.label) === recibido);
    if (!encontrado)
      encontrado = catalogo.find(c => norm(c.label).includes(recibido) || recibido.includes(norm(c.label)));
    return encontrado?.id ?? catalogo[0]?.id ?? 0;
  }

  function personalToPayload(p: Personal): PersonalPayload {
    return {
      nombre: p.nombre,
      tipo_documento: buscarIdCatalogo(tiposDocumento, p.tipo_documento),
      num_documento: p.num_documento,
      email: p.email,
      id_rol: buscarIdCatalogo(roles, p.rol),
      activo: p.activo,
    };
  }

  const getInitials = (n: string) => n.split(" ").slice(0, 2).map(x => x[0]).join("").toUpperCase();
  const getRolColor = (rol: string) => {
    const map: Record<string, string> = {
      admin: "#e8832a", administrador: "#e8832a",
      recepcion: "#c9a96e", recepcionista: "#c9a96e",
      limpieza: "#7a6e5f",
    };
    return map[rol.toLowerCase()] ?? "#4a4035";
  };

  const activos   = personal.filter(p => p.activo).length;
  const inactivos = personal.filter(p => !p.activo).length;
  const rolesUniq = new Set(personal.map(p => p.rol)).size;

  // ── KPI type y arreglo tipado (highlight, hColor, hBorder opcionales)
  type KPIItem = {
    label: string;
    val: number;
    icon: string;
    bg: string;
    delay: string;
    highlight?: boolean;
    hColor?: string;
    hBorder?: string;
  };

  const kpis: KPIItem[] = [
    { label: "Total miembros",  val: personal.length, icon: "👥", bg: "rgba(201,169,110,.1)",  delay: ".05s" },
    { label: "Activos",         val: activos,         icon: "✅", bg: "rgba(90,158,111,.1)",   delay: ".1s", highlight: activos > 0, hColor: "#16a34a", hBorder: "rgba(90,158,111,.3)" },
    { label: "Inactivos",       val: inactivos,       icon: "⏸",  bg: "rgba(122,110,95,.08)", delay: ".15s" },
    { label: "Roles distintos", val: rolesUniq,       icon: "🎯", bg: "rgba(232,131,42,.1)",   delay: ".2s"  },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0e9df; }
        @keyframes slideUp { from { opacity:0; transform:translateY(24px) scale(.97) } to { opacity:1; transform:none } }
        @keyframes cardIn  { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:none } }
        @keyframes spin    { to { transform:rotate(360deg) } }
        @keyframes pulse   { 0%,100% { opacity:.6 } 50% { opacity:1 } }

        .ps-page { min-height:100vh; background:#f0e9df; font-family:'Montserrat',sans-serif; }

        /* Navbar */
        .ps-nav { background:#1a1a14; border-bottom:1px solid rgba(201,169,110,.25); position:sticky; top:0; z-index:100; }
        .ps-nav-inner { max-width:1300px; margin:0 auto; padding:0 2rem; height:68px; display:flex; align-items:center; gap:1rem; }
        .ps-logo { display:flex; align-items:center; gap:.75rem; text-decoration:none; }
        .ps-logo-icon { width:40px; height:40px; background:linear-gradient(135deg,#e8832a,#d4451a); border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 3px 12px rgba(232,131,42,.4); flex-shrink:0; }
        .ps-logo-icon svg { width:18px; height:18px; fill:#fff; }
        .ps-logo-name { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:#f5efe6; }
        .ps-logo-sub  { font-size:.5rem; letter-spacing:.2em; text-transform:uppercase; color:#c9a96e; margin-top:1px; }
        .ps-nav-sep   { flex:1; }
        .ps-back-link { display:flex; align-items:center; gap:.4rem; font-size:.6rem; font-weight:600; letter-spacing:.14em; text-transform:uppercase; color:rgba(245,239,230,.5); text-decoration:none; transition:color .2s; }
        .ps-back-link:hover { color:#c9a96e; }

        /* Layout */
        .ps-main { max-width:1300px; margin:0 auto; padding:2.5rem 2rem 5rem; }

        /* Ornamento */
        .ps-ornament { display:flex; align-items:center; gap:.75rem; margin-bottom:.6rem; }
        .ps-orn-line    { flex:1; height:1px; background:#c9a96e; opacity:.35; }
        .ps-orn-diamond { width:7px; height:7px; border:1px solid #c9a96e; transform:rotate(45deg); opacity:.7; flex-shrink:0; }

        /* Page header */
        .ps-page-header { display:flex; align-items:flex-end; justify-content:space-between; gap:1rem; flex-wrap:wrap; margin-bottom:2rem; }
        .ps-page-title  { font-family:'Cormorant Garamond',serif; font-size:2.4rem; font-weight:600; color:#1a1a14; line-height:1.1; }
        .ps-page-title em { font-style:italic; color:#e8832a; }
        .ps-page-sub    { font-size:.6rem; letter-spacing:.18em; text-transform:uppercase; color:#7a6e5f; margin-top:.3rem; }
        .ps-breadcrumb  { display:flex; align-items:center; gap:.5rem; font-size:.7rem; color:#b8a898; margin-bottom:.4rem; }
        .ps-breadcrumb a { color:#b8a898; text-decoration:none; transition:color .2s; }
        .ps-breadcrumb a:hover { color:#e8832a; }

        /* Botón primario */
        .ps-btn-primary {
          position:relative; overflow:hidden;
          display:inline-flex; align-items:center; gap:.5rem;
          padding:.72rem 1.6rem; border-radius:50px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#e8832a 0%,#d4451a 100%);
          color:#fff; font-family:'Montserrat',sans-serif;
          font-size:.7rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase;
          box-shadow:0 6px 20px rgba(232,131,42,.45);
          transition:transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s;
        }
        .ps-btn-primary::after { content:''; position:absolute; top:0; width:60%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent); left:-80%; transition:left .5s ease; }
        .ps-btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(232,131,42,.55); }
        .ps-btn-primary:hover::after { left:140%; }
        .ps-btn-primary:active { transform:scale(.97); }
        .ps-btn-primary svg { width:14px; height:14px; flex-shrink:0; }

        /* KPIs */
        .ps-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
        @media(max-width:900px) { .ps-kpis { grid-template-columns:repeat(2,1fr); } }
        .ps-kpi { background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:20px; padding:1.1rem 1.4rem; display:flex; align-items:center; gap:1rem; animation:cardIn .5s cubic-bezier(.22,1,.36,1) both; transition:transform .25s, box-shadow .25s; }
        .ps-kpi:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(26,26,20,.08); }
        .ps-kpi-icon { width:44px; height:44px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; flex-shrink:0; }
        .ps-kpi-val { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#1a1a14; line-height:1; }
        .ps-kpi-lbl { font-size:.58rem; letter-spacing:.14em; text-transform:uppercase; color:#b8a898; margin-top:2px; }

        /* Controles */
        .ps-controls { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap; }
        .ps-search-wrap { position:relative; display:inline-block; }
        .ps-search-icon { position:absolute; left:.9rem; top:50%; transform:translateY(-50%); color:#b8a898; font-size:.9rem; pointer-events:none; line-height:1; }
        .ps-search { padding:.5rem 1.1rem .5rem 2.4rem; border:1.5px solid #ddd5c4; border-radius:50px; font-family:'Montserrat',sans-serif; font-size:.75rem; color:#1a1a14; background:#fff; outline:none; width:280px; transition:border-color .2s, box-shadow .2s; }
        .ps-search:focus { border-color:#e8832a; box-shadow:0 0 0 3px rgba(232,131,42,.12); }
        .ps-search::placeholder { color:#b8a898; }

        /* Error */
        .ps-error { padding:.85rem 1.25rem; border-radius:14px; margin-bottom:1.25rem; background:rgba(212,69,26,.07); border:1px solid rgba(212,69,26,.2); font-size:.75rem; color:#d4451a; }

        /* Loading / Empty */
        .ps-loading { background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:24px; padding:5rem 2rem; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .ps-spinner { width:28px; height:28px; border-radius:50%; border:3px solid rgba(201,169,110,.2); border-top-color:#e8832a; animation:spin .7s linear infinite; }
        .ps-loading-lbl { font-size:.62rem; letter-spacing:.18em; text-transform:uppercase; color:#b8a898; }
        .ps-empty { background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:24px; padding:5rem 2rem; text-align:center; display:flex; flex-direction:column; align-items:center; gap:1rem; }
        .ps-empty-icon { width:64px; height:64px; border-radius:50%; font-size:1.6rem; background:rgba(201,169,110,.08); border:1px solid rgba(201,169,110,.2); display:flex; align-items:center; justify-content:center; }
        .ps-empty-title { font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:600; color:#1a1a14; }
        .ps-empty-sub   { font-size:.7rem; color:#b8a898; }

        /* Tabla */
        .ps-table-wrap { background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:24px; overflow:hidden; box-shadow:0 4px 20px rgba(26,26,20,.05); }
        .ps-table { width:100%; border-collapse:collapse; font-size:.78rem; }
        .ps-table thead tr { background:#f9f5ef; }
        .ps-table th { padding:.8rem 1.1rem; text-align:left; font-size:.58rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase; color:#7a6e5f; border-bottom:1px solid rgba(201,169,110,.18); white-space:nowrap; }
        .ps-table td { padding:.85rem 1.1rem; color:#4a4035; border-bottom:1px solid rgba(201,169,110,.1); vertical-align:middle; }
        .ps-table tbody tr { transition:background .2s; animation:cardIn .4s cubic-bezier(.22,1,.36,1) both; }
        .ps-table tbody tr:hover { background:#fdf9f4; }
        .ps-table tbody tr:last-child td { border-bottom:none; }

        /* Acciones */
        .ps-actions { display:flex; align-items:center; gap:.35rem; flex-wrap:wrap; justify-content:flex-end; }
        .ps-act { display:inline-flex; align-items:center; gap:.3rem; padding:.28rem .75rem; border-radius:50px; font-family:'Montserrat',sans-serif; font-size:.58rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase; border:1.5px solid; background:transparent; cursor:pointer; transition:background .2s, transform .15s; white-space:nowrap; }
        .ps-act:hover { transform:translateY(-1px); }
        .ps-act.edit { color:#7a6e5f; border-color:rgba(201,169,110,.4); }
        .ps-act.edit:hover { background:rgba(201,169,110,.08); border-color:#c9a96e; }
        .ps-act.del  { color:#d4451a; border-color:rgba(212,69,26,.25); }
        .ps-act.del:hover  { background:rgba(212,69,26,.08); }

        /* Footer tabla */
        .ps-table-foot { padding:.65rem 1.1rem; border-top:1px solid rgba(201,169,110,.12); font-size:.62rem; color:#b8a898; letter-spacing:.06em; }

        /* Modal confirmación */
        .confirm-icon-wrap { width:60px; height:60px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1.6rem; margin:0 auto 1.1rem; }
        .confirm-title { font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:600; color:#1a1a14; text-align:center; margin-bottom:.4rem; }
        .confirm-desc { font-size:.75rem; color:#7a6e5f; text-align:center; line-height:1.65; margin-bottom:1rem; }
        .confirm-card { background:#f9f5ef; border:1px solid rgba(201,169,110,.2); border-radius:16px; padding:.9rem 1.1rem; margin-bottom:1.25rem; }
        .confirm-card-id { font-family:'Cormorant Garamond',serif; font-size:1rem; font-weight:600; color:#e8832a; margin-bottom:.3rem; }
        .confirm-card-det { font-size:.75rem; color:#4a4035; line-height:1.75; }
        .confirm-btns { display:flex; gap:.75rem; }
        .confirm-btn { flex:1; padding:.75rem; border-radius:50px; border:none; cursor:pointer; font-family:'Montserrat',sans-serif; font-size:.68rem; font-weight:700; letter-spacing:.18em; text-transform:uppercase; transition:all .25s; }
        .confirm-btn:disabled { opacity:.5; cursor:not-allowed; }
        .confirm-btn.cancel { background:transparent; border:1.5px solid #ddd5c4; color:#7a6e5f; }
        .confirm-btn.cancel:hover { background:rgba(201,169,110,.08); }
        .confirm-btn.exec { color:#fff; box-shadow:0 4px 14px rgba(0,0,0,.18); }
        .confirm-btn.exec:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(0,0,0,.22); }
      `}</style>

      <div className="ps-page">

        {/* ══════════════════ NAVBAR ══════════════════ */}
        <header className="ps-nav">
          <div className="ps-nav-inner">
            <Link href="/dashboard" className="ps-logo">
              <div className="ps-logo-icon">
                <svg viewBox="0 0 24 24"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/></svg>
              </div>
              <div>
                <div className="ps-logo-name">Hostal Las Mercedes</div>
                <div className="ps-logo-sub">Panel de Administración</div>
              </div>
            </Link>
            <div className="ps-nav-sep" />
            <Link href="/dashboard" className="ps-back-link">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
              </svg>
              Volver al dashboard
            </Link>
          </div>
        </header>

        {/* ══════════════════ MAIN ══════════════════ */}
        <main className="ps-main">
          <div className="ps-ornament">
            <div className="ps-orn-line" /><div className="ps-orn-diamond" /><div className="ps-orn-line" />
          </div>

          <div className="ps-page-header">
            <div>
              <div className="ps-breadcrumb">
                <Link href="/dashboard">Dashboard</Link>
                <span>/</span>
                <span style={{ color: "#4a4035" }}>Personal</span>
              </div>
              <h1 className="ps-page-title">Gestión de <em>Personal</em></h1>
              <p className="ps-page-sub">Equipo · Roles · Accesos · Trujillo, La Libertad</p>
            </div>
            <button className="ps-btn-primary" onClick={() => setModalCrear(true)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo personal
            </button>
          </div>

          {/* KPIs */}
          <div className="ps-kpis">
            {kpis.map((k) => (
              <div key={k.label} className="ps-kpi"
                style={{ animationDelay: k.delay, borderColor: k.highlight ? k.hBorder : undefined }}>
                <div className="ps-kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
                <div>
                  <div className="ps-kpi-val" style={{ color: k.highlight ? k.hColor : undefined }}>
                    {loadingData ? "—" : k.val}
                  </div>
                  <div className="ps-kpi-lbl">{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Controles */}
          <div className="ps-controls">
            <div className="ps-search-wrap">
              <span className="ps-search-icon">⌕</span>
              <input className="ps-search" value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre…" />
            </div>
            {!loadingData && (
              <span style={{ fontSize: ".62rem", color: "#b8a898", letterSpacing: ".08em" }}>
                {personal.length} miembro{personal.length !== 1 ? "s" : ""} registrado{personal.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {error && <div className="ps-error">⚠ {error}</div>}

          {/* Tabla */}
          {loadingData ? (
            <div className="ps-loading"><div className="ps-spinner" /><span className="ps-loading-lbl">Cargando personal…</span></div>
          ) : personal.length === 0 ? (
            <div className="ps-empty">
              <div className="ps-empty-icon">👤</div>
              <div className="ps-empty-title">{busqueda ? "Sin resultados" : "No hay personal registrado"}</div>
              <div className="ps-empty-sub">{busqueda ? "Prueba con otro nombre." : "Agrega el primer miembro con el botón superior."}</div>
            </div>
          ) : (
            <div className="ps-table-wrap">
              <table className="ps-table">
                <thead>
                  <tr>
                    <th>Miembro</th><th>Documento</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {personal.map((p, idx) => (
                    <tr key={p.id_personal} style={{ animationDelay: `${idx * .03}s` }}>

                      {/* Avatar + nombre */}
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: "linear-gradient(135deg,#e8832a,#d4451a)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#fff", fontFamily: "'Montserrat',sans-serif",
                            fontSize: ".68rem", fontWeight: 700, flexShrink: 0,
                            boxShadow: "0 2px 8px rgba(232,131,42,.3)",
                          }}>
                            {getInitials(p.nombre)}
                          </div>
                          <span style={{ fontWeight: 600, color: "#1a1a14" }}>{p.nombre}</span>
                        </div>
                      </td>

                      {/* Documento */}
                      <td>
                        <span style={{
                          display: "inline-block", background: "rgba(201,169,110,.1)",
                          border: "1px solid rgba(201,169,110,.25)", borderRadius: 6,
                          padding: ".15rem .5rem", fontFamily: "'Montserrat',sans-serif",
                          fontSize: ".58rem", fontWeight: 600, letterSpacing: ".1em",
                          textTransform: "uppercase", color: "#7a6e5f", marginRight: ".4rem",
                        }}>
                          {p.tipo_documento}
                        </span>
                        {p.num_documento}
                      </td>

                      <td style={{ color: "#7a6e5f", fontSize: ".78rem" }}>{p.email}</td>

                      {/* Rol */}
                      <td>
                        <span style={{ color: getRolColor(p.rol), fontWeight: 600, fontSize: ".78rem" }}>
                          {p.rol}
                        </span>
                      </td>

                      {/* Estado */}
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: ".4rem",
                          padding: ".3rem .85rem", borderRadius: 50,
                          fontFamily: "'Montserrat',sans-serif", fontSize: ".6rem", fontWeight: 600,
                          letterSpacing: ".12em", textTransform: "uppercase",
                          ...(p.activo
                            ? { background: "rgba(34,197,94,.08)", color: "#16a34a", border: "1px solid rgba(34,197,94,.2)" }
                            : { background: "rgba(120,110,100,.08)", color: "#7a6e5f", border: "1px solid rgba(120,110,100,.2)" }
                          ),
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: p.activo ? "#22c55e" : "#b8a898",
                            animation: p.activo ? "pulse 2s ease-in-out infinite" : "none",
                          }} />
                          {p.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td>
                        <div className="ps-actions">
                          <button className="ps-act edit" onClick={() => setEditando(p)}>✎ Editar</button>
                          <button className="ps-act del"  onClick={() => setEliminando(p)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="ps-table-foot">
                {personal.length} miembro{personal.length !== 1 ? "s" : ""} registrado{personal.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════ MODAL: NUEVO PERSONAL ══════ */}
      {modalCrear && (
        <Modal title="Nuevo miembro del personal" subtitle="Registro por parte del administrador"
          onClose={() => setModalCrear(false)}>
          <PersonalForm
            initial={{ ...EMPTY_FORM, tipo_documento: tiposDocumento[0]?.id ?? 0, id_rol: roles[0]?.id ?? 0 }}
            tiposDocumento={tiposDocumento} roles={roles}
            onSubmit={handleCrear} loading={loadingForm} esEdicion={false}
          />
        </Modal>
      )}

      {/* ══════ MODAL: EDITAR PERSONAL ══════ */}
      {editando && (
        <Modal title="Editar personal" subtitle={editando.nombre} onClose={() => setEditando(null)}>
          <PersonalForm
            initial={personalToPayload(editando)}
            tiposDocumento={tiposDocumento} roles={roles}
            onSubmit={handleEditar} loading={loadingForm} esEdicion={true}
          />
        </Modal>
      )}

      {/* ══════ MODAL: CONFIRMAR ELIMINACIÓN ══════ */}
      {eliminando && (
        <Modal title="" onClose={() => !loadingForm && setEliminando(null)}>
          <div className="confirm-icon-wrap" style={{ background: "rgba(212,69,26,.08)" }}>⚠</div>
          <div className="confirm-title">Eliminar miembro</div>
          <div className="confirm-desc">
            ¿Estás seguro de que deseas eliminar a{" "}
            <strong style={{ color: "#1a1a14" }}>{eliminando.nombre}</strong>?
            Esta acción desactivará al usuario del sistema.
          </div>
          <div className="confirm-card">
            <div className="confirm-card-id">Miembro del personal</div>
            <div className="confirm-card-det">
              <strong>{eliminando.nombre}</strong><br/>
              📄 {eliminando.tipo_documento} · {eliminando.num_documento}<br/>
              ✉ {eliminando.email}<br/>
              🎯 {eliminando.rol} ·{" "}
              <span style={{ color: eliminando.activo ? "#16a34a" : "#7a6e5f" }}>
                {eliminando.activo ? "Activo" : "Inactivo"}
              </span>
            </div>
          </div>
          <div className="confirm-btns">
            <button className="confirm-btn cancel" onClick={() => setEliminando(null)} disabled={loadingForm}>
              Cancelar
            </button>
            <button className="confirm-btn exec"
              style={{ background: "linear-gradient(135deg,#d4451a,#a02810)" }}
              onClick={handleEliminar} disabled={loadingForm}>
              {loadingForm ? "Eliminando…" : "Sí, eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}