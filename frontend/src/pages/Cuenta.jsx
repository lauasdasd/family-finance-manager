import { useState, useEffect } from "react";
import { useFiltros } from "../Context/FiltroContext"; // 1. Importamos el contexto
import MovimientoForm from "../modules/Cuentas/MovimientoForm";
import MovimientoList from "../modules/Cuentas/MovimientoList";
import BalanceCard from "../modules/Cuentas/BalanceCard";
import api from "../services/api"; 
import styles from "../modules/Cuentas/Cuenta.module.css";

export default function CuentasPage() {
// 1. Extraemos titularId del contexto global en lugar de fijarlo en 1
    const { filtros: filtrosGlobales } = useFiltros(); 
    const { titularId } = filtrosGlobales; // <--- Dinámico

    const [personas, setPersonas] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    const [montoPendiente, setMontoPendiente] = useState(0);

    const [filtrosLocales, setFiltrosLocales] = useState({
        tipo: "",
        persona_id: ""
    });
    const [montoTotalMes, setMontoTotalMes] = useState(0); // Estado para el compromiso total
    // Combinamos los globales (Header) con los locales (Sidebar) para las peticiones
    const filtrosCompletos = {
        ...filtrosGlobales,
        ...filtrosLocales
    };

    useEffect(() => {
        api.get('/personas/')
           .then(res => setPersonas(res.data))
           .catch(console.error);
    }, []);

    const handleChangeLocal = (e) => {
        setFiltrosLocales({
            ...filtrosLocales,
            [e.target.name]: e.target.value
        });
    };

    const handleMovimientoCreado = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
    // 4. QUITAMOS <Layout> (ya viene de App.jsx)
    <div className={styles.container}>
          {/* HEADER CON TÍTULO Y MONTO PENDIENTE */}
          <div className={styles.headerTitleRow}>
            <h1>Gestión de Cuentas y Movimientos</h1>
            <div className={styles.totalPagarBadge}>
                <span className={styles.totalPagarLabel}>Total del mes:</span>
                <span className={styles.totalPagarMonto}>
                    ${montoPendiente?.toLocaleString('es-AR')}
                </span>
            </div>
          </div>
          
          <section style={{ marginBottom: "2rem" }}>
            <BalanceCard 
              titularId={titularId} 
              refreshKey={refreshKey} 
              filtros={filtrosCompletos}
              // --- PASAMOS LA FUNCIÓN PARA ACTUALIZAR EL MONTO ---
              onBalanceLoad={(data) => setMontoPendiente(data.total_comprometido_mes)}
            />
          </section>
      <section className={styles.sectionCard} style={{ marginBottom: "2rem" }}>
        <h3>Registrar Nuevo Movimiento</h3>
        <p className={styles.subtitle}>Ingresos, gastos o préstamos</p>
        <MovimientoForm 
          titularId={titularId} 
          onMovimientoCreado={handleMovimientoCreado} 
        />
      </section>

      <div className={styles.historyLayout}>
        <aside className={styles.filterSidebar}>
          <div className={styles.sectionCard}>
            <h3>Filtros</h3>
            
            {/* HEMOS QUITADO MES Y AÑO DE AQUÍ PORQUE YA ESTÁN EN EL HEADER */}
            
            <div className={styles.filterGroup}>
              <label>Tipo</label>
              <select name="tipo" value={filtrosLocales.tipo} onChange={handleChangeLocal}>
                <option value="">Todos</option>
                <option value="ingreso">Ingresos</option>
                <option value="egreso">Egresos</option>
                <option value="transferencia">Transferencias</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Participante</label>
              <select name="persona_id" value={filtrosLocales.persona_id} onChange={handleChangeLocal}>
                <option value="">Todos</option>
                {personas.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        <main className={styles.listContent}>
          <div className={styles.sectionCard}>
            <h3>Historial de Movimientos</h3>
            <MovimientoList 
              titularId={titularId} 
              filtros={filtrosCompletos} 
              refreshKey={refreshKey} 
            />
          </div>
        </main>
      </div>
    </div>
    );
}