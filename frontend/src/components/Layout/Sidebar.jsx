import { Link, useLocation } from "react-router-dom";
import styles from "./Layout.module.css";
import logoFFM from "../../../../Logo.png"; 

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoWrapper}>
          <img src={logoFFM} alt="Family Finance Logo" className={styles.logoImage} />
        </div>
      </div>

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {/* ... tus links se mantienen igual ... */}
          <li>
            <Link to="/" className={location.pathname === "/" ? styles.active : ""}>
              <span className={styles.icon}>🏠</span> Dashboard
            </Link>
          </li>
          <li>
            <Link to="/personas" className={location.pathname === "/personas" ? styles.active : ""}>
              <span className={styles.icon}>👥</span> Personas
            </Link>
          </li>
          <li>
            <Link to="/bancos" className={location.pathname === "/bancos" ? styles.active : ""}>
              <span className={styles.icon}>🏦</span> Bancos
            </Link>
          </li>
          <li>
            <Link to="/tarjetas" className={location.pathname === "/tarjetas" ? styles.active : ""}>
              <span className={styles.icon}>💳</span> Tarjetas
            </Link>
          </li>
          <li>
            <Link to="/cuentas" className={location.pathname === "/cuentas" ? styles.active : ""}>
              <span className={styles.icon}>💰</span> Cuentas
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}