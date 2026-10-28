import { useCallback, useEffect, useState } from "react";
import { api, type Equipment, type Incident, type User, type Collection } from "./services/api";
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
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [incidentList, setIncidentList] = useState<Incident[]>([]);
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const refresh = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [equipment, incidents, users] = await Promise.all([
        api.list<Equipment>("equipment"), api.list<Incident>("incidents"), api.list<User>("users"),
      ]);
      setEquipmentList(equipment);
      setIncidentList(incidents);
      setUserList(users);
      setUpdatedAt(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initial = window.setTimeout(() => void refresh(true), 0);
    const timer = window.setInterval(() => void refresh(), 30000);
    return () => { window.clearTimeout(initial); window.clearInterval(timer); };
  }, [refresh]);

  async function save<T extends { id: number }>(collection: Collection, value: T) {
    await api.save(collection, value);
    await refresh();
  }
  async function remove(collection: Collection, id: number) {
    await api.remove(collection, id);
    await refresh();
  }
  async function check(id: number) {
    await api.check(id);
    await refresh();
  }

  return <div className="layout">
    <Sidebar page={page} onNavigate={setPage} />
    <main className="content">
      <header className="topbar"><div><p className="eyebrow">NEXUSOPS / {headings[page].title.toUpperCase()}</p><h1>{headings[page].title}</h1><p className="page-description">{headings[page].description}</p></div><div><div className="demo-pill"><span className="pulse" /> API + PostgreSQL</div><button className="btn btn-small" onClick={() => void refresh(true)}>Actualiser</button></div></header>
      {error && <div className="card" role="alert"><strong>Connexion impossible :</strong> {error} <button className="btn btn-small" onClick={() => void refresh(true)}>Réessayer</button></div>}
      {loading ? <div className="card" role="status">Chargement des données depuis l'API…</div> : <>
        {page === "Dashboard" && <Dashboard equipmentList={equipmentList} incidentList={incidentList} userList={userList} onNavigate={setPage} />}
        {page === "Equipment" && <EquipmentPage equipmentList={equipmentList} incidentList={incidentList} onSave={value => save("equipment", value)} onRemove={id => remove("equipment", id)} onCheck={check} />}
        {page === "Incidents" && <Incidents incidentList={incidentList} equipmentList={equipmentList} onSave={value => save("incidents", value)} onRemove={id => remove("incidents", id)} />}
        {page === "Users" && <Users userList={userList} onSave={value => save("users", value)} onRemove={id => remove("users", id)} />}
      </>}
      <footer className="app-footer">NexusOps · API FastAPI + PostgreSQL · {updatedAt ? `Synchronisé à ${updatedAt.toLocaleTimeString("fr-FR")}` : "Non synchronisé"}</footer>
    </main>
  </div>;
}
