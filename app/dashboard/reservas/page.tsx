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
     <>
    <style>{`
    
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(26,26,20,0.55);
  backdrop-filter: blur(6px);
  display:flex;
  align-items:center;
  justify-content:center;
  z-index:100;
  animation: fadeIn 0.35s cubic-bezier(0.22,1,0.36,1);
}

.modal-card {
  width: 720px;
  max-width: 95%;
  background: #f5efe6;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow:
    0 40px 80px rgba(0,0,0,0.25),
    0 10px 30px rgba(0,0,0,0.1);
  animation: slideUp 0.45s cubic-bezier(0.22,1,0.36,1);
}

@keyframes fadeIn {
  from { opacity:0; }
  to { opacity:1; }
}

@keyframes slideUp {
  from { opacity:0; transform: translateY(40px); }
  to { opacity:1; transform: translateY(0); }
}

.modal-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:1.5rem;
}

.modal-title {
  font-family:'Cormorant Garamond',serif;
  font-size:1.9rem;
  font-weight:400;
}

.modal-close {
  background:none;
  border:none;
  font-size:1.5rem;
  cursor:pointer;
}

.modal-form {
  margin-top:1.5rem;
}

.form-grid {
  display:grid;
  grid-template-columns: repeat(2,1fr);
  gap:1.25rem;
}

.field label {
  font-size:0.65rem;
  letter-spacing:0.2em;
  text-transform:uppercase;
  color:#7a6e5f;
  display:block;
  margin-bottom:0.5rem;
}

.field input,
.field select {
  width:100%;
  border-radius:14px;
  border:1.5px solid #ddd5c4;
  padding:0.75rem 0.9rem;
  font-family:'Montserrat',sans-serif;
  background:#fff;
}

.field input:focus,
.field select:focus {
  outline:none;
  border-color:#e8832a;
  box-shadow:0 0 0 4px rgba(232,131,42,0.12);
}

.modal-actions {
  margin-top:2rem;
  display:flex;
  justify-content:flex-end;
  gap:1rem;
}

.btn-primary {
  border-radius:50px;
  padding:0.95rem 1.9rem;
  background: linear-gradient(135deg,#e8832a 0%,#d4451a 100%);
  color:#fff;
  font-family:'Montserrat',sans-serif;
  font-size:0.72rem;
  letter-spacing:0.22em;
  text-transform:uppercase;
  font-weight:700;
  border:none;
  box-shadow:0 6px 20px rgba(232,131,42,0.45);
  cursor:pointer;
  position:relative;
  overflow:hidden;
  transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
}

.btn-primary:hover {
  transform:translateY(-2px);
  box-shadow:0 10px 30px rgba(232,131,42,0.6);
}

.btn-primary:active {
  transform:scale(0.96);
}

/* Shine effect */
.btn-primary::after {
  content:"";
  position:absolute;
  top:0;
  left:-75%;
  width:50%;
  height:100%;
  background:linear-gradient(
    120deg,
    rgba(255,255,255,0.15),
    rgba(255,255,255,0.45),
    rgba(255,255,255,0.15)
  );
  transform:skewX(-25deg);
  transition:0.6s;
}

.btn-primary:hover::after {
  left:130%;
}

.btn-secondary {
  border-radius:50px;
  padding:0.9rem 1.6rem;
  background:transparent;
  border:1px solid #c9a96e;
  color:#4a4035; /* Marrón oscuro del sistema */
  font-family:'Montserrat',sans-serif;
  font-size:0.72rem;
  letter-spacing:0.22em;
  text-transform:uppercase;
  font-weight:700;
  cursor:pointer;
  transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
}

.btn-secondary:hover {
  background: rgba(212,69,26,0.08);
  border-color:#d4451a;
  color:#d4451a;
  transform:translateY(-2px);
}

.btn-secondary:active {
  transform:scale(0.97);
}

.res-card {
  background:#fff;
  border-radius:24px;
  border:1px solid rgba(201,169,110,0.18);
  overflow:hidden;
  box-shadow:
    0 20px 50px rgba(26,26,20,0.08),
    0 4px 14px rgba(26,26,20,0.06);
}

.res-table {
  width:100%;
  border-collapse:collapse;
  font-family:'Montserrat',sans-serif;
}

.res-table thead {
  background:#f5efe6;
}

.res-table th {
  text-align:left;
  padding:1rem 1.5rem;
  font-size:0.65rem;
  letter-spacing:0.18em;
  text-transform:uppercase;
  color:#7a6e5f;
  font-weight:600;
  border-bottom:1px solid rgba(201,169,110,0.25);
}

.res-table td {
  padding:1.1rem 1.5rem;
  font-size:0.78rem;
  color:#4a4035;
  border-bottom:1px solid rgba(201,169,110,0.12);
  transition: background 0.25s;
}

.res-table tbody tr:hover {
  background:#fffdf9;
}

.res-id {
  font-weight:600;
  color:#1a1a14;
}

.res-money {
  font-weight:600;
  color:#e8832a;
}

.res-actions button {
  background:none;
  border:none;
  font-family:'Montserrat',sans-serif;
  font-size:0.68rem;
  letter-spacing:0.12em;
  text-transform:uppercase;
  cursor:pointer;
  transition: all 0.25s;
}

.res-edit {
  color:#e8832a;
  margin-right:1rem;
}

.res-edit:hover {
  color:#d4451a;
}

.res-delete {
  color:#a02810;
}

.res-delete:hover {
  color:#7a1d0a;
}

.res-header {
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:2rem;
}

.res-title {
  font-family:'Cormorant Garamond',serif;
  font-size:2.3rem;
  font-weight:400;
  color:#1a1a14;
}

.res-subtitle {
  font-family:'Montserrat',sans-serif;
  font-size:0.8rem;
  color:#7a6e5f;
  margin-top:0.4rem;
}

.ornament {
  display:flex;
  align-items:center;
  gap:0.75rem;
  margin-bottom:2rem;
}

.ornament-line {
  flex:1;
  height:1px;
  background:#c9a96e;
  opacity:0.35;
}

.ornament-diamond {
  width:7px;
  height:7px;
  border:1px solid #c9a96e;
  transform:rotate(45deg);
  opacity:0.7;
}

    `}</style>
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="res-header">
  <div>
    <h1 className="res-title">Reservas</h1>
    <p className="res-subtitle">
      Gestión completa de reservas activas
    </p>
  </div>

  <button
    className="btn-primary"
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
  >
    Nueva Reserva
  </button>
