"use client";

import { useEffect, useState } from "react";
import { reservaService, Reserva } from "@/services/reservaService";
import Link from "next/link";

export default function ReservasPage() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
  id_huesped: "",
  id_habitacion: "",
  fecha_entrada: "",
  fecha_salida: "",
  num_personas: "",
  monto_total: "",
  estado: "1",
});

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  onClick={() => setShowForm(true)}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
        )}
        {showForm && (
  <div className="mt-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <h2 className="text-lg font-semibold mb-4 text-gray-600">Crear Reserva</h2>
    <p><form
  onSubmit={async (e) => {
    e.preventDefault();

    try {
      await reservaService.crear({
        id_huesped: Number(formData.id_huesped),
        id_habitacion: Number(formData.id_habitacion),
        fecha_entrada: formData.fecha_entrada,
        fecha_salida: formData.fecha_salida,
        num_personas: Number(formData.num_personas),
        monto_total: Number(formData.monto_total),
        estado: Number(formData.estado),
      });

      setShowForm(false);
      window.location.reload();
    } catch {
      alert("Error al crear reserva");
    }
  }}
  className="grid grid-cols-2 gap-4 "
>
  <input name="id_huesped" placeholder="ID Huésped"  onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />
  <input name="id_habitacion" placeholder="ID Habitación" onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />

  <input type="date" name="fecha_entrada" onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />
  <input type="date" name="fecha_salida" onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />

  <input name="num_personas" placeholder="Número de Personas" onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />
  <input name="monto_total" placeholder="Monto Total" onChange={handleChange} className="border p-2 rounded text-black placeholder-gray-500 bg-white" required />

  <button type="submit" className="col-span-2 mt-2 bg-blue-600 text-white py-2 rounded">
    Guardar Reserva
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