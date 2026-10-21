export type Equipment = {
  id: number;
  name: string;
  type: string;
  site: string;
  status: "online" | "offline";
};

export type Incident = {
  id: number;
  title: string;
  severity: "high" | "medium" | "low";
  status: "open" | "in_progress" | "resolved";
  equipmentId: number;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
};

export type ApiData = {
  equipments: Equipment[];
  incidents: Incident[];
  users: User[];
};

export const apiData: ApiData = {
  equipments: [
    { id: 1, name: "SRV-PAR-01", type: "Serveur", site: "Paris", status: "online" },
    { id: 2, name: "FW-LYO-01", type: "Firewall", site: "Lyon", status: "online" },
    { id: 3, name: "SW-BDX-02", type: "Switch", site: "Bordeaux", status: "offline" },
  ],
  incidents: [
    {
      id: 1,
      title: "Perte de connectivité",
      severity: "high",
      status: "open",
      equipmentId: 3,
    },
    {
      id: 2,
      title: "Charge CPU élevée",
      severity: "medium",
      status: "in_progress",
      equipmentId: 1,
    },
  ],
  users: [
    { id: 1, name: "Alice Martin", email: "alice@nexusops.local", role: "admin" },
    { id: 2, name: "Lucas Bernard", email: "lucas@nexusops.local", role: "operator" },
    { id: 3, name: "Emma Robert", email: "emma@nexusops.local", role: "viewer" },
  ],
};
