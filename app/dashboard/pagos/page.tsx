"use client";

import { useEffect, useState } from "react";
import { pagoService, Pago } from "@/services/pagoService";
import Link from "next/link";

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    pagoService
      .listar()
      .then(setPagos)
      .catch(() => setError("Error al cargar pagos"))
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
            Pagos
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
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Documento</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Monto</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Método</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Estado</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((p) => (
                  <tr
                    key={p.id_pago}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-3.5 text-gray-600">{p.id_pago}</td>
                    <td className="px-5 py-3.5 text-gray-600">{p.id_documento}</td>
                    <td className="px-5 py-3.5 text-gray-600">S/ {p.monto_pagado}</td>
                    <td className="px-5 py-3.5 text-gray-600">{p.metodo}</td>
                    <td className="px-5 py-3.5 text-gray-600">{p.estado_pago}</td>
                    <td className="px-5 py-3.5 text-gray-600">
                      {new Date(p.fecha_creacion).toLocaleDateString("es-PE")}
                    </td>
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