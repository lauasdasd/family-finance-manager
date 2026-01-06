// src/modules/tarjetas/TarjetaForm.jsx
import { useState, useEffect } from "react";
import api from "../../services/api";
import styles from "./Tarjetas.module.css";

export default function TarjetaForm({ onTarjetaCreada }) {
  const [bancos, setBancos] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [formData, setFormData] = useState({
    nombre: "",
    banco_id: "",
    persona_id: "",
    tipo: "credito",
    dia_cierre: "",
    dia_vencimiento: "",
    limite_credito: ""
  });

  useEffect(() => {
    api.get("/bancos/").then(res => setBancos(res.data));
    api.get("/personas/").then(res => setPersonas(res.data));
  }, []);

    const handleSubmit = async (e) => {
    e.preventDefault();
    
    const payload = {
        nombre: formData.nombre,
        banco_id: parseInt(formData.banco_id),
        persona_id: parseInt(formData.persona_id),
        tipo: formData.tipo,
        // Si es crédito, mandamos el número, si es débito mandamos null
        dia_cierre: formData.tipo === "credito" ? parseInt(formData.dia_cierre) : null,
        dia_vencimiento: formData.tipo === "credito" ? parseInt(formData.dia_vencimiento) : null,
        limite_credito: formData.limite_credito ? parseFloat(formData.limite_credito) : 0,
    };

    try {
        await api.post("/tarjetas/", payload);
        onTarjetaCreada();
        // Limpiar el form...
    } catch (error) {
        console.error("Detalle del error:", error.response?.data?.detail);
    }
    };
  return (
    <div className={styles.cardForm}>
      <h3>Nueva Tarjeta</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Nombre del Plástico</label>
          <input 
            className={styles.input}
            placeholder="Ej: Visa Naranja" 
            value={formData.nombre}
            onChange={e => setFormData({...formData, nombre: e.target.value})}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>Banco Emisor</label>
          <select 
            className={styles.select}
            value={formData.banco_id}
            onChange={e => setFormData({...formData, banco_id: e.target.value})} 
            required
          >
            <option value="">Seleccionar Banco</option>
            {bancos.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Titular</label>
          <select 
            className={styles.select}
            value={formData.persona_id}
            onChange={e => setFormData({...formData, persona_id: e.target.value})} 
            required
          >
            <option value="">Seleccionar Persona</option>
            {personas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>

        <div className={styles.formGroup}>
          <label>Tipo de Cuenta</label>
          <select 
            className={styles.select}
            value={formData.tipo} 
            onChange={e => setFormData({...formData, tipo: e.target.value})}
          >
            <option value="credito">Tarjeta de Crédito</option>
            <option value="debito">Tarjeta de Débito</option>
          </select>
        </div>

        {formData.tipo === "credito" && (
          <div className={styles.adminGrid} style={{gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px'}}>
            <div className={styles.formGroup}>
              <label>Día Cierre</label>
              <input 
                className={styles.input}
                type="number" placeholder="25" min="1" max="31"
                value={formData.dia_cierre}
                onChange={e => setFormData({...formData, dia_cierre: e.target.value})} 
              />
            </div>
            <div className={styles.formGroup}>
              <label>Día Vence</label>
              <input 
                className={styles.input}
                type="number" placeholder="10" min="1" max="31"
                value={formData.dia_vencimiento}
                onChange={e => setFormData({...formData, dia_vencimiento: e.target.value})} 
              />
            </div>
          </div>
        )}

        <button type="submit" className={styles.btnSubmit}>
          Registrar Tarjeta
        </button>
      </form>
    </div>
  );
}