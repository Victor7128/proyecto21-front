"use client";

import { useEffect, useState } from "react";
import { pagoService, Pago } from "@/services/pagoService";
import Link from "next/link";

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
const [editando, setEditando] = useState<Pago | null>(null);
const [documentos, setDocumentos] = useState<any[]>([]);

const [formData, setFormData] = useState({
  id_documento: "",
  monto_pagado: "",
  metodo: "",
  estado_pago: "1",
  numero_comprobante: "",
  numero_operacion: "",
  observaciones: "",
});
const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
) => {
  setFormData({ ...formData, [e.target.name]: e.target.value });
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const payload = {
      id_documento: Number(formData.id_documento),
      monto_pagado: Number(formData.monto_pagado),
      metodo: Number(formData.metodo),
      estado_pago: Number(formData.estado_pago),
      numero_comprobante: formData.numero_comprobante || undefined,
      numero_operacion: formData.numero_operacion || undefined,
      observaciones: formData.observaciones || undefined,
    };

    if (editando) {
      await pagoService.actualizar(editando.id_pago, payload);
    } else {
      await pagoService.crear(payload);
    }

    const listaActualizada = await pagoService.listar();
    setPagos(listaActualizada);

    setShowForm(false);
    setEditando(null);
  } catch {
    alert("Error al guardar pago");
  }
};




  useEffect(() => {
    pagoService
      .listar()
      .then(setPagos)
      .catch(() => setError("Error al cargar pagos"))
      .finally(() => setLoading(false));
      fetch("/api/documentos")
    .then(res => res.json())
    .then(setDocumentos)
    .catch(() => {});
  }, []);

  return (
  <>
    <style>{`
      body { background:#f0e9df; }

      .page-wrap {
        padding: 2.5rem 3rem;
      }

      .pay-header {
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:2rem;
      }

      .pay-title {
        font-family:'Cormorant Garamond',serif;
        font-size:2.3rem;
        font-weight:400;
        color:#1a1a14;
      }

      .pay-subtitle {
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

      .btn-primary {
        border-radius:50px;
        padding:0.9rem 1.8rem;
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
        transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
      }

      .btn-primary:hover {
        transform:translateY(-2px);
      }

      .pay-card {
        background:#fff;
        border-radius:24px;
        border:1px solid rgba(201,169,110,0.18);
        overflow:hidden;
        box-shadow:
          0 20px 50px rgba(26,26,20,0.08),
          0 4px 14px rgba(26,26,20,0.06);
      }

      .pay-table {
        width:100%;
        border-collapse:collapse;
        font-family:'Montserrat',sans-serif;
      }

      .pay-table thead {
        background:#f5efe6;
      }

      .pay-table th {
        text-align:left;
        padding:1rem 1.5rem;
        font-size:0.65rem;
        letter-spacing:0.18em;
        text-transform:uppercase;
        color:#7a6e5f;
        font-weight:600;
        border-bottom:1px solid rgba(201,169,110,0.25);
      }

      .pay-table td {
        padding:1.1rem 1.5rem;
        font-size:0.78rem;
        color:#4a4035;
        border-bottom:1px solid rgba(201,169,110,0.12);
      }

      .pay-money {
        font-weight:600;
        color:#e8832a;
      }

      .pay-badge {
        padding:0.4rem 0.9rem;
        border-radius:50px;
        font-size:0.6rem;
        letter-spacing:0.18em;
        text-transform:uppercase;
        font-weight:600;
      }

      .badge-ok {
        background:rgba(232,131,42,0.12);
        color:#e8832a;
      }

      .badge-pend {
        background:rgba(122,110,95,0.12);
        color:#7a6e5f;
      }


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
}

.modal-close {
  background:none;
  border:none;
  font-size:1.5rem;
  cursor:pointer;
}

.form-grid {
  display:grid;
  grid-template-columns: repeat(2,1fr);
  gap:1.2rem;
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


.btn-secondary {
  border-radius:50px;
  padding:0.9rem 1.6rem;
  background:transparent;
  border:1px solid #c9a96e;
  color:#4a4035;
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

    `}</style>

    <div className="page-wrap">

      <div className="pay-header">
        <div>
          <h1 className="pay-title">Pagos</h1>
          <p className="pay-subtitle">
            Gestión financiera y control de facturación
          </p>
        </div>

        <button
  className="btn-primary"
  onClick={() => {
    setEditando(null);
    setFormData({
      id_documento: "",
      monto_pagado: "",
      metodo: "",
      estado_pago: "1",
      numero_comprobante: "",
      numero_operacion: "",
      observaciones: "",
    });
    setShowForm(true);
  }}
>
  Nuevo Pago
</button>
      </div>

      <div className="ornament">
        <div className="ornament-line"></div>
        <div className="ornament-diamond"></div>
        <div className="ornament-line"></div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="pay-card">
          <table className="pay-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Documento</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {pagos.map((p) => (
                <tr key={p.id_pago}>
                  <td>{p.id_pago}</td>
                  <td>{p.id_documento}</td>
                  <td className="pay-money">S/ {p.monto_pagado}</td>
                  <td>{p.metodo}</td>
                  <td>
                    <span className={`pay-badge ${p.estado_pago === 1 ? "badge-ok" : "badge-pend"}`}>
                      {p.estado_pago === 1 ? "Pagado" : "Pendiente"}
                    </span>
                  </td>
                  <td>
                    {new Date(p.fecha_creacion).toLocaleDateString("es-PE")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showForm && (
  <div className="modal-overlay">
    <div className="modal-card">
      <div className="modal-header">
        <h2 className="modal-title">
          {editando ? "Editar Pago" : "Nuevo Pago"}
        </h2>
        <button
          className="modal-close"
          onClick={() => setShowForm(false)}
        >
          ×
        </button>
      </div>

      <div className="ornament">
        <div className="ornament-line"></div>
        <div className="ornament-diamond"></div>
        <div className="ornament-line"></div>
      </div>

      <form onSubmit={handleSubmit} className="modal-form">

        <div className="form-grid">

          <div className="field">
            <label>ID Documento</label>
            <select
  name="id_documento"
  value={formData.id_documento}
  onChange={handleChange}
  required
>
  <option value="">Seleccione documento</option>
  {documentos.map((d) => (
    <option key={d.id_documento} value={d.id_documento}>
      {d.id_documento}
    </option>
  ))}
</select>
          </div>

          <div className="field">
            <label>Monto</label>
            <input
              name="monto_pagado"
              value={formData.monto_pagado}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Método</label>
            <input
              name="metodo"
              value={formData.metodo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label>Estado</label>
            <select
              name="estado_pago"
              value={formData.estado_pago}
              onChange={handleChange}
            >
              <option value="1">Pagado</option>
              <option value="0">Pendiente</option>
            </select>
          </div>

          <div className="field">
            <label>N° Comprobante</label>
            <input
              name="numero_comprobante"
              value={formData.numero_comprobante}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>N° Operación</label>
            <input
              name="numero_operacion"
              value={formData.numero_operacion}
              onChange={handleChange}
            />
          </div>

        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowForm(false)}
          >
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
      )}
    </div>
  </>
);
}