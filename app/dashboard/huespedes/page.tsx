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

const EMPTY_FORM: HuespedPayload = {
  nombres: "",
  apellidos: "",
  tipo_documento: 0,
  num_documento: "",
  telefono: "",
  correo: "",
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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
function HuespedForm({
  initial,
  tiposDocumento,
  onSubmit,
  loading,
}: {
  initial: HuespedPayload;
  tiposDocumento: TipoDocumento[];
  onSubmit: (data: HuespedPayload) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<HuespedPayload>(initial);
  const set = (k: keyof HuespedPayload, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Si los tipos cargaron y no hay tipo seleccionado, selecciona el primero
  useEffect(() => {
    if (tiposDocumento.length > 0 && form.tipo_documento === 0) {
      setForm((f) => ({ ...f, tipo_documento: tiposDocumento[0].id }));
    }
  }, [tiposDocumento]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nombres *
          </label>
          <input
            required
            value={form.nombres}
            onChange={(e) => set("nombres", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Apellidos *
          </label>
          <input
            required
            value={form.apellidos}
            onChange={(e) => set("apellidos", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Tipo documento *
          </label>
          <select
            value={form.tipo_documento}
            onChange={(e) => set("tipo_documento", Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {tiposDocumento.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Nº documento *
          </label>
          <input
            required
            value={form.num_documento}
            onChange={(e) => set("num_documento", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Teléfono
        </label>
        <input
          value={form.telefono ?? ""}
          onChange={(e) => set("telefono", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Correo
        </label>
        <input
          type="email"
          value={form.correo ?? ""}
          onChange={(e) => set("correo", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || tiposDocumento.length === 0}
        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                   text-white text-sm font-semibold rounded-lg transition
                   cursor-pointer disabled:cursor-not-allowed"
      >
        {loading ? "Guardando..." : "Guardar"}
      </button>
    </form>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function HuespedesPage() {
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState("");

  const [modalCrear, setModalCrear] = useState(false);
  const [editando, setEditando] = useState<Huesped | null>(null);
  const [eliminando, setEliminando] = useState<Huesped | null>(null);

  // Carga tipos de documento desde el catálogo real del backend
  useEffect(() => {
    catalogoService
      .tiposDocumento()
      .then(setTiposDocumento)
      .catch(() => setError("No se pudieron cargar los tipos de documento"));
  }, []);

  const cargar = useCallback(async (nombre?: string) => {
    setLoadingData(true);
    setError("");
    try {
      const data = await huespedService.listar(nombre || undefined);
      setHuespedes(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar huéspedes");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  // Búsqueda con debounce
  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda), 400);
    return () => clearTimeout(t);
  }, [busqueda, cargar]);

  async function handleCrear(data: HuespedPayload) {
    setLoadingForm(true);
    try {
      await huespedService.crear(data);
      setModalCrear(false);
      cargar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setLoadingForm(false);
    }
  }

  async function handleEditar(data: HuespedPayload) {
    if (!editando) return;
    setLoadingForm(true);
    try {
      await huespedService.actualizar(editando.id_huesped, data);
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
      await huespedService.eliminar(eliminando.id_huesped);
      setEliminando(null);
      cargar();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setLoadingForm(false);
    }
  }

  // Convierte Huesped → HuespedPayload para precargar el formulario de edición
  // Usa los tipos cargados desde el backend, no valores hardcodeados
  function huespedToPayload(h: Huesped): HuespedPayload {
    const tipoEncontrado = tiposDocumento.find(
      (t) => t.label.toLowerCase() === h.tipo_documento.toLowerCase()
    );
    return {
      nombres: h.nombres,
      apellidos: h.apellidos,
      tipo_documento: tipoEncontrado?.id ?? tiposDocumento[0]?.id ?? 0,
      num_documento: h.num_documento,
      telefono: h.telefono ?? "",
      correo: h.correo ?? "",
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
              <span className="text-gray-800 font-medium">Huéspedes</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Huéspedes</h1>
          </div>
          <button
            onClick={() => setModalCrear(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                       text-white text-sm font-semibold rounded-lg transition cursor-pointer"
          >
            <span className="text-lg leading-none">+</span>
            Nuevo huésped
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Buscador */}
        <div className="mb-5">
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre..."
            className="w-full max-w-sm border border-gray-300 rounded-lg px-4 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

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
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Nombre completo
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Documento
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Teléfono
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Correo
                </th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">
                  Registro
                </th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {loadingData ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : huespedes.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-12 text-gray-400"
                  >
                    No se encontraron huéspedes
                  </td>
                </tr>
              ) : (
                huespedes.map((h) => (
                  <tr
                    key={h.id_huesped}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      {h.nombres} {h.apellidos}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 mr-1">
                        {h.tipo_documento}
                      </span>
                      {h.num_documento}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {h.telefono ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {h.correo ?? "—"}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">
                      {new Date(h.fecha_creacion).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditando(h)}
                          className="px-3 py-1 text-xs font-medium text-blue-600
                                     border border-blue-200 rounded-lg hover:bg-blue-50
                                     transition cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setEliminando(h)}
                          className="px-3 py-1 text-xs font-medium text-red-500
                                     border border-red-200 rounded-lg hover:bg-red-50
                                     transition cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {!loadingData && huespedes.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {huespedes.length} huésped{huespedes.length !== 1 ? "es" : ""}{" "}
              encontrado{huespedes.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Crear */}
      {modalCrear && (
        <Modal title="Nuevo huésped" onClose={() => setModalCrear(false)}>
          <HuespedForm
            initial={{ ...EMPTY_FORM, tipo_documento: tiposDocumento[0]?.id ?? 0 }}
            tiposDocumento={tiposDocumento}
            onSubmit={handleCrear}
            loading={loadingForm}
          />
        </Modal>
      )}

      {/* Modal: Editar */}
      {editando && (
        <Modal title="Editar huésped" onClose={() => setEditando(null)}>
          <HuespedForm
            initial={huespedToPayload(editando)}
            tiposDocumento={tiposDocumento}
            onSubmit={handleEditar}
            loading={loadingForm}
          />
        </Modal>
      )}

      {/* Modal: Confirmar eliminación */}
      {eliminando && (
        <Modal title="Eliminar huésped" onClose={() => setEliminando(null)}>
          <p className="text-gray-600 text-sm mb-6">
            ¿Estás seguro de que deseas eliminar a{" "}
            <span className="font-semibold text-gray-800">
              {eliminando.nombres} {eliminando.apellidos}
            </span>
            ? Esta acción no se puede deshacer.
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