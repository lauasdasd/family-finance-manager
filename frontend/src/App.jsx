import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FiltroProvider } from "./Context/FiltroContext"; // 1. Importamos el Provider
import Layout from "./components/Layout/Layout"; // 2. Importamos tu Layout
import Dashboard from "./pages/Dashboard";
import Personas from "./pages/Persona";
import Bancos from "./pages/Banco";
import Tarjetas from "./pages/Tarjeta";
import Cuentas from "./pages/Cuenta";

export default function App() {
  return (
    // El Provider debe envolver TODO lo que necesite usar el mes/año global
    <FiltroProvider> 
      <BrowserRouter>
        <Layout> {/* Envolvemos las rutas con el Layout para tener Header y Sidebar fijos */}
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/personas" element={<Personas />} />
            <Route path="/bancos" element={<Bancos />} />
            <Route path="/tarjetas" element={<Tarjetas />} />
            <Route path="/cuentas" element={<Cuentas />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </FiltroProvider>
  );
}