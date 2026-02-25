"use client";

import { useEffect, useState } from "react";
import {
  getUser, apiFetch,
  type Reserva, type Documento, type Pago,
  ESTADO_DOC, METODO_PAGO,
  fmtDate, fmtMoney,
} from "@/lib/portal";

type DocumentoConPagos = {
  doc:   Documento;
  pagos: Pago[];
  reserva: Reserva;
};

export default function PagosPage() {
  const [items, setItems]     = useState<DocumentoConPagos[]>([]);
  const [loading, setLoading] = useState(true);
  const [abierto, setAbierto] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user) return;

    apiFetch<Reserva[]>(`/reservas?id_huesped=${user.id_huesped}`)
      .then(async reservas => {
        const lista = Array.isArray(reservas) ? reservas : [];

        // Solo mostrar documentos de reservas que ya fueron procesadas
        const relevantes = lista.filter(r =>
          r.estado === "Confirmada" || r.estado === "Completada"
        );

        const resultados = await Promise.all(
          relevantes.map(async rv => {
            const docs = await apiFetch<Documento[]>(
              `/documentos?id_reserva=${rv.id_reserva}`
            ).catch(() => [] as Documento[]);

            const docsArr = Array.isArray(docs) ? docs : [];

            const conPagos = await Promise.all(
              docsArr.map(async doc => {
                const pagos = await apiFetch<Pago[]>(
                  `/pagos?id_documento=${doc.id_documento}`
                ).catch(() => [] as Pago[]);
                return {
                  doc,
                  pagos: Array.isArray(pagos) ? pagos : [],
                  reserva: rv,
                };
              })
            );
            return conPagos;
          })
        );

        const todos = resultados.flat();
        // Ordenar: pendientes primero, luego por fecha más reciente
        todos.sort((a, b) => {
          if (a.doc.estado_documento !== b.doc.estado_documento) {
            return a.doc.estado_documento - b.doc.estado_documento;
          }
          return new Date(b.doc.fecha_emision).getTime() - new Date(a.doc.fecha_emision).getTime();
        });

        setItems(todos);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalPendiente = items
    .filter(i => i.doc.estado_documento === 1)
    .reduce((s, i) => s + Number(i.doc.saldo_pendiente), 0);

  const totalPagado = items
    .reduce((s, i) => s + Number(i.doc.monto_pagado), 0);

  if (loading) return (
    <div className="py-24 flex justify-center">
      <svg className="w-6 h-6 animate-spin text-amber-400" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Mis Pagos</h1>
        <p className="text-slate-400 text-sm mt-0.5">Documentos de cobro y registro de pagos</p>
      </div>

      {/* Resumen */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Saldo pendiente</p>
            <p className={`text-xl font-bold ${totalPendiente > 0 ? "text-red-400" : "text-slate-400"}`}>
              {fmtMoney(totalPendiente)}
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-500 text-xs mb-1">Total pagado</p>
            <p className="text-xl font-bold text-green-400">{fmtMoney(totalPagado)}</p>
          </div>
        </div>
      )}

      {/* Lista de documentos */}
      {items.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl py-16 text-center">
          <svg className="w-12 h-12 text-slate-700 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          <p className="text-slate-400">No hay documentos de pago aún</p>
          <p className="text-slate-600 text-sm mt-1">Los documentos se generan al confirmar una reserva o estadía</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(({ doc, pagos, reserva }) => {
            const compositeKey = `${reserva.id_reserva}-${doc.id_documento}`;
            const estadoInfo = ESTADO_DOC[doc.estado_documento];
            const isOpen     = abierto === compositeKey;
            const saldo      = Number(doc.saldo_pendiente ?? (Number(doc.monto_total) - Number(doc.monto_pagado)));

            return (
              <div key={compositeKey}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

                {/* Cabecera del documento */}
                <button
                  onClick={() => setAbierto(isOpen ? null : compositeKey)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors text-left">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                      ${doc.estado_documento === 2 ? "bg-green-500/10" : doc.estado_documento === 3 ? "bg-red-500/10" : "bg-amber-500/10"}`}>
                      <svg className={`w-5 h-5 ${doc.estado_documento === 2 ? "text-green-400" : doc.estado_documento === 3 ? "text-red-400" : "text-amber-400"}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">{doc.numero_documento}</p>
                        {estadoInfo && (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoInfo.color}`}>
                            {estadoInfo.label}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Reserva #{reserva.id_reserva} · {doc.tipo_nombre || "Documento"} · {fmtDate(doc.fecha_emision, { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {doc.descripcion && (
                        <p className="text-slate-500 text-xs mt-0.5">{doc.descripcion}</p>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-4">
                    <p className="text-white font-bold">{fmtMoney(doc.monto_total)}</p>
                    {saldo > 0 && (
                      <p className="text-red-400 text-xs mt-0.5">Saldo: {fmtMoney(saldo)}</p>
                    )}
                    <svg className={`w-4 h-4 text-slate-500 mt-1.5 ml-auto transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Detalle de pagos (desplegable) */}
                {isOpen && (
                  <div className="border-t border-slate-800 px-5 py-4 space-y-4">

                    {/* Barra de progreso */}
                    <div>
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Pagado: {fmtMoney(doc.monto_pagado)}</span>
                        <span>Total: {fmtMoney(doc.monto_total)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, (Number(doc.monto_pagado) / Number(doc.monto_total)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Pagos registrados */}
                    <div>
                      <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">
                        Pagos registrados ({pagos.length})
                      </p>
                      {pagos.length === 0 ? (
                        <p className="text-slate-600 text-sm">Sin pagos registrados aún</p>
                      ) : (
                        <div className="space-y-2">
                          {pagos.map(p => (
                            <div key={p.id_pago}
                              className="bg-slate-800 rounded-xl px-4 py-3 flex items-center justify-between">
                              <div>
                                <p className="text-white text-sm font-medium">{fmtMoney(p.monto_pagado)}</p>
                                <div className="flex items-center gap-2 mt-0.5 text-slate-500 text-xs">
                                  <span>{fmtDate(p.fecha_pago, { day: "numeric", month: "short", year: "numeric" })}</span>
                                  <span>·</span>
                                  <span>{METODO_PAGO[p.metodo] ?? `Método ${p.metodo}`}</span>
                                  {p.numero_operacion && (
                                    <>
                                      <span>·</span>
                                      <span>Op. {p.numero_operacion}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${p.estado_pago === 2 ? "bg-green-400" : p.estado_pago === 3 ? "bg-red-400" : "bg-yellow-400"}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}