// src/modules/tarjetas/TarjetaList.jsx
import api from "../../services/api";
import styles from "./Tarjetas.module.css";

export default function TarjetasList({ tarjetas, onUpdate }) {
  const handleEliminar = async (id) => {
    if (window.confirm("¿Seguro que quieres desactivar esta tarjeta? No se perderán los gastos asociados.")) {
      try {
        await api.delete(`/tarjetas/${id}`);
        onUpdate();
      } catch (error) {
        console.error("Error al desactivar tarjeta", error);
      }
    }
  };

  return (
    <div className={styles.cardList}>
      <h3>Tarjetas Registradas</h3>
      
      {tarjetas.length === 0 ? (
        <p style={{ color: '#666', textAlign: 'center' }}>No hay tarjetas activas.</p>
      ) : (
        <div className={styles.listContainer}>
          {tarjetas.map((t) => (
            <div key={t.id} className={styles.item}>
              <div className={styles.itemInfo}>
                <b>{t.nombre}</b>
                <span>
                  {t.banco?.nombre || "Sin Banco"} • {t.persona?.nombre || "Sin Titular"}
                  <span className={`${styles.tag} ${t.tipo === 'credito' ? styles.tagCredito : styles.tagDebito}`}>
                    {t.tipo}
                  </span>
                </span>
                
                {t.tipo === 'credito' && (
                  <div style={{ fontSize: '0.75rem', marginTop: '4px', color: '#999' }}>
                    Cierra: día {t.dia_cierre} • Vence: día {t.dia_vencimiento}
                  </div>
                )}
              </div>
              
              <div className={styles.listActions}>
                <button 
                  onClick={() => handleEliminar(t.id)} 
                  className={styles.btnDelete}
                  title="Desactivar tarjeta"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}