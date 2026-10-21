
import { useState } from "react";
import "./index.css";

type Page = "Dashboard" | "Equipment" | "Incidents" | "Users";

const equipment = [
  { name: "Serveur principal", status: "En ligne" },
  { name: "Routeur site Paris", status: "En ligne" },
  { name: "Poste accueil", status: "Hors ligne" },
];

const incidents = [
  { title: "Serveur indisponible", priority: "Critique" },
  { title: "Perte de connexion", priority: "Moyenne" },
];

const users = [
  { name: "Alice Martin", role: "Administratrice" },
  { name: "Thomas Bernard", role: "Opérateur" },
];

function App() {
  const [page, setPage] = useState<Page>("Dashboard");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [equipmentList, setEquipmentList] = useState(equipment);
  const [error, setError] = useState("");

  const filteredEquipment = equipmentList.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  function addEquipment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newName.trim()) {
      setError("Le nom de l'équipement est obligatoire.");
      return;
    }

    setEquipmentList([
      ...equipmentList,
      { name: newName.trim(), status: "En ligne" },
    ]);

    setNewName("");
    setError("");
    setShowForm(false);
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
                <p>Equipment</p>
                <h2>{equipmentList.length}</h2>
              </article>
              <article className="card">
                <p>Incidents</p>
                <h2>{incidents.length}</h2>
              </article>
              <article className="card">
                <p>Users</p>
                <h2>{users.length}</h2>
              </article>
            </div>

            <section className="card">
              <h2>Recent equipment</h2>
              {equipmentList.slice(0, 3).map((item) => (
                <p key={item.name}>
                  {item.name} — {item.status}
                </p>
              ))}
            </section>
          </>
        )}

        {page === "Equipment" && (
          <section className="card">
            <div className="section-header">
              <h2>Equipment inventory</h2>
              <button onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancel" : "+ Add equipment"}
              </button>
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search equipment..."
            />

            {showForm && (
              <form onSubmit={addEquipment}>
                <input
                  value={newName}
                  onChange={(event) => setNewName(event.target.value)}
                  placeholder="Equipment name"
                />
                <button type="submit">Save</button>
                {error && <p className="error">{error}</p>}
              </form>
            )}

            {filteredEquipment.map((item) => (
              <p key={item.name}>
                {item.name} — {item.status}
              </p>
            ))}

            {filteredEquipment.length === 0 && (
              <p>No equipment found.</p>
            )}
          </section>
        )}

        {page === "Incidents" && (
          <section className="card">
            <h2>Incident management</h2>
            {incidents.map((item) => (
              <p key={item.title}>
                {item.title} — {item.priority}
              </p>
            ))}
          </section>
        )}

        {page === "Users" && (
          <section className="card">
            <h2>User directory</h2>
            {users.map((user) => (
              <p key={user.name}>
                {user.name} — {user.role}
              </p>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
