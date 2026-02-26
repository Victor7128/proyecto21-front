"use client";

import { useEffect, useState } from "react";
import { reservaService, Reserva } from "@/services/reservaService";
import Link from "next/link";

interface Huesped {
  id_huesped: number;
  nombres: string;
  apellidos: string;
}
interface Habitacion {
  id_habitacion: number;
  numero: string;
  piso: number;
  tipo_habitacion: string;
}
export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [huespedes, setHuespedes] = useState<Huesped[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Reserva | null>(null);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);

  const [formData, setFormData] = useState({
  id_huesped: "",
  id_habitacion: "",
  fecha_entrada: "",
  fecha_salida: "",
  num_personas: "",
  monto_total: "",
  estado: "1",
});

const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  setFormData({
    ...formData,
    [e.target.name]: e.target.value,
  });
};

  useEffect(() => {
    reservaService
      .listar()
      .then(setReservas)
      .catch(() => setError("Error al cargar reservas"))
      .finally(() => setLoading(false));

    fetch("/api/huespedes")
      .then(res => res.json())
      .then(setHuespedes)
      .catch(() => console.log("Error cargando huéspedes"));
    fetch("/api/habitaciones")
      .then(res => res.json())
      .then(setHabitaciones)
      .catch(() => console.log("Error cargando habitaciones"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <Link href="/dashboard" className="text-sm text-blue-600">
            ← Volver al Dashboard
          </Link>
          <h1 className="text-xl font-bold text-gray-800 mt-2">
            Reservas
          </h1>
          <button
  onClick={() => {
    setEditando(null);
    setFormData({
      id_huesped: "",
      id_habitacion: "",
      fecha_entrada: "",
      fecha_salida: "",
      num_personas: "",
      monto_total: "",
      estado: "1",
    });
    setShowForm(true);
  }}
  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg"
>
  Nueva Reserva
</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-5 py-3 font-medium text-gray-600">ID</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Huésped</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Habitación</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Entrada</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Salida</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Personas</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Monto</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">
  Acciones
</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((r) => (
                  <tr
                    key={r.id_reserva}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-3.5 text-gray-600">{r.id_reserva}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.huesped}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.habitacion}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {new Date(r.fecha_entrada).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {new Date(r.fecha_salida).toLocaleDateString("es-PE")}
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{r.num_personas}</td>
                    <td className="px-5 py-3.5 text-gray-600">S/ {r.monto_total}</td>
                    <td className="px-5 py-3.5 text-gray-600">{r.estado}</td>
                    <td className="px-5 py-3.5">
  <button
    onClick={() => {
      setEditando(r);
      setFormData({
        id_huesped: "",
        id_habitacion: "",
        fecha_entrada: r.fecha_entrada.split("T")[0],
        fecha_salida: r.fecha_salida.split("T")[0],
        num_personas: String(r.num_personas),
        monto_total: String(r.monto_total),
        estado: "1",
      });
      setShowForm(true);
    }}
    className="text-blue-600 hover:underline mr-3"
  >
    Editar
  </button>

  <button
    onClick={async () => {
      try {
        await reservaService.eliminar(r.id_reserva);
        setReservas(prev =>
          prev.filter(res => res.id_reserva !== r.id_reserva)
        );
      } catch {
        alert("Error al eliminar");
      }
    }}
    className="text-red-600 hover:underline"
  >
    Eliminar
  </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        )}
        {showForm && (
  <div className="mt-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <h2 className="text-lg font-semibold mb-4 text-gray-600">{editando ? "Editar Reserva" : "Crear Reserva"}</h2>
    <p><form
  onSubmit={async (e) => {
    e.preventDefault();

    try {
  const payload = {
    id_huesped: Number(formData.id_huesped),
    id_habitacion: Number(formData.id_habitacion),
    fecha_entrada: formData.fecha_entrada,
    fecha_salida: formData.fecha_salida,
    num_personas: Number(formData.num_personas),
    monto_total: Number(formData.monto_total),
    estado: Number(formData.estado),
  };

  if (editando) {
    await reservaService.actualizar(editando.id_reserva, payload);

    setReservas(prev =>
  prev.map(r =>
    r.id_reserva === editando.id_reserva
      ? {
          ...r,
          fecha_entrada: payload.fecha_entrada,
          fecha_salida: payload.fecha_salida,
          num_personas: payload.num_personas,
          monto_total: payload.monto_total,
        }
      : r
  )
);
  } else {
    const nueva = await reservaService.crear(payload);
    setReservas(prev => [...prev, nueva]);
  }

  setShowForm(false);
  setEditando(null);

} catch {
  alert("Error al guardar reserva");
}
  }}
  className="grid grid-cols-2 gap-4 "
>
  <select
  name="id_huesped"
  value={formData.id_huesped}
  onChange={handleChange}
  className="border p-2 rounded text-black bg-white"
  required
>
  
  <option value="">Seleccione Huésped</option>
  {huespedes.map(h => (
    <option key={h.id_huesped} value={h.id_huesped}>
      {h.nombres} {h.apellidos}
    </option>
  ))}
</select>
<p className="col-span-2 text-sm mt-1">
  <Link
    href="/dashboard/huespedes"
    className="text-blue-600 hover:underline"
  >
    ¿No existe el huésped? Crear nuevo
  </Link>
</p>
  <select
  name="id_habitacion"
  value={formData.id_habitacion}
  onChange={handleChange}
  className="border p-2 rounded text-black bg-white"
  required
>
  <option value="">Seleccione Habitación</option>
  {habitaciones.map(h => (
    <option key={h.id_habitacion} value={h.id_habitacion}>
      {h.numero} - Piso {h.piso} ({h.tipo_habitacion})
    </option>
  ))}
</select>

  <input type="date" name="fecha_entrada" onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />
  <input type="date" name="fecha_salida" onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />

  <input name="num_personas" placeholder="Número de Personas" onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />
  <input name="monto_total" placeholder="Monto Total" onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />

  <button
  type="submit"
  className="col-span-2 mt-2 bg-blue-600 text-white py-2 rounded"
>
  {editando ? "Actualizar Reserva" : "Guardar Reserva"}
</button>
</form></p>
    <button
      onClick={() => setShowForm(false)}
      className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg"
    >
      Cancelar
    </button>
  </div>
)}
      </div>
    </div>
  );
}