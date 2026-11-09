import { HIGHLIGHT_STATUSES } from '@/lib/format';

/** Mono uppercase tag with a small dot; terracotta when the customer needs to act. */
export function StatusTag({ status, label }: { status: string; label: string }) {
  const hot = HIGHLIGHT_STATUSES.has(status);
  return (
    <span className={`label inline-flex items-center gap-2 ${hot ? 'text-accent' : 'text-muted'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${hot ? 'bg-accent' : 'bg-muted'}`} aria-hidden />
      {label}
    </span>
  );
}

/** Horizontal status tracker (Submitted → … → Delivered). */
export function Tracker({ labels, current, minWidth = 96 }: { labels: string[]; current: number; minWidth?: number }) {
  return (
    <ol className="no-scrollbar flex overflow-x-auto" aria-label="Progress">
      {labels.map((label, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={label} className="flex flex-1 flex-col gap-2.5" style={{ flexBasis: minWidth, minWidth }} aria-current={now ? 'step' : undefined}>
            <div className="flex items-center">
              <span
                className={`h-2.5 w-2.5 flex-none rounded-full border ${
                  done ? 'border-ink bg-ink' : now ? 'border-accent bg-accent' : 'border-muted bg-transparent'
                }`}
              />
              <span className={`h-px flex-1 ${i === labels.length - 1 ? 'bg-transparent' : done ? 'bg-ink' : 'bg-line'}`} />
            </div>
            <span className={`label-sm pr-2 ${i <= current ? 'text-ink' : 'text-muted'}`}>
              {label}
              {done ? <span className="sr-only"> (done)</span> : now ? <span className="sr-only"> (current)</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
