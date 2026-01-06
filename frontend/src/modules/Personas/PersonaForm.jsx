import { useState, useEffect } from "react";
import api from "../../services/api";
import styles from "./Persona.module.css";

export default function PersonaForm({ persona, onAgregar, onActualizar, onCancelar }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    if (persona) {
      setNombre(persona.nombre);
      setTipo(persona.tipo);
    } else {
      setNombre("");
      setTipo("");
    }
  }, [persona]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (persona) {
        // Actualizar persona existente
        const res = await api.put(`/personas/${persona.id}`, { nombre, tipo });
        if (onActualizar) onActualizar(res.data);
      } else {
        // Agregar nueva persona
        const res = await api.post("/personas/", { nombre, tipo });
        if (onAgregar) onAgregar(res.data);
      }
      // Limpiar formulario
      setNombre("");
      setTipo("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
  <form className={styles.form} onSubmit={handleSubmit}>
    <div className={styles.formHeader}>
      <h3>{persona ? "Editar persona" : "Nueva persona"}</h3>
      {persona && (
        <span className={styles.editBadge}>Editando</span>
      )}
    </div>

    <div className={styles.fields}>
      <div className={styles.field}>
        <label>Nombre</label>
        <input
          placeholder="Nombre completo"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
        />
      </div>

      <div className={styles.field}>
        <label>Tipo</label>
        <input
          placeholder="Ej: Titular, Hijo, Madre"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          required
        />
      </div>
    </div>

    <div className={styles.actions}>
      <button className={styles.submitBtn} type="submit">
        {persona ? "Guardar cambios" : "Agregar persona"}
      </button>

      {persona && onCancelar && (
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={onCancelar}
        >
          Cancelar
        </button>
      )}
    </div>
  </form>
  );
}
