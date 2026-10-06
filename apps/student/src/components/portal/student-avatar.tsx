export function StudentAvatar({ name, compact = false, className = "" }: {
  name: string;
  compact?: boolean;
  className?: string;
}) {
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("id-ID");
  return <span aria-hidden="true" className={`portal-avatar${compact ? " compact" : ""}${className ? ` ${className}` : ""}`}>{initials}</span>;
}
