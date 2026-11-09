import Link from 'next/link';

export function StatusFilter({ base, current, options }: { base: string; current: string; options: [string, string][] }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
      {options.map(([value, label]) => (
        <Link
          key={value}
          href={value ? `${base}?status=${value}` : base}
          aria-current={current === value ? 'page' : undefined}
          className={`chip flex-none whitespace-nowrap hover:no-underline ${current === value ? 'chip-on hover:text-bg' : 'hover:text-ink'}`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
