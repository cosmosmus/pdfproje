/* Yükleme akışlarının (yeni PDF + PDF güncelleme) ortak parçaları:
   aşama satırı ve dosya boyutu formatı. */

export function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function StageRow({
  done,
  active,
  label,
  detail,
}: {
  done: boolean;
  active: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-5 h-5 shrink-0 flex items-center justify-center">
        {done ? (
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4 text-signal">
            <circle cx="8" cy="8" r="7" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : active ? (
          <span className="w-3.5 h-3.5 rounded-full border-2 border-signal border-t-transparent animate-spin block" />
        ) : (
          <span className="w-3 h-3 rounded-full border border-rule block mx-auto" />
        )}
      </span>
      <span className={`text-sm flex-1 ${active ? "text-ink font-medium" : done ? "text-ink/40 line-through decoration-1" : "text-ink/30"}`}>
        {label}
      </span>
      {detail && <span className="font-mono text-xs text-signal">{detail}</span>}
    </div>
  );
}
