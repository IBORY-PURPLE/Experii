export function PhoneFrame({ className }: { className?: string }) {
  return <div className={className ? `phone ${className}` : 'phone'} aria-hidden="true" />;
}
