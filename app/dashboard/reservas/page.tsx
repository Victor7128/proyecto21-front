"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  reservaService,
  reservaCatalogos,
  Reserva,
  ReservaPayload,
  HuespedOption,
  HabitacionOption,
  EstadoOption,
} from "@/services/reservaService";

// ── Helpers ───────────────────────────────────────────────────────────────────
function calcularNoches(entrada: string, salida: string): number {
  if (!entrada || !salida) return 0;
  const diff = new Date(salida).getTime() - new Date(entrada).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function formatFecha(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-PE", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function badgeColor(estado: string) {
  const e = estado.toLowerCase();
  if (e.includes("confirm")) return "bg-emerald-100 text-emerald-700";
  if (e.includes("pend"))    return "bg-amber-100 text-amber-700";
  if (e.includes("cancel"))  return "bg-red-100 text-red-700";
  if (e.includes("complet")) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-600";
}

const EMPTY_FORM: ReservaPayload = {
  id_huesped: 0,
  id_habitacion: 0,
  fecha_entrada: "",
  fecha_salida: "",
  num_personas: 1,
  monto_total: 0,
  estado: 0,
};

// ── Modal ─────────────────────────────────────────────────────────────────────
function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white">
          <h2 className="font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none cursor-pointer"
          >
            ✕
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

// ── Formulario ────────────────────────────────────────────────────────────────
function ReservaForm({
  initial,
  huespedes,
  habitaciones,
  estados,
  onSubmit,
  loading,
}: {
  initial: ReservaPayload;
  huespedes: HuespedOption[];
  habitaciones: HabitacionOption[];
  estados: EstadoOption[];
  onSubmit: (data: ReservaPayload) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<ReservaPayload>(initial);

  // Selección inicial cuando carguen los catálogos
  useEffect(() => {
    setForm((f) => ({
      ...f,
      id_huesped:    f.id_huesped    || huespedes[0]?.id    || 0,
      id_habitacion: f.id_habitacion || habitaciones[0]?.id || 0,
      estado:        f.estado        || estados[0]?.id       || 0,
    }));
  }, [huespedes, habitaciones, estados]);

  const set = <K extends keyof ReservaPayload>(k: K, v: ReservaPayload[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Auto-calcular monto cuando cambia habitación o fechas
  useEffect(() => {
    const hab = habitaciones.find((h) => h.id === form.id_habitacion);
    const noches = calcularNoches(form.fecha_entrada, form.fecha_salida);
    if (hab && noches > 0) {
      set("monto_total", parseFloat((hab.tarifa_base * noches).toFixed(2)));
    }
  }, [form.id_habitacion, form.fecha_entrada, form.fecha_salida, habitaciones]);

  const habSeleccionada = habitaciones.find((h) => h.id === form.id_habitacion);
  const noches = calcularNoches(form.fecha_entrada, form.fecha_salida);

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      className="space-y-4"
    >
      {/* Huésped */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Huésped *</label>
        <select
          required
          value={form.id_huesped}
          onChange={(e) => set("id_huesped", Number(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {huespedes.map((h) => (
            <option key={h.id} value={h.id}>{h.label}</option>
          ))}
        </select>
      </div>

      {/* Habitación */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Habitación *</label>
        <select
          required
          value={form.id_habitacion}
          onChange={(e) => set("id_habitacion", Number(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {habitaciones.map((h) => (
            <option key={h.id} value={h.id}>{h.label}</option>
          ))}
        </select>
        {habSeleccionada && (
          <p className="text-xs text-gray-400 mt-1">
            Tarifa: S/ {habSeleccionada.tarifa_base.toFixed(2)} / noche
          </p>
        )}
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha entrada *</label>
          <input
            required
            type="date"
            value={form.fecha_entrada}
            onChange={(e) => set("fecha_entrada", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Fecha salida *</label>
          <input
            required
            type="date"
            value={form.fecha_salida}
            min={form.fecha_entrada || undefined}
            onChange={(e) => set("fecha_salida", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Noches calculadas */}
      {noches > 0 && (
        <p className="text-xs text-blue-600 font-medium">
          📅 {noches} noche{noches !== 1 ? "s" : ""}
        </p>
      )}

      {/* Nº personas y monto */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nº personas *</label>
          <input
            required
            type="number"
            min={1}
            max={habSeleccionada?.capacidad || 99}
            value={form.num_personas}
            onChange={(e) => set("num_personas", Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Monto total (S/) *</label>
          <input
            required
            type="number"
            min={0}
            step="0.01"
            value={form.monto_total}
            onChange={(e) => set("monto_total", parseFloat(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Estado */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Estado *</label>
        <select
          value={form.estado}
          onChange={(e) => set("estado", Number(e.target.value))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {estados.map((e) => (
            <option key={e.id} value={e.id}>{e.label}</option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || huespedes.length === 0 || habitaciones.length === 0}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                   text-white text-sm font-semibold rounded-lg transition
                   cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? "Guardando..." : "Guardar reserva"}
      </button>
    </form>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ReservasPage() {
  const [reservas, setReservas]       = useState<Reserva[]>([]);
  const [huespedes, setHuespedes]     = useState<HuespedOption[]>([]);
  const [habitaciones, setHabitaciones] = useState<HabitacionOption[]>([]);
  const [estados, setEstados]         = useState<EstadoOption[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError]             = useState("");

  const [modalCrear, setModalCrear]   = useState(false);
  const [editando, setEditando]       = useState<Reserva | null>(null);
  const [eliminando, setEliminando]   = useState<Reserva | null>(null);

  // Carga catálogos una sola vez
  useEffect(() => {
    Promise.all([
      reservaCatalogos.huespedes(),
      reservaCatalogos.habitaciones(),
      reservaCatalogos.estados(),
    ])
      .then(([h, hab, e]) => {
        setHuespedes(h);
        setHabitaciones(hab);
        setEstados(e);
      })
      .catch(() => setError("Error al cargar los catálogos"));
  }, []);

  const cargar = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      const data = await reservaService.listar();
      setReservas(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar reservas");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleCrear(data: ReservaPayload) {
    setLoadingForm(true);
    try {
      await reservaService.crear(data);
      setModalCrear(false);
      cargar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setLoadingForm(false);
    }
  }

  async function handleEditar(data: ReservaPayload) {
    if (!editando) return;
    setLoadingForm(true);
    try {
      await reservaService.actualizar(editando.id_reserva, data);
      setEditando(null);
      cargar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setLoadingForm(false);
    }
  }

  async function handleEliminar() {
    if (!eliminando) return;
    setLoadingForm(true);
    try {
      await reservaService.eliminar(eliminando.id_reserva);
      setEliminando(null);
      cargar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setLoadingForm(false);
    }
  }

  // Convierte Reserva → ReservaPayload para precargar formulario de edición
  function reservaToPayload(r: Reserva): ReservaPayload {
    return {
      id_huesped:    r.id_huesped,
      id_habitacion: r.id_habitacion,
      fecha_entrada: r.fecha_entrada.split("T")[0],
      fecha_salida:  r.fecha_salida.split("T")[0],
      num_personas:  r.num_personas,
      monto_total:   r.monto_total,
      estado:        r.id_estado,
    };
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/dashboard" className="hover:text-blue-600 transition">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-gray-800 font-medium">Reservas</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Reservas</h1>
          </div>
          <button
            onClick={() => setModalCrear(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                       text-white text-sm font-semibold rounded-lg transition cursor-pointer"
          >
            <span className="text-lg leading-none">+</span>
            Nueva reserva
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Huésped</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Habitación</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Entrada</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Salida</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Noches</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Personas</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Monto</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loadingData ? (
                <tr>
                  <td colSpan={10} className="text-center py-12">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : reservas.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400">
                    No se encontraron reservas
                  </td>
                </tr>
              ) : (
                reservas.map((r) => {
                  const noches = calcularNoches(r.fecha_entrada, r.fecha_salida);
                  return (
                    <tr
                      key={r.id_reserva}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="px-5 py-3.5 text-gray-400 text-xs">#{r.id_reserva}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{r.huesped}</td>
                      <td className="px-5 py-3.5 text-gray-600">{r.habitacion}</td>
                      <td className="px-5 py-3.5 text-gray-600">{formatFecha(r.fecha_entrada)}</td>
                      <td className="px-5 py-3.5 text-gray-600">{formatFecha(r.fecha_salida)}</td>
                      <td className="px-5 py-3.5 text-gray-600">{noches}</td>
                      <td className="px-5 py-3.5 text-gray-600">{r.num_personas}</td>
                      <td className="px-5 py-3.5 font-medium text-gray-800">
                        S/ {Number(r.monto_total).toFixed(2)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${badgeColor(r.estado)}`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => setEditando(r)}
                            className="px-3 py-1 text-xs font-medium text-blue-600
                                       border border-blue-200 rounded-lg hover:bg-blue-50
                                       transition cursor-pointer"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setEliminando(r)}
                            className="px-3 py-1 text-xs font-medium text-red-500
                                       border border-red-200 rounded-lg hover:bg-red-50
                                       transition cursor-pointer"
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {!loadingData && reservas.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {reservas.length} reserva{reservas.length !== 1 ? "s" : ""} encontrada{reservas.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Crear */}
      {modalCrear && (
        <Modal title="Nueva reserva" onClose={() => setModalCrear(false)}>
          <ReservaForm
            initial={EMPTY_FORM}
            huespedes={huespedes}
            habitaciones={habitaciones}
            estados={estados}
            onSubmit={handleCrear}
            loading={loadingForm}
          />
        </Modal>
      )}

      {/* Modal: Editar */}
      {editando && (
        <Modal title="Editar reserva" onClose={() => setEditando(null)}>
          <ReservaForm
            initial={reservaToPayload(editando)}
            huespedes={huespedes}
            habitaciones={habitaciones}
            estados={estados}
            onSubmit={handleEditar}
            loading={loadingForm}
          />
        </Modal>
      )}

      {/* Modal: Eliminar */}
      {eliminando && (
        <Modal title="Eliminar reserva" onClose={() => setEliminando(null)}>
          <p className="text-gray-600 text-sm mb-2">
            ¿Estás seguro de que deseas eliminar la reserva{" "}
            <span className="font-semibold text-gray-800">#{eliminando.id_reserva}</span>?
          </p>
          <p className="text-gray-500 text-xs mb-6">
            {eliminando.huesped} · {formatFecha(eliminando.fecha_entrada)} → {formatFecha(eliminando.fecha_salida)}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setEliminando(null)}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-sm
                         text-gray-600 hover:bg-gray-50 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleEliminar}
              disabled={loadingForm}
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400
                         text-white text-sm font-semibold rounded-lg transition cursor-pointer"
            >
              {loadingForm ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}