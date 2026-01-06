import { useState, useEffect } from "react";
import api from "../../services/api";
import Banco from "./Banco";
import styles from "./Banco.module.css";

export default function BancoList() {
  const [bancos, setBancos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/bancos/")
      .then(res => {
        setBancos(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const eliminar = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este banco?")) {
      await api.delete(`/bancos/${id}`);
      setBancos(bancos.filter(b => b.id !== id));
    }
  };

  if (loading) return <p className={styles.loading}>Cargando entidades...</p>;

  return (
    <div className={styles.bancosGrid}>
      {bancos.length > 0 ? (
        bancos.map(banco => (
          <Banco key={banco.id} banco={banco} onDelete={eliminar} />
        ))
      ) : (
        <div className={styles.emptyState}>
          <p>No hay bancos registrados aún.</p>
        </div>
      )}
    </div>
  );
}