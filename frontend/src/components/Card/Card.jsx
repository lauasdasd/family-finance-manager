import styles from "./Card.module.css";

export default function Card({ title, subtitle, children }) {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      <div>{children}</div>
    </div>
  );
}
