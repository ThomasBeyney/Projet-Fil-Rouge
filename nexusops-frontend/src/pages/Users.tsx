import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import type { User } from "../services/api";
import { emailValid, matches, nextId } from "../lib/utils";
import Editor from "../components/Editor";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

type Props = { userList: User[]; setUserList: Dispatch<SetStateAction<User[]>> };
const roleLabels = { admin: "Administrateur", operator: "Opérateur", viewer: "Lecteur" };
export default function Users({ userList, setUserList }: Props) {
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState<User | null>(null);
  const [error, setError] = useState("");
  const close = () => { setDraft(null); setError(""); };
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!draft) return;
    const value = { ...draft, name: draft.name.trim(), email: draft.email.trim().toLowerCase() };
    if (!value.name || !emailValid(value.email)) return setError("Saisissez un nom et une adresse e-mail valide.");
    if (userList.some(item => item.id !== value.id && item.email.toLowerCase() === value.email)) return setError("Cette adresse e-mail est déjà utilisée.");
    setUserList(items => value.id === 0 ? [...items, { ...value, id: nextId(items) }] : items.map(item => item.id === value.id ? value : item));
    close();
  }
  function remove(item: User) { if (window.confirm(`Supprimer l'utilisateur « ${item.name} » ?`)) setUserList(items => items.filter(i => i.id !== item.id)); }
  const filtered = userList.filter(item => matches(`${item.name} ${item.email}`, search));
  return <section className="card panel"><div className="section-header"><div><h2>Annuaire des utilisateurs</h2><p>{userList.length} compte(s) enregistré(s)</p></div><button className="btn btn-primary" onClick={() => { setDraft({ id: 0, name: "", email: "", role: "viewer" }); setError(""); }}>+ Nouvel utilisateur</button></div>
    <div className="toolbar"><input aria-label="Rechercher des utilisateurs" placeholder="Rechercher par nom ou e-mail..." value={search} onChange={e => setSearch(e.target.value)} /></div>
    {draft && <Editor title={draft.id ? "Modifier un utilisateur" : "Ajouter un utilisateur"} error={error} onSave={save} onCancel={close}><label>Nom<input autoFocus maxLength={100} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} required /></label><label>Adresse e-mail<input type="email" maxLength={160} value={draft.email} onChange={e => setDraft({ ...draft, email: e.target.value })} required /></label><label className="full-width">Rôle<select value={draft.role} onChange={e => setDraft({ ...draft, role: e.target.value as User["role"] })}><option value="viewer">Lecteur</option><option value="operator">Opérateur</option><option value="admin">Administrateur</option></select></label></Editor>}
    {filtered.length ? <div className="table-wrap"><table><thead><tr><th>Utilisateur</th><th>E-mail</th><th>Rôle</th><th className="actions-col">Actions</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><strong>{item.name}</strong><small>#{String(item.id).padStart(3, "0")}</small></td><td>{item.email}</td><td><StatusBadge label={roleLabels[item.role]} variant={item.role === "admin" ? "info" : "neutral"} /></td><td className="row-actions"><button className="btn btn-small" onClick={() => { setDraft({ ...item }); setError(""); }}>Modifier</button><button className="btn btn-small btn-danger" onClick={() => remove(item)}>Supprimer</button></td></tr>)}</tbody></table></div> : <EmptyState title="Aucun utilisateur" description="Aucun utilisateur ne correspond à votre recherche." />}
  </section>;
}
