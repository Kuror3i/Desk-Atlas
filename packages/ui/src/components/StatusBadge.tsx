export interface StatusBadgeProps {
  label: string;
  tone?: 'default' | 'positive' | 'warning';
}

export function StatusBadge({ label, tone = 'default' }: StatusBadgeProps) {
  const toneClasses = {
    default: 'bg-slate-800 text-slate-200',
    positive: 'bg-emerald-600/20 text-emerald-300',
    warning: 'bg-amber-600/20 text-amber-300',
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      {label}
    </span>
  );
}
