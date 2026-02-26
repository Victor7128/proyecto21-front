"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  reservaService,
  hospedajeService,
  reservaCatalogos,
  Reserva,
  ReservaPayload,
  OrdenHospedaje,
  HuespedOpcion,
  HabitacionOpcion,
  ESTADO_STYLE,
  ESTADOS_RESERVA,
} from "@/services/reservaService";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtFecha(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" });
}
function fmtHora(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}
function fmtMoney(n: number) {
  return new Intl.NumberFormat("es-PE", {
    style: "currency", currency: "PEN", minimumFractionDigits: 2,
  }).format(n ?? 0);
}
function calcNoches(entrada: string, salida: string) {
  return Math.max(0, Math.round(
    (new Date(salida).getTime() - new Date(entrada).getTime()) / 86_400_000
  ));
}
function estadoNumId(nombre: string): number {
  return ESTADOS_RESERVA.find(s => s.label === nombre)?.id ?? 1;
}

const EMPTY_PAYLOAD: ReservaPayload = {
  id_huesped: 0, id_habitacion: 0,
  fecha_entrada: "", fecha_salida: "",
  num_personas: 1, monto_total: 0, estado: 1,
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes UI
// ─────────────────────────────────────────────────────────────────────────────

/** Badge coloreado para el estado de la reserva */
function EstadoBadge({ estado }: { estado: string }) {
  const s = ESTADO_STYLE[estado] ?? ESTADO_STYLE["Pendiente"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 50,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      fontSize: ".58rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase",
      fontFamily: "'Montserrat',sans-serif", whiteSpace: "nowrap",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0,
        animation: estado === "Pendiente" ? "dotPulse 1.5s ease infinite" : "none",
      }} />
      {estado}
    </span>
  );
}

/** Modal con overlay borroso */
function Modal({ title, subtitle, wide = false, onClose, children }: {
  title: string; subtitle?: string; wide?: boolean;
  onClose: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(26,26,20,.65)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 24,
        width: "100%", maxWidth: wide ? 680 : 520,
        maxHeight: "92vh", overflow: "hidden",
        display: "flex", flexDirection: "column",
        boxShadow: "0 32px 80px rgba(26,26,20,.28), 0 8px 24px rgba(26,26,20,.14)",
        animation: "slideUp .32s cubic-bezier(.22,1,.36,1) both",
      }}>
        {/* Header del modal */}
        <div style={{
          padding: "1.4rem 1.75rem 1.1rem",
          borderBottom: "1px solid rgba(201,169,110,.18)",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem",
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontFamily: "'Cormorant Garamond',serif",
              fontSize: "1.25rem", fontWeight: 600, color: "#1a1a14",
            }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: ".6rem", color: "#b8a898", letterSpacing: ".14em", marginTop: 3 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#b8a898", fontSize: "1rem", lineHeight: 1, padding: 4, flexShrink: 0,
          }} title="Cerrar">✕</button>
        </div>
        {/* Cuerpo */}
        <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Grupo campo + label + error para formularios */
function Field({ label, error, children }: {
  label: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{
        fontSize: ".6rem", fontWeight: 600, letterSpacing: ".22em",
        textTransform: "uppercase", color: "#7a6e5f",
        fontFamily: "'Montserrat',sans-serif",
      }}>{label}</label>
      {children}
      {error && <span style={{ fontSize: ".65rem", color: "#d4451a" }}>{error}</span>}
    </div>
  );
}

