import { useState, type FormEvent } from "react";

type Props = {
  onLogin: (email: string, password: string) => Promise<void>;
  error: string;
};

export default function Login({ onLogin, error }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onLogin(email, password);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand auth-brand">
          <div className="brand-icon">N</div>
          <div><strong>NEXUS<span>OPS</span></strong><small>CONTROL CENTER</small></div>
        </div>
        <p className="eyebrow">ESPACE SÉCURISÉ</p>
        <h1>Connexion</h1>
        <p className="page-description">Connectez-vous pour accéder aux données de l’infrastructure.</p>
        <label>
          Adresse e-mail
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={event => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={event => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn-primary auth-submit" type="submit" disabled={submitting}>
          {submitting ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
