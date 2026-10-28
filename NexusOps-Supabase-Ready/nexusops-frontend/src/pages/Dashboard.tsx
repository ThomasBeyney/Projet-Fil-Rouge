import type { Equipment, Incident, User } from "../services/api";
import type { Page } from "../types";
import StatusBadge from "../components/StatusBadge";
export default function Dashboard({ equipmentList, incidentList, userList, onNavigate }: {
  equipmentList: Equipment[]; incidentList: Incident[]; userList: User[]; onNavigate: (page: Page) => void;
}) {
  const online = equipmentList.filter(item => item.status === "online").length;
  const monitored = equipmentList.filter(item => item.monitoring_enabled).length;
  const open = incidentList.filter(item => item.status !== "resolved").length;
  const cards = [
    { title: "Équipements", value: equipmentList.length, hint: `${online} en ligne`, icon: "▣", page: "Equipment" as Page },
    { title: "Incidents actifs", value: open, hint: `${incidentList.length - open} résolu(s)`, icon: "⚑", page: "Incidents" as Page },
    { title: "Utilisateurs", value: userList.length, hint: "Comptes enregistrés", icon: "♙", page: "Users" as Page },
    { title: "Disponibilité", value: monitored ? `${Math.round(online / monitored * 100)}%` : "—", hint: "Parmi les équipements supervisés", icon: "◉", page: "Equipment" as Page },
  ];
  return <>
    <div className="metrics">{cards.map(card => <button type="button" className="metric card" key={card.title} onClick={() => onNavigate(card.page)}><span className="metric-icon">{card.icon}</span><span className="metric-title">{card.title}</span><strong>{card.value}</strong><small>{card.hint}</small></button>)}</div>
    <div className="dashboard-grid"><section className="card panel"><div className="section-header"><div><h2>État des équipements</h2><p>Vue rapide de votre infrastructure</p></div><button className="link-button" onClick={() => onNavigate("Equipment")}>Voir tout →</button></div>
      <div className="table-wrap"><table><thead><tr><th>Équipement</th><th>Site</th><th>État</th></tr></thead><tbody>{equipmentList.slice(0, 6).map(item => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.type}</small></td><td>{item.site}</td><td><StatusBadge label={item.status === "online" ? "En ligne" : item.status === "offline" ? "Hors ligne" : "Non supervisé"} variant={item.status === "online" ? "success" : item.status === "offline" ? "danger" : "neutral"} /></td></tr>)}</tbody></table></div>
      {!equipmentList.length && <p>Aucun équipement enregistré.</p>}
    </section><section className="card panel"><div className="section-header"><div><h2>Incidents récents</h2><p>Événements à surveiller</p></div><button className="link-button" onClick={() => onNavigate("Incidents")}>Voir tout →</button></div>
      <div className="recent-list">{incidentList.slice(-5).reverse().map(item => <div className="recent-item" key={item.id}><span className={`severity-dot ${item.severity}`} /><div><strong>{item.title}</strong><small>{equipmentList.find(e => e.id === item.equipmentId)?.name ?? "Équipement inconnu"}</small></div><StatusBadge label={item.status === "resolved" ? "Résolu" : item.status === "in_progress" ? "En cours" : "Ouvert"} variant={item.status === "resolved" ? "success" : "warning"} /></div>)}</div>
      {!incidentList.length && <p>Aucun incident enregistré.</p>}
    </section></div>
  </>;
}
