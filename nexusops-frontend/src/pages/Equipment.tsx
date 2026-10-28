import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { Equipment as EquipmentType, Incident } from "../services/api";
import { matches, nextId } from "../lib/utils";
import Editor from "../components/Editor";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

type Props = { equipmentList: EquipmentType[]; setEquipmentList: Dispatch<SetStateAction<EquipmentType[]>>; incidentList: Incident[] };
const empty = (): EquipmentType => ({ id: 0, name: "", type: "Serveur", site: "", status: "online" });
export default function Equipment({ equipmentList, setEquipmentList, incidentList }: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [draft, setDraft] = useState<EquipmentType | null>(null);
  const [error, setError] = useState("");
  const close = () => { setDraft(null); setError(""); };
  const filtered = equipmentList.filter(item => matches(`${item.name} ${item.type} ${item.site}`, search) && (filter === "all" || item.status === filter));
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return;
    const value = { ...draft, name: draft.name.trim(), type: draft.type.trim(), site: draft.site.trim() };
    if (!value.name || !value.type || !value.site) return setError("Le nom, le type et le site sont obligatoires.");
    if (equipmentList.some(item => item.id !== value.id && item.name.toLowerCase() === value.name.toLowerCase())) return setError("Ce nom d'équipement existe déjà.");
    setEquipmentList(items => value.id === 0 ? [...items, { ...value, id: nextId(items) }] : items.map(item => item.id === value.id ? value : item));
    close();
  }
  function remove(item: EquipmentType) {
    if (incidentList.some(incident => incident.equipmentId === item.id)) return setError("Impossible de supprimer cet équipement : il est lié à un incident.");
    if (window.confirm(`Supprimer définitivement « ${item.name} » ?`)) { setEquipmentList(items => items.filter(i => i.id !== item.id)); setError(""); }
  }
  return <section className="card panel"><div className="section-header"><div><h2>Parc informatique</h2><p>{equipmentList.length} équipement(s) enregistré(s)</p></div><button className="btn btn-primary" onClick={() => { setDraft(empty()); setError(""); }}>+ Nouvel équipement</button></div>
    <div className="toolbar"><input aria-label="Rechercher des équipements" placeholder="Rechercher par nom, type ou site..." value={search} onChange={e => setSearch(e.target.value)} /><select aria-label="Filtrer par état" value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Tous les états</option><option value="online">En ligne</option><option value="offline">Hors ligne</option></select></div>
    {error && !draft && <p className="form-error" role="alert">{error}</p>}
    {draft && <Editor title={draft.id ? "Modifier un équipement" : "Ajouter un équipement"} error={error} onSave={save} onCancel={close}><label>Nom<input autoFocus value={draft.name} maxLength={80} onChange={e => setDraft({ ...draft, name: e.target.value })} required /></label><label>Type<input value={draft.type} maxLength={80} onChange={e => setDraft({ ...draft, type: e.target.value })} required /></label><label>Site<input value={draft.site} maxLength={80} onChange={e => setDraft({ ...draft, site: e.target.value })} required /></label><label>État<select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as EquipmentType["status"] })}><option value="online">En ligne</option><option value="offline">Hors ligne</option></select></label></Editor>}
    {filtered.length ? <div className="table-wrap"><table><thead><tr><th>Équipement</th><th>Type</th><th>Site</th><th>État</th><th className="actions-col">Actions</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><strong>{item.name}</strong><small>#{String(item.id).padStart(3, "0")}</small></td><td>{item.type}</td><td>{item.site}</td><td><StatusBadge label={item.status === "online" ? "En ligne" : "Hors ligne"} variant={item.status === "online" ? "success" : "danger"} /></td><td className="row-actions"><button className="btn btn-small" onClick={() => { setDraft({ ...item }); setError(""); }}>Modifier</button><button className="btn btn-small btn-danger" onClick={() => remove(item)}>Supprimer</button></td></tr>)}</tbody></table></div> : <EmptyState title="Aucun équipement" description="Modifiez votre recherche ou ajoutez un équipement." />}
  </section>;
}
