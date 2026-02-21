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

const EMPTY_FORM: PersonalPayload = {
  nombre: "",
  tipo_documento: 0,
  num_documento: "",
  email: "",
  password: "",
  id_rol: 0,
  activo: true,
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
function PersonalForm({
  initial,
  tiposDocumento,
  roles,
  onSubmit,
  loading,
  esEdicion,
}: {
  initial: PersonalPayload;
  tiposDocumento: TipoDocumento[];
  roles: Rol[];
  onSubmit: (data: PersonalPayload) => void;
  loading: boolean;
  esEdicion: boolean;
}) {
  const [form, setForm] = useState<PersonalPayload>(initial);
  const set = (k: keyof PersonalPayload, v: string | number | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Reiniciar el form completo cuando cambia el registro que se edita
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  // Si los catálogos cargan después y el tipo/rol sigue en 0, usar el primero
  useEffect(() => {
    if (tiposDocumento.length > 0 && form.tipo_documento === 0) {
      setForm((f) => ({ ...f, tipo_documento: tiposDocumento[0].id }));
    }
  }, [tiposDocumento]);

  useEffect(() => {
    if (roles.length > 0 && form.id_rol === 0) {
      setForm((f) => ({ ...f, id_rol: roles[0].id }));
    }
  }, [roles]);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4 text-black"
    >
      {/* Nombre */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Nombre completo *
        </label>
        <input
          required
          value={form.nombre}
          onChange={(e) => set("nombre", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Tipo doc + Nº doc */}
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

      {/* Email */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Correo electrónico *
        </label>
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Password — solo en creación */}
      {!esEdicion && (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Contraseña *
          </label>
          <input
            required
            type="password"
            value={form.password ?? ""}
            onChange={(e) => set("password", e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Rol + Activo */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Rol *
          </label>
          <select
            value={form.id_rol}
            onChange={(e) => set("id_rol", Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Estado
          </label>
          <select
            value={form.activo ? "1" : "0"}
            onChange={(e) => set("activo", e.target.value === "1")}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="1">Activo</option>
            <option value="0">Inactivo</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || tiposDocumento.length === 0 || roles.length === 0}
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
export default function PersonalPage() {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [loadingForm, setLoadingForm] = useState(false);
  const [error, setError] = useState("");

  const [modalCrear, setModalCrear] = useState(false);
  const [editando, setEditando] = useState<Personal | null>(null);
  const [eliminando, setEliminando] = useState<Personal | null>(null);

  useEffect(() => {
    Promise.all([
      catalogoService.tiposDocumento(),
      catalogoService.roles(),
    ])
      .then(([tipos, rols]) => {
        setTiposDocumento(tipos);
        setRoles(rols);
      })
      .catch(() => setError("No se pudieron cargar los catálogos"));
  }, []);

  const cargar = useCallback(async (nombre?: string) => {
    setLoadingData(true);
    setError("");
    try {
      const data = await personalService.listar(nombre || undefined);
      setPersonal(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al cargar personal");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    const t = setTimeout(() => cargar(busqueda), 400);
    return () => clearTimeout(t);
  }, [busqueda, cargar]);

  async function handleCrear(data: PersonalPayload) {
    setLoadingForm(true);
    try {
      await personalService.crear(data);
      setModalCrear(false);
      cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al crear personal");
    } finally {
      setLoadingForm(false);
    }
  }

  async function handleEditar(data: PersonalPayload) {
    if (!editando) return;
    setLoadingForm(true);
    try {
      const { password: _, ...payload } = data;
      await personalService.actualizar(editando.id_personal, payload);
      setEditando(null);
      cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al actualizar personal");
    } finally {
      setLoadingForm(false);
    }
  }

  async function handleEliminar() {
    if (!eliminando) return;
    setLoadingForm(true);
    try {
      await personalService.eliminar(eliminando.id_personal);
      setEliminando(null);
      cargar();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al eliminar personal");
    } finally {
      setLoadingForm(false);
    }
  }

  /**
   * Convierte Personal → PersonalPayload.
   * Busca el id del catálogo comparando labels de forma flexible:
   * primero exacto, luego si uno contiene al otro (para cubrir abreviaciones).
   */
  function buscarIdCatalogo(
    catalogo: { id: number; label: string }[],
    nombreRecibido: string
  ): number {
    const norm = (s: string) => s.toLowerCase().trim();
    const recibido = norm(nombreRecibido);

    // 1. Exacto
    let encontrado = catalogo.find((c) => norm(c.label) === recibido);
    // 2. Uno contiene al otro
    if (!encontrado) {
      encontrado = catalogo.find(
        (c) => norm(c.label).includes(recibido) || recibido.includes(norm(c.label))
      );
    }
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
              <span className="text-gray-800 font-medium">Personal</span>
            </div>
            <h1 className="text-xl font-bold text-gray-800">Personal</h1>
          </div>
          <button
            onClick={() => setModalCrear(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700
                       text-white text-sm font-semibold rounded-lg transition cursor-pointer"
          >
            <span className="text-lg leading-none">+</span>
            Nuevo personal
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
                       focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
                <th className="text-left px-5 py-3 font-medium text-gray-600">Nombre</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Documento</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Correo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Rol</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
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
              ) : personal.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No se encontró personal
                  </td>
                </tr>
              ) : (
                personal.map((p) => (
                  <tr
                    key={p.id_personal}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-800">{p.nombre}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      <span className="text-xs bg-gray-100 rounded px-1.5 py-0.5 mr-1">
                        {p.tipo_documento}
                      </span>
                      {p.num_documento}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{p.email}</td>
                    <td className="px-5 py-3.5 text-gray-600">{p.rol}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                          ${p.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                      >
                        {p.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setEditando(p)}
                          className="px-3 py-1 text-xs font-medium text-blue-600
                                     border border-blue-200 rounded-lg hover:bg-blue-50
                                     transition cursor-pointer"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setEliminando(p)}
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

          {!loadingData && personal.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400">
              {personal.length} miembro{personal.length !== 1 ? "s" : ""} encontrado{personal.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Crear */}
      {modalCrear && (
        <Modal title="Nuevo personal" onClose={() => setModalCrear(false)}>
          <PersonalForm
            initial={{ ...EMPTY_FORM, tipo_documento: tiposDocumento[0]?.id ?? 0, id_rol: roles[0]?.id ?? 0 }}
            tiposDocumento={tiposDocumento}
            roles={roles}
            onSubmit={handleCrear}
            loading={loadingForm}
            esEdicion={false}
          />
        </Modal>
      )}

      {/* Modal: Editar */}
      {editando && (
        <Modal title="Editar personal" onClose={() => setEditando(null)}>
          <PersonalForm
            initial={personalToPayload(editando)}
            tiposDocumento={tiposDocumento}
            roles={roles}
            onSubmit={handleEditar}
            loading={loadingForm}
            esEdicion={true}
          />
        </Modal>
      )}

      {/* Modal: Confirmar eliminación */}
      {eliminando && (
        <Modal title="Eliminar personal" onClose={() => setEliminando(null)}>
          <p className="text-gray-600 text-sm mb-6">
            ¿Estás seguro de que deseas eliminar a{" "}
            <span className="font-semibold text-gray-800">{eliminando.nombre}</span>
            ? Esta acción desactivará al usuario del sistema.
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