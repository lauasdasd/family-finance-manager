import { useEffect, useState } from "react";
import api from "../../services/api";
import styles from "./Tarjetas.module.css";

export default function GestionarTarjetas({ filtros, refreshKey }) {
  const [tarjetas, setTarjetas] = useState([]);
  const [modalData, setModalData] = useState(null); // Para controlar el Modal
  // Dentro de tu componente de Tarjetas
  const manejarPagoResumen = async () => {
    if (!window.confirm(`¿Marcar todo el resumen de ${filtros.mes}/${filtros.anio} como pagado?`)) return;

    try {
      await api.post(`/tarjetas/${modalData.id}/pagar-resumen?mes=${filtros.mes}&anio=${filtros.anio}`);
      
      alert("¡Resumen pagado correctamente!");
      
      // 1. IMPORTANTE: Cerramos el modal. 
      // Al cerrarlo, eliminamos la referencia vieja de modalData.
      setModalData(null); 
      
      // 2. Refrescamos la lista. 
      // Para asegurar que React detecte el cambio, podemos limpiar el estado antes
      setTarjetas([]); 
      await cargarDatos(); 
      
    } catch (err) {
      console.error("Error al pagar", err);
      alert("Error al procesar el pago");
    }
  };
  // ... dentro de tu componente GestionarTarjetas

  const cargarDatos = async () => {
    // 1. Verificamos que tengamos los filtros necesarios
    if (!filtros?.mes || !filtros?.anio || !filtros?.titularId) {
      setTarjetas([]); // Si no hay titular, limpiamos la vista
      return;
    }

    try {
      // 2. IMPORTANTE: Usamos el endpoint filtrado por titularId
      // Esto asegura que solo procesemos tarjetas del titular seleccionado
      const res = await api.get(`/tarjetas/${filtros.titularId}/tarjetas`);
      const tarjetasData = res.data;

      const tarjetasProcesadas = await Promise.all(
        tarjetasData.map(async (t) => {
          // ... (el resto de tu lógica de procesamiento se mantiene igual)
          if (t.tipo === "credito") {
            try {
              const resResumen = await api.get(`/tarjetas/${t.id}/resumen`, { 
                params: { mes: filtros.mes, anio: filtros.anio } 
              });
              return { ...t, resumen: resResumen.data };
            } catch (err) {
              return { ...t, resumen: { total_resumen: 0, movimientos: [] } };
            }
          } else if (t.tipo === "debito") {
            try {
              const resSaldo = await api.get(`/tarjetas/${t.id}/saldo`, {
                params: { mes: filtros.mes, anio: filtros.anio }
              });
              return { ...t, resumen: { 
                  total_resumen: resSaldo.data.balance_mes, 
                  ingresos: resSaldo.data.ingresos_mes,
                  egresos: resSaldo.data.egresos_mes,
                  movimientos: resSaldo.data.movimientos 
              }};
            } catch (err) {
              return { ...t, resumen: { total_resumen: 0, movimientos: [] } };
            }
          }
          return t;
        })
      );
      setTarjetas(tarjetasProcesadas);
    } catch (error) {
      console.error("Error cargando datos de tarjetas", error);
    }
  };

  // 3. El useEffect ahora escuchará específicamente al titularId
  useEffect(() => {
    cargarDatos();
  }, [filtros.titularId, filtros.mes, filtros.anio, refreshKey]);

const imprimirDetalle = () => {
    const t = modalData;
    const ventimp = window.open('', '_blank');
    
    // Construir filas de la tabla
    const filas = t.resumen.movimientos.map(m => `
      <tr>
        <td>${new Date(m.fecha).toLocaleDateString()}</td>
        <td>
          <b>${m.descripcion}</b><br/>
          <small>Titular: ${m.involucrados.titular} | Part: ${m.involucrados.participantes.join(', ') || '-'}</small>
        </td>
        <td style="text-align:center">${m.cuota_nro}</td>
        <td style="text-align:right; color: ${m.tipo === 'ingreso' ? '#27ae60' : '#000'}">
          ${m.tipo === 'ingreso' ? '+' : '-'}$${m.monto.toLocaleString('es-AR')}
        </td>
      </tr>
    `).join('');

    ventimp.document.write(`
      <html>
        <head>
          <title>Resumen - ${t.nombre}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #ff8c00; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #ccc; padding: 10px 5px; font-size: 12px; color: #666; }
            td { padding: 12px 5px; border-bottom: 1px solid #eee; font-size: 13px; }
            .footer { margin-top: 30px; display: flex; justify-content: flex-end; }
            .resumen-box { border: 1px solid #eee; padding: 15px; border-radius: 8px; min-width: 200px; }
            .total { font-size: 18px; font-weight: bold; color: #20b2aa; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Resumen de Tarjeta</h1>
            <p><b>Banco:</b> ${t.banco?.nombre || 'S/B'} | <b>Tarjeta:</b> ${t.nombre} (${t.tipo.toUpperCase()})</p>
            <p><b>Periodo:</b> ${filtros.mes}/${filtros.anio}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>FECHA</th>
                <th>CONCEPTO / INVOLUCRADOS</th>
                <th style="text-align:center">CUOTA</th>
                <th style="text-align:right">MONTO</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
          <div class="footer">
            <div class="resumen-box">
              <p>Ingresos: +$${t.resumen.ingresos.toLocaleString('es-AR')}</p>
              <p>Gastos: -$${t.resumen.egresos.toLocaleString('es-AR')}</p>
              <p class="total">Neto: $${t.resumen.total_resumen.toLocaleString('es-AR')}</p>
            </div>
          </div>
        </body>
      </html>
    `);

    ventimp.document.close();
    ventimp.print();
    ventimp.close();
  };

  return (
  <div className={styles.overviewGrid}>
    {tarjetas.map((t) => {
      // Calculamos si todas las cuotas del mes están pagadas
      const todasPagadas = t.resumen?.movimientos?.length > 0 && 
                           t.resumen.movimientos.every(m => m.pagada);

      return (
        <div key={t.id} className={`${styles.cardPlastic} ${t.tipo === 'debito' ? styles.debito : styles.credito} ${todasPagadas ? styles.cardSaldada : ''}`}>
          
          <div className={styles.cardHeader}>
            <div>
              <span className={styles.bankName}>{t.banco?.nombre || "Banco"}</span>
              <h4 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {t.nombre}
                {todasPagadas && <span title="Mes Saldado" style={{ fontSize: '0.9rem' }}>✅</span>}
              </h4>
            </div>
            <div className={styles.chip}></div>
          </div>

          <div className={styles.cardNumber}>**** **** **** {t.id.toString().padStart(4, '0')}</div>

          <div className={styles.balanceInfo}>
            <div>
              <span className={styles.amountLabel}>
                {t.tipo === "credito" ? `Resumen ${filtros.mes}` : `Balance neto ${filtros.mes}`}
              </span>
              <div className={`${styles.amountValue} ${todasPagadas ? styles.montoSaldado : ''}`}>
                ${(t.resumen?.total_resumen || 0).toLocaleString()}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button onClick={() => setModalData(t)} className={styles.btnDetail}>
                Ver Detalle
              </button>
            </div>
          </div>
        </div>
      );
    })}

    {/* --- RENDERIZADO DEL MODAL --- */}
    {modalData && (
      <div className={styles.modalOverlay} onClick={() => setModalData(null)}>
        <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div style={{ width: '100%' }}>
                <div className={styles.titleRow}>
                  <h3>Detalle: {modalData.nombre}</h3>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div className={styles.accionesModal}>
                        {/* El botón de pagar solo aparece si hay algo pendiente */}
                        {modalData.tipo === "credito" && modalData.resumen?.movimientos?.some(m => !m.pagada) && (
                          <button className={styles.btnPagarTodo} onClick={manejarPagoResumen}>
                            ✅ Pagar Resumen
                          </button>
                        )}
                        <button className={styles.btnPrint} onClick={imprimirDetalle}>
                          🖨️ Imprimir
                        </button>
                    </div>
                    <button className={styles.closeBtn} onClick={() => setModalData(null)}>&times;</button>
                  </div>
                </div>
                
                <div className={styles.tableHeader}>
                  <span className={styles.colFecha}>Fecha</span>
                  <span className={styles.colConcepto}>Concepto / Involucrados</span>
                  <span className={styles.colCuota}>Cuota</span>
                  <span className={styles.colMonto}>Monto</span>
                </div>
              </div>
            </div>

            <div className={styles.modalBody}>
              <table className={styles.detailTable}>
                <tbody>
                  {modalData.resumen?.movimientos?.map((m, idx) => (
                    <tr key={idx} className={`${m.tipo === 'ingreso' ? styles.rowIngreso : ''} ${m.pagada ? styles.rowPagada : ''}`}>
                      <td className={styles.colFecha}>{new Date(m.fecha).toLocaleDateString()}</td>
                      <td className={styles.colConcepto}>
                        <div style={{ fontWeight: '600', textDecoration: m.pagada ? 'line-through' : 'none', opacity: m.pagada ? 0.6 : 1 }}>
                          {m.descripcion} {m.pagada && '✓'}
                        </div>
                        <div className={styles.involucradosText}>
                          👤 {m.involucrados.titular} {m.involucrados.participantes.length > 0 && `| 👥 ${m.involucrados.participantes.join(', ')}`}
                        </div>
                      </td>
                      <td className={styles.colCuota}>{m.cuota_nro}</td>
                      <td className={styles.colMonto} style={{ 
                        color: m.pagada ? '#999' : (m.tipo === 'ingreso' ? '#20b2aa' : '#e74c3c'),
                        textDecoration: m.pagada ? 'line-through' : 'none'
                      }}>
                        {m.tipo === 'ingreso' ? '+' : '-'}${m.monto.toLocaleString('es-AR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.modalSummaryFooter}>
              <div className={styles.summaryBox}>
                <span className={styles.summaryLabel}>INGRESOS</span>
                <span className={styles.summaryValueVerde}>+${modalData.resumen?.ingresos?.toLocaleString('es-AR') || 0}</span>
              </div>
              <div className={styles.summaryBox}>
                <span className={styles.summaryLabel}>GASTOS</span>
                <span className={styles.summaryValueRojo}>-${modalData.resumen?.egresos?.toLocaleString('es-AR') || 0}</span>
              </div>
              <div className={`${styles.summaryBox} ${styles.summaryBoxTotal}`}>
                <span className={styles.summaryLabel}>BALANCE NETO</span>
                <span className={modalData.resumen?.total_resumen >= 0 ? styles.summaryValueVerde : styles.summaryValueRojo}>
                  ${modalData.resumen?.total_resumen?.toLocaleString('es-AR') || 0}
                </span>
                {modalData.resumen?.movimientos?.every(m => m.pagada) && 
                  <div className={styles.saldadoBadge}>SALDADO</div>
                }
              </div>
            </div>
        </div>
      </div>
    )}
  </div>
);
}