import { useEffect, useState } from "react"; // 1. Agregamos hooks
import { useFiltros } from "../../context/FiltroContext";
import api from "../../services/api";
import styles from "./Layout.module.css";

export default function Header() {
  const { filtros, actualizarFiltros } = useFiltros();
  const [personas, setPersonas] = useState([]); // Estado para la lista de titulares

  // 3. Cargamos las personas del backend al montar el componente
  useEffect(() => {
    const cargarPersonas = async () => {
      try {
        const res = await api.get("/personas/"); // Ajusta la ruta según tu backend
        setPersonas(res.data);
      } catch (err) {
        console.error("Error al cargar personas", err);
      }
    };
    cargarPersonas();
  }, []);

  const handleSelectorChange = (e) => {
    const { name, value } = e.target;
    // Usamos parseInt porque el ID es numérico
    actualizarFiltros({ [name]: value ? parseInt(value) : null });
  };

  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const anioActual = new Date().getFullYear();
  const anios = [anioActual - 1, anioActual, anioActual + 1];

  return (
    <header className={styles.header}>
      <div className={styles.brandTitle}>
        Family<span>Finance</span>
      </div>

      <div className={styles.filtrosGlobales}>
        {/* 4. NUEVO SELECTOR DE TITULAR */}
        <select 
          name="titularId" 
          value={filtros.titularId || ""} 
          onChange={handleSelectorChange}
          className={styles.selectorHeader}
          style={{ fontWeight: 'bold', color: '#007bff' }} // Un toque de color para diferenciarlo
        >
          <option value="">Seleccionar Titular...</option>
          {personas.map(p => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>

        <select 
          name="mes" 
          value={filtros.mes} 
          onChange={handleSelectorChange}
          className={styles.selectorHeader}
        >
          {meses.map((mes, index) => (
            <option key={index + 1} value={index + 1}>
              {mes}
            </option>
          ))}
        </select>

        <select 
          name="anio" 
          value={filtros.anio} 
          onChange={handleSelectorChange}
          className={styles.selectorHeader}
        >
          {anios.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <div className={styles.rightSpacer}></div>
    </header>
  );
}