import { useState, type FormEvent } from "react";
import type { Equipment, Incident } from "../services/api";
import { matches } from "../lib/utils";
import Editor from "../components/Editor";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

type Props = { incidentList: Incident[]; equipmentList: Equipment[]; onSave: (value: Incident) => Promise<void>; onRemove: (id: number) => Promise<void> };
const severityLabels = { high: "Élevée", medium: "Moyenne", low: "Faible" };
const statusLabels = { open: "Ouvert", in_progress: "En cours", resolved: "Résolu" };
export default function Incidents({ incidentList, equipmentList, onSave, onRemove }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState<Incident | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => { setDraft(null); setError(""); };
  const filtered = incidentList.filter(item => matches(item.title, search) && (filter === "all" || item.status === filter));
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return;
    if (!draft.title.trim()) return setError("Le titre est obligatoire.");
    if (!equipmentList.some(item => item.id === draft.equipmentId)) return setError("Choisissez un équipement valide.");
    setBusy(true);
    try { await onSave({ ...draft, title: draft.title.trim() }); close(); } catch (err) { setError(err instanceof Error ? err.message : "Échec de l'enregistrement"); } finally { setBusy(false); }
  }
  async function remove(item: Incident) {
    if (!window.confirm(`Supprimer l'incident « ${item.title} » ?`)) return;
    setBusy(true);
    try { await onRemove(item.id); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Échec de la suppression"); } finally { setBusy(false); }
  }
  return <section className="card panel"><div className="section-header"><div><h2>Suivi des incidents</h2><p>{incidentList.filter(i => i.status !== "resolved").length} incident(s) actif(s)</p></div><button className="btn btn-primary" disabled={!equipmentList.length} onClick={() => { setDraft({ id: 0, title: "", severity: "medium", status: "open", equipmentId: equipmentList[0].id }); setError(""); }}>+ Nouvel incident</button></div>
    {!equipmentList.length && <p className="form-error">Ajoutez d'abord un équipement.</p>}
    <div className="toolbar"><input aria-label="Rechercher des incidents" placeholder="Rechercher un incident…" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filtrer par statut" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tous les statuts</option><option value="open">Ouvert</option><option value="in_progress">En cours</option><option value="resolved">Résolu</option></select></div>
    {error && !draft && <p className="form-error" role="alert">{error}</p>}
    {draft && <Editor title={draft.id ? "Modifier un incident" : "Déclarer un incident"} error={error} onSave={save} onCancel={close} disabled={busy || !equipmentList.length}><label className="full-width">Titre<input autoFocus maxLength={120} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} required /></label><label>Gravité<select value={draft.severity} onChange={e => setDraft({ ...draft, severity: e.target.value as Incident["severity"] })}><option value="low">Faible</option><option value="medium">Moyenne</option><option value="high">Élevée</option></select></label><label>Statut<select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as Incident["status"] })}><option value="open">Ouvert</option><option value="in_progress">En cours</option><option value="resolved">Résolu</option></select></label><label className="full-width">Équipement concerné<select value={draft.equipmentId} onChange={e => setDraft({ ...draft, equipmentId: Number(e.target.value) })}>{equipmentList.map(item => <option key={item.id} value={item.id}>{item.name} — {item.site}</option>)}</select></label></Editor>}
    {filtered.length ? <div className="table-wrap"><table><thead><tr><th>Incident</th><th>Équipement</th><th>Gravité</th><th>Statut</th><th className="actions-col">Actions</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><strong>{item.title}</strong><small>#{String(item.id).padStart(3, "0")}</small></td><td>{equipmentList.find(e => e.id === item.equipmentId)?.name ?? "Inconnu"}</td><td><StatusBadge label={severityLabels[item.severity]} variant={item.severity === "high" ? "danger" : item.severity === "medium" ? "warning" : "info"} /></td><td><StatusBadge label={statusLabels[item.status]} variant={item.status === "resolved" ? "success" : item.status === "in_progress" ? "warning" : "neutral"} /></td><td className="row-actions"><button className="btn btn-small" disabled={busy} onClick={() => { setDraft({ ...item }); setError(""); }}>Modifier</button><button className="btn btn-small btn-danger" disabled={busy} onClick={() => void remove(item)}>Supprimer</button></td></tr>)}</tbody></table></div> : <EmptyState title="Aucun incident" description="Aucun incident ne correspond aux critères." />}
  </section>;
}
