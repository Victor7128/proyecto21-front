"use client";

import { useEffect, useState } from "react";
import { habitacionService, Habitacion } from "@/services/habitacionService";
import Link from "next/link";

export default function HabitacionesPage() {
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    habitacionService
      .listar()
      .then(setHabitaciones)
      .catch(() => setError("Error al cargar habitaciones"))
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
            Habitaciones
          </h1>
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
                <th className="text-left px-5 py-3 font-medium text-gray-600">Número</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Piso</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Tipo</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
              </tr>
            </thead>
            <tbody>
              {habitaciones.map((h) => (
                <tr key={h.id_habitacion}
                    className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-5 py-3.5 text-gray-600">{h.id_habitacion}</td>
                  <td className="px-5 py-3.5 text-gray-600">{h.numero}</td>
                  <td className="px-5 py-3.5 text-gray-600">{h.piso}</td>
                  <td className="px-5 py-3.5 text-gray-600">{h.id_tipo_habitacion}</td>
                  <td className="px-5 py-3.5 text-gray-600">{h.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
