import { useState, type FormEvent } from "react";
import type { User } from "../services/api";
import { emailValid, matches } from "../lib/utils";
import Editor from "../components/Editor";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

type Props = { userList: User[]; onSave: (value: User) => Promise<void>; onRemove: (id: number) => Promise<void> };
const roleLabels = { admin: "Administrateur", operator: "Opérateur", viewer: "Lecteur" };
export default function Users({ userList, onSave, onRemove }: Props) {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const close = () => { setDraft(null); setError(""); };
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return;
    const value = { ...draft, name: draft.name.trim(), email: draft.email.trim().toLowerCase() };
    if (!value.name || !emailValid(value.email)) return setError("Saisissez un nom et une adresse e-mail valide.");
    setBusy(true);
    try { await onSave(value); close(); } catch (err) { setError(err instanceof Error ? err.message : "Échec de l'enregistrement"); } finally { setBusy(false); }
  }
  async function remove(item: User) {
    if (!window.confirm(`Supprimer l'utilisateur « ${item.name} » ?`)) return;
    setBusy(true);
    try { await onRemove(item.id); setError(""); } catch (err) { setError(err instanceof Error ? err.message : "Échec de la suppression"); } finally { setBusy(false); }
  }
  const filtered = userList.filter(item => matches(`${item.name} ${item.email}`, search));
  return <section className="card panel"><div className="section-header"><div><h2>Annuaire des utilisateurs</h2><p>{userList.length} compte(s) enregistré(s)</p></div><button className="btn btn-primary" onClick={() => { setDraft({ id: 0, name: "", email: "", role: "viewer" }); setError(""); }}>+ Nouvel utilisateur</button></div>
    <div className="toolbar"><input aria-label="Rechercher des utilisateurs" placeholder="Rechercher par nom ou e-mail…" value={search} onChange={e => setSearch(e.target.value)} /></div>
    {error && !draft && <p className="form-error" role="alert">{error}</p>}
    {draft && <Editor title={draft.id ? "Modifier un utilisateur" : "Ajouter un utilisateur"} error={error} onSave={save} onCancel={close} disabled={busy}><label>Nom<input autoFocus maxLength={100} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} required /></label><label>Adresse e-mail<input type="email" maxLength={160} value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} required /></label><label className="full-width">Rôle<select value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value as User["role"] })}><option value="viewer">Lecteur</option><option value="operator">Opérateur</option><option value="admin">Administrateur</option></select></label></Editor>}
    {filtered.length ? <div className="table-wrap"><table><thead><tr><th>Utilisateur</th><th>E-mail</th><th>Rôle</th><th className="actions-col">Actions</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><strong>{item.name}</strong><small>#{String(item.id).padStart(3, "0")}</small></td><td>{item.email}</td><td><StatusBadge label={roleLabels[item.role]} variant={item.role === "admin" ? "info" : "neutral"} /></td><td className="row-actions"><button className="btn btn-small" disabled={busy} onClick={() => { setDraft({ ...item }); setError(""); }}>Modifier</button><button className="btn btn-small btn-danger" disabled={busy} onClick={() => void remove(item)}>Supprimer</button></td></tr>)}</tbody></table></div> : <EmptyState title="Aucun utilisateur" description="Aucun utilisateur ne correspond à votre recherche." />}
  </section>;
}
