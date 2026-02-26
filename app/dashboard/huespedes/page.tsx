"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  huespedService,
  catalogoService,
  Huesped,
  HuespedPayload,
  TipoDocumento,
} from "@/services/huespedService";

// ─────────────────────────────────────────────────────────────────────────────
// Constantes
// ─────────────────────────────────────────────────────────────────────────────
const EMPTY_FORM: HuespedPayload = {
  nombres: "",
  apellidos: "",
  tipo_documento: 0,
  num_documento: "",
  telefono: "",
  correo: "",
};

const REGLAS_DOCUMENTO: Record<string, { regex: RegExp; mensaje: string }> = {
  dni:         { regex: /^\d{8}$/,            mensaje: "El DNI debe tener exactamente 8 dígitos numéricos." },
  pasaporte:   { regex: /^[A-Za-z0-9]{6,12}$/, mensaje: "El pasaporte debe tener entre 6 y 12 caracteres alfanuméricos." },
  "carné":     { regex: /^[A-Za-z0-9]{9,12}$/, mensaje: "El carné de extranjería debe tener entre 9 y 12 caracteres." },
  extranjería: { regex: /^[A-Za-z0-9]{9,12}$/, mensaje: "El carné de extranjería debe tener entre 9 y 12 caracteres." },
  ruc:         { regex: /^\d{11}$/,            mensaje: "El RUC debe tener exactamente 11 dígitos numéricos." },
};
function getRegla(label: string) {
  const lower = label.toLowerCase();
  for (const [key, regla] of Object.entries(REGLAS_DOCUMENTO))
    if (lower.includes(key)) return regla;
  return { regex: /^.{4,}$/, mensaje: "El número de documento debe tener al menos 4 caracteres." };
}
const REGEX_TEL = /^9\d{8}$/;

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

/** Modal con overlay borroso */
function Modal({
  title, subtitle = "", onClose, children,
}: {
  title: string; subtitle?: string;
  onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(26,26,20,.65)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24,
        width: "100%", maxWidth: 520,
        maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
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
              <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "1.25rem", fontWeight: 600, color: "#1a1a14" }}>
                {title}
              </div>
              {subtitle && (
                <div style={{ fontSize: ".6rem", color: "#b8a898", letterSpacing: ".14em", marginTop: 3 }}>{subtitle}</div>
              )}
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#b8a898", fontSize: "1rem", lineHeight: 1, padding: 4, flexShrink: 0,
            }}>✕</button>
          </div>
        )}
        <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Grupo campo + label + error */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{
        fontSize: ".6rem", fontWeight: 600, letterSpacing: ".22em",
        textTransform: "uppercase", color: "#7a6e5f", fontFamily: "'Montserrat',sans-serif",
      }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: ".65rem", color: "#d4451a" }}>{error}</span>}
    </div>
  );
}

function inputSt(hasError?: boolean, focused?: boolean): React.CSSProperties {
  return {
    width: "100%", padding: ".55rem .9rem",
    border: `1.5px solid ${hasError ? "#d4451a" : focused ? "#e8832a" : "#ddd5c4"}`,
    borderRadius: 14, fontSize: ".82rem",
    color: "#1a1a14", background: hasError ? "rgba(212,69,26,.04)" : "#fff",
    fontFamily: "'Montserrat',sans-serif", outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    boxSizing: "border-box" as const,
    boxShadow: focused && !hasError ? "0 0 0 4px rgba(232,131,42,.12)" : undefined,
  };
}

