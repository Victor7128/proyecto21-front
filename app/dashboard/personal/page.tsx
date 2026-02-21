"use client";

import { useEffect, useState, FormEvent } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

interface Personal {
  id_personal: number;
  nombre: string;
  tipo_documento: string;
  num_documento: string;
  email: string;
  id_rol: number;
  activo: boolean;
}

export default function PersonalPage() {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nombre: "",
    tipo_documento: "",
    num_documento: "",
    email: "",
    password: "",
    id_rol: 1,
    activo: true,
  });

  // ✅ Sin localStorage — las cookies se envían automáticamente con credentials
  const fetchPersonal = async () => {
    const res = await fetch(`${API_URL}/personal`, {
      credentials: "include", // ← envía la cookie "token" automáticamente
    });
    const data = await res.json();
    setPersonal(data);
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const method = editingId ? "PUT" : "POST";
    const url = editingId
      ? `${API_URL}/personal/${editingId}`
      : `${API_URL}/personal`;

    const body = editingId
      ? {
          nombre: form.nombre,
          tipo_documento: form.tipo_documento,
          num_documento: form.num_documento,
          email: form.email,
          id_rol: form.id_rol,
          activo: form.activo,
        }
      : form;

    await fetch(url, {
      method,
      credentials: "include", // ← aquí también
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setForm({
      nombre: "",
      tipo_documento: "",
      num_documento: "",
      email: "",
      password: "",
      id_rol: 1,
      activo: true,
    });
    setEditingId(null);
    fetchPersonal();
  };

  const handleEdit = (p: Personal) => {
    setEditingId(p.id_personal);
    setForm({
      nombre: p.nombre,
      tipo_documento: p.tipo_documento,
      num_documento: p.num_documento,
      email: p.email,
      password: "",
      id_rol: p.id_rol,
      activo: p.activo,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Seguro de eliminar este personal?")) return;
    await fetch(`${API_URL}/personal/${id}`, {
      method: "DELETE",
      credentials: "include", // ← aquí también
    });
    fetchPersonal();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Personal</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 mb-6">
        <input className="border p-2" placeholder="Nombre"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input className="border p-2" placeholder="Tipo Documento"
          value={form.tipo_documento}
          onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}
        />
        <input className="border p-2" placeholder="N° Documento"
          value={form.num_documento}
          onChange={(e) => setForm({ ...form, num_documento: e.target.value })}
        />
        <input className="border p-2" placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        {!editingId && (
          <input className="border p-2" placeholder="Password" type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        )}
        <input className="border p-2" placeholder="Rol"
          type="number"
          value={form.id_rol}
          onChange={(e) => setForm({ ...form, id_rol: Number(e.target.value) })}
        />
        <button className="bg-blue-600 text-white p-2 rounded col-span-2">
          {editingId ? "Actualizar" : "Crear"}
        </button>
      </form>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-100">
            <th>Nombre</th>
            <th>Email</th>
            <th>Documento</th>
            <th>Rol</th>
            <th>Activo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {personal.map((p) => (
            <tr key={p.id_personal} className="border-t">
              <td>{p.nombre}</td>
              <td>{p.email}</td>
              <td>{p.tipo_documento} {p.num_documento}</td>
              <td>{p.id_rol}</td>
              <td>{p.activo ? "Sí" : "No"}</td>
              <td className="space-x-2">
                <button onClick={() => handleEdit(p)} className="text-blue-600">Editar</button>
                <button onClick={() => handleDelete(p.id_personal)} className="text-red-600">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}