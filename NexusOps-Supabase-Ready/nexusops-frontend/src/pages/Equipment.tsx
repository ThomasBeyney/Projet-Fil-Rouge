import { useState, type FormEvent } from "react";
import type { Equipment as EquipmentType, Incident } from "../services/api";
import { matches } from "../lib/utils";
import Editor from "../components/Editor";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

type Props = {
  equipmentList: EquipmentType[];
  incidentList: Incident[];
  onSave: (value: EquipmentType) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  onCheck: (id: number) => Promise<void>;
};
const empty = (): EquipmentType => ({ id: 0, name: "", type: "Serveur", site: "", status: "unknown", monitor_host: null, monitoring_enabled: false, last_checked_at: null, response_ms: null });
export default function Equipment({ equipmentList, incidentList, onSave, onRemove, onCheck }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState<EquipmentType | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => { setDraft(null); setError(""); };
  const filtered = equipmentList.filter(item => matches(`${item.name} ${item.type} ${item.site} ${item.monitor_host || ""}`, search) && (filter === "all" || item.status === filter));
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return;
    const value = { ...draft, name: draft.name.trim(), type: draft.type.trim(), site: draft.site.trim(), monitor_host: draft.monitor_host?.trim() || null };
    if (!value.name || !value.type || !value.site) return setError("Nom, type et site obligatoires.");
    if (value.monitoring_enabled && !value.monitor_host) return setError("Indiquez une adresse IP pour la supervision.");
    setBusy(true);
    try { await onSave(value); close(); } catch (err) { setError(err instanceof Error ? err.message : "Échec de l'enregistrement"); } finally { setBusy(false); }
  }
  async function remove(item: EquipmentType) {
    if (incidentList.some(incident => incident.equipmentId === item.id)) return setError("Cet équipement est lié à un incident.");
    if (!window.confirm(`Supprimer « ${item.name} » ?`)) return;
    setBusy(true);
    try { await onRemove(item.id); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Échec de la suppression"); } finally { setBusy(false); }
  }
  async function check(item: EquipmentType) {
    setBusy(true);
    try { await onCheck(item.id); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Échec du contrôle"); } finally { setBusy(false); }
  }
  return <section className="card panel"><div className="section-header"><div><h2>Parc informatique</h2><p>{equipmentList.length} équipement(s) enregistré(s)</p></div><button className="btn btn-primary" onClick={() => { setDraft(empty()); setError(""); }}>+ Nouvel équipement</button></div>
    <div className="toolbar"><input aria-label="Rechercher des équipements" placeholder="Nom, type, site ou IP…" value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filtrer par état" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tous les états</option><option value="online">En ligne</option><option value="offline">Hors ligne</option><option value="unknown">Non supervisé</option></select></div>
    {error && !draft && <p className="form-error" role="alert">{error}</p>}
    {draft && <Editor title={draft.id ? "Modifier un équipement" : "Ajouter un équipement"} error={error} onSave={save} onCancel={close} disabled={busy}><label>Nom<input autoFocus value={draft.name} maxLength={80} onChange={e => setDraft({ ...draft, name: e.target.value })} required /></label><label>Type<input value={draft.type} maxLength={80} onChange={e => setDraft({ ...draft, type: e.target.value })} required /></label><label>Site<input value={draft.site} maxLength={80} onChange={e => setDraft({ ...draft, site: e.target.value })} required /></label><label>IP privée à superviser<input placeholder="192.168.1.20" value={draft.monitor_host || ""} onChange={e => setDraft({ ...draft, monitor_host: e.target.value })} /></label><label className="full-width"><input type="checkbox" style={{width:"auto",marginRight:10}} checked={draft.monitoring_enabled} onChange={e => setDraft({ ...draft, monitoring_enabled: e.target.checked })} />Activer la supervision ICMP (ping)</label></Editor>}
    {filtered.length ? <div className="table-wrap"><table><thead><tr><th>Équipement</th><th>Type</th><th>Site / IP</th><th>État</th><th className="actions-col">Actions</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><strong>{item.name}</strong><small>#{String(item.id).padStart(3, "0")}</small></td><td>{item.type}</td><td>{item.site}<small>{item.monitor_host || "IP non renseignée"}</small></td><td><StatusBadge label={item.status === "online" ? "En ligne" : item.status === "offline" ? "Hors ligne" : "Non supervisé"} variant={item.status === "online" ? "success" : item.status === "offline" ? "danger" : "neutral"} />{item.last_checked_at && <small>Vérifié : {new Date(item.last_checked_at).toLocaleString("fr-FR")}{item.response_ms !== null ? ` · ${item.response_ms} ms` : ""}</small>}</td><td className="row-actions"><button className="btn btn-small" disabled={busy} onClick={() => { setDraft({ ...item }); setError(""); }}>Modifier</button><button className="btn btn-small" disabled={busy || !item.monitoring_enabled} onClick={() => void check(item)}>Tester</button><button className="btn btn-small btn-danger" disabled={busy} onClick={() => void remove(item)}>Supprimer</button></td></tr>)}</tbody></table></div> : <EmptyState title="Aucun équipement" description="Ajoutez un équipement ou modifiez vos filtres." />}
  </section>;
}