</div>

<div className="ornament">
  <div className="ornament-line"></div>
  <div className="ornament-diamond"></div>
  <div className="ornament-line"></div>
</div>
      </div>



      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <p>Cargando...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="res-card">
            <table className="res-table">
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
                    <td className="res-id">{r.id_reserva}</td>
                    <td>{r.huesped}</td>
                    <td>{r.habitacion}</td>
                    <td>
                      {new Date(r.fecha_entrada).toLocaleDateString("es-PE")}
                    </td>
                    <td>
                      {new Date(r.fecha_salida).toLocaleDateString("es-PE")}
                    </td>
                    <td>{r.num_personas}</td>
                    <td className="res-money">S/ {r.monto_total}</td>
                    <td>{r.estado}</td>
<td className="res-actions">
  <button
    className="res-edit"
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
  >
    Editar
  </button>

  <button
    className="res-delete"
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
  <div className="modal-overlay">
    <div className="modal-card">
      <div className="modal-header">
        <h2 className="modal-title">
          {editando ? "Editar Reserva" : "Nueva Reserva"}
        </h2>
        <button className="modal-close" onClick={() => setShowForm(false)}>×</button>
      </div>

      <div className="ornament">
        <div className="ornament-line" />
        <div className="ornament-diamond" />
        <div className="ornament-line" />
      </div>

      <form
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
        className="modal-form"
      >

        <div className="form-grid">

          <div className="field">
            <label>Huésped</label>
            <select name="id_huesped" value={formData.id_huesped} onChange={handleChange} required>
              <option value="">Seleccione Huésped</option>
              {huespedes.map(h => (
                <option key={h.id_huesped} value={h.id_huesped}>
                  {h.nombres} {h.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Habitación</label>
            <select name="id_habitacion" value={formData.id_habitacion} onChange={handleChange} required>
              <option value="">Seleccione Habitación</option>
              {habitaciones.map(h => (
                <option key={h.id_habitacion} value={h.id_habitacion}>
                  {h.numero} - Piso {h.piso}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Fecha Entrada</label>
            <input type="date" name="fecha_entrada" onChange={handleChange} required />
          </div>

          <div className="field">
            <label>Fecha Salida</label>
            <input type="date" name="fecha_salida" onChange={handleChange} required />
          </div>

          <div className="field">
            <label>N° Personas</label>
            <input name="num_personas" onChange={handleChange} required />
          </div>

          <div className="field">
            <label>Monto Total</label>
            <input name="monto_total" onChange={handleChange} required />
          </div>

        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary">
            {editando ? "Actualizar" : "Guardar"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      </div>
        </div>
  </>
  );
}