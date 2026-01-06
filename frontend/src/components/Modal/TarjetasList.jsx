import { useEffect, useState } from "react";
import api from "../../services/api";
import styles from "./Tarjetas.module.css";

export default function TarjetasList({ personaId }) {
  const [tarjetas, setTarjetas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!personaId) return;

    setLoading(true);

    api
      .get(`/tarjetas/${personaId}/tarjetas`)
      .then(res => setTarjetas(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));

  }, [personaId]);

  if (loading) return <p>Cargando tarjetas...</p>;

  if (tarjetas.length === 0) {
    return <p>No tiene tarjetas registradas</p>;
  }

  return (
    <div className={styles.list}>
      {tarjetas.map(t => (
        <div key={t.id} className={`${styles.card} ${!t.activo ? styles.inactiva : ''}`}>
          <div className={styles.header}>
            {/* CAMBIO AQUÍ: Accedemos a .nombre porque ahora es un objeto */}
            <span className={styles.banco}>{t.banco.nombre}</span> 
            {!t.activo && <span className={styles.badge}>Inactiva</span>}
          </div>

          <div className={styles.body}>
            <span className={styles.nombre}>{t.nombre}</span>
            
            {/* OPCIONAL: Mostrar el dueño si lo necesitas */}
            <small className={styles.titular}>Titular: {t.persona.nombre}</small>

            {t.limite && (
              <span className={styles.limite}>
                Límite: ${t.limite.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}