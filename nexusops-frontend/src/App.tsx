import { useState } from "react";
import { apiData, type Equipment, type Incident, type User } from "./services/api";
import { useStoredState } from "./lib/storage";
import type { Page } from "./types";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import EquipmentPage from "./pages/Equipment";
import Incidents from "./pages/Incidents";
import Users from "./pages/Users";
import "./index.css";

const headings: Record<Page, { title: string; description: string }> = {
  Dashboard: { title: "Vue d'ensemble", description: "L'activité de votre infrastructure en un coup d'œil." },
  Equipment: { title: "Équipements", description: "Inventaire et état de votre parc informatique." },
  Incidents: { title: "Incidents", description: "Suivez les anomalies et leur résolution." },
  Users: { title: "Utilisateurs", description: "Gérez les membres de votre organisation." },
};

export default function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [equipmentList, setEquipmentList] = useStoredState<Equipment[]>("nexusops.equipment.v2", apiData.equipments);
  const [incidentList, setIncidentList] = useStoredState<Incident[]>("nexusops.incidents.v2", apiData.incidents);
  const [userList, setUserList] = useStoredState<User[]>("nexusops.users.v2", apiData.users);

  return <div className="layout">
    <Sidebar page={page} onNavigate={setPage} />
    <main className="content">
      <header className="topbar"><div><p className="eyebrow">NEXUSOPS / {headings[page].title.toUpperCase()}</p><h1>{headings[page].title}</h1><p className="page-description">{headings[page].description}</p></div><div className="demo-pill"><span className="pulse" /> Environnement démo</div></header>
      {page === "Dashboard" && <Dashboard equipmentList={equipmentList} incidentList={incidentList} userList={userList} onNavigate={setPage} />}
      {page === "Equipment" && <EquipmentPage equipmentList={equipmentList} setEquipmentList={setEquipmentList} incidentList={incidentList} />}
      {page === "Incidents" && <Incidents incidentList={incidentList} setIncidentList={setIncidentList} equipmentList={equipmentList} />}
      {page === "Users" && <Users userList={userList} setUserList={setUserList} />}
      <footer className="app-footer">NexusOps · Plateforme de supervision · Version de démonstration locale</footer>
    </main>
  </div>;
}
