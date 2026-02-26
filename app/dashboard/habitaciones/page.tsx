"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  habitacionService,
  catalogoHabitacionService,
  Habitacion,
  HabitacionPayload,
  TipoHabitacion,
} from "@/services/habitacionService";

type Usuario = {
  nombre: string;
  email: string | null;
};

const EMPTY_FORM: HabitacionPayload = {
  numero: "",
  piso: 1,
  id_tipo_habitacion: 0,
  estado: 1,
};

function estadoToNumber(estado: Habitacion["estado"]) {
  if (typeof estado === "number") return estado;
  const s = estado.toLowerCase();
  if (s.includes("dispon")) return 1;
  return 2;
}

function estadoLabel(estado: Habitacion["estado"]) {
  if (typeof estado === "string") return estado;
  if (estado === 1) return "Disponible";
  if (estado === 2) return "No disponible";
  return `Estado ${estado}`;
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="hb-modal-overlay">
      <div className="hb-modal">
        <div className="hb-modal-head">
          <h2>{title}</h2>
          <button onClick={onClose} className="hb-modal-close" aria-label="Cerrar">x</button>
        </div>
        <div className="hb-modal-body">{children}</div>
      </div>
    </div>
  );
}

export default function HabitacionesPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [tipos, setTipos] = useState<TipoHabitacion[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");

  const [modalCrear, setModalCrear] = useState(false);
  const [editando, setEditando] = useState<Habitacion | null>(null);
  const [eliminando, setEliminando] = useState<Habitacion | null>(null);

  const [form, setForm] = useState<HabitacionPayload>(EMPTY_FORM);

  const loadPageData = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      const [meRes, habs, tiposData] = await Promise.all([
        fetch("/api/auth/me"),
        habitacionService.listar(),
        catalogoHabitacionService.tiposHabitacion(),
      ]);

      if (!meRes.ok) throw new Error("No autorizado");
      const me = await meRes.json();
      setUsuario({ nombre: me.nombre, email: me.email ?? null });

      setHabitaciones(habs);
      setTipos(tiposData);
      if (tiposData.length > 0) {
        setForm((prev) =>
          prev.id_tipo_habitacion === 0 ? { ...prev, id_tipo_habitacion: tiposData[0].id } : prev
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al cargar habitaciones";
      if (msg === "No autorizado") {
        router.push("/login");
        return;
      }
      setError(msg);
    } finally {
      setLoadingData(false);
    }
  }, [router]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  const rows = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return habitaciones;
    return habitaciones.filter((h) =>
      [
        String(h.id_habitacion),
        h.numero,
        String(h.piso),
        h.tipo_habitacion ?? "",
        estadoLabel(h.estado),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [habitaciones, busqueda]);

  function resetForm(next?: HabitacionPayload) {
    setForm(
      next ?? {
        ...EMPTY_FORM,
        id_tipo_habitacion: tipos[0]?.id ?? 0,
      }
    );
  }

  function openCreate() {
    resetForm();
    setModalCrear(true);
  }

  function openEdit(h: Habitacion) {
    const tipoId =
      h.id_tipo_habitacion ??
      tipos.find((t) => t.label.toLowerCase() === (h.tipo_habitacion ?? "").toLowerCase())?.id ??
      tipos[0]?.id ??
      0;

    setForm({
      numero: h.numero,
      piso: h.piso,
      id_tipo_habitacion: tipoId,
      estado: estadoToNumber(h.estado),
    });
    setEditando(h);
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoadingForm(true);
    setError("");
    try {
      await habitacionService.crear(form);
      setModalCrear(false);
      resetForm();
      await loadPageData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear habitación");
    } finally {
      setLoadingForm(false);
    }
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editando) return;
    setLoadingForm(true);
    setError("");
    try {
      await habitacionService.actualizar(editando.id_habitacion, form);
      setEditando(null);
      resetForm();
      await loadPageData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar habitación");
    } finally {
      setLoadingForm(false);
    }
  }

  async function confirmDelete() {
    if (!eliminando) return;
    setLoadingForm(true);
    setError("");
    try {
      await habitacionService.eliminar(eliminando.id_habitacion);
      setEliminando(null);
      await loadPageData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar habitación");
    } finally {
      setLoadingForm(false);
    }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .hb-root{min-height:100vh;background:#f0e9df;font-family:'Montserrat',sans-serif;color:#1a1a14}

        .hb-nav{background:#1a1a14;border-bottom:1px solid rgba(201,169,110,0.25);position:sticky;top:0;z-index:50}
        .hb-nav-inner{max-width:1280px;margin:0 auto;padding:0 2rem;height:68px;display:flex;align-items:center;justify-content:space-between}
        .hb-brand{display:flex;align-items:center;gap:.75rem;text-decoration:none}
        .hb-brand-ico{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#e8832a,#d4451a);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(232,131,42,.4)}
        .hb-brand-ico svg{width:18px;height:18px;fill:#fff}
        .hb-brand-name{font-family:'Cormorant Garamond',serif;font-size:1.2rem;font-weight:600;color:#f5efe6;letter-spacing:.04em}
        .hb-brand-sub{font-size:.55rem;letter-spacing:.2em;text-transform:uppercase;color:#c9a96e;font-weight:500}
        .hb-nav-right{display:flex;align-items:center;gap:1rem}
        .hb-user{font-size:.75rem;color:#f5efe6;text-align:right}
        .hb-user small{display:block;color:rgba(245,239,230,.55);font-size:.65rem}
        .hb-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;background:linear-gradient(135deg,#e8832a,#d4451a);border:2px solid rgba(201,169,110,.4)}
        .hb-logout{display:flex;align-items:center;gap:.45rem;padding:.55rem 1rem;background:transparent;color:rgba(245,239,230,.72);border:1px solid rgba(201,169,110,.3);border-radius:50px;font-size:.68rem;letter-spacing:.12em;text-transform:uppercase;font-weight:600;cursor:pointer;transition:.2s}
        .hb-logout:hover{background:rgba(212,69,26,.15);border-color:#d4451a;color:#f5c4b0}

        .hb-main{max-width:1280px;margin:0 auto;padding:2.4rem 2rem 3rem}
        .hb-orn{display:flex;align-items:center;gap:.75rem;margin-bottom:.55rem}
        .hb-line{flex:1;height:1px;background:#c9a96e;opacity:.35}
        .hb-diamond{width:7px;height:7px;border:1px solid #c9a96e;transform:rotate(45deg);opacity:.7}

        .hb-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.2rem}
        .hb-title{font-family:'Cormorant Garamond',serif;font-size:2.1rem;font-weight:400;line-height:1.2}
        .hb-title em{color:#e8832a;font-style:italic}
        .hb-sub{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;color:#7a6e5f;margin-top:.3rem}

        .hb-primary{border:none;border-radius:50px;background:linear-gradient(135deg,#e8832a 0%,#d4451a 100%);color:#fff;padding:.9rem 1.45rem;font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;font-weight:700;cursor:pointer;box-shadow:0 6px 20px rgba(232,131,42,.45);position:relative;overflow:hidden;transition:transform .2s,box-shadow .2s}
        .hb-primary::before{content:'';position:absolute;top:0;left:-120%;width:100%;height:100%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.2),transparent);transition:left .5s}
        .hb-primary:hover::before{left:120%}
        .hb-primary:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(232,131,42,.5)}
        .hb-primary:active{transform:scale(.98)}
        .hb-primary:disabled{opacity:.65;cursor:not-allowed}

        .hb-tools{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin-bottom:1rem}
        .hb-back{font-size:.8rem;color:#7a6e5f;text-decoration:none}
        .hb-back:hover{color:#d4451a}
        .hb-search{width:100%;max-width:360px;border-radius:14px;border:1.5px solid #ddd5c4;background:#fff;padding:.72rem .95rem;font-size:.86rem;color:#1a1a14;outline:none}
        .hb-search:focus{border-color:#e8832a;box-shadow:0 0 0 4px rgba(232,131,42,.12)}

        .hb-error{margin-bottom:.9rem;padding:.75rem .9rem;border-radius:12px;background:#fff0f0;border:1px solid #f0d0d0;color:#8b2020;font-size:.8rem}

        .hb-card{background:#fff;border:1px solid rgba(201,169,110,.15);border-radius:24px;overflow:hidden;box-shadow:0 20px 44px rgba(26,26,20,.08)}
        .hb-table{width:100%;border-collapse:collapse}
        .hb-table thead tr{background:#fcfbf8;border-bottom:1px solid #ece5d7}
        .hb-table th{font-size:.64rem;letter-spacing:.2em;text-transform:uppercase;color:#7a6e5f;padding:.95rem 1rem;text-align:left}
        .hb-table td{padding:1rem;border-bottom:1px solid #f2ecdf;color:#4a4035;font-size:.86rem}
        .hb-table tr:hover td{background:#fffefb}
        .hb-pill{display:inline-block;padding:.2rem .6rem;border-radius:999px;font-size:.68rem;font-weight:600}
        .hb-pill-ok{background:#e8f6ef;color:#1f8f5f}
        .hb-pill-off{background:#fdecec;color:#b02424}
        .hb-actions{display:flex;justify-content:flex-end;gap:.45rem}
        .hb-btn-sm{padding:.42rem .75rem;border-radius:10px;font-size:.72rem;font-weight:600;border:1px solid transparent;cursor:pointer;background:#fff}
        .hb-btn-edit{border-color:rgba(42,122,232,.25);color:#2a7ae8}
        .hb-btn-edit:hover{background:rgba(42,122,232,.08)}
        .hb-btn-del{border-color:rgba(180,47,47,.25);color:#b42f2f}
        .hb-btn-del:hover{background:rgba(180,47,47,.08)}
        .hb-empty{padding:2.2rem 1rem;text-align:center;color:#b8a898}

        .hb-modal-overlay{position:fixed;inset:0;background:rgba(20,16,10,.45);display:flex;align-items:center;justify-content:center;padding:1rem;z-index:70}
        .hb-modal{width:100%;max-width:680px;background:#f5efe6;border-radius:22px;border:1px solid rgba(201,169,110,.25);box-shadow:0 28px 60px rgba(0,0,0,.24)}
        .hb-modal-head{display:flex;justify-content:space-between;align-items:center;padding:1rem 1.25rem;border-bottom:1px solid rgba(201,169,110,.3)}
        .hb-modal-head h2{font-family:'Cormorant Garamond',serif;font-size:1.45rem;color:#1a1a14}
        .hb-modal-close{border:none;background:transparent;font-size:1.2rem;color:#7a6e5f;cursor:pointer}
        .hb-modal-body{padding:1.1rem 1.25rem}
        .hb-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem}
        .hb-label{display:block;margin-bottom:.35rem;font-size:.65rem;letter-spacing:.2em;text-transform:uppercase;color:#7a6e5f;font-weight:600}
        .hb-input{width:100%;border-radius:14px;border:1.5px solid #ddd5c4;background:#fff;padding:.72rem .9rem;font-size:.86rem;color:#1a1a14;outline:none}
        .hb-input:focus{border-color:#e8832a;box-shadow:0 0 0 4px rgba(232,131,42,.12)}
        .hb-field-error{margin-top:.25rem;font-size:.72rem;color:#b02424}
        .hb-modal-actions{margin-top:.9rem}

        @media (max-width: 860px){
          .hb-nav-inner{padding:0 1rem}
          .hb-main{padding:1.2rem .9rem 2rem}
          .hb-header{flex-direction:column}
          .hb-tools{flex-direction:column;align-items:flex-start}
          .hb-search{max-width:none}
          .hb-form-grid{grid-template-columns:1fr}
          .hb-user{display:none}
        }
      `}</style>

      <div className="hb-root">
        <header className="hb-nav">
          <div className="hb-nav-inner">
            <Link href="/dashboard" className="hb-brand">
              <span className="hb-brand-ico">
                <svg viewBox="0 0 24 24"><path d="M12.65 10A6 6 0 1 0 11 14.54V17H9v2h2v2h2v-2h2v-2h-2v-2.46A6 6 0 0 0 12.65 10zM7 10a4 4 0 1 1 4 4 4 4 0 0 1-4-4z"/></svg>
              </span>
              <span>
                <div className="hb-brand-name">Hostal Las Mercedes</div>
                <div className="hb-brand-sub">Panel de Administración</div>
              </span>
            </Link>
            <div className="hb-nav-right">
              <div className="hb-user">
                {usuario?.nombre ?? "Usuario"}
                <small>{usuario?.email ?? ""}</small>
              </div>
              <div className="hb-avatar">{(usuario?.nombre ?? "U").charAt(0).toUpperCase()}</div>
              <button onClick={handleLogout} className="hb-logout">Salir</button>
            </div>
          </div>
        </header>

        <main className="hb-main">
          <div className="hb-header">
            <div>
              <div className="hb-orn"><div className="hb-line"/><div className="hb-diamond"/><div className="hb-line"/></div>
              <h1 className="hb-title">Gestión de <em>Habitaciones</em></h1>
              <p className="hb-sub">Control de estado y disponibilidad por habitación</p>
            </div>
            <button onClick={openCreate} className="hb-primary">Nueva Habitación</button>
          </div>

          <div className="hb-tools">
            <Link href="/dashboard" className="hb-back">← Volver al dashboard</Link>
            <input
              className="hb-search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por número, piso, tipo o estado"
            />
          </div>

          {error ? <div className="hb-error">{error}</div> : null}

          <section className="hb-card">
            <table className="hb-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Número</th>
                  <th>Piso</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loadingData ? (
                  <tr><td className="hb-empty" colSpan={6}>Cargando habitaciones...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td className="hb-empty" colSpan={6}>No se encontraron habitaciones.</td></tr>
                ) : (
                  rows.map((h) => {
                    const tipoLabel = h.tipo_habitacion
                      ?? tipos.find((t) => t.id === h.id_tipo_habitacion)?.label
                      ?? `Tipo ${h.id_tipo_habitacion ?? "-"}`;
                    const estadoNum = estadoToNumber(h.estado);
                    return (
                      <tr key={h.id_habitacion}>
                        <td>{h.id_habitacion}</td>
                        <td><strong>{h.numero}</strong></td>
                        <td>{h.piso}</td>
                        <td>{tipoLabel}</td>
                        <td>
                          <span className={`hb-pill ${estadoNum === 1 ? "hb-pill-ok" : "hb-pill-off"}`}>
                            {estadoLabel(h.estado)}
                          </span>
                        </td>
                        <td>
                          <div className="hb-actions">
                            <button onClick={() => openEdit(h)} className="hb-btn-sm hb-btn-edit">Editar</button>
                            <button onClick={() => setEliminando(h)} className="hb-btn-sm hb-btn-del">Eliminar</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>
        </main>

        {modalCrear ? (
          <Modal title="Nueva habitación" onClose={() => setModalCrear(false)}>
            <form onSubmit={submitCreate}>
              <div className="hb-form-grid">
                <div>
                  <label className="hb-label">Número *</label>
                  <input className="hb-input" value={form.numero} onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))} required />
                </div>
                <div>
                  <label className="hb-label">Piso *</label>
                  <input className="hb-input" type="number" min={1} value={form.piso} onChange={(e) => setForm((p) => ({ ...p, piso: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label className="hb-label">Tipo habitación *</label>
                  <select className="hb-input" value={form.id_tipo_habitacion} onChange={(e) => setForm((p) => ({ ...p, id_tipo_habitacion: Number(e.target.value) }))} required>
                    {tipos.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="hb-label">Estado *</label>
                  <select className="hb-input" value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: Number(e.target.value) }))}>
                    <option value={1}>Disponible</option>
                    <option value={2}>No disponible</option>
                  </select>
                </div>
              </div>
              <div className="hb-modal-actions">
                <button className="hb-primary" type="submit" disabled={loadingForm}>{loadingForm ? "Guardando..." : "Guardar"}</button>
              </div>
            </form>
          </Modal>
        ) : null}

        {editando ? (
          <Modal title="Editar habitación" onClose={() => setEditando(null)}>
            <form onSubmit={submitEdit}>
              <div className="hb-form-grid">
                <div>
                  <label className="hb-label">Número *</label>
                  <input className="hb-input" value={form.numero} onChange={(e) => setForm((p) => ({ ...p, numero: e.target.value }))} required />
                </div>
                <div>
                  <label className="hb-label">Piso *</label>
                  <input className="hb-input" type="number" min={1} value={form.piso} onChange={(e) => setForm((p) => ({ ...p, piso: Number(e.target.value) }))} required />
                </div>
                <div>
                  <label className="hb-label">Tipo habitación *</label>
                  <select className="hb-input" value={form.id_tipo_habitacion} onChange={(e) => setForm((p) => ({ ...p, id_tipo_habitacion: Number(e.target.value) }))} required>
                    {tipos.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="hb-label">Estado *</label>
                  <select className="hb-input" value={form.estado} onChange={(e) => setForm((p) => ({ ...p, estado: Number(e.target.value) }))}>
                    <option value={1}>Disponible</option>
                    <option value={2}>No disponible</option>
                  </select>
                </div>
              </div>
              <div className="hb-modal-actions">
                <button className="hb-primary" type="submit" disabled={loadingForm}>{loadingForm ? "Guardando..." : "Actualizar"}</button>
              </div>
            </form>
          </Modal>
        ) : null}

        {eliminando ? (
          <Modal title="Eliminar habitación" onClose={() => setEliminando(null)}>
            <p style={{ color: "#4a4035", marginBottom: "0.9rem" }}>
              ¿Deseas eliminar la habitación <strong>{eliminando.numero}</strong>?
            </p>
            <div style={{ display: "flex", gap: ".6rem" }}>
              <button
                type="button"
                onClick={() => setEliminando(null)}
                style={{ flex: 1, borderRadius: "50px", border: "1px solid #c9a96e", padding: ".75rem 1rem", background: "transparent", color: "#4a4035", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="hb-primary"
                disabled={loadingForm}
                style={{ flex: 1 }}
              >
                {loadingForm ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </Modal>
        ) : null}
      </div>
    </>
  );
}
