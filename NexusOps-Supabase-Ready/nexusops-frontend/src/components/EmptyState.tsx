export default function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="empty"><div className="empty-symbol">◇</div><strong>{title}</strong><p>{description}</p></div>;
}
