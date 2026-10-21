
import { useState } from "react";
import {
  apiData,
  type Equipment,
  type Incident,
  type User,
} from "./services/api";
import FormSelect from "./components/FormSelect";
import RecordActions from "./components/RecordActions";
import StatusBadge from "./components/StatusBadge";
import "./index.css";

type Page = "Dashboard" | "Equipment" | "Incidents" | "Users";

const severityLabels = {
  high: "Élevée",
  medium: "Moyenne",
  low: "Faible",
};

const incidentStatusLabels = {
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
};

const roleLabels = {
  admin: "Administrateur",
  operator: "Opérateur",
  viewer: "Lecteur",
};

function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIncident, setNewIncident] = useState({
    title: "",
    severity: "medium" as Incident["severity"],
    status: "open" as Incident["status"],
    equipmentId: apiData.equipments[0]?.id ?? 0,
  });
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "viewer" as User["role"],
  });
  const [equipmentList, setEquipmentList] = useState<Equipment[]>(apiData.equipments);
  const [incidentList, setIncidentList] = useState<Incident[]>(apiData.incidents);
  const [userList, setUserList] = useState<User[]>(apiData.users);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [editError, setEditError] = useState("");

  const filteredEquipment = equipmentList.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  function equipmentStatus(status: Equipment["status"]) {
    return status === "online" ? "En ligne" : "Hors ligne";
  }

  function addEquipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newName.trim()) {
      setError("Le nom de l'équipement est obligatoire.");
      return;
    }

    setEquipmentList([
      ...equipmentList,
      {
        id: Math.max(0, ...equipmentList.map((item) => item.id)) + 1,
        name: newName.trim(),
        type: "Autre",
        site: "Non renseigné",
        status: "online",
      },
    ]);

    setNewName("");
    setError("");
    setShowForm(false);
  }

  function addIncident(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newIncident.title.trim()) {
      setError("Le titre de l'incident est obligatoire.");
      return;
    }
    if (!equipmentList.some((item) => item.id === newIncident.equipmentId)) {
      setError("Sélectionnez un équipement valide pour cet incident.");
      return;
    }

    setIncidentList((items) => [
      ...items,
      {
        id: Math.max(0, ...items.map((item) => item.id)) + 1,
        ...newIncident,
        title: newIncident.title.trim(),
      },
    ]);
    setNewIncident({
      title: "",
      severity: "medium",
      status: "open",
      equipmentId: equipmentList[0]?.id ?? 0,
    });
    setError("");
    setShowIncidentForm(false);
  }

  function addUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newUser.name.trim() || !newUser.email.trim()) {
      setError("Le nom et l'adresse e-mail sont obligatoires.");
      return;
    }

    setUserList((items) => [
      ...items,
      {
        id: Math.max(0, ...items.map((item) => item.id)) + 1,
        ...newUser,
        name: newUser.name.trim(),
        email: newUser.email.trim(),
      },
    ]);
    setNewUser({ name: "", email: "", role: "viewer" });
    setError("");
    setShowUserForm(false);
  }

  function saveEquipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingEquipment) return;
    if (!editingEquipment.name.trim() || !editingEquipment.type.trim() || !editingEquipment.site.trim()) {
      setEditError("Le nom, le type et le site sont obligatoires.");
      return;
    }

    setEquipmentList((items) =>
      items.map((item) =>
        item.id === editingEquipment.id
          ? { ...editingEquipment, name: editingEquipment.name.trim(), type: editingEquipment.type.trim(), site: editingEquipment.site.trim() }
          : item
      )
    );
    setEditingEquipment(null);
    setEditError("");
  }

  function saveIncident(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingIncident) return;
    if (!editingIncident.title.trim()) {
      setEditError("Le titre de l'incident est obligatoire.");
      return;
    }

    setIncidentList((items) =>
      items.map((item) =>
        item.id === editingIncident.id
          ? { ...editingIncident, title: editingIncident.title.trim() }
          : item
      )
    );
    setEditingIncident(null);
    setEditError("");
  }

  function saveUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingUser) return;
    if (!editingUser.name.trim() || !editingUser.email.trim()) {
      setEditError("Le nom et l'adresse e-mail sont obligatoires.");
      return;
    }

    setUserList((items) =>
      items.map((item) =>
        item.id === editingUser.id
          ? { ...editingUser, name: editingUser.name.trim(), email: editingUser.email.trim() }
          : item
      )
    );
    setEditingUser(null);
    setEditError("");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>NEXUSOPS</h2>
        <p className="subtitle">Operations Center</p>

        {(["Dashboard", "Equipment", "Incidents", "Users"] as Page[]).map(
          (item) => (
            <button
              key={item}
              className={page === item ? "nav active" : "nav"}
              onClick={() => setPage(item)}
            >
              {item}
            </button>
          )
        )}
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">SUPERVISION PLATFORM</p>
            <h1>{page}</h1>
          </div>
          <span className="online">● System operational</span>
        </header>

        {page === "Dashboard" && (
          <>
            <div className="stats">
              <article className="card">
                <p>Équipements</p>
                <h2>{equipmentList.length}</h2>
              </article>
              <article className="card">
                <p>Incidents</p>
                <h2>{incidentList.length}</h2>
              </article>
              <article className="card">
                <p>Utilisateurs</p>
                <h2>{userList.length}</h2>
              </article>
            </div>

            <section className="card">
              <h2>Équipements récents</h2>
              {equipmentList.slice(0, 3).map((item) => (
                <p key={item.id}>
                  {item.name} — {item.type}, {item.site} — {equipmentStatus(item.status)}
                </p>
              ))}
            </section>
          </>
        )}

        {page === "Equipment" && (
          <section className="card">
            <div className="section-header">
              <h2>Inventaire des équipements</h2>
              <button onClick={() => setShowForm(!showForm)}>
                {showForm ? "Annuler" : "+ Ajouter un équipement"}
              </button>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher un équipement..."
            />

            {showForm && (
              <form onSubmit={addEquipment}>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Nom de l'équipement"
                />
                <button type="submit">Enregistrer</button>
                {error && <p className="error">{error}</p>}
              </form>
            )}

            {filteredEquipment.map((item) => (
              <article className="record" key={item.id}>
                {editingEquipment?.id === item.id ? (
                  <form className="edit-form" onSubmit={saveEquipment}>
                    <input
                      aria-label="Nom de l'équipement"
                      value={editingEquipment.name}
                      onChange={(event) => setEditingEquipment({ ...editingEquipment, name: event.target.value })}
                      required
                    />
                    <input
                      aria-label="Type d'équipement"
                      value={editingEquipment.type}
                      onChange={(event) => setEditingEquipment({ ...editingEquipment, type: event.target.value })}
                      required
                    />
                    <input
                      aria-label="Site de l'équipement"
                      value={editingEquipment.site}
                      onChange={(event) => setEditingEquipment({ ...editingEquipment, site: event.target.value })}
                      required
                    />
                    <FormSelect
                      label="État de l'équipement"
                      value={editingEquipment.status}
                      options={[
                        { value: "online", label: "En ligne" },
                        { value: "offline", label: "Hors ligne" },
                      ]}
                      onChange={(status) => setEditingEquipment({ ...editingEquipment, status: status as Equipment["status"] })}
                    />
                    <RecordActions onCancel={() => { setEditingEquipment(null); setEditError(""); }} />
                    {editError && <p className="error">{editError}</p>}
                  </form>
                ) : (
                  <>
                    <p>{item.name} — {item.type} — {item.site} — <StatusBadge label={equipmentStatus(item.status)} variant={item.status === "online" ? "success" : "danger"} /></p>
                    <button type="button" className="secondary-button" onClick={() => { setEditingEquipment({ ...item }); setEditError(""); }}>Modifier</button>
                  </>
                )}
              </article>
            ))}

            {filteredEquipment.length === 0 && (
              <p>Aucun équipement trouvé.</p>
            )}
          </section>
        )}

        {page === "Incidents" && (
          <section className="card">
            <div className="section-header">
              <h2>Gestion des incidents</h2>
              <button
                type="button"
                onClick={() => { setShowIncidentForm(!showIncidentForm); setError(""); }}
              >
                {showIncidentForm ? "Annuler" : "+ Ajouter un incident"}
              </button>
            </div>
            {showIncidentForm && (
              <form className="edit-form create-form" onSubmit={addIncident}>
                <input
                  aria-label="Titre de l'incident"
                  placeholder="Titre de l'incident"
                  value={newIncident.title}
                  onChange={(event) => setNewIncident({ ...newIncident, title: event.target.value })}
                  required
                />
                <FormSelect
                  label="Gravité"
                  value={newIncident.severity}
                  options={[
                    { value: "high", label: "Élevée" },
                    { value: "medium", label: "Moyenne" },
                    { value: "low", label: "Faible" },
                  ]}
                  onChange={(severity) => setNewIncident({ ...newIncident, severity: severity as Incident["severity"] })}
                />
                <FormSelect
                  label="Statut de l'incident"
                  value={newIncident.status}
                  options={[
                    { value: "open", label: "Ouvert" },
                    { value: "in_progress", label: "En cours" },
                    { value: "resolved", label: "Résolu" },
                  ]}
                  onChange={(status) => setNewIncident({ ...newIncident, status: status as Incident["status"] })}
                />
                <FormSelect
                  label="Équipement concerné"
                  value={newIncident.equipmentId}
                  options={equipmentList.length === 0
                    ? [{ value: "0", label: "Aucun équipement disponible" }]
                    : equipmentList.map((equipmentItem) => ({
                      value: String(equipmentItem.id),
                      label: equipmentItem.name,
                    }))}
                  onChange={(equipmentId) => setNewIncident({ ...newIncident, equipmentId: Number(equipmentId) })}
                  disabled={equipmentList.length === 0}
                />
                <RecordActions disabled={equipmentList.length === 0} />
                {error && <p className="error">{error}</p>}
              </form>
            )}
            {incidentList.map((item) => {
              const equipment = equipmentList.find(
                (equipmentItem) => equipmentItem.id === item.equipmentId
              );

              return (
                <article className="record" key={item.id}>
                  {editingIncident?.id === item.id ? (
                    <form className="edit-form" onSubmit={saveIncident}>
                      <input
                        aria-label="Titre de l'incident"
                        value={editingIncident.title}
                        onChange={(event) => setEditingIncident({ ...editingIncident, title: event.target.value })}
                        required
                      />
                      <FormSelect
                        label="Gravité"
                        value={editingIncident.severity}
                        options={[
                          { value: "high", label: "Élevée" },
                          { value: "medium", label: "Moyenne" },
                          { value: "low", label: "Faible" },
                        ]}
                        onChange={(severity) => setEditingIncident({ ...editingIncident, severity: severity as Incident["severity"] })}
                      />
                      <FormSelect
                        label="Statut de l'incident"
                        value={editingIncident.status}
                        options={[
                          { value: "open", label: "Ouvert" },
                          { value: "in_progress", label: "En cours" },
                          { value: "resolved", label: "Résolu" },
                        ]}
                        onChange={(status) => setEditingIncident({ ...editingIncident, status: status as Incident["status"] })}
                      />
                      <FormSelect
                        label="Équipement concerné"
                        value={editingIncident.equipmentId}
                        options={equipmentList.map((equipmentItem) => ({
                          value: String(equipmentItem.id),
                          label: equipmentItem.name,
                        }))}
                        onChange={(equipmentId) => setEditingIncident({ ...editingIncident, equipmentId: Number(equipmentId) })}
                      />
                      <RecordActions onCancel={() => { setEditingIncident(null); setEditError(""); }} />
                      {editError && <p className="error">{editError}</p>}
                    </form>
                  ) : (
                    <>
                      <p>{item.title} — Gravité : <StatusBadge label={severityLabels[item.severity]} variant={item.severity === "high" ? "danger" : item.severity === "medium" ? "warning" : "info"} /> —{" "}
                        <StatusBadge label={incidentStatusLabels[item.status]} variant={item.status === "resolved" ? "success" : item.status === "in_progress" ? "warning" : "neutral"} /> — Équipement : {equipment?.name ?? "Inconnu"}</p>
                      <button type="button" className="secondary-button" onClick={() => { setEditingIncident({ ...item }); setEditError(""); }}>Modifier</button>
                    </>
                  )}
                </article>
              );
            })}
          </section>
        )}

        {page === "Users" && (
          <section className="card">
            <div className="section-header">
              <h2>Annuaire des utilisateurs</h2>
              <button
                type="button"
                onClick={() => { setShowUserForm(!showUserForm); setError(""); }}
              >
                {showUserForm ? "Annuler" : "+ Ajouter un utilisateur"}
              </button>
            </div>
            {showUserForm && (
              <form className="edit-form create-form" onSubmit={addUser}>
                <input
                  aria-label="Nom de l'utilisateur"
                  placeholder="Nom"
                  value={newUser.name}
                  onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
                  required
                />
                <input
                  aria-label="Adresse e-mail"
                  type="email"
                  placeholder="Adresse e-mail"
                  value={newUser.email}
                  onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
                  required
                />
                <FormSelect
                  label="Rôle"
                  value={newUser.role}
                  options={[
                    { value: "admin", label: "Administrateur" },
                    { value: "operator", label: "Opérateur" },
                    { value: "viewer", label: "Lecteur" },
                  ]}
                  onChange={(role) => setNewUser({ ...newUser, role: role as User["role"] })}
                />
                <RecordActions />
                {error && <p className="error">{error}</p>}
              </form>
            )}
            {userList.map((user) => (
              <article className="record" key={user.id}>
                {editingUser?.id === user.id ? (
                  <form className="edit-form" onSubmit={saveUser}>
                    <input
                      aria-label="Nom de l'utilisateur"
                      value={editingUser.name}
                      onChange={(event) => setEditingUser({ ...editingUser, name: event.target.value })}
                      required
                    />
                    <input
                      aria-label="Adresse e-mail"
                      type="email"
                      value={editingUser.email}
                      onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })}
                      required
                    />
                    <FormSelect
                      label="Rôle"
                      value={editingUser.role}
                      options={[
                        { value: "admin", label: "Administrateur" },
                        { value: "operator", label: "Opérateur" },
                        { value: "viewer", label: "Lecteur" },
                      ]}
                      onChange={(role) => setEditingUser({ ...editingUser, role: role as User["role"] })}
                    />
                    <RecordActions onCancel={() => { setEditingUser(null); setEditError(""); }} />
                    {editError && <p className="error">{editError}</p>}
                  </form>
                ) : (
                  <>
                    <p>{user.name} — {user.email} — <StatusBadge label={roleLabels[user.role]} variant={user.role === "admin" ? "info" : "neutral"} /></p>
                    <button type="button" className="secondary-button" onClick={() => { setEditingUser({ ...user }); setEditError(""); }}>Modifier</button>
                  </>
                )}
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
