import styles from "./Banco.module.css";

export default function Banco({ banco, onDelete }) {
  return (
    <div className={styles.bancoCardCompact}>
      <div className={styles.bancoInfo}>
        <h4 className={styles.bancoNombre}>{banco.nombre}</h4>
        <span className={styles.bancoTipo}>{banco.tipo}</span>
      </div>
      
      <button 
        className={styles.btnDelete} 
        onClick={() => onDelete(banco.id)}
        title="Eliminar entidad"
      >
        &times;
      </button>
    </div>
  );
}