function inputSt(hasError?: boolean): React.CSSProperties {
  return {
    width: "100%", padding: ".55rem .9rem",
    border: `1.5px solid ${hasError ? "#d4451a" : "#ddd5c4"}`,
    borderRadius: 14, fontSize: ".82rem",
    color: "#1a1a14", background: hasError ? "rgba(212,69,26,.04)" : "#fff",
    fontFamily: "'Montserrat',sans-serif", outline: "none",
    transition: "border-color .2s, box-shadow .2s",
    boxSizing: "border-box",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Formulario crear / editar reserva
// ─────────────────────────────────────────────────────────────────────────────
type FormErrors = Partial<Record<keyof ReservaPayload, string>>;

function ReservaForm({ initial, huespedes, habitaciones, onSubmit, loading }: {
  initial: ReservaPayload;
  huespedes: HuespedOpcion[];
  habitaciones: HabitacionOpcion[];
  onSubmit: (d: ReservaPayload) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<ReservaPayload>(initial);
  const [errs, setErrs] = useState<FormErrors>({});
  const [busqH, setBusqH] = useState("");

  useEffect(() => { setForm(initial); setErrs({}); setBusqH(""); }, [initial]);

  const set = (k: keyof ReservaPayload, v: string | number) => {
    setForm(f => ({ ...f, [k]: v }));
    setErrs(e => ({ ...e, [k]: undefined }));
  };

  const habsFiltradas = habitaciones.filter(
    h => h.estado === "Disponible" || h.id_habitacion === form.id_habitacion
  );
  const huespFiltrados = busqH.trim()
    ? huespedes.filter(h =>
        `${h.nombres} ${h.apellidos}`.toLowerCase().includes(busqH.toLowerCase()))
    : huespedes;

  const noches = form.fecha_entrada && form.fecha_salida
    ? calcNoches(form.fecha_entrada, form.fecha_salida) : 0;

  function validar(): boolean {
    const e: FormErrors = {};
    if (!form.id_huesped)    e.id_huesped    = "Selecciona un huésped.";
    if (!form.id_habitacion) e.id_habitacion = "Selecciona una habitación.";
    if (!form.fecha_entrada) e.fecha_entrada = "Fecha de entrada requerida.";
    if (!form.fecha_salida)  e.fecha_salida  = "Fecha de salida requerida.";
    if (form.fecha_entrada && form.fecha_salida && form.fecha_salida <= form.fecha_entrada)
      e.fecha_salida = "La salida debe ser posterior a la entrada.";
    if (form.num_personas < 1) e.num_personas = "Mínimo 1 persona.";
    if (form.monto_total <= 0) e.monto_total  = "El monto debe ser mayor a S/. 0.";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  return (
    <form onSubmit={ev => { ev.preventDefault(); if (validar()) onSubmit(form); }}
      style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

      {/* Huésped */}
      <Field label="Huésped *" error={errs.id_huesped}>
        <input
          value={busqH} onChange={e => setBusqH(e.target.value)}
          placeholder="Buscar huésped por nombre…"
          style={{ ...inputSt(), marginBottom: 4 }}
        />
        <select
          value={form.id_huesped}
          onChange={e => set("id_huesped", Number(e.target.value))}
          size={Math.min(5, Math.max(2, huespFiltrados.length))}
          style={{ ...inputSt(!!errs.id_huesped), height: "auto" }}
        >
          <option value={0} disabled>— Selecciona un huésped —</option>
          {huespFiltrados.map(h => (
            <option key={h.id_huesped} value={h.id_huesped}>
              {h.nombres} {h.apellidos}
            </option>
          ))}
        </select>
      </Field>

      {/* Habitación */}
      <Field label="Habitación *" error={errs.id_habitacion}>
        <select
          value={form.id_habitacion}
          onChange={e => set("id_habitacion", Number(e.target.value))}
          style={inputSt(!!errs.id_habitacion)}
        >
          <option value={0} disabled>— Selecciona habitación —</option>
          {habsFiltradas.map(h => (
            <option key={h.id_habitacion} value={h.id_habitacion}>
              Hab. {h.numero} — Piso {h.piso} · {h.tipo_habitacion}
              {h.tarifa_base ? ` · S/. ${h.tarifa_base}/noche` : ""}
            </option>
          ))}
        </select>
      </Field>

      {/* Fechas */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="Fecha de entrada *" error={errs.fecha_entrada}>
          <input type="date" value={form.fecha_entrada}
            onChange={e => set("fecha_entrada", e.target.value)}
            style={inputSt(!!errs.fecha_entrada)} />
        </Field>
        <Field label="Fecha de salida *" error={errs.fecha_salida}>
          <input type="date" value={form.fecha_salida}
            min={form.fecha_entrada || undefined}
            onChange={e => set("fecha_salida", e.target.value)}
            style={inputSt(!!errs.fecha_salida)} />
        </Field>
      </div>
      {noches > 0 && (
        <div style={{ marginTop: -8, fontSize: ".7rem", color: "#c9a96e", fontWeight: 600 }}>
          {noches} noche{noches !== 1 ? "s" : ""}
        </div>
      )}

      {/* Personas + Monto */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <Field label="N° de personas *" error={errs.num_personas}>
          <input type="number" min={1} max={20} value={form.num_personas}
            onChange={e => set("num_personas", Number(e.target.value))}
            style={inputSt(!!errs.num_personas)} />
        </Field>
        <Field label="Monto total (S/.) *" error={errs.monto_total}>
          <input type="number" min={0} step={0.01} value={form.monto_total}
            onChange={e => set("monto_total", Number(e.target.value))}
            style={inputSt(!!errs.monto_total)} />
        </Field>
      </div>

      {/* Estado */}
      <Field label="Estado inicial">
        <select value={form.estado} onChange={e => set("estado", Number(e.target.value))}
          style={inputSt()}>
          {ESTADOS_RESERVA.map(s => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </Field>

      {/* Botón submit */}
      <button type="submit" disabled={loading} style={{
        marginTop: ".5rem",
        padding: ".78rem 1.5rem",
        background: loading
          ? "rgba(232,131,42,.45)"
          : "linear-gradient(135deg,#e8832a 0%,#d4451a 100%)",
        color: "#fff", border: "none", borderRadius: 50,
        cursor: loading ? "not-allowed" : "pointer",
        fontFamily: "'Montserrat',sans-serif",
        fontSize: ".7rem", fontWeight: 700,
        letterSpacing: ".22em", textTransform: "uppercase",
        boxShadow: loading ? "none" : "0 6px 20px rgba(232,131,42,.45)",
        transition: "all .25s cubic-bezier(.22,1,.36,1)",
      }}>
        {loading ? "Guardando…" : "Guardar reserva"}
      </button>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal de confirmación de acción (confirmar / check-in / check-out / cancelar…)
// ─────────────────────────────────────────────────────────────────────────────
type AccionTipo = "confirmar" | "checkin" | "checkout" | "cancelar" | "noshow" | "eliminar";

const ACCION_INFO: Record<AccionTipo, {
  titulo: string; desc: string; btnLabel: string;
  btnGrad: string; icon: string; iconBg: string;
}> = {
  confirmar: {
    titulo: "Confirmar reserva",
    desc: "La reserva pasará a estado Confirmada. El huésped quedará asignado a la habitación para las fechas indicadas.",
    btnLabel: "Confirmar reserva", btnGrad: "linear-gradient(135deg,#5a9e6f,#3d7a52)",
    icon: "✅", iconBg: "rgba(90,158,111,.1)",
  },
  checkin: {
    titulo: "Realizar Check-in",
    desc: "Se registrará el ingreso del huésped y se creará la orden de hospedaje activa. La habitación pasará a estado ocupado.",
    btnLabel: "Hacer check-in", btnGrad: "linear-gradient(135deg,#2a7ae8,#1a4fd4)",
    icon: "🔑", iconBg: "rgba(42,122,232,.1)",
  },
  checkout: {
    titulo: "Realizar Check-out",
    desc: "Se registrará la salida del huésped. La orden de hospedaje quedará completada y la reserva pasará a Completada.",
    btnLabel: "Hacer check-out", btnGrad: "linear-gradient(135deg,#e8832a,#d4451a)",
    icon: "🚪", iconBg: "rgba(232,131,42,.1)",
  },
  cancelar: {
    titulo: "Cancelar reserva",
    desc: "La reserva quedará marcada como Cancelada y la habitación volverá a estar disponible.",
    btnLabel: "Cancelar reserva", btnGrad: "linear-gradient(135deg,#d4451a,#a02810)",
    icon: "✕", iconBg: "rgba(212,69,26,.08)",
  },
  noshow: {
    titulo: "Marcar como No show",
    desc: "El huésped no se presentó. La reserva quedará en estado No show sin posibilidad de reactivación.",
    btnLabel: "Marcar No show", btnGrad: "linear-gradient(135deg,#7a6e5f,#4a4035)",
    icon: "👻", iconBg: "rgba(122,110,95,.08)",
  },
  eliminar: {
    titulo: "Eliminar reserva",
    desc: "Solo es posible si la reserva no tiene órdenes de hospedaje, conserjería ni documentos de cobro asociados.",
    btnLabel: "Eliminar definitivamente", btnGrad: "linear-gradient(135deg,#d4451a,#a02810)",
    icon: "🗑", iconBg: "rgba(212,69,26,.08)",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────────────────────
export default function ReservasPage() {
  // ── datos ──
  const [reservas,      setReservas]      = useState<Reserva[]>([]);
  const [ordenes,       setOrdenes]       = useState<Record<number, OrdenHospedaje | null>>({});
  const [huespedes,     setHuespedes]     = useState<HuespedOpcion[]>([]);
  const [habitaciones,  setHabitaciones]  = useState<HabitacionOpcion[]>([]);
  const [loadingData,   setLoadingData]   = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error,         setError]         = useState<string | null>(null);

  // ── filtros ──
  const [filtro,   setFiltro]   = useState("Todas");
  const [busqueda, setBusqueda] = useState("");

  // ── modales ──
  const [modalCrear,   setModalCrear]   = useState(false);
  const [editando,     setEditando]     = useState<Reserva | null>(null);
  const [confirmando,  setConfirmando]  = useState<{
    reserva: Reserva; accion: AccionTipo;
  } | null>(null);

  // Para evitar bucle de cargas
  const cargando = useRef(false);

  // ── carga principal ──
  const cargar = useCallback(async () => {
    if (cargando.current) return;
    cargando.current = true;
    setLoadingData(true);
    setError(null);
    try {
      const [rvs, hsp, hab] = await Promise.all([
        reservaService.listar(),
        reservaCatalogos.huespedes(),
        reservaCatalogos.habitaciones(),
      ]);
      setReservas(rvs);
      setHuespedes(hsp);
      setHabitaciones(hab);

      // Cargar órdenes de hospedaje para reservas confirmadas en paralelo
      const confirmadas = rvs.filter(r => r.estado === "Confirmada");
      const mapa: Record<number, OrdenHospedaje | null> = {};
      await Promise.all(
        confirmadas.map(async r => {
          try {
            const os = await hospedajeService.porReserva(r.id_reserva);
            mapa[r.id_reserva] = Array.isArray(os) && os.length > 0 ? os[0] : null;
          } catch {
            mapa[r.id_reserva] = null;
          }
        })
      );
      setOrdenes(mapa);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar las reservas");
    } finally {
      setLoadingData(false);
      cargando.current = false;
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── conteos para KPIs y chips ──
  const cnt = useCallback((estado: string) =>
    reservas.filter(r => r.estado === estado).length,
    [reservas]
  );
  const enEstadia = Object.values(ordenes).filter(o => o?.estado === 2).length;

  // ── lista filtrada ──
  const lista = reservas.filter(r => {
    const pasaFiltro = filtro === "Todas" || r.estado === filtro;
    if (!pasaFiltro) return false;
    if (!busqueda.trim()) return true;
    return `${r.huesped} ${r.habitacion} ${r.id_reserva}`
      .toLowerCase()
      .includes(busqueda.toLowerCase());
  });

  // ── acción confirmar/checkin/checkout/cancelar/noshow/eliminar ──
  async function ejecutarAccion() {
    if (!confirmando) return;
    const { reserva: r, accion } = confirmando;
    setActionLoading(r.id_reserva);
    setError(null);
    try {
      switch (accion) {
        case "confirmar": await reservaService.cambiarEstado(r, 2); break;
        case "cancelar":  await reservaService.cambiarEstado(r, 3); break;
        case "noshow":    await reservaService.cambiarEstado(r, 4); break;
        case "eliminar":  await reservaService.eliminar(r.id_reserva); break;
        case "checkin": {
          // Asegurar que esté confirmada y luego crear orden de hospedaje
          if (r.estado !== "Confirmada") await reservaService.cambiarEstado(r, 2);
          await hospedajeService.checkin(r.id_reserva);
          break;
        }
        case "checkout": {
          const orden = ordenes[r.id_reserva];
          if (!orden) throw new Error("No se encontró la orden de hospedaje activa.");
          await hospedajeService.checkout(orden.id_orden_hospedaje, orden);
          await reservaService.cambiarEstado(r, 5); // → Completada
          break;
        }
      }
      setConfirmando(null);
      await cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al ejecutar la acción");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCrear(data: ReservaPayload) {
    setActionLoading(-1);
    setError(null);
    try {
      await reservaService.crear(data);
      setModalCrear(false);
      await cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear la reserva");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleEditar(data: ReservaPayload) {
    if (!editando) return;
    setActionLoading(editando.id_reserva);
    setError(null);
    try {
      await reservaService.actualizar(editando.id_reserva, data);
      setEditando(null);
      await cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al actualizar la reserva");
    } finally {
      setActionLoading(null);
    }
  }

  function toPayload(r: Reserva): ReservaPayload {
    return {
      id_huesped:    r.id_huesped,
      id_habitacion: r.id_habitacion,
      fecha_entrada: r.fecha_entrada.slice(0, 10),
      fecha_salida:  r.fecha_salida.slice(0, 10),
      num_personas:  r.num_personas,
      monto_total:   Number(r.monto_total),
      estado:        estadoNumId(r.estado),
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  const FILTROS = ["Todas", "Pendiente", "Confirmada", "Cancelada", "No show", "Completada"];

  return (
    <>
      {/* ── CSS global ── */}
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
          0%,100% { opacity:1; }
          50%      { opacity:.3; }
        }
        @keyframes spin {
          to { transform:rotate(360deg); }
        }
        @keyframes shineBtn {
          from { left:-80%; }
          to   { left:140%; }
        }

        .rv-page { min-height:100vh; background:#f0e9df; font-family:'Montserrat',sans-serif; }

        /* ── Navbar ── */
        .rv-nav {
          background:#1a1a14; border-bottom:1px solid rgba(201,169,110,.25);
          position:sticky; top:0; z-index:100;
        }
        .rv-nav-inner {
          max-width:1300px; margin:0 auto; padding:0 2rem;
          height:68px; display:flex; align-items:center; gap:1rem;
        }
        .rv-logo { display:flex; align-items:center; gap:.75rem; text-decoration:none; }
        .rv-logo-icon {
          width:40px; height:40px;
          background:linear-gradient(135deg,#e8832a,#d4451a);
          border-radius:50%; display:flex; align-items:center; justify-content:center;
          box-shadow:0 3px 12px rgba(232,131,42,.4); flex-shrink:0;
        }
        .rv-logo-icon svg { width:18px; height:18px; fill:#fff; }
        .rv-logo-name { font-family:'Cormorant Garamond',serif; font-size:1.2rem; font-weight:600; color:#f5efe6; }
        .rv-logo-sub  { font-size:.5rem; letter-spacing:.2em; text-transform:uppercase; color:#c9a96e; margin-top:1px; }
        .rv-nav-sep   { flex:1; }
        .rv-back-link {
          display:flex; align-items:center; gap:.4rem;
          font-size:.6rem; font-weight:600; letter-spacing:.14em; text-transform:uppercase;
          color:rgba(245,239,230,.5); text-decoration:none; transition:color .2s;
        }
        .rv-back-link:hover { color:#c9a96e; }

        /* ── Layout principal ── */
        .rv-main { max-width:1300px; margin:0 auto; padding:2.5rem 2rem 5rem; }

        /* ── Header de página ── */
        .rv-ornament {
          display:flex; align-items:center; gap:.75rem; margin-bottom:.6rem;
        }
        .rv-orn-line  { flex:1; height:1px; background:#c9a96e; opacity:.35; }
        .rv-orn-diamond {
          width:7px; height:7px; border:1px solid #c9a96e;
          transform:rotate(45deg); opacity:.7; flex-shrink:0;
        }
        .rv-page-header {
          display:flex; align-items:flex-end; justify-content:space-between;
          gap:1rem; flex-wrap:wrap; margin-bottom:2rem;
        }
        .rv-page-title {
          font-family:'Cormorant Garamond',serif;
          font-size:2.4rem; font-weight:600; color:#1a1a14; line-height:1.1;
        }
        .rv-page-title em { font-style:italic; color:#e8832a; }
        .rv-page-sub {
          font-size:.6rem; letter-spacing:.18em; text-transform:uppercase;
          color:#7a6e5f; margin-top:.3rem;
        }
        .rv-breadcrumb {
          display:flex; align-items:center; gap:.5rem;
          font-size:.7rem; color:#b8a898; margin-bottom:.4rem;
        }
        .rv-breadcrumb a { color:#b8a898; text-decoration:none; transition:color .2s; }
        .rv-breadcrumb a:hover { color:#e8832a; }

        /* ── Botón principal ── */
        .rv-btn-primary {
          position:relative; overflow:hidden;
          display:inline-flex; align-items:center; gap:.5rem;
          padding:.72rem 1.6rem; border-radius:50px; border:none; cursor:pointer;
          background:linear-gradient(135deg,#e8832a 0%,#d4451a 100%);
          color:#fff; font-family:'Montserrat',sans-serif;
          font-size:.7rem; font-weight:700; letter-spacing:.22em; text-transform:uppercase;
          box-shadow:0 6px 20px rgba(232,131,42,.45);
          transition:transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s;
        }
        .rv-btn-primary::after {
          content:''; position:absolute; top:0; width:60%; height:100%;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);
          left:-80%; transition:left .5s ease;
        }
        .rv-btn-primary:hover { transform:translateY(-2px); box-shadow:0 10px 28px rgba(232,131,42,.55); }
        .rv-btn-primary:hover::after { left:140%; }
        .rv-btn-primary:active { transform:scale(.97); }
        .rv-btn-primary svg { width:14px; height:14px; flex-shrink:0; }

        /* ── KPI cards ── */
        .rv-kpis {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:1rem; margin-bottom:2rem;
        }
        @media(max-width:900px) { .rv-kpis { grid-template-columns:repeat(2,1fr); } }
        .rv-kpi {
          background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:20px;
          padding:1.1rem 1.4rem; display:flex; align-items:center; gap:1rem;
          animation:cardIn .5s cubic-bezier(.22,1,.36,1) both;
          transition:transform .25s, box-shadow .25s;
        }
        .rv-kpi:hover { transform:translateY(-3px); box-shadow:0 8px 24px rgba(26,26,20,.08); }
        .rv-kpi-icon {
          width:44px; height:44px; border-radius:14px;
          display:flex; align-items:center; justify-content:center;
          font-size:1.2rem; flex-shrink:0;
        }
        .rv-kpi-val {
          font-family:'Cormorant Garamond',serif;
          font-size:2rem; font-weight:600; color:#1a1a14; line-height:1;
        }
        .rv-kpi-lbl {
          font-size:.58rem; letter-spacing:.14em; text-transform:uppercase;
          color:#b8a898; margin-top:2px;
        }

        /* ── Controles: chips + buscador ── */
        .rv-controls {
          display:flex; align-items:center; justify-content:space-between;
          gap:1rem; margin-bottom:1.5rem; flex-wrap:wrap;
        }
        .rv-chips { display:flex; gap:.4rem; flex-wrap:wrap; }
        .rv-chip {
          padding:.35rem .9rem; border-radius:50px; border:1.5px solid rgba(201,169,110,.2);
          background:transparent; cursor:pointer;
          font-family:'Montserrat',sans-serif; font-size:.58rem; font-weight:600;
          letter-spacing:.12em; text-transform:uppercase; color:#7a6e5f;
          transition:all .2s;
        }
        .rv-chip:hover { background:rgba(201,169,110,.08); border-color:rgba(201,169,110,.35); }
        .rv-chip.active { background:#1a1a14; color:#c9a96e; border-color:#1a1a14; }
        .rv-chip.pend.active { background:rgba(232,131,42,.1); color:#e8832a; border-color:rgba(232,131,42,.35); }
        .rv-search {
          padding:.5rem 1.1rem; border:1.5px solid #ddd5c4; border-radius:50px;
          font-family:'Montserrat',sans-serif; font-size:.75rem; color:#1a1a14;
          background:#fff; outline:none; width:250px;
          transition:border-color .2s, box-shadow .2s;
        }
        .rv-search:focus { border-color:#e8832a; box-shadow:0 0 0 3px rgba(232,131,42,.12); }

        /* ── Error banner ── */
        .rv-error {
          padding:.85rem 1.25rem; border-radius:14px; margin-bottom:1.25rem;
          background:rgba(212,69,26,.07); border:1px solid rgba(212,69,26,.2);
          font-size:.75rem; color:#d4451a;
        }

        /* ── Loading / Empty ── */
        .rv-loading {
          background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:24px;
          padding:5rem 2rem; display:flex; justify-content:center;
        }
        .rv-spinner {
          width:28px; height:28px; border-radius:50%;
          border:3px solid rgba(201,169,110,.2); border-top-color:#e8832a;
          animation:spin .7s linear infinite;
        }
        .rv-empty {
          background:#fff; border:1px solid rgba(201,169,110,.15); border-radius:24px;
          padding:5rem 2rem; text-align:center;
          display:flex; flex-direction:column; align-items:center; gap:1rem;
        }
        .rv-empty-icon {
          width:64px; height:64px; border-radius:50%; font-size:1.6rem;
          background:rgba(201,169,110,.08); border:1px solid rgba(201,169,110,.2);
          display:flex; align-items:center; justify-content:center;
        }
        .rv-empty-title {
          font-family:'Cormorant Garamond',serif;
          font-size:1.3rem; font-weight:600; color:#1a1a14;
        }
        .rv-empty-sub { font-size:.7rem; color:#b8a898; }

        /* ── Tabla de reservas ── */
        .rv-table-wrap {
          background:#fff; border:1px solid rgba(201,169,110,.15);
          border-radius:24px; overflow:hidden;
          box-shadow:0 4px 20px rgba(26,26,20,.05);
        }
        .rv-table { width:100%; border-collapse:collapse; font-size:.78rem; }
        .rv-table thead tr { background:#f9f5ef; }
        .rv-table th {
          padding:.8rem 1.1rem; text-align:left;
          font-size:.58rem; font-weight:700; letter-spacing:.16em; text-transform:uppercase;
          color:#7a6e5f; border-bottom:1px solid rgba(201,169,110,.18); white-space:nowrap;
        }
        .rv-table td {
          padding:.85rem 1.1rem; color:#4a4035;
          border-bottom:1px solid rgba(201,169,110,.1);
          vertical-align:middle;
        }
        .rv-table tbody tr { transition:background .2s; animation:cardIn .4s cubic-bezier(.22,1,.36,1) both; }
        .rv-table tbody tr:hover { background:#fdf9f4; }
        .rv-table tbody tr:last-child td { border-bottom:none; }

        .rv-cell-id {
          font-family:'Cormorant Garamond',serif;
          font-size:1rem; font-weight:600; color:#e8832a;
        }
        .rv-cell-guest { font-weight:600; color:#1a1a14; }
        .rv-cell-hab {
          display:inline-flex; align-items:center; gap:.35rem;
          padding:.2rem .6rem; border-radius:8px;
          background:rgba(42,122,232,.06); border:1px solid rgba(42,122,232,.15);
          color:#2a7ae8; font-size:.68rem; font-weight:600; white-space:nowrap;
        }
        .rv-cell-dates { white-space:nowrap; color:#4a4035; }
        .rv-cell-dates .arrow { color:#c9a96e; margin:0 .4rem; }
        .rv-cell-nights { color:#7a6e5f; font-size:.7rem; }
        .rv-cell-money {
          font-family:'Cormorant Garamond',serif;
          font-size:1rem; font-weight:600; color:#1a1a14; white-space:nowrap;
        }
        .rv-origin-badge {
          display:inline-flex; align-items:center;
          padding:.15rem .55rem; border-radius:50px; border:1px solid;
          font-size:.55rem; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
          white-space:nowrap;
        }

        /* Check-in activo indicator */
        .rv-checkin-live {
          display:inline-flex; align-items:center; gap:.35rem; margin-top:.35rem;
          padding:.3rem .65rem; border-radius:8px;
          background:rgba(90,158,111,.07); border:1px solid rgba(90,158,111,.2);
          font-size:.6rem; font-weight:600; color:#5a9e6f;
        }
        .rv-checkin-live-dot {
          width:7px; height:7px; border-radius:50%; background:#5a9e6f;
          animation:dotPulse 1.5s ease infinite;
        }

        /* ── Botones de acción en fila ── */
        .rv-actions { display:flex; align-items:center; gap:.35rem; flex-wrap:wrap; justify-content:flex-end; }
        .rv-act {
          display:inline-flex; align-items:center; gap:.3rem;
          padding:.28rem .75rem; border-radius:50px;
          font-family:'Montserrat',sans-serif; font-size:.58rem; font-weight:700;
          letter-spacing:.1em; text-transform:uppercase;
          border:1.5px solid; background:transparent; cursor:pointer;
          transition:background .2s, transform .15s; white-space:nowrap;
        }
        .rv-act:hover { transform:translateY(-1px); }
        .rv-act:disabled { opacity:.4; cursor:not-allowed; transform:none; }
        .rv-act.green  { color:#5a9e6f; border-color:rgba(90,158,111,.35); }
        .rv-act.green:hover  { background:rgba(90,158,111,.1); }
        .rv-act.blue   { color:#2a7ae8; border-color:rgba(42,122,232,.3); }
        .rv-act.blue:hover   { background:rgba(42,122,232,.1); }
        .rv-act.orange { color:#e8832a; border-color:rgba(232,131,42,.35); }
        .rv-act.orange:hover { background:rgba(232,131,42,.1); }
        .rv-act.red    { color:#d4451a; border-color:rgba(212,69,26,.3); }
        .rv-act.red:hover    { background:rgba(212,69,26,.08); }
        .rv-act.gray   { color:#7a6e5f; border-color:rgba(122,110,95,.25); }
        .rv-act.gray:hover   { background:rgba(122,110,95,.08); }

        /* ── Footer tabla ── */
        .rv-table-foot {
          padding:.65rem 1.1rem; border-top:1px solid rgba(201,169,110,.12);
          font-size:.62rem; color:#b8a898; letter-spacing:.06em;
        }

        /* ── Modal de confirmación ── */
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
        .confirm-desc {
          font-size:.75rem; color:#7a6e5f; text-align:center;
          line-height:1.65; margin-bottom:1rem;
        }
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
        .confirm-btn.cancel {
          background:transparent; border:1.5px solid #ddd5c4; color:#7a6e5f;
        }
        .confirm-btn.cancel:hover { background:rgba(201,169,110,.08); }
        .confirm-btn.exec { color:#fff; box-shadow:0 4px 14px rgba(0,0,0,.18); }
        .confirm-btn.exec:hover { transform:translateY(-1px); box-shadow:0 6px 18px rgba(0,0,0,.22); }
      `}</style>

      <div className="rv-page">

        {/* ══════════════════ NAVBAR ══════════════════ */}
        <header className="rv-nav">
          <div className="rv-nav-inner">
            <Link href="/dashboard" className="rv-logo">
              <div className="rv-logo-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V5H1v15h2v-3h18v3h2v-9c0-2.21-1.79-4-4-4z"/>
                </svg>
              </div>
              <div>
                <div className="rv-logo-name">Hostal Las Mercedes</div>
                <div className="rv-logo-sub">Panel de Administración</div>
              </div>
            </Link>
            <div className="rv-nav-sep" />
            <Link href="/dashboard" className="rv-back-link">
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7"/>
              </svg>
              Volver al dashboard
            </Link>
          </div>
        </header>

        {/* ══════════════════ MAIN ══════════════════ */}
        <main className="rv-main">

          {/* Ornamento + Header */}
          <div className="rv-ornament">
            <div className="rv-orn-line" />
            <div className="rv-orn-diamond" />
            <div className="rv-orn-line" />
          </div>
          <div className="rv-page-header">
            <div>
              <div className="rv-breadcrumb">
                <Link href="/dashboard">Dashboard</Link>
                <span>/</span>
                <span style={{ color: "#4a4035" }}>Reservas</span>
              </div>
              <h1 className="rv-page-title">Gestión de <em>Reservas</em></h1>
              <p className="rv-page-sub">
                Recepción · Aprobaciones · Check-in / Check-out · Trujillo, La Libertad
              </p>
            </div>
            <button className="rv-btn-primary" onClick={() => setModalCrear(true)}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4"/>
              </svg>
              Nueva reserva
            </button>
          </div>

          {/* ── KPIs ── */}
          <div className="rv-kpis">
            {[
              {
                label: "Total reservas", val: reservas.length,
                icon: "🗓", bg: "rgba(201,169,110,.1)", delay: ".05s",
              },
              {
                label: "Pendientes de aprobación", val: cnt("Pendiente"),
                icon: "⏳", bg: "rgba(232,131,42,.1)", delay: ".1s",
                highlight: cnt("Pendiente") > 0,
              },
              {
                label: "Confirmadas", val: cnt("Confirmada"),
                icon: "✅", bg: "rgba(90,158,111,.1)", delay: ".15s",
              },
              {
                label: "En estadía ahora", val: enEstadia,
                icon: "🛎", bg: "rgba(42,122,232,.1)", delay: ".2s",
              },
            ].map((k, i) => (
              <div key={i} className="rv-kpi"
                style={{
                  animationDelay: k.delay,
                  borderColor: k.highlight ? "rgba(232,131,42,.3)" : undefined,
                }}>
                <div className="rv-kpi-icon" style={{ background: k.bg }}>{k.icon}</div>
                <div>
                  <div className="rv-kpi-val"
                    style={{ color: k.highlight ? "#e8832a" : undefined }}>
                    {loadingData ? "—" : k.val}
                  </div>
                  <div className="rv-kpi-lbl">{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Filtros + búsqueda ── */}
          <div className="rv-controls">
            <div className="rv-chips">
              {FILTROS.map(f => (
                <button
                  key={f}
                  className={`rv-chip${filtro === f ? " active" : ""}${f === "Pendiente" ? " pend" : ""}`}
                  onClick={() => setFiltro(f)}
                >
                  {f}
                  {f !== "Todas" && !loadingData && (
                    <span style={{ opacity: .65, marginLeft: ".3rem" }}>({cnt(f)})</span>
                  )}
                  {f === "Todas" && !loadingData && (
                    <span style={{ opacity: .65, marginLeft: ".3rem" }}>({reservas.length})</span>
                  )}
                </button>
              ))}
            </div>
            <input
              className="rv-search"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar huésped, habitación, #…"
            />
          </div>

          {/* ── Error ── */}
          {error && <div className="rv-error">⚠ {error}</div>}

          {/* ── Tabla / estados ── */}
          {loadingData ? (
            <div className="rv-loading"><div className="rv-spinner" /></div>
          ) : lista.length === 0 ? (
            <div className="rv-empty">
              <div className="rv-empty-icon">🗓</div>
              <div className="rv-empty-title">
                {filtro === "Pendiente"
                  ? "Sin reservas pendientes"
                  : `No hay reservas${filtro !== "Todas" ? ` "${filtro}"` : ""}`}
              </div>
              <div className="rv-empty-sub">
                {filtro === "Pendiente"
                  ? "¡Todo en orden! No hay solicitudes pendientes de aprobación."
                  : "Ajusta los filtros o registra una nueva reserva."}
              </div>
            </div>
          ) : (
            <div className="rv-table-wrap">
              <table className="rv-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Huésped</th>
                    <th>Habitación</th>
                    <th>Origen</th>
                    <th>Fechas</th>
                    <th>Noches</th>
                    <th>Personas</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((r, idx) => {
                    const orden = ordenes[r.id_reserva];
                    const tieneCheckin = orden?.estado === 2;
                    const noches = calcNoches(r.fecha_entrada, r.fecha_salida);
                    const busy = actionLoading === r.id_reserva;
                    // Origen: si el huésped tiene email_login la reserva vino del portal,
                    // si no, fue creada por el personal. Sin ese dato exacto en la
                    // respuesta, asumimos "Personal" para todas las del dashboard.
                    const esPortal = false; // El SP no expone email_login

                    return (
                      <tr key={r.id_reserva} style={{ animationDelay: `${idx * .03}s` }}>
                        <td className="rv-cell-id">#{r.id_reserva}</td>

                        <td>
                          <div className="rv-cell-guest">{r.huesped}</div>
                          {tieneCheckin && orden && (
                            <div className="rv-checkin-live">
                              <span className="rv-checkin-live-dot" />
                              Check-in {fmtFecha(orden.fecha_checkin!)} {fmtHora(orden.fecha_checkin!)}
                            </div>
                          )}
                        </td>

                        <td>
                          <span className="rv-cell-hab">🛏 {r.habitacion}</span>
                        </td>

                        <td>
                          <span className="rv-origin-badge" style={
                            esPortal
                              ? { color: "#2a7ae8", borderColor: "rgba(42,122,232,.2)", background: "rgba(42,122,232,.05)" }
                              : { color: "#7a6e5f", borderColor: "rgba(122,110,95,.2)", background: "rgba(122,110,95,.05)" }
                          }>
                            {esPortal ? "Portal" : "Personal"}
                          </span>
                        </td>

                        <td className="rv-cell-dates">
                          {fmtFecha(r.fecha_entrada)}
                          <span className="arrow">→</span>
                          {fmtFecha(r.fecha_salida)}
                        </td>

                        <td className="rv-cell-nights">{noches}n</td>
                        <td style={{ color: "#7a6e5f", fontSize: ".7rem" }}>{r.num_personas} pers.</td>
                        <td className="rv-cell-money">{fmtMoney(Number(r.monto_total))}</td>

                        <td><EstadoBadge estado={r.estado} /></td>

                        <td>
                          <div className="rv-actions">
                            {/* ── Pendiente: Confirmar + Cancelar + Editar ── */}
                            {r.estado === "Pendiente" && (
                              <>
                                <button className="rv-act green" disabled={busy}
                                  onClick={() => setConfirmando({ reserva: r, accion: "confirmar" })}>
                                  ✓ Aprobar
                                </button>
                                <button className="rv-act gray" disabled={busy}
                                  onClick={() => setEditando(r)}>
                                  ✎ Editar
                                </button>
                                <button className="rv-act red" disabled={busy}
                                  onClick={() => setConfirmando({ reserva: r, accion: "cancelar" })}>
                                  ✕
                                </button>
                              </>
                            )}

                            {/* ── Confirmada sin check-in: Check-in + No show + Cancelar + Editar ── */}
                            {r.estado === "Confirmada" && !tieneCheckin && (
                              <>
                                <button className="rv-act blue" disabled={busy}
                                  onClick={() => setConfirmando({ reserva: r, accion: "checkin" })}>
                                  🔑 Check-in
                                </button>
                                <button className="rv-act gray" disabled={busy}
                                  onClick={() => setEditando(r)}>
                                  ✎ Editar
                                </button>
                                <button className="rv-act gray" disabled={busy}
                                  onClick={() => setConfirmando({ reserva: r, accion: "noshow" })}>
                                  No show
                                </button>
                                <button className="rv-act red" disabled={busy}
                                  onClick={() => setConfirmando({ reserva: r, accion: "cancelar" })}>
                                  ✕
                                </button>
                              </>
                            )}

                            {/* ── Confirmada CON check-in: Check-out ── */}
                            {r.estado === "Confirmada" && tieneCheckin && (
                              <button className="rv-act orange" disabled={busy}
                                onClick={() => setConfirmando({ reserva: r, accion: "checkout" })}>
                                🚪 Check-out
                              </button>
                            )}

                            {/* ── Completada / Cancelada / No show: solo eliminar ── */}
                            {(r.estado === "Completada" || r.estado === "Cancelada" || r.estado === "No show") && (
                              <button className="rv-act red" disabled={busy}
                                onClick={() => setConfirmando({ reserva: r, accion: "eliminar" })}>
                                🗑 Eliminar
                              </button>
                            )}

                            {/* Spinner en acción activa */}
                            {busy && (
                              <span style={{
                                width: 16, height: 16, borderRadius: "50%",
                                border: "2px solid rgba(201,169,110,.2)",
                                borderTopColor: "#e8832a",
                                animation: "spin .6s linear infinite",
                                display: "inline-block", flexShrink: 0,
                              }} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Footer de la tabla */}
              <div className="rv-table-foot">
                {lista.length} reserva{lista.length !== 1 ? "s" : ""} mostrada{lista.length !== 1 ? "s" : ""}
                {lista.length !== reservas.length
                  ? ` · ${reservas.length} en total`
                  : ""}
                {cnt("Pendiente") > 0 && (
                  <span style={{ color: "#e8832a", fontWeight: 700, marginLeft: "1rem" }}>
                    ⏳ {cnt("Pendiente")} pendiente{cnt("Pendiente") !== 1 ? "s" : ""} de aprobación
                  </span>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ══════════════════ MODAL: NUEVA RESERVA ══════════════════ */}
      {modalCrear && (
        <Modal
          title="Nueva reserva"
          subtitle="Registro por parte del personal de recepción"
          wide
          onClose={() => { setModalCrear(false); setError(null); }}
        >
          <ReservaForm
            initial={EMPTY_PAYLOAD}
            huespedes={huespedes}
            habitaciones={habitaciones}
            onSubmit={handleCrear}
            loading={actionLoading === -1}
          />
        </Modal>
      )}

      {/* ══════════════════ MODAL: EDITAR RESERVA ══════════════════ */}
      {editando && (
        <Modal
          title={`Editar reserva #${editando.id_reserva}`}
          subtitle={editando.huesped}
          wide
          onClose={() => { setEditando(null); setError(null); }}
        >
          <ReservaForm
            initial={toPayload(editando)}
            huespedes={huespedes}
            habitaciones={habitaciones}
            onSubmit={handleEditar}
            loading={actionLoading === editando.id_reserva}
          />
        </Modal>
      )}

      {/* ══════════════════ MODAL: CONFIRMAR ACCIÓN ══════════════════ */}
      {confirmando && (() => {
        const { reserva: r, accion } = confirmando;
        const info = ACCION_INFO[accion];
        const busy = actionLoading === r.id_reserva;
        const noches = calcNoches(r.fecha_entrada, r.fecha_salida);
        return (
          <Modal title="" onClose={() => !busy && setConfirmando(null)}>
            <div className="confirm-icon-wrap" style={{ background: info.iconBg }}>
              {info.icon}
            </div>
            <div className="confirm-title">{info.titulo}</div>
            <div className="confirm-desc">{info.desc}</div>

            {/* Tarjeta resumen de la reserva */}
            <div className="confirm-card">
              <div className="confirm-card-id">Reserva #{r.id_reserva}</div>
              <div className="confirm-card-det">
                <strong>{r.huesped}</strong><br />
                🛏 {r.habitacion}<br />
                📅 {fmtFecha(r.fecha_entrada)} → {fmtFecha(r.fecha_salida)}
                {" "}({noches} noche{noches !== 1 ? "s" : ""})<br />
                💰 {fmtMoney(Number(r.monto_total))}
                {" · "}
                <EstadoBadge estado={r.estado} />
              </div>
            </div>

            <div className="confirm-btns">
              <button
                className="confirm-btn cancel"
                onClick={() => setConfirmando(null)}
                disabled={busy}
              >
                Volver
              </button>
              <button
                className="confirm-btn exec"
                style={{ background: info.btnGrad }}
                onClick={ejecutarAccion}
                disabled={busy}
              >
                {busy ? "Procesando…" : info.btnLabel}
              </button>
            </div>
          </Modal>
        );
      })()}
    </>
  );
}