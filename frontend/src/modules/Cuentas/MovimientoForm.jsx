import { useEffect, useState } from "react";
import api from "../../services/api";
import styles from "./Cuenta.module.css";

export default function MovimientoForm({ titularId, onMovimientoCreado }) {
  const [isOpen, setIsOpen] = useState(false);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("egreso");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cuotas, setCuotas] = useState(1);
  
  const [tarjetas, setTarjetas] = useState([]);
  const [personas, setPersonas] = useState([]);
  
  const [tarjetaId, setTarjetaId] = useState("");
  const [tarjetaDestinoId, setTarjetaDestinoId] = useState("");
  const [personaSeleccionada, setPersonaSeleccionada] = useState("");

  // Para saber el tipo de tarjeta seleccionada en tiempo real
  const tarjetaSeleccionadaObj = tarjetas.find(t => t.id === parseInt(tarjetaId));
  const esDebito = tarjetaSeleccionadaObj?.tipo === "debito";

  useEffect(() => {
    // Limpiamos las tarjetas si cambia el titular para evitar seleccionar 
    // una tarjeta del titular anterior por error
    setTarjetas([]); 
    setTarjetaId("");

    if (titularId && isOpen) {
      api.get(`/tarjetas/${titularId}/tarjetas`)
        .then(res => setTarjetas(res.data))
        .catch(console.error);
      
      api.get(`/personas/`)
        .then(res => setPersonas(res.data))
        .catch(console.error);
    }
  }, [titularId, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const participantes = (personaSeleccionada && tipo !== "transferencia")
      ? [{ persona_id: parseInt(personaSeleccionada), monto_asignado: parseFloat(monto) }]
      : [];

    const payload = {
      nombre,
      tipo,
      monto_total: parseFloat(monto),
      titular_id: titularId,
      fecha_inicio: fecha,
      // Si es débito, forzamos 1 cuota aunque haya quedado algo en el estado
      cantidad_cuotas: esDebito || !tarjetaId ? 1 : parseInt(cuotas),
      tarjeta_id: tarjetaId ? parseInt(tarjetaId) : null,
      tarjeta_destino_id: tarjetaDestinoId ? parseInt(tarjetaDestinoId) : null,
      participantes
    };

    try {
      await api.post("/cuentas/", payload);
      onMovimientoCreado();
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error("DETALLE COMPLETO DEL ERROR:", error.response?.data);
      
      // Extraemos el mensaje específico de FastAPI si existe
      const errorDetail = error.response?.data?.detail;
      let mensaje = "Revisa los campos";

      if (Array.isArray(errorDetail)) {
        // Esto toma el primer error de validación (ej: "monto_total: field required")
        mensaje = `${errorDetail[0].loc[1]}: ${errorDetail[0].msg}`;
      }
      
      alert("Error al registrar: " + mensaje);
    }
  };

  const resetForm = () => {
    setNombre("");
    setMonto("");
    setCuotas(1);
    setTarjetaId("");
    setTarjetaDestinoId("");
    setPersonaSeleccionada("");
    setTipo("egreso");
  };

return (
  <>
    <button 
      onClick={() => setIsOpen(true)} 
      className={styles.btnNuevoMovimiento}
      disabled={!titularId} // Bloqueo si no hay titular
      title={!titularId ? "Selecciona un titular arriba para registrar" : ""}
    >
      {titularId ? "+ Nuevo Movimiento" : "⚠️ Selecciona Titular"}
    </button>
      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ borderTop: '5px solid #ff8c00' }}>
            <div className={styles.modalHeader}>
              <h3 style={{ color: '#ff8c00' }}>
                {tipo === "transferencia" ? "Transferencia Propia" : `Registrar ${tipo.toUpperCase()}`}
              </h3>
              <button onClick={() => setIsOpen(false)} className={styles.btnClose}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.formModal}>
              <div className={styles.formGrid}>
                
                <div className={styles.formGroup}>
                  <label>Tipo de Operación</label>
                  <select value={tipo} onChange={(e) => { setTipo(e.target.value); setCuotas(1); }}>
                    <option value="egreso">Gasto (Egreso)</option>
                    <option value="ingreso">Ingreso</option>
                    <option value="transferencia">Transferencia Propia</option>
                    <option value="prestamo">Préstamo</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label>Fecha</label>
                  <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                </div>

                <div className={styles.formGroupFull}>
                  <label>Concepto / Descripción</label>
                  <input type="text" placeholder="Ej: Supermercado, Alquiler..." value={nombre} onChange={(e) => setNombre(e.target.value)} required />
                </div>

                <div className={styles.formGroup}>
                  <label>Monto Total</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={monto} 
                    onChange={(e) => setMonto(e.target.value)} 
                    required 
                    style={{ fontWeight: 'bold', color: '#20b2aa' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>{tipo === "transferencia" ? "Desde (Origen)" : "Medio de Pago"}</label>
                  <select value={tarjetaId} onChange={(e) => setTarjetaId(e.target.value)}>
                    <option value="">💵 Efectivo / Cash</option>
                    {tarjetas.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.tipo === 'debito' ? '🟦' : '🟧'} {t.nombre} ({t.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {tipo === "transferencia" && (
                  <div className={styles.formGroup}>
                    <label>Hacia (Destino)</label>
                    <select value={tarjetaDestinoId} onChange={(e) => setTarjetaDestinoId(e.target.value)} required>
                      <option value="">Seleccionar destino...</option>
                      {tarjetas.map(t => (
                        t.id !== parseInt(tarjetaId) && 
                        <option key={t.id} value={t.id}>💳 {t.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* LOGICA DE CUOTAS DINAMICA */}
                {tarjetaId && tipo === "egreso" && !esDebito && (
                  <div className={styles.formGroup}>
                    <label>Cantidad de Cuotas</label>
                    <input type="number" min="1" max="48" value={cuotas} onChange={(e) => setCuotas(e.target.value)} />
                  </div>
                )}

                {/* AVISO DE PAGO INMEDIATO */}
                {(esDebito || !tarjetaId) && tipo === "egreso" && (
                  <div className={styles.formGroupFull}>
                    <p style={{ color: '#20b2aa', fontSize: '0.85rem', margin: 0 }}>
                      ✓ Este pago se descontará inmediatamente del saldo actual.
                    </p>
                  </div>
                )}

                {tipo !== "transferencia" && (
                  <div className={styles.formGroup}>
                    <label>¿Quién participa?</label>
                    <select value={personaSeleccionada} onChange={(e) => setPersonaSeleccionada(e.target.value)}>
                      <option value="">Solo yo</option>
                      {personas.filter(p => p.id !== titularId).map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} {p.apellido}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <button type="submit" className={styles.btnGuardar} style={{ backgroundColor: '#ff8c00' }}>
                {tipo === "transferencia" ? "Confirmar Transferencia" : "Guardar Movimiento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}