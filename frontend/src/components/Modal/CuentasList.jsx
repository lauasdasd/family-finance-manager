import { useEffect, useState } from "react";
import api from "../../services/api";
import styles from "../../modules/Personas/Persona.module.css"; // Usaremos el mismo archivo de estilos para coherencia

export default function CuentasList({ personaId }) {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarCuentas = async () => {
      try {
        // Ajusta esta URL según tu API (ej: /personas/1/cuentas/)
        const res = await api.get(`/personas/${personaId}/cuentas/`);
        setCuentas(res.data);
      } catch (err) {
        console.error("Error al cargar cuentas:", err);
      } finally {
        setLoading(false);
      }
    };
    cargarCuentas();
  }, [personaId]);

  if (loading) return <p className={styles.loadingModal}>Cargando detalle...</p>;

  return (
    <div className={styles.cuentasDetalle}>
      {cuentas.length > 0 ? (
        <table className={styles.tablaDetalle}>
          <thead>
            <tr>
              <th>Entidad</th>
              <th>Tipo</th>
              <th className={styles.textRight}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {cuentas.map((c) => (
              <tr key={c.id}>
                <td className={styles.bancoNombreTable}>{c.banco_nombre || "General"}</td>
                <td>
                  <span className={c.tipo === "ingreso" ? styles.badgeIngreso : styles.badgeGasto}>
                    {c.tipo}
                  </span>
                </td>
                <td className={`${styles.montoTable} ${styles.textRight}`}>
                  ${Number(c.monto).toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className={styles.emptyModal}>Esta persona no tiene cuentas asociadas.</p>
      )}
    </div>
  );
}