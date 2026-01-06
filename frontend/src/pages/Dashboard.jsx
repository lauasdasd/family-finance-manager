import { useFiltros } from "../Context/FiltroContext";
import DashboardComponent from "../modules/Dashboard/Dashboard";

export default function DashboardPage() {
  const { filtros } = useFiltros();

  return (
    // Pasamos el titularId también como prop
    <DashboardComponent 
      mes={filtros.mes} 
      anio={filtros.anio} 
      titularId={filtros.titularId} 
    />
  );
}