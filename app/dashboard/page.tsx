"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Usuario {
  id_personal: number;
  nombre: string;
  email: string | null;
  rol: string;      
  activo: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("No autorizado");
        return res.json();
      })
      .then((data) => setUsuario(data))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const cards = [
    { label: "Reservas",    icon: "🗓️", href: "/dashboard/reservas",    color: "bg-blue-50 text-blue-600"     },
    { label: "Habitaciones",icon: "🛏️", href: "/dashboard/habitaciones", color: "bg-emerald-50 text-emerald-600"},
    { label: "Huéspedes",   icon: "👤", href: "/dashboard/huespedes",    color: "bg-violet-50 text-violet-600" },
    { label: "Pagos",       icon: "💳", href: "/dashboard/pagos",        color: "bg-amber-50 text-amber-600"   },
  ];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">H</span>
            </div>
            <span className="font-semibold text-gray-800 text-lg">Hostal Las Mercedes</span>
          </div>

          {/* Usuario + Logout */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{usuario?.nombre}</p>
              <p className="text-xs text-gray-500">{usuario?.email}</p>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-semibold text-sm">
                {usuario?.nombre?.charAt(0).toUpperCase()}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600
                         border border-gray-300 rounded-lg hover:bg-red-50 hover:text-red-600
                         hover:border-red-300 transition cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1"
                />
              </svg>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-6 py-10">

        {/* Saludo */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">
            Bienvenido, {usuario?.nombre?.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">
            Aquí tienes un resumen de la actividad del hotel.
          </p>
        </div>

        {/* Cards de acceso rápido */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col items-start
                         gap-3 hover:shadow-md transition group"
            >
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl ${item.color}`}>
                {item.icon}
              </div>
              <div>
                <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition">
                  {item.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">Ver módulo →</p>
              </div>
            </Link>
          ))}
        </div>

      </main>
    </div>
  );
}