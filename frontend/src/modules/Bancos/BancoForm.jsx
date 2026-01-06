import { useState } from "react";
import api from "../../services/api";
import styles from "./Banco.module.css";

export default function BancoForm({ onBancoCreado }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [saldo, setSaldo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const nuevoBanco = { nombre, tipo, saldo: parseFloat(saldo) };
      const res = await api.post("/bancos/", nuevoBanco);
      onBancoCreado(res.data);
      setNombre("");
      setTipo("");
      setSaldo("");
    } catch (error) {
      console.error("Error al crear banco:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formCard}>
      <div className={styles.inputGroup}>
        <label className={styles.label}>Nombre de la Entidad</label>
        <input
          type="text"
          className={styles.input}
          placeholder="Ej: Banco Galicia"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Tipo de Cuenta</label>
        <input
          type="text"
          className={styles.input}
          placeholder="Ej: Cuenta Corriente, Caja Ahorro"
          value={tipo}
          onChange={e => setTipo(e.target.value)}
          required
        />
      </div>

      <div className={styles.inputGroup}>
        <label className={styles.label}>Saldo Inicial</label>
        <div className={styles.montoWrapper}>
          <span className={styles.currencySymbol}>$</span>
          <input
            type="number"
            className={styles.inputMonto}
            placeholder="0.00"
            value={saldo}
            onChange={e => setSaldo(e.target.value)}
            required
          />
        </div>
      </div>

      <button type="submit" className={styles.btnSubmit}>
        Agregar Banco
      </button>
    </form>
  );
}