import type { FormEvent, ReactNode } from "react";
export default function Editor({ title, children, error, onSave, onCancel, disabled = false }: {
  title: string; children: ReactNode; error: string; onSave: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void; disabled?: boolean;
}) {
  return <form className="editor" onSubmit={onSave}>
    <div className="editor-heading"><h3>{title}</h3><button type="button" className="icon-button" onClick={onCancel} aria-label="Fermer">×</button></div>
    <div className="form-grid">{children}</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="editor-actions"><button type="button" className="btn btn-ghost" onClick={onCancel}>Annuler</button><button className="btn btn-primary" type="submit" disabled={disabled}>Enregistrer</button></div>
  </form>;
}
