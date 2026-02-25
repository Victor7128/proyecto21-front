"use client";

import { useEffect, useState, FormEvent } from "react";
import { getUser, apiFetch, type Huesped } from "@/lib/portal";

const cls = "w-full bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-xl px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all";

export default function PerfilPage() {
  const [huesped, setHuesped]  = useState<Huesped | null>(null);
  const [loading, setLoading]  = useState(true);
  const [savingD, setSavingD]  = useState(false);
  const [savingP, setSavingP]  = useState(false);
  const [msgD, setMsgD]        = useState("");
  const [errD, setErrD]        = useState("");
  const [msgP, setMsgP]        = useState("");
  const [errP, setErrP]        = useState("");
  const [showPass, setShowPass] = useState({ actual: false, nuevo: false, confirmar: false });

  const [datos, setDatos] = useState({
    nombres:        "",
    apellidos:      "",
    tipo_documento: "1",
    num_documento:  "",
    telefono:       "",
    correo:         "",
  });

  const [pass, setPass] = useState({
    password_actual: "",
    password_nuevo:  "",
    confirmar:       "",
  });

  useEffect(() => {
    const user = getUser();
    if (!user) return;
    apiFetch<Huesped>(`/huespedes/${user.id_huesped}`)
      .then(h => {
        setHuesped(h);
        setDatos({
          nombres:        h.nombres        ?? "",
          apellidos:      h.apellidos      ?? "",
          tipo_documento: String(h.tipo_documento ?? 1),
          num_documento:  h.num_documento  ?? "",
          telefono:       h.telefono       ?? "",
          correo:         h.correo         ?? "",
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleGuardar(e: FormEvent) {
    e.preventDefault();
    setErrD(""); setMsgD("");
    const user = getUser();
    if (!user) return;
    setSavingD(true);
    try {
      await apiFetch(`/huespedes/${user.id_huesped}`, {
        method: "PUT",
        body: JSON.stringify({ ...datos, tipo_documento: parseInt(datos.tipo_documento) }),
      });
      setMsgD("Perfil actualizado correctamente.");
    } catch (err) {
      setErrD(err instanceof Error ? err.message : "Error al actualizar.");
    } finally {
      setSavingD(false);
    }
  }

  async function handlePassword(e: FormEvent) {
    e.preventDefault();
    setErrP(""); setMsgP("");
    if (pass.password_nuevo !== pass.confirmar) {
      setErrP("Las contraseñas nuevas no coinciden."); return;
    }
    if (pass.password_nuevo.length < 6) {
      setErrP("La contraseña debe tener al menos 6 caracteres."); return;
    }
    const user = getUser();
    if (!user) return;
    setSavingP(true);
    try {
      await apiFetch(`/huespedes/${user.id_huesped}/password`, {
        method: "PUT",
        body: JSON.stringify({
          password_actual: pass.password_actual,
          password_nuevo:  pass.password_nuevo,
        }),
      });
      setMsgP("Contraseña actualizada correctamente.");
      setPass({ password_actual: "", password_nuevo: "", confirmar: "" });
    } catch (err) {
      setErrP(err instanceof Error ? err.message : "Error al cambiar contraseña.");
    } finally {
      setSavingP(false);
    }
  }

  if (loading) return (
    <div className="py-24 flex justify-center">
      <svg className="w-6 h-6 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  const initials = huesped
    ? `${huesped.nombres[0]}${huesped.apellidos[0]}`.toUpperCase()
    : "H";

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-white text-2xl font-bold">Mi Perfil</h1>
        <p className="text-slate-400 text-sm mt-0.5">Administra tu información personal</p>
      </div>

      {/* Avatar card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-5">
        <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-400 font-bold text-2xl shrink-0">
          {initials}
        </div>
        <div>
          <p className="text-white font-bold text-lg">{huesped?.nombres} {huesped?.apellidos}</p>
          <p className="text-slate-400 text-sm">{huesped?.email_login}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
            <span className="text-green-400 text-xs">Cuenta activa</span>
          </div>
        </div>
      </div>

      {/* Datos personales */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          Datos personales
        </h2>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-sm">Nombres</label>
              <input value={datos.nombres} onChange={e => setDatos({ ...datos, nombres: e.target.value })}
                required className={cls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-sm">Apellidos</label>
              <input value={datos.apellidos} onChange={e => setDatos({ ...datos, apellidos: e.target.value })}
                required className={cls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-sm">Tipo documento</label>
              <select value={datos.tipo_documento} onChange={e => setDatos({ ...datos, tipo_documento: e.target.value })}
                className={cls}>
                <option value="1">DNI</option>
                <option value="2">Pasaporte</option>
                <option value="3">Carné extranjería</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-sm">Nº documento</label>
              <input value={datos.num_documento} onChange={e => setDatos({ ...datos, num_documento: e.target.value })}
                required className={cls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-400 text-sm">Teléfono</label>
              <input value={datos.telefono} onChange={e => setDatos({ ...datos, telefono: e.target.value })}
                placeholder="999888777" className={cls} />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 text-sm">Correo contacto</label>
              <input type="email" value={datos.correo} onChange={e => setDatos({ ...datos, correo: e.target.value })}
                className={cls} />
            </div>
          </div>

          {msgD && <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">{msgD}</p>}
          {errD && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{errD}</p>}

          <button type="submit" disabled={savingD}
            className="w-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400
                       text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-60
                       flex items-center justify-center gap-2">
            {savingD ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Guardando…
              </>
            ) : "Guardar cambios"}
          </button>
        </form>
      </div>

      {/* Cambiar contraseña */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Cambiar contraseña
        </h2>

        <form onSubmit={handlePassword} className="space-y-4">
          {(["actual", "nuevo", "confirmar"] as const).map(key => {
            const labels = { actual: "Contraseña actual", nuevo: "Nueva contraseña", confirmar: "Confirmar nueva" };
            const passKeys = { actual: "password_actual", nuevo: "password_nuevo", confirmar: "confirmar" } as const;
            return (
              <div key={key} className="space-y-1.5">
                <label className="text-slate-400 text-sm">{labels[key]}</label>
                <div className="relative">
                  <input type={showPass[key] ? "text" : "password"}
                    value={pass[passKeys[key]]}
                    onChange={e => setPass({ ...pass, [passKeys[key]]: e.target.value })}
                    placeholder="••••••••" required
                    className={`${cls} pr-11`} />
                  <button type="button" onClick={() => setShowPass(s => ({ ...s, [key]: !s[key] }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d={showPass[key]
                          ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}

          {msgP && <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">{msgP}</p>}
          {errP && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{errP}</p>}

          <button type="submit" disabled={savingP}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2">
            {savingP ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Cambiando…
              </>
            ) : "Cambiar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}