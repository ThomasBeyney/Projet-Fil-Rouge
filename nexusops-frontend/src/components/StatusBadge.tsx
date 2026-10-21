type StatusBadgeProps = {
  label: string;
  variant?: "success" | "danger" | "warning" | "info" | "neutral";
};

function StatusBadge({ label, variant = "neutral" }: StatusBadgeProps) {
  return <span className={`status-badge status-badge-${variant}`}>{label}</span>;
}

export default StatusBadge;