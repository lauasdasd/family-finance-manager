import { useEffect, useState } from "react";
import api from "../../services/api";
import styles from "./Cuenta.module.css";

export default function MovimientoList({ titularId, refreshKey, filtros }) {
  const [movimientos, setMovimientos] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
  const limite = 5;

  // Sincronizar el modal si los datos cambian (por ejemplo, al anular)
  useEffect(() => {
    if (movimientoSeleccionado) {
      const actualizado = movimientos.find(m => m.id === movimientoSeleccionado.id);
      if (actualizado) setMovimientoSeleccionado(actualizado);
    }
  }, [movimientos]);

  useEffect(() => {
    setPagina(0);
    setMovimientos([]);
  }, [filtros, titularId]);

  const cargarMovimientos = () => {
    if (titularId) {
      setCargando(true);
      const params = new URLSearchParams();
      if (filtros?.mes) params.append("mes", filtros.mes);
      if (filtros?.anio) params.append("anio", filtros.anio);
      if (filtros?.tipo) params.append("tipo", filtros.tipo);
      if (filtros?.persona_id) params.append("persona_id", filtros.persona_id);
      params.append("skip", pagina * limite);
      params.append("limit", limite);

      api.get(`/cuentas/titular/${titularId}?${params.toString()}`)
        .then(res => {
          setMovimientos(res.data);
          setCargando(false);
        })
        .catch(err => {
          console.error("Error:", err);
          setCargando(false);
        });
    }
  };

  useEffect(() => {
    cargarMovimientos();
  }, [titularId, refreshKey, filtros, pagina]);

  // --- FUNCIONES DE ACCIÓN ---
  const handleAnular = async (id) => {
    if (window.confirm("¿Anular este movimiento? Ya no sumará en los balances.")) {
      try {
        await api.patch(`/cuentas/${id}/anular`);
        cargarMovimientos(); // Recargamos la lista
      } catch (err) {
        alert("Error al anular");
      }
    }
  };

  const handleEliminar = async (id) => {
    if (window.confirm("¿ELIMINAR DEFINITIVAMENTE? Se borrarán todas las cuotas asociadas.")) {
      try {
        await api.delete(`/cuentas/${id}`);
        setMovimientoSeleccionado(null); // Cerramos modal
        cargarMovimientos(); 
      } catch (err) {
        alert("Error al eliminar");
      }
    }
  };

  return (
    <div className={styles.listaContainer}>
      <table className={styles.tabla}>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th style={{ textAlign: 'right' }}>Monto</th>
            <th>Origen / Destino</th>
          </tr>
        </thead>
        <tbody>
          {movimientos.map((m) => {
            const total = m.cuotas?.reduce((acc, c) => acc + c.monto, 0) || 0;
            const esTransfEntrada = m.tipo === "transferencia" && m.nombre.includes("(Entrada)");
            const esPositivo = m.tipo === "ingreso" || esTransfEntrada;
            const signo = esPositivo ? "+" : "-";
            const colorMonto = esPositivo ? "#38a169" : "#e53e3e";

            return (
              <tr 
                key={m.id} 
                onClick={() => setMovimientoSeleccionado(m)} 
                className={`${styles.rowClickable} ${m.anulada ? styles.rowAnulada : ""}`}
              >
                <td className={styles.tdFecha}>{new Date(m.fecha_inicio).toLocaleDateString('es-AR')}</td>
                <td>
                  <span className={styles.txtNombre}>{m.nombre}</span>
                  {m.anulada && <span className={styles.tagAnulado}>ANULADO</span>}
                  {m.cuotas?.length > 1 && !m.anulada && (
                    <small className={styles.cuotasBadge}>{m.cuotas.length} cuotas</small>
                  )}
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[m.tipo]}`}>
                    {m.tipo === "transferencia" ? "🔄 Transf." : m.tipo.toUpperCase()}
                  </span>
                </td>
                <td style={{ textAlign: 'right', color: m.anulada ? "#94a3b8" : colorMonto, fontWeight: 'bold' }}>
                  {signo} ${total.toLocaleString('es-AR')}
                </td>
                <td>
                  <span className={styles.origenLabel}>
                    {m.tarjeta ? `💳 ${m.tarjeta.nombre}` : "💵 Efectivo"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

            {/* PAGINACIÓN */}
      {movimientos.length > 0 && (
        <div className={styles.pagination}>
          <button disabled={pagina === 0} onClick={() => setPagina(pagina - 1)} className={styles.btnPage}>
            ← Anterior
          </button>
          <span className={styles.pageIndicator}>Página {pagina + 1}</span>
          <button disabled={movimientos.length < limite} onClick={() => setPagina(pagina + 1)} className={styles.btnPage}>
            Siguiente →
          </button>
        </div>
      )}

      {/* MODAL DE DETALLE MEJORADO */}
      {movimientoSeleccionado && (
        <div className={styles.modalOverlay} onClick={() => setMovimientoSeleccionado(null)}>
          <div className={styles.modalDetalle} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Detalle del Movimiento</h3>
              <button className={styles.btnClose} onClick={() => setMovimientoSeleccionado(null)}>&times;</button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.infoPrincipal}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h4 className={movimientoSeleccionado.anulada ? styles.txtTachado : ""}>
                            {movimientoSeleccionado.nombre}
                        </h4>
                        <p>Total: <strong>${movimientoSeleccionado.cuotas.reduce((acc, c) => acc + c.monto, 0).toLocaleString('es-AR')}</strong></p>
                    </div>
                    {/* BOTONES DE ACCIÓN DENTRO DEL MODAL */}
                    <div className={styles.modalAcciones}>
                        {!movimientoSeleccionado.anulada ? (
                            <button 
                                className={styles.btnAnularModal}
                                onClick={() => handleAnular(movimientoSeleccionado.id)}
                            >
                                🚫 Anular Movimiento
                            </button>
                        ) : (
                            <button 
                                className={styles.btnEliminarModal}
                                onClick={() => handleEliminar(movimientoSeleccionado.id)}
                            >
                                🗑️ Eliminar Definitivamente
                            </button>
                        )}
                    </div>
                </div>
              </div>

              <div className={styles.cuotasGrid}>
                {movimientoSeleccionado.cuotas.sort((a,b) => a.numero - b.numero).map(c => (
                  <div key={c.id} className={`${styles.cuotaCard} ${c.pagada ? styles.pagada : styles.pendiente} ${movimientoSeleccionado.anulada ? styles.cuotaAnulada : ""}`}>
                    <div className={styles.cuotaHeader}>
                      <span>Cuota {c.numero}</span>
                      {c.pagada ? <span>✅</span> : <span>⏳</span>}
                    </div>
                    <div className={styles.cuotaMonto}>${c.monto.toLocaleString('es-AR')}</div>
                    <div className={styles.cuotaFecha}>
                      {new Date(c.fecha_vencimiento).toLocaleDateString('es-AR', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}