function FInput({ hasError, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={inputSt(hasError, focused)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
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
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 1rem center",
        paddingRight: "2.5rem",
        cursor: "pointer",
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulario de huésped
// ─────────────────────────────────────────────────────────────────────────────
type FormErrors = Partial<Record<keyof HuespedPayload, string>>;

function HuespedForm({
  initial, tiposDocumento, onSubmit, loading,
}: {
  initial: HuespedPayload;
  tiposDocumento: TipoDocumento[];
  onSubmit: (d: HuespedPayload) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<HuespedPayload>(initial);
  const [errs, setErrs] = useState<FormErrors>({});

  const set = (k: keyof HuespedPayload, v: string | number) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrs(e => ({ ...e, [k]: undefined }));
  };

  useEffect(() => { setForm(initial); setErrs({}); }, [initial]);
  useEffect(() => {
    if (tiposDocumento.length > 0 && form.tipo_documento === 0)
      setForm(f => ({ ...f, tipo_documento: tiposDocumento[0].id }));
  }, [tiposDocumento]);

  function validar(): boolean {
    const e: FormErrors = {};
    if (!form.nombres.trim())   e.nombres   = "El nombre es obligatorio.";
    if (!form.apellidos.trim()) e.apellidos = "Los apellidos son obligatorios.";
    const tipoLabel = tiposDocumento.find(t => t.id === form.tipo_documento)?.label ?? "";
    const regla = getRegla(tipoLabel);
    if (!regla.regex.test(form.num_documento)) e.num_documento = regla.mensaje;
    if (form.telefono && !REGEX_TEL.test(form.telefono))
      e.telefono = "Número peruano inválido (9 dígitos, comenzar con 9).";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  const dniPlaceholder = tiposDocumento.find(t => t.id === form.tipo_documento)
    ?.label?.toLowerCase().includes("dni") ? "12345678" : "";

  return (
    <form
      onSubmit={ev => { ev.preventDefault(); if (validar()) onSubmit(form); }}
      style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}
    >
      {/* Nombres + Apellidos */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Nombres *" error={errs.nombres}>
          <FInput value={form.nombres} onChange={e => set("nombres", e.target.value)}
            hasError={!!errs.nombres} placeholder="María" />
        </Field>
        <Field label="Apellidos *" error={errs.apellidos}>
          <FInput value={form.apellidos} onChange={e => set("apellidos", e.target.value)}
            hasError={!!errs.apellidos} placeholder="López Herrera" />
        </Field>
      </div>

      {/* Tipo doc + Nº doc */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Tipo documento *">
          <FSelect
            value={form.tipo_documento}
            onChange={e => {
              const id = Number(e.target.value);
              set("tipo_documento", id);
              if (form.num_documento) {
                const lbl = tiposDocumento.find(t => t.id === id)?.label ?? "";
                const r = getRegla(lbl);
                setErrs(er => ({
                  ...er, num_documento: r.regex.test(form.num_documento) ? undefined : r.mensaje,
                }));
              }
            }}
          >
            {tiposDocumento.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </FSelect>
        </Field>
        <Field label="Nº documento *" error={errs.num_documento}>
          <FInput value={form.num_documento} onChange={e => set("num_documento", e.target.value)}
            hasError={!!errs.num_documento} placeholder={dniPlaceholder} />
        </Field>
      </div>

      {/* Teléfono + Correo */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Teléfono" error={errs.telefono}>
          <FInput value={form.telefono ?? ""} onChange={e => set("telefono", e.target.value)}
            hasError={!!errs.telefono} placeholder="9XXXXXXXX" maxLength={9} />
        </Field>
        <Field label="Correo electrónico">
          <FInput type="email" value={form.correo ?? ""}
            onChange={e => set("correo", e.target.value)} placeholder="correo@ejemplo.com" />
        </Field>
      </div>

      {/* Ornamento */}
      <div style={{ display: "flex", alignItems: "center", gap: ".75rem", margin: ".25rem 0" }}>
        <div style={{ flex: 1, height: 1, background: "#c9a96e", opacity: .35 }} />
        <div style={{ width: 7, height: 7, border: "1px solid #c9a96e", transform: "rotate(45deg)", opacity: .7 }} />
        <div style={{ flex: 1, height: 1, background: "#c9a96e", opacity: .35 }} />
      </div>

      <button type="submit" disabled={loading || tiposDocumento.length === 0} style={{
        padding: ".78rem 1.5rem",
        background: loading ? "rgba(232,131,42,.45)" : "linear-gradient(135deg,#e8832a 0%,#d4451a 100%)",
        color: "#fff", border: "none", borderRadius: 50,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "'Montserrat',sans-serif",
        fontSize: ".7rem", fontWeight: 700, letterSpacing: ".22em", textTransform: "uppercase",
        boxShadow: loading ? "none" : "0 6px 20px rgba(232,131,42,.45)",
        transition: "all .25s cubic-bezier(.22,1,.36,1)",
      }}>
        {loading
          ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: ".5rem" }}>
              <span style={{
                width: 14, height: 14,
                border: "2px solid rgba(255,255,255,.35)", borderTopColor: "#fff",
                borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite",
              }} />
              Guardando…
            </span>
          : "Guardar huésped"}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function HuespedesPage() {
  const [huespedes,      setHuespedes]  = useState<Huesped[]>([]);
  const [tiposDocumento, setTiposDoc]   = useState<TipoDocumento[]>([]);
  const [busqueda,       setBusqueda]   = useState("");
  const [loadingData,    setLoadingData] = useState(true);
  const [loadingForm,    setLoadingForm] = useState(false);
  const [error,          setError]      = useState<string | null>(null);

  const [modalCrear,  setModalCrear]  = useState(false);
  const [editando,    setEditando]    = useState<Huesped | null>(null);
  const [eliminando,  setEliminando]  = useState<Huesped | null>(null);

  useEffect(() => {
    catalogoService.tiposDocumento()
      .then(setTiposDoc)
      .catch(() => setError("No se pudieron cargar los tipos de documento"));
  }, []);

  const cargar = useCallback(async (nombre?: string) => {
    setLoadingData(true); setError(null);
    try { setHuespedes(await huespedService.listar(nombre || undefined)); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al cargar huéspedes"); }
    finally { setLoadingData(false); }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda), 400);
    return () => clearTimeout(t);
  }, [busqueda, cargar]);

  async function handleCrear(data: HuespedPayload) {
    setLoadingForm(true); setError(null);
    try { await huespedService.crear(data); setModalCrear(false); cargar(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al crear"); }
    finally { setLoadingForm(false); }
  }

  async function handleEditar(data: HuespedPayload) {
    if (!editando) return;
    setLoadingForm(true); setError(null);
    try { await huespedService.actualizar(editando.id_huesped, data); setEditando(null); cargar(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al actualizar"); }
    finally { setLoadingForm(false); }
  }

  async function handleEliminar() {
    if (!eliminando) return;
    setLoadingForm(true); setError(null);
    try { await huespedService.eliminar(eliminando.id_huesped); setEliminando(null); cargar(); }
    catch (e: unknown) { setError(e instanceof Error ? e.message : "Error al eliminar"); }
    finally { setLoadingForm(false); }
  }

  function toPayload(h: Huesped): HuespedPayload {
    const tipo = tiposDocumento.find(t => t.label.toLowerCase() === h.tipo_documento.toLowerCase());
    return {
      nombres: h.nombres, apellidos: h.apellidos,
      tipo_documento: tipo?.id ?? tiposDocumento[0]?.id ?? 0,
      num_documento: h.num_documento,
      telefono: h.telefono ?? "", correo: h.correo ?? "",
    };
  }

  // ── KPIs ──
  const conTel    = huespedes.filter(h => h.telefono).length;
  const conCorreo = huespedes.filter(h => h.correo).length;
  const esteMes   = huespedes.filter(h => {
    const d = new Date(h.fecha_creacion), n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  // Definimos un tipo para los KPIs y usamos un arreglo tipado (highlight es opcional)
  type KPIItem = {
    label: string;
    val: number;
    icon: string;
    bg: string;
    delay: string;
    highlight?: boolean;
  };

  const kpis: KPIItem[] = [
    { label: "Total huéspedes",       val: huespedes.length, icon: "👥", bg: "rgba(201,169,110,.1)", delay: ".05s" },
    { label: "Nuevos este mes",      val: esteMes,          icon: "🗓", bg: "rgba(232,131,42,.1)",  delay: ".1s",  highlight: esteMes > 0 },
    { label: "Con teléfono",         val: conTel,           icon: "📞", bg: "rgba(90,158,111,.1)", delay: ".15s" },
    { label: "Con correo electrónico", val: conCorreo,       icon: "✉",  bg: "rgba(42,122,232,.1)", delay: ".2s"  },
  ];

  function fmtFecha(iso: string) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
  }
  function getInitials(n: string, a: string) { return `${n[0] ?? ""}${a[0] ?? ""}`.toUpperCase(); }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0e9df; }

        @keyframes slideUp {
          from { opacity:0; transform:translateY(24px) scale(.97); }
          to   { opacity:1; transform:none; }
        }
        @keyframes cardIn {
          from { opacity:0; transform:translateY(18px); }
          to   { opacity:1; transform:none; }
        }
        @keyframes dotPulse {
          0%,100% { opacity:1; } 50% { opacity:.3; }
        }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* ── Página ── */
        .hg-page { min-height:100vh; background:#f0e9df; font-family:'Montserrat',sans-serif; }

        /* ── Navbar ── */
        .hg-nav {
          background:#1a1a14; border-bottom:1px solid rgba(201,169,110,.25);
          position:sticky; top:0; z-index:100;
        }
        .hg-nav-inner {
          max-width:1300px; margin:0 auto; padding:0 2rem;
          height:68px; display:flex; align-items:center; gap:1rem;
        }
        .hg-logo { display:flex; align-items:center; gap:.75rem; text-decoration:none; }
        .hg-logo-icon {
          width:40px; height:40px; background:linear-gradient(135deg,#e8832a,#d4451a);
          border-radius:50%; display:flex; align-items:center; justify-content:center;
          box-shadow:0 3px 12px rgba(232,131,42,.4); flex-shrink:0;
        }
        .hg-logo-icon svg { width:18px; height:18px; fill:#fff; }
        .hg-logo-name { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:#f5efe6; }
        .hg-logo-sub  { font-size:.5rem; letter-spacing:.2em; text-transform:uppercase; color:#c9a96e; margin-top:1px; }
        .hg-nav-sep   { flex:1; }
        .hg-back-link {
          display:flex; align-items:center; gap:.4rem;
          font-size:.6rem; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
          color:rgba(245,239,230,.5); text-decoration:none; transition:color .2s;
        }
        .hg-back-link:hover { color:#c9a96e; }

        /* ── Layout ── */
        .hg-main { max-width:1300px; margin:0 auto; padding:2.5rem 2rem 5rem; }

        /* ── Ornamento ── */
        .hg-ornament { display:flex; align-items:center; gap:.75rem; margin-bottom:.6rem; }
        .hg-orn-line    { flex:1; height:1px; background:#c9a96e; opacity:.35; }
        .hg-orn-diamond { width:7px; height:7px; border:1px solid #c9a96e; transform:rotate(45deg); opacity:.7; flex-shrink:0; }

        /* ── Page header ── */
        .hg-page-header {
          display:flex; align-items:flex-end; justify-content:space-between;
          gap:1rem; flex-wrap:wrap; margin-bottom:2rem;
        }
        .hg-page-title {
          font-family:'Cormorant Garamond',serif;
          font-size:2.4rem; font-weight:600; color:#1a1a14; line-height:1.1;
        }
        .hg-page-title em { font-style:italic; color:#e8832a; }
        .hg-page-sub { font-size:.6rem; letter-spacing:.18em; text-transform:uppercase; color:#7a6e5f; margin-top:.3rem; }
        .hg-breadcrumb { display:flex; align-items:center; gap:.5rem; font-size:.7rem; color:#b8a898; margin-bottom:.4rem; }
        .hg-breadcrumb a { color:#b8a898; text-decoration:none; }
        .hg-breadcrumb a:hover { color:#e8832a; }

        /* ── Botón primario ── */
        .hg-btn-primary {
          position:relative; overflow:hidden;
          display:inline-flex; align-items:center; gap:.5rem;
          padding:.72rem 1.6rem; border-radius:50px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#e8832a 0%,#d4451a 100%);
          color:#fff; font-family:'Montserrat',sans-serif;
          font-size:.7rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase;
          box-shadow:0 6px 20px rgba(232,131,42,.45);
          transition:transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s;
        }
        .hg-btn-primary::after {
          content:''; position:absolute; top:0; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
          left:-80%; transition:left .5s ease;
        }
        .hg-btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(232,131,42,.55); }
        .hg-btn-primary:hover::after { left:140%; }
        .hg-btn-primary:active { transform:scale(.97); }
        .hg-btn-primary svg { width:14px; height:14px; flex-shrink:0; }

        /* ── KPIs ── */
        .hg-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; margin-bottom:2rem; }
        @media(max-width:900px) { .hg-kpis { grid-template-columns:repeat(2,1fr); } }
        .hg-kpi {
          background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:20px;
          padding:1.1rem 1.4rem; display:flex; align-items:center; gap:1rem;
          animation:cardIn .5s cubic-bezier(.22,1,.36,1) both;
          transition:transform .25s, box-shadow .25s;
        }
        .hg-kpi:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(26,26,20,.08); }
        .hg-kpi-icon {
          width:44px; height:44px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          font-size:1.2rem; flex-shrink:0;
        }
        .hg-kpi-val { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:600; color:#1a1a14; line-height:1; }
        .hg-kpi-lbl { font-size:.58rem; letter-spacing:.14em; text-transform:uppercase; color:#b8a898; margin-top:2px; }

        /* ── Controles ── */
        .hg-controls {
          display:flex; align-items:center; justify-content:space-between;
          gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap;
        }
        .hg-search-wrap { position:relative; display:inline-block; }
        .hg-search-icon {
          position:absolute; left:.9rem; top:50%; transform:translateY(-50%);
          color:#b8a898; font-size:.9rem; pointer-events:none; line-height:1;
        }
        .hg-search {
          padding:.5rem 1.1rem .5rem 2.4rem;
          border:1.5px solid #ddd5c4; border-radius:50px;
          font-family:'Montserrat',sans-serif; font-size:.75rem; color:#1a1a14;
          background:#fff; outline:none; width:280px;
          transition:border-color .2s, box-shadow .2s;
        }
        .hg-search:focus { border-color:#e8832a; box-shadow:0 0 0 3px rgba(232,131,42,.12); }
        .hg-search::placeholder { color:#b8a898; }

        /* ── Error ── */
        .hg-error {
          padding:.85rem 1.25rem; border-radius:14px; margin-bottom:1.25rem;
          background:rgba(212,69,26,.07); border:1px solid rgba(212,69,26,.2);
          font-size:.75rem; color:#d4451a;
        }

        /* ── Loading / Empty ── */
        .hg-loading {
          background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:24px;
          padding:5rem 2rem; display:flex; flex-direction:column; align-items:center; gap:1rem;
        }
        .hg-spinner {
          width:28px; height:28px; border-radius:50%;
          border:3px solid rgba(201,169,110,.2); border-top-color:#e8832a;
          animation:spin .7s linear infinite;
        }
        .hg-loading-label { font-size:.62rem; letter-spacing:.18em; text-transform:uppercase; color:#b8a898; }
        .hg-empty {
          background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:24px;
          padding:5rem 2rem; text-align:center;
          display:flex; flex-direction:column; align-items:center; gap:1rem;
        }
        .hg-empty-icon {
          width:64px; height:64px; border-radius:50%; font-size:1.6rem;
          background:rgba(201,169,110,.08); border:1px solid rgba(201,169,110,.2);
          display:flex; align-items:center; justify-content:center;
        }
        .hg-empty-title { font-family:'Cormorant Garamond',serif; font-size:1.3rem; font-weight:600; color:#1a1a14; }
        .hg-empty-sub   { font-size:.7rem; color:#b8a898; }

        /* ── Tabla ── */
        .hg-table-wrap {
          background:#fff; border:1px solid rgba(201,169,110,.15);
          border-radius:24px; overflow:hidden;
          box-shadow:0 4px 20px rgba(26,26,20,.05);
        }
        .hg-table { width:100%; border-collapse:collapse; font-size:.78rem; }
        .hg-table thead tr { background:#f9f5ef; }
        .hg-table th {
          padding:.8rem 1.1rem; text-align:left;
          font-size:.58rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
          color:#7a6e5f; border-bottom:1px solid rgba(201,169,110,.18); white-space:nowrap;
        }
        .hg-table td {
          padding:.85rem 1.1rem; color:#4a4035;
          border-bottom:1px solid rgba(201,169,110,.1); vertical-align:middle;
        }
        .hg-table tbody tr { transition:background .2s; animation:cardIn .4s cubic-bezier(.22,1,.36,1) both; }
        .hg-table tbody tr:hover { background:#fdf9f4; }
        .hg-table tbody tr:last-child td { border-bottom:none; }

        /* ── Botones de acción ── */
        .hg-actions { display:flex; align-items:center; gap:.35rem; flex-wrap:wrap; justify-content:flex-end; }
        .hg-act {
          display:inline-flex; align-items:center; gap:.3rem;
          padding:.28rem .75rem; border-radius:50px;
          font-family:'Montserrat',sans-serif; font-size:.58rem; font-weight:700;
          letter-spacing:.1em; text-transform:uppercase;
          border:1.5px solid; background:transparent; cursor:pointer;
          transition:background .2s, transform .15s; white-space:nowrap;
        }
        .hg-act:hover   { transform:translateY(-1px); }
        .hg-act.edit    { color:#7a6e5f; border-color:rgba(201,169,110,.4); }
        .hg-act.edit:hover { background:rgba(201,169,110,.08); border-color:#c9a96e; }
        .hg-act.del     { color:#d4451a; border-color:rgba(212,69,26,.25); }
        .hg-act.del:hover  { background:rgba(212,69,26,.08); }

        /* ── Footer tabla ── */
        .hg-table-foot {
          padding:.65rem 1.1rem; border-top:1px solid rgba(201,169,110,.12);
          font-size:.62rem; color:#b8a898; letter-spacing:.06em;
        }

        /* ── Modal confirmación ── */
        .confirm-icon-wrap {
          width:60px; height:60px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:1.6rem; margin:0 auto 1.1rem;
        }
        .confirm-title {
          font-family:'Cormorant Garamond',serif;
          font-size:1.3rem; font-weight:600; color:#1a1a14;
          text-align:center; margin-bottom:.4rem;
        }
        .confirm-desc { font-size:.75rem; color:#7a6e5f; text-align:center; line-height:1.65; margin-bottom:1rem; }
        .confirm-card {
          background:#f9f5ef; border:1px solid rgba(201,169,110,.2);
          border-radius:16px; padding:.9rem 1.1rem; margin-bottom:1.25rem;
        }
        .confirm-card-id {
          font-family:'Cormorant Garamond',serif;
          font-size:1rem; font-weight:600; color:#e8832a; margin-bottom:.3rem;
        }
        .confirm-card-det { font-size:.75rem; color:#4a4035; line-height:1.75; }
        .confirm-btns { display:flex; gap:.75rem; }
        .confirm-btn {
          flex:1; padding:.75rem; border-radius:50px; border:none;
          cursor:pointer; font-family:'Montserrat',sans-serif;
          font-size:.68rem; font-weight:700; letter-spacing:.18em; text-transform:uppercase;
          transition:all .25s;
        }
        .confirm-btn:disabled { opacity:.5; cursor:not-allowed; }
        .confirm-btn.cancel { background:transparent; border:1.5px solid #ddd5c4; color:#7a6e5f; }
        .confirm-btn.cancel:hover { background:rgba(201,169,110,.08); }
        .confirm-btn.exec { color:#fff; box-shadow:0 4px 14px rgba(0,0,0,.18); }
        .confirm-btn.exec:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(0,0,0,.22); }
      `}</style>

      <div className="hg-page">

        {/* ══════════════════ NAVBAR ══════════════════ */}
        <header className="hg-nav">
          <div className="hg-nav-inner">
            <Link href="/dashboard" className="hg-logo">
              <div className="hg-logo-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
                </svg>
              </div>
              <div>
                <div className="hg-logo-name">Hostal Las Mercedes</div>
                <div className="hg-logo-sub">Panel de Administración</div>
              </div>
            </Link>
            <div className="hg-nav-sep" />
            <Link href="/dashboard" className="hg-back-link">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
              </svg>
              Volver al dashboard
            </Link>
          </div>
        </header>

        {/* ══════════════════ MAIN ══════════════════ */}
        <main className="hg-main">

          {/* Ornamento + Header */}
          <div className="hg-ornament">
            <div className="hg-orn-line" /><div className="hg-orn-diamond" /><div className="hg-orn-line" />
          </div>

          <div className="hg-page-header">
            <div>
              <div className="hg-breadcrumb">
                <Link href="/dashboard">Dashboard</Link>
                <span>/</span>
                <span style={{ color: "#4a4035" }}>Huéspedes</span>
              </div>
              <h1 className="hg-page-title">Registro de <em>Huéspedes</em></h1>
              <p className="hg-page-sub">
                Directorio · Historial · Trujillo, La Libertad
              </p>
            </div>
            <button className="hg-btn-primary" onClick={() => setModalCrear(true)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo huésped
            </button>
          </div>

          {/* ── KPIs ── */}
          <div className="hg-kpis">
            {kpis.map((k, i) => (
              <div key={k.label} className="hg-kpi"
                style={{ animationDelay: k.delay, borderColor: k.highlight ? "rgba(232,131,42,.3)" : undefined }}>
                <div className="hg-kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
                <div>
                  <div className="hg-kpi-val" style={{ color: k.highlight ? "#e8832a" : undefined }}>
                    {loadingData ? "—" : k.val}
                  </div>
                  <div className="hg-kpi-lbl">{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Controles ── */}
          <div className="hg-controls">
            <div className="hg-search-wrap">
              <span className="hg-search-icon">⌕</span>
              <input
                className="hg-search"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o documento…"
              />
            </div>
            {!loadingData && (
              <span style={{ fontSize: ".62rem", color: "#b8a898", letterSpacing: ".08em" }}>
                {huespedes.length} huésped{huespedes.length !== 1 ? "es" : ""} registrado{huespedes.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* ── Error ── */}
          {error && <div className="hg-error">⚠ {error}</div>}

          {/* ── Tabla / estados ── */}
          {loadingData ? (
            <div className="hg-loading">
              <div className="hg-spinner" />
              <span className="hg-loading-label">Cargando huéspedes…</span>
            </div>
          ) : huespedes.length === 0 ? (
            <div className="hg-empty">
              <div className="hg-empty-icon">👤</div>
              <div className="hg-empty-title">
                {busqueda ? "Sin resultados" : "No hay huéspedes registrados"}
              </div>
              <div className="hg-empty-sub">
                {busqueda
                  ? "Prueba con otro nombre o número de documento."
                  : "Agrega el primer huésped con el botón superior."}
              </div>
            </div>
          ) : (
            <div className="hg-table-wrap">
              <table className="hg-table">
                <thead>
                  <tr>
                    <th>Huésped</th>
                    <th>Documento</th>
                    <th>Teléfono</th>
                    <th>Correo</th>
                    <th>Registro</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {huespedes.map((h, idx) => (
                    <tr key={h.id_huesped} style={{ animationDelay: `${idx * .03}s` }}>

                      {/* Avatar + Nombre */}
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
                            {getInitials(h.nombres, h.apellidos)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#1a1a14", fontSize: ".82rem" }}>
                              {h.nombres} {h.apellidos}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Documento */}
                      <td>
                        <span style={{
                          display: "inline-block",
                          background: "rgba(201,169,110,.1)", border: "1px solid rgba(201,169,110,.25)",
                          borderRadius: 6, padding: ".15rem .5rem",
                          fontFamily: "'Montserrat',sans-serif",
                          fontSize: ".58rem", fontWeight: 600, letterSpacing: ".1em", textTransform: "uppercase",
                          color: "#7a6e5f", marginRight: ".4rem",
                        }}>
                          {h.tipo_documento}
                        </span>
                        {h.num_documento}
                      </td>

                      {/* Teléfono */}
                      <td>
                        {h.telefono
                          ? <span style={{ display: "flex", alignItems: "center", gap: ".3rem", color: "#4a4035" }}>
                              <span>📞</span> {h.telefono}
                            </span>
                          : <span style={{ color: "#b8a898" }}>—</span>
                        }
                      </td>

                      {/* Correo */}
                      <td>
                        {h.correo
                          ? <span style={{ color: "#7a6e5f", fontSize: ".78rem" }}>{h.correo}</span>
                          : <span style={{ color: "#b8a898" }}>—</span>
                        }
                      </td>

                      {/* Fecha registro */}
                      <td>
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: ".3rem",
                          padding: ".2rem .6rem", borderRadius: 8,
                          background: "rgba(201,169,110,.07)", border: "1px solid rgba(201,169,110,.18)",
                          color: "#7a6e5f", fontSize: ".68rem", fontWeight: 500, whiteSpace: "nowrap",
                        }}>
                          {fmtFecha(h.fecha_creacion)}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td>
                        <div className="hg-actions">
                          <button className="hg-act edit" onClick={() => setEditando(h)}>✎ Editar</button>
                          <button className="hg-act del"  onClick={() => setEliminando(h)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="hg-table-foot">
                {huespedes.length} huésped{huespedes.length !== 1 ? "es" : ""} registrado{huespedes.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════════ MODAL: NUEVO HUÉSPED ══════════════════ */}
      {modalCrear && (
        <Modal
          title="Nuevo huésped"
          subtitle="Registro por parte del personal de recepción"
          onClose={() => { setModalCrear(false); setError(null); }}
        >
          <HuespedForm
            initial={{ ...EMPTY_FORM, tipo_documento: tiposDocumento[0]?.id ?? 0 }}
            tiposDocumento={tiposDocumento}
            onSubmit={handleCrear}
            loading={loadingForm}
          />
        </Modal>
      )}

      {/* ══════════════════ MODAL: EDITAR HUÉSPED ══════════════════ */}
      {editando && (
        <Modal
          title="Editar huésped"
          subtitle={`${editando.nombres} ${editando.apellidos}`}
          onClose={() => { setEditando(null); setError(null); }}
        >
          <HuespedForm
            initial={toPayload(editando)}
            tiposDocumento={tiposDocumento}
            onSubmit={handleEditar}
            loading={loadingForm}
          />
        </Modal>
      )}

      {/* ══════════════════ MODAL: CONFIRMAR ELIMINACIÓN ══════════════════ */}
      {eliminando && (
        <Modal title="" onClose={() => !loadingForm && setEliminando(null)}>
          <div className="confirm-icon-wrap" style={{ background: "rgba(212,69,26,.08)" }}>🗑</div>
          <div className="confirm-title">Eliminar huésped</div>
          <div className="confirm-desc">
            ¿Estás seguro de que deseas eliminar a{" "}
            <strong style={{ color: "#1a1a14" }}>{eliminando.nombres} {eliminando.apellidos}</strong>?
            Esta acción no se puede deshacer.
          </div>

          <div className="confirm-card">
            <div className="confirm-card-id">Huésped registrado</div>
            <div className="confirm-card-det">
              <strong>{eliminando.nombres} {eliminando.apellidos}</strong><br/>
              📄 {eliminando.tipo_documento} · {eliminando.num_documento}<br/>
              {eliminando.telefono ? `📞 ${eliminando.telefono}` : "Sin teléfono"}
              {eliminando.correo ? ` · ✉ ${eliminando.correo}` : ""}
            </div>
          </div>

          <div className="confirm-btns">
            <button
              className="confirm-btn cancel"
              onClick={() => setEliminando(null)}
              disabled={loadingForm}
            >
              Cancelar
            </button>
            <button
              className="confirm-btn exec"
              style={{ background: "linear-gradient(135deg,#d4451a,#a02810)" }}
              onClick={handleEliminar}
              disabled={loadingForm}
            >
              {loadingForm ? "Eliminando…" : "Eliminar definitivamente"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}