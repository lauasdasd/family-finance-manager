import { useEffect, useState } from "react";
import api from "../../services/api";
import Card from "../../components/Card/Card";
import Modal from "../../components/Modal/Modal";
import TarjetasList from "../../components/Modal/TarjetasList";
import CuentasList from "../../components/Modal/CuentasList";
import styles from "./Persona.module.css";

export default function PersonaList({ onEditar }) {
  const [personas, setPersonas] = useState([]);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);
  const [modalTipo, setModalTipo] = useState(null); // "tarjetas" | "cuentas"

  const cargarPersonas = async () => {
    try {
      const res = await api.get("/personas/");
      setPersonas(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarPersonas();
  }, []);

  const desactivar = async (id) => {
    try {
      await api.patch(`/personas/${id}/desactivar`);
      setPersonas(prev =>
        prev.map(p =>
          p.id === id ? { ...p, activo: false } : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const activar = async (id) => {
    try {
      await api.patch(`/personas/${id}/activar`);
      setPersonas(prev =>
        prev.map(p =>
          p.id === id ? { ...p, activo: true } : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const verTarjetas = (persona) => {
    setPersonaSeleccionada(persona);
    setModalTipo("tarjetas");
  };

  const verCuentas = (persona) => {
    setPersonaSeleccionada(persona);
    setModalTipo("cuentas");
  };

  const cerrarModal = () => {
    setPersonaSeleccionada(null);
    setModalTipo(null);
  };

  return (
    <>
      <div className={styles.list}>
        {personas.map((p) => (
          <Card key={p.id}>
            <div className={styles.info}>
              <span className={styles.nombre}>{p.nombre}</span>
              <span className={styles.tipo}>{p.tipo}</span>
              <span
                className={`${styles.estado} ${
                  p.activo ? styles.activo : styles.inactivo
                }`}
              >
                {p.activo ? "Activa" : "Inactiva"}
              </span>
            </div>

            <div className={styles.btnGroup}>
              <button
                className={`${styles.btn} ${styles.editBtn}`}
                onClick={() => onEditar(p)}
              >
                Editar
              </button>

              {p.activo ? (
                <button
                  className={`${styles.btn} ${styles.toggleBtn}`}
                  onClick={() => desactivar(p.id)}
                >
                  Desactivar
                </button>
              ) : (
                <button
                  className={`${styles.btn} ${styles.toggleBtn}`}
                  onClick={() => activar(p.id)}
                >
                  Activar
                </button>
              )}

              <button
                className={styles.infoBtn}
                onClick={() => verTarjetas(p)}
              >
                💳 Tarjetas
              </button>

              <button
                className={styles.infoBtn}
                onClick={() => verCuentas(p)}
              >
                🏦 Cuentas
              </button>
            </div>
          </Card>
        ))}
      </div>

      {personaSeleccionada && modalTipo && (
        <Modal
          title={
            modalTipo === "tarjetas"
              ? `Tarjetas de ${personaSeleccionada.nombre}`
              : `Cuentas de ${personaSeleccionada.nombre}`
          }
          onClose={cerrarModal}
        >
          {modalTipo === "tarjetas" ? (
            <TarjetasList personaId={personaSeleccionada.id} />
          ) : (
            <CuentasList personaId={personaSeleccionada.id} />
          )}
        </Modal>
      )}
    </>
  );
}
