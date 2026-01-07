import React, { useEffect, useState } from 'react';
import api from '../../services/api'; 
import styles from './Dashboard.module.css';

const Dashboard = ({ mes, anio, titularId }) => { 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!titularId) {
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await api.get(`/resumen/dashboard/maestro`, {
          params: { mes, anio, persona_id: titularId }
        });
        setData(res.data);
      } catch (err) {
        console.error("Error cargando dashboard", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboard();
  }, [mes, anio, titularId]); 

  const handlePrint = async () => {
    try {
      const res = await api.get(`/resumen/extracto-impresion`, {
        params: { mes, anio, persona_id: titularId }
      });
      const dataPrint = res.data;

      const ventimp = window.open('', '_blank');

      // CORRECCIÓN: Usamos el tipo para determinar el signo visual en el PDF
      const filas = dataPrint.movimientos.map(m => {
        const esIngreso = m.tipo === 'ingreso';
        return `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">${m.fecha}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-weight: bold; color: #2d3748;">${m.concepto}</div>
              <div style="font-size: 11px; color: #718096;">${m.info || ''}</div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-family: 'Courier New', monospace; font-weight: bold;">
              <span style="color: ${esIngreso ? '#38a169' : '#e53e3e'}">
                ${esIngreso ? '+' : '-'}$${m.monto.toLocaleString('es-AR')}
              </span>
            </td>
          </tr>
        `;
      }).join('');

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
                <span>Balance Neto</span>
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
                <span>Balance del Período:</span>
                <span>$${dataPrint.resumen.balance_neto.toLocaleString('es-AR')}</span>
              </div>
              <div class="total-line total-main">
                <span>SALDO FINAL:</span>
                <span>$${dataPrint.resumen.balance_neto.toLocaleString('es-AR')}</span>
              </div>
            </div>
            <div class="legal">Generado automáticamente por Family Finance Manager v2.6</div>
          </body>
        </html>
      `);

      ventimp.document.close();
      setTimeout(() => { ventimp.print(); ventimp.close(); }, 600);

    } catch (err) {
      console.error("Error al generar el extracto:", err);
      alert("Error al obtener datos.");
    }
  };

  if (!titularId) return (
    <div className={styles.container}>
      <div className={styles.emptyState}>
        <h2>👋 ¡Bienvenido!</h2>
        <p>Selecciona un <strong>titular</strong> para ver su estado financiero.</p>
      </div>
    </div>
  );

  if (loading) return <div className={styles.loading}>Cargando resumen de {mes}/{anio}...</div>;
  if (!data) return <div className={styles.error}>Error al cargar información.</div>;

  return (
    <div className={styles.container}>
      <header className={styles.headerDashboard}>
        <div>
          <h1>Panel de Control</h1>
          <p className={styles.subtitle}>Estado financiero para <strong>{mes}/{anio}</strong></p>
        </div>
        <button onClick={handlePrint} className={styles.btnPrint}>🖨️ Imprimir Reporte</button>
      </header>

      <section className={styles.widgets}>
        {/* BALANCE NETO (Ingresos - Gastos) */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>BALANCE NETO MES</span>
          <h2 className={styles.monto} style={{ color: data.mes_actual.total_comprometido >= 0 ? '#27ae60' : '#e53e3e' }}>
            ${data.mes_actual.total_comprometido.toLocaleString('es-AR')}
          </h2>
          <small>Ingresos menos Gastos del mes</small>
        </div>

        {/* DEUDA PENDIENTE (Suma de montos negativos no pagados) */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>DEUDA PENDIENTE TOTAL</span>
          <h2 className={styles.monto} style={{ color: data.deuda_total_actualizada < 0 ? '#e53e3e' : '#27ae60' }}>
            ${Math.abs(data.deuda_total_actualizada).toLocaleString('es-AR')}
          </h2>
          <small>Total a pagar para estar al día</small>
        </div>

        {/* SALDO YA PAGADO */}
        <div className={styles.card}>
          <span className={styles.cardLabel}>GASTOS YA PAGADOS</span>
          <h2 className={styles.monto}>
            ${Math.abs(data.mes_actual.total_comprometido - data.mes_actual.total_pendiente).toLocaleString('es-AR')}
          </h2>
          <small>Dinero ejecutado este mes</small>
        </div>
      </section>

      <div className={styles.mainGrid}>
        {/* Listado de Mes Pasado */}
        <section className={styles.column}>
          <h3 className={styles.colTitle}>⚠️ Pendiente {data.mes_vencido.mes}</h3>
          <div className={styles.lista}>
            {Object.entries(data.mes_vencido.detalle).map(([nombre, monto]) => (
              <div key={nombre} className={styles.item}>
                <div className={styles.info}>
                  <strong>{nombre}</strong>
                  <span className={styles.tagVencido}>Mes Anterior</span>
                </div>
                {/* Lógica de color: si el monto es negativo es una deuda, si es positivo es un saldo a favor */}
                <span className={monto < 0 ? styles.montoRojo : styles.montoVerde}>
                  {monto < 0 ? '-' : '+'}${Math.abs(monto).toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Listado de Mes Actual */}
        <section className={styles.column}>
          <h3 className={styles.colTitle}>🗓️ Detalle de {data.mes_actual.mes}</h3>
          <div className={styles.lista}>
            {Object.entries(data.mes_actual.detalle).map(([nombre, monto]) => (
              <div key={nombre} className={styles.item}>
                <div className={styles.info}>
                  <strong>{nombre}</strong>
                  <span className={styles.tagActual}>Estado</span>
                </div>
                <span className={monto < 0 ? styles.montoRojo : styles.montoVerde}>
                  {monto < 0 ? '-' : '+'}${Math.abs(monto).toLocaleString('es-AR')}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Participantes */}
      <section className={styles.participantesSection}>
        <h3>👥 A cobrar a Participantes</h3>
        <div className={styles.participantesGrid}>
          {Object.entries(data.deudas_personas).length > 0 ? (
            Object.entries(data.deudas_personas).map(([nombre, monto]) => (
              <div key={nombre} className={styles.personaCard}>
                <p><strong>{nombre}</strong> debe <span className={styles.verde}>${monto.toLocaleString('es-AR')}</span></p>
              </div>
            ))
          ) : (
            <p className={styles.empty}>Sin saldos pendientes de cobro.</p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;