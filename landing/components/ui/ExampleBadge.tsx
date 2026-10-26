export function ExampleBadge({ label, className }: { label: string; className?: string }) {
  return <span className={className ? `ex ${className}` : 'ex'}>{label}</span>;
}
