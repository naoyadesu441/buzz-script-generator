export function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div
          key={n}
          className={`h-1.5 flex-1 rounded-full transition-all ${
            n <= current ? 'bg-neon-purple' : 'bg-border'
          }`}
        />
      ))}
      <span className="text-xs text-text-muted ml-1">{current}/{total}</span>
    </div>
  );
}
