import { useState, useEffect } from "react";
import { useFiltros } from "../Context/FiltroContext"; // 1. Importamos el contexto global
import api from "../services/api";
import TarjetaForm from "../modules/Tarjetas/TarjetaForm";
import TarjetasList from "../modules/Tarjetas/TarjetasList";
import GestionarTarjetas from "../modules/Tarjetas/GestionarTarjetas"; 
import styles from "../modules/Tarjetas/Tarjetas.module.css";
export default function TarjetasPage() {
  const [tarjetas, setTarjetas] = useState([]);
  const [refresh, setRefresh] = useState(false);
  
  // Obtenemos titularId, mes y anio del contexto global
  const { filtros: filtrosGlobales } = useFiltros(); 
  const { titularId } = filtrosGlobales;

  const cargarTarjetas = () => {
    // Si no hay titular seleccionado, podrías traer todas o ninguna
    // Pero lo ideal es usar el endpoint filtrado:
    const url = titularId 
      ? `/tarjetas/${titularId}/tarjetas` 
      : "/tarjetas/"; // fallback por si acaso

    api.get(url)
      .then(res => setTarjetas(res.data))
      .catch(console.error);
  };

  // IMPORTANTE: Ahora el useEffect también "escucha" al titularId
  useEffect(() => {
    cargarTarjetas();
  }, [refresh, titularId]); // <--- Si cambias el titular en el Header, se recarga la lista

  const handleUpdate = () => setRefresh(!refresh);

  return (
    <div className={styles.container}>
      <h2>Panel de Tarjetas</h2>
      
      {/* Mostramos un aviso si no hay titular seleccionado */}
      {!titularId && (
        <div className={styles.warning}>⚠️ Selecciona un titular en el encabezado para gestionar sus tarjetas.</div>
      )}

      <section className={styles.section}>
        <GestionarTarjetas 
          tarjetas={tarjetas} 
          refreshKey={refresh} 
          filtros={filtrosGlobales} 
        />
      </section>

      <div className={styles.adminGrid}>
        <section>
          {/* Le pasamos el titularId al formulario para que sepa a quién pertenece la nueva tarjeta */}
          <TarjetaForm onTarjetaCreada={handleUpdate} titularId={titularId} />
        </section>

        <section>
          <TarjetasList tarjetas={tarjetas} onUpdate={handleUpdate} />
        </section>
      </div>
    </div>
  );
}