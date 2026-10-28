type Props={label:string;variant?:"success"|"danger"|"warning"|"info"|"neutral"};
export default function StatusBadge({label,variant="neutral"}:Props){return <span className={`status-badge status-badge-${variant}`}>{label}</span>}
