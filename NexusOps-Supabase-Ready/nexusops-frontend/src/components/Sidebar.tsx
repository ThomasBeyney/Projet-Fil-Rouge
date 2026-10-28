import type { Page } from "../types";
const items: { page: Page; icon: string; label: string }[] = [
  { page: "Dashboard", icon: "◫", label: "Vue d'ensemble" },
  { page: "Equipment", icon: "▣", label: "Équipements" },
  { page: "Incidents", icon: "⚑", label: "Incidents" },
  { page: "Users", icon: "♙", label: "Utilisateurs" },
];
export default function Sidebar({ page, onNavigate }: { page: Page; onNavigate: (page: Page) => void }) {
  return <aside className="sidebar">
    <div className="brand"><div className="brand-icon">N</div><div><strong>NEXUS<span>OPS</span></strong><small>CONTROL CENTER</small></div></div>
    <div className="nav-heading">ESPACE DE TRAVAIL</div>
    <nav aria-label="Navigation principale">{items.map(item => <button key={item.page} type="button" className={`nav ${page === item.page ? "active" : ""}`} aria-current={page === item.page ? "page" : undefined} onClick={() => onNavigate(item.page)}><span className="nav-icon" aria-hidden="true">{item.icon}</span>{item.label}</button>)}</nav>
    <div className="sidebar-footer"><span className="pulse" /> Mode démonstration <small>Données stockées sur cet appareil</small></div>
  </aside>;
}
