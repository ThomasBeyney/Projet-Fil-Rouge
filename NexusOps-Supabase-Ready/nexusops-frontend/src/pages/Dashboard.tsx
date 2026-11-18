
import { useEffect, useState } from "react";
import { fetchCloudStatus, type CloudProvider, type Equipment, type Incident, type User } from "../services/api";
import type { Page } from "../types";
import StatusBadge from "../components/StatusBadge";

type Props = {
  equipmentList: Equipment[];
  incidentList: Incident[];
  userList: User[];
  onNavigate: (page: Page) => void;
};

export default function Dashboard({ equipmentList, incidentList, userList, onNavigate }: Props) {
  const [cloud, setCloud] = useState<CloudProvider[]>([]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const data = await fetchCloudStatus();
        if (active) { setCloud(data); setError(false); }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 60000);
    return () => { active = false; clearInterval(timer); };
  }, []);

  const monitored = equipmentList.filter(e => e.monitoring_enabled);
  const online = monitored.filter(e => e.status === "online").length;
  const open = incidentList.filter(i => i.status !== "resolved").length;

  const cards = [
    { title: "Équipements", value: equipmentList.length, hint: `${online} en ligne`, icon: "▣", page: "Equipment" as Page },
    { title: "Incidents actifs", value: open, hint: `${incidentList.length - open} résolu(s)`, icon: "⚑", page: "Incidents" as Page },
    { title: "Utilisateurs", value: userList.length, hint: "Comptes enregistrés", icon: "♙", page: "Users" as Page },
    { title: "Disponibilité", value: monitored.length ? `${Math.round(online / monitored.length * 100)}%` : "—", hint: "Équipements supervisés", icon: "◉", page: "Equipment" as Page },
  ];

  return (
    <>
      <div className="metrics">
        {cards.map(c => (
          <button type="button" className="metric card" key={c.title} onClick={() => onNavigate(c.page)}>
            <span className="metric-icon">{c.icon}</span>
            <span className="metric-title">{c.title}</span>
            <strong>{c.value}</strong><small>{c.hint}</small>
          </button>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="card panel">
          <div className="section-header">
            <div><h2>État des équipements</h2><p>Vue rapide de votre infrastructure</p></div>
            <button className="link-button" onClick={() => onNavigate("Equipment")}>Voir tout →</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Équipement</th><th>Site</th><th>État</th></tr></thead>
              <tbody>
                {equipmentList.slice(0, 6).map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.name}</strong><small>{e.type}</small></td>
                    <td>{e.site}</td>
                    <td>
                      <StatusBadge
                        label={e.status === "online" ? "En ligne" : e.status === "offline" ? "Hors ligne" : "Non supervisé"}
                        variant={e.status === "online" ? "success" : e.status === "offline" ? "danger" : "neutral"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!equipmentList.length && <p>Aucun équipement enregistré.</p>}
        </section>

        <section className="card panel">
          <div className="section-header">
            <div><h2>Incidents récents</h2><p>Événements à surveiller</p></div>
            <button className="link-button" onClick={() => onNavigate("Incidents")}>Voir tout →</button>
          </div>
          <div className="recent-list">
            {incidentList.slice(-5).reverse().map(i => (
              <div className="recent-item" key={i.id}>
                <span className={`severity-dot ${i.severity}`} />
                <div>
                  <strong>{i.title}</strong>
                  <small>{equipmentList.find(e => e.id === i.equipmentId)?.name ?? "Équipement inconnu"}</small>
                </div>
                <StatusBadge
                  label={i.status === "resolved" ? "Résolu" : i.status === "in_progress" ? "En cours" : "Ouvert"}
                  variant={i.status === "resolved" ? "success" : "warning"}
                />
              </div>
            ))}
          </div>
          {!incidentList.length && <p>Aucun incident enregistré.</p>}
        </section>
      </div>

      <section className="card panel cloud-section">
        <div className="section-header">
          <div>
            <h2>Supervision cloud</h2>
            <p>Statuts officiels GitHub et Cloudflare · Actualisation toutes les 60 secondes</p>
          </div>
        </div>

        {loading && <p>Chargement des services cloud...</p>}
        {error && <p className="cloud-error">API inaccessible. {cloud.length > 0 && "Dernières données conservées."}</p>}

        <div className="cloud-grid">
          {cloud.map(p => {
            const unavailable = p.indicator === "unknown" || !!p.error;
            const online = p.indicator === "none" && !unavailable;
            return (
              <a
                key={p.id}
                className="cloud-card"
                href={p.id === "github" ? "https://www.githubstatus.com/" : "https://www.cloudflarestatus.com/"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="cloud-card-top">
                  <h3>{p.name}</h3>
                  <span className={`cloud-badge ${unavailable ? "unknown" : online ? "online" : "incident"}`}>
                    {unavailable ? "Indisponible" : online ? "Opérationnel" : "Incident"}
                  </span>
                </div>
                <p className="cloud-description">{p.description}</p>
                <div className="cloud-metrics">
                  <div><strong>{unavailable ? "—" : p.incidents.length}</strong><span>Incidents actifs</span></div>
                  <div><strong>{unavailable ? "—" : p.affected_count}</strong><span>Composants affectés</span></div>
                </div>
                {!unavailable && p.incidents.length > 0 && (
                  <div className="cloud-incidents">
                    <h4>Incidents signalés</h4>
                    {p.incidents.map(i => (
                      <div className="cloud-incident" key={i.id}>
                        <strong>{i.name}</strong><span>{i.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="cloud-updated">Dernière collecte : {new Date(p.checked_at).toLocaleString("fr-FR")}</p>
              </a>
            );
          })}
        </div>
      </section>
    </>
  );
}
