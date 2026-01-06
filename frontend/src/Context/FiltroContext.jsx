import { createContext, useState, useContext, useEffect } from "react";

const FiltroContext = createContext();

export const FiltroProvider = ({ children }) => {
  const [filtros, setFiltros] = useState({
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear(),
    // Intentamos cargar el titular desde el storage, si no existe ponemos null o 1
    titularId: localStorage.getItem("titularId") 
               ? parseInt(localStorage.getItem("titularId")) 
               : null, 
  });

  const actualizarFiltros = (nuevosFiltros) => {
    setFiltros((prev) => {
      const actualizado = { ...prev, ...nuevosFiltros };
      
      // Si en el cambio viene un nuevo titularId, lo guardamos en el navegador
      if (nuevosFiltros.titularId) {
        localStorage.setItem("titularId", nuevosFiltros.titularId);
      }
      
      return actualizado;
    });
  };

  return (
    <FiltroContext.Provider value={{ filtros, actualizarFiltros }}>
      {children}
    </FiltroContext.Provider>
  );
};

export const useFiltros = () => useContext(FiltroContext);