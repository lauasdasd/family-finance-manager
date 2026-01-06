import PersonaForm from "../modules/Personas/PersonaForm";
import PersonaList from "../modules/Personas/PersonaList";
import { useState } from "react";
// Opcional: import { useFiltros } from "../context/FiltroContext"; 

export default function Personas() {
  const [actualizarLista, setActualizarLista] = useState(0);
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null);

  const handleAgregar = () => setActualizarLista(actualizarLista + 1);
  const handleActualizar = () => {
    setActualizarLista(actualizarLista + 1);
    setPersonaSeleccionada(null); 
  };
  const handleCancelar = () => setPersonaSeleccionada(null);

  return (
    // Quitamos <Layout> porque ya envuelve a las rutas en App.jsx
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px", color: "#333" }}>
        Gestión de <span style={{ color: "#ff8c00" }}>Personas</span>
      </h2>
      
      <PersonaForm
        persona={personaSeleccionada}
        onAgregar={handleAgregar}
        onActualizar={handleActualizar}
        onCancelar={handleCancelar}
      />

      <div style={{ marginTop: "30px" }}>
        <PersonaList
          key={actualizarLista}
          onEditar={(p) => setPersonaSeleccionada(p)}
        />
      </div>
    </div>
  );
}