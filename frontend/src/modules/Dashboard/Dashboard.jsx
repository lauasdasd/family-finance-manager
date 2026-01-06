import React, { useEffect, useState } from 'react';
import api from '../../services/api'; 
import styles from './Dashboard.module.css';

// 1. Recibimos titularId como prop desde DashboardPage
const Dashboard = ({ mes, anio, titularId }) => { 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      // 2. Si no hay titular seleccionado, limpiamos y no pedimos nada
      if (!titularId) {
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // 3. Incluimos persona_id en los params (coincidiendo con tu backend)
        const res = await api.get(`/resumen/dashboard/maestro`, {
          params: { 
            mes, 
            anio, 
            persona_id: titularId 
          }
        });
        setData(res.data);
      } catch (err) {
        console.error("Error cargando dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
    // 4. Se vuelve a ejecutar si cambia el mes, el año O EL TITULAR
  }, [mes, anio, titularId]); 

const handlePrint = async () => {
  try {
    // 1. Petición al backend con el filtro de persona_id
    const res = await api.get(`/resumen/extracto-impresion`, {
      params: { 
        mes, 
        anio, 
        persona_id: titularId 
      }
    });
    const dataPrint = res.data;

    const ventimp = window.open('', '_blank');

    // 2. Generación de filas con el nuevo estilo cebra
    const filas = dataPrint.movimientos.map(m => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${m.fecha}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
          <div style="font-weight: bold; color: #2d3748;">${m.concepto}</div>
          <div style="font-size: 11px; color: #718096;">${m.info || ''}</div>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: 'Courier New', monospace; font-weight: bold;">
          <span style="color: ${m.tipo === 'ingreso' ? '#38a169' : '#e53e3e'}">
            ${m.tipo === 'ingreso' ? '+' : '-'}$${m.monto.toLocaleString('es-AR')}
          </span>
        </td>
      </tr>
    `).join('');

    // 3. Estructura HTML completa con estilos integrados
    ventimp.document.write(`
      <html>
        <head>
          <title>Extracto - ${dataPrint.titular}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333; margin: 0; padding: 20px; line-height: 1.4; }
            
            .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 4px solid #1a365d; padding-bottom: 20px; margin-bottom: 30px; }
            .brand-box h1 { margin: 0; color: #1a365d; font-size: 24px; letter-spacing: -1px; }
            .brand-box p { margin: 0; color: #718096; font-size: 12px; }
            
            .info-box { text-align: right; }
            .info-box h2 { margin: 0; color: #2d3748; font-size: 16px; text-transform: uppercase; }
            .info-box p { margin: 2px 0; font-size: 12px; color: #4a5568; }

            .quick-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
            .summary-card { background: #f7fafc; padding: 12px; border-radius: 8px; border: 1px solid #edf2f7; }
            .summary-card span { display: block; font-size: 10px; color: #718096; text-transform: uppercase; font-weight: bold; margin-bottom: 4px; }
            .summary-card strong { font-size: 16px; color: #2d3748; }

            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #1a365d; color: white; text-align: left; padding: 10px; font-size: 11px; text-transform: uppercase; }
            tr:nth-child(even) { background-color: #f8fafc; }
            
            .footer-box { margin-left: auto; width: 280px; background: #1a365d; color: white; padding: 15px; border-radius: 8px; }
            .total-line { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
            .total-main { border-top: 1px solid #ffffff44; margin-top: 8px; padding-top: 8px; font-size: 18px; font-weight: bold; }
            
            .legal { margin-top: 40px; font-size: 10px; color: #a0aec0; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="brand-box">
              <h1>Family Finance Manager</h1>
              <p>Sistema de Gestión Patrimonial</p>
            </div>
            <div class="info-box">
              <h2>Extracto de Movimientos</h2>
              <p><strong>Titular:</strong> ${dataPrint.titular}</p>
              <p><strong>Período:</strong> ${dataPrint.periodo}</p>
              <p><strong>Fecha emisión:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
            </div>
          </div>

          <div class="quick-summary">
            <div class="summary-card">
              <span>Ingresos Totales</span>
              <strong style="color: #38a169;">+$${dataPrint.resumen.total_ingresos.toLocaleString('es-AR')}</strong>
            </div>
            <div class="summary-card">
              <span>Egresos Totales</span>
              <strong style="color: #e53e3e;">-$${dataPrint.resumen.total_egresos.toLocaleString('es-AR')}</strong>
            </div>
            <div class="summary-card">
              <span>Resultado Neto</span>
              <strong style="color: ${dataPrint.resumen.balance_neto >= 0 ? '#1a365d' : '#e53e3e'}; font-weight: 800;">
                $${dataPrint.resumen.balance_neto.toLocaleString('es-AR')}
              </strong>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Fecha</th>
                <th style="width: 65%;">Concepto / Detalle</th>
                <th style="width: 20%; text-align: right;">Importe</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
            </tbody>
          </table>

          <div class="footer-box">
            <div class="total-line">
              <span>Total Egresos:</span>
              <span>$${dataPrint.resumen.total_egresos.toLocaleString('es-AR')}</span>
            </div>
            <div class="total-line total-main">
              <span>SALDO NETO:</span>
              <span>$${dataPrint.resumen.balance_neto.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div class="legal">
            Este reporte es para uso privado y refleja exclusivamente los movimientos del titular indicado.
            <br>Generado automáticamente por Family Finance Manager v2.6 - 2026
          </div>
        </body>
      </html>
    `);

    ventimp.document.close();
    
    // Pequeño delay para asegurar renderizado de fuentes y estilos
    setTimeout(() => {
      ventimp.print();
      ventimp.close();
    }, 600);

  } catch (err) {
    console.error("Error al generar el extracto:", err);
    alert("Ocurrió un error al obtener los datos para la impresión.");
  }
};

if (!titularId) return (
  <div className={styles.container}>
    <div className={styles.emptyState}>
      <h2>👋 ¡Bienvenido!</h2>
      <p>Por favor, selecciona un <strong>titular</strong> en el encabezado para ver su estado financiero.</p>
    </div>
  </div>
);
if (loading) return <div className={styles.loading}>Cargando resumen de {mes}/{anio}...</div>;
if (!data) return <div className={styles.error}>No se pudo cargar la información.</div>;


  return (
    <div className={styles.container}>
      <header className={styles.headerDashboard}>
        <div>
          <h1>Panel de Control</h1>
          <p className={styles.subtitle}>
            Estado financiero para <strong>{mes}/{anio}</strong>
          </p>
        </div>
        <button onClick={handlePrint} className={styles.btnPrint}>
          🖨️ Imprimir Reporte
        </button>
      </header>

      {/* --- WIDGETS DE TOTALES ACTUALIZADOS --- */}
      <section className={styles.widgets}>
        
        {/* 1. MUESTRA EL GASTO TOTAL DEL MES (Inamovible) */}
        <div className={`${styles.card} ${styles.actualCard}`}>
          <span className={styles.cardLabel}>GASTO TOTAL {mes}/{anio}</span>
          <h2 className={styles.monto}>
            ${data.mes_actual.total_comprometido.toLocaleString('es-AR')}
          </h2>
          <small>Todo lo registrado en el mes</small>
        </div>

      {/* 2. LO QUE REALMENTE DEBES HOY (Atrasos + Lo no pagado de este mes) */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>DEUDA TOTAL PENDIENTE</span>
          <h2 className={styles.monto} style={{ color: data.deuda_total_actualizada > 0 ? '#e53e3e' : '#27ae60' }}>
            ${data.deuda_total_actualizada.toLocaleString('es-AR')}
          </h2>
          <small>Lo que te falta pagar para estar al día</small>
        </div>

        {/* 3. TU GASTO REAL YA EJECUTADO */}
        <div className={`${styles.card} ${styles.totalCard}`}>
          <span className={styles.cardLabel}>TOTAL PAGADO</span>
          <h2 className={styles.monto}>
            ${(data.mes_actual.total_comprometido - data.mes_actual.total_pendiente).toLocaleString('es-AR')}
          </h2>
          <small>Dinero que ya salió de tu cuenta</small>
        </div>
      </section>

      <div className={styles.mainGrid}>
        {/* Columna de Atrasados */}
        <section className={styles.column}>
          <h3 className={styles.colTitle}>⚠️ Pendiente Mes {data.mes_vencido.mes}</h3>
          <div className={styles.lista}>
            {Object.entries(data.mes_vencido.detalle).length > 0 ? (
              Object.entries(data.mes_vencido.detalle).map(([nombre, monto]) => (
                <div key={nombre} className={styles.item}>
                  <div className={styles.info}>
                    <strong>{nombre}</strong>
                    <span className={styles.tagVencido}>Atrasado</span>
                  </div>
                  <span className={styles.montoRojo}>${monto.toLocaleString('es-AR')}</span>
                </div>
              ))
            ) : (
              <p className={styles.empty}>Sin deudas de meses pasados.</p>
            )}
          </div>
        </section>

        {/* Columna de Consumos del Mes */}
        <section className={styles.column}>
          <h3 className={styles.colTitle}>🗓️ Detalle de {data.mes_actual.mes}</h3>
          <div className={styles.lista}>
            {Object.entries(data.mes_actual.detalle).length > 0 ? (
              Object.entries(data.mes_actual.detalle).map(([nombre, monto]) => (
                <div key={nombre} className={styles.item}>
                  <div className={styles.info}>
                    <strong>{nombre}</strong>
                    <span className={styles.tagActual}>Consumo</span>
                  </div>
                  <span className={styles.montoNormal}>${monto.toLocaleString('es-AR')}</span>
                </div>
              ))
            ) : (
              <p className={styles.empty}>No hay consumos registrados.</p>
            )}
          </div>
        </section>
      </div>

      {/* Resumen de Participantes */}
      <section className={styles.participantesSection}>
        <h3>👥 Resumen de Participantes (A cobrar)</h3>
        <div className={styles.participantesGrid}>
          {data.deudas_personas && Object.entries(data.deudas_personas).length > 0 ? (
            Object.entries(data.deudas_personas).map(([nombre, monto]) => (
              <div key={nombre} className={styles.personaCard}>
                <p>
                  <strong>{nombre}</strong> te debe 
                  <span className={styles.verde}> ${monto.toLocaleString('es-AR')}</span>
                </p>
              </div>
            ))
          ) : (
            <p className={styles.empty}>Nadie te debe nada actualmente. 🙌</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;