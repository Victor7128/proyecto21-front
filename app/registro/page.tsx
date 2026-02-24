"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all duration-200";

export default function RegistroPage() {
  const router = useRouter();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    nombres:        "",
    apellidos:      "",
    tipo_documento: "1",
    num_documento:  "",
    email_login:    "",
    password:       "",
    telefono:       "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/registro", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          ...form,
          tipo_documento: parseInt(form.tipo_documento),
          correo: form.email_login,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al registrarse.");
        return;
      }

      router.push("/portal");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div>
                <h1 className="text-white font-bold text-xl tracking-tight">Hotel EVO</h1>
                <p className="text-amber-100 text-sm">Crear cuenta de huésped</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-8">
            <h2 className="text-white text-2xl font-semibold mb-1">Regístrate</h2>
            <p className="text-slate-400 text-sm mb-6">Completa tus datos para crear tu cuenta</p>

            <form onSubmit={handleSubmit} className="space-y-4">

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 text-sm font-medium">Nombres</label>
                  <input
                    name="nombres" value={form.nombres} onChange={handleChange}
                    required placeholder="Juan" className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 text-sm font-medium">Apellidos</label>
                  <input
                    name="apellidos" value={form.apellidos} onChange={handleChange}
                    required placeholder="Pérez" className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-slate-300 text-sm font-medium">Tipo documento</label>
                  <select
                    name="tipo_documento" value={form.tipo_documento} onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="1">DNI</option>
                    <option value="2">Pasaporte</option>
                    <option value="3">Carné extranjería</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-300 text-sm font-medium">Nº documento</label>
                  <input
                    name="num_documento" value={form.num_documento} onChange={handleChange}
                    required placeholder="12345678" className={inputClass}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm font-medium">Correo de acceso</label>
                <input
                  name="email_login" type="email" value={form.email_login}
                  onChange={handleChange} required placeholder="correo@ejemplo.com"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm font-medium">Contraseña</label>
                <div className="relative">
                  <input
                    name="password" type={showPass ? "text" : "password"}
                    value={form.password} onChange={handleChange}
                    required placeholder="••••••••"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPass ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 text-sm font-medium">
                  Teléfono <span className="text-slate-500">(opcional)</span>
                </label>
                <input
                  name="telefono" value={form.telefono} onChange={handleChange}
                  placeholder="999888777" className={inputClass}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                  <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400
                           text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200
                           shadow-lg shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creando cuenta...
                  </>
                ) : "Crear cuenta"}
              </button>

            </form>

            <p className="text-center text-slate-500 text-sm mt-6">
              ¿Ya tienes cuenta?{" "}
              <a href="/login" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                Inicia sesión
              </a>
            </p>
          </div>

          <div className="px-8 pb-6">
            <p className="text-center text-slate-600 text-xs">© 2026 Hotel EVO</p>
          </div>

        </div>
      </div>
    </div>
  );
}