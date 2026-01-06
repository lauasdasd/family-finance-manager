import { useFiltros } from "../Context/FiltroContext"; // 1. Importamos el hook
import BancoForm from "../modules/Bancos/BancoForm";
import BancoList from "../modules/Bancos/BancoList";
import { useState } from "react";
import styles from "../modules/Bancos/Banco.module.css";

export default function BancoPage() {
  const [updateFlag, setUpdateFlag] = useState(false);
  const { filtros } = useFiltros(); // 2. Obtenemos mes y anio globales

  const handleBancoCreado = () => setUpdateFlag(!updateFlag);

  return (
    // 3. QUITAMOS <Layout>, el contenido se renderiza directo
    <div className={styles.container}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          Gestión de <span className={styles.highlight}>Bancos</span>
        </h2>
        <p className={styles.subtitle}>
          Configura las entidades bancarias ({filtros.mes}/{filtros.anio})
        </p>
      </header>

      <div className={styles.contentGrid}>
        <aside className={styles.sidebar}>
          <div className={styles.cardForm}>
            <h3 className={styles.cardTitle}>Añadir Entidad</h3>
            <BancoForm onBancoCreado={handleBancoCreado} />
          </div>
        </aside>

        <main className={styles.mainContent}>
          {/* 4. Si BancoList necesitara filtrar por mes, le pasarías los filtros aquí */}
          <BancoList key={`${updateFlag}-${filtros.mes}-${filtros.anio}`} />
        </main>
      </div>
    </div>
  );
}