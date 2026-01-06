import { useEffect, useState } from "react";
import api from "../../services/api";
import styles from "./Cuenta.module.css";

// 1. Agregamos onBalanceLoad a las props
export default function BalanceCard({ titularId, refreshKey, filtros, onBalanceLoad }) {
  const [balance, setBalance] = useState({
    total_ingresos: 0,
    total_egresos: 0,
    saldo_en_mano: 0,
    deudas_pendientes: 0,
    total_comprometido_mes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (titularId) {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtros?.mes) params.append("mes", filtros.mes);
      if (filtros?.anio) params.append("anio", filtros.anio);

      api.get(`/finanzas/balance/${titularId}?${params.toString()}`)
        .then(res => {
          setBalance(res.data);
          setLoading(false);
          
          // 2. Ejecutamos la función para avisarle al padre el nuevo monto
          if (onBalanceLoad) {
            onBalanceLoad(res.data);
          }
        })
        .catch(err => {
          console.error("Error cargando balance:", err);
          setLoading(false);
        });
    }
  }, [titularId, refreshKey, filtros, onBalanceLoad]); // 3. Agregamos onBalanceLoad a las dependencias

  if (loading && balance.total_ingresos === 0) return <p>Calculando saldos...</p>;

  return (
    <div className={styles.balanceGrid}>
      <div className={`${styles.statCard} ${styles.ingreso}`}>
        <span>Ingresos</span>
        <h3>${balance.total_ingresos?.toLocaleString() || 0}</h3>
      </div>
      
      <div className={`${styles.statCard} ${styles.egreso}`}>
        <span>Pagado</span>
        <h3>${balance.total_egresos?.toLocaleString() || 0}</h3>
      </div>
      
      <div className={`${styles.statCard} ${styles.total}`}>
        <span>En Mano</span>
        <h3 className={balance.saldo_en_mano >= 0 ? styles.positivo : styles.negativo}>
          ${balance.saldo_en_mano?.toLocaleString() || 0}
        </h3>
      </div>

      <div className={`${styles.statCard} ${styles.deuda}`}>
        <span>A Vencer</span>
        <h3>${balance.deudas_pendientes?.toLocaleString() || 0}</h3>
      </div>
    </div>
  );
}