/** Placeholder blocks shown instantly while a page loads (shimmer is skipped for reduced motion). */
export function Bone({ className = '' }: { className?: string }) {
  return <div className={`skeleton bg-smoke ${className}`} />;
}

export function GridSkeleton({ count = 6, cols = 'grid-cols-2 md:grid-cols-3' }: { count?: number; cols?: string }) {
  return (
    <div className={`grid gap-x-3 gap-y-6 lg:gap-6 ${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-3">
          <Bone className="aspect-[4/5]" />
          <Bone className="h-3 w-1/3" />
          <Bone className="h-4 w-2/3" />
          <Bone className="h-4 w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="wrap pb-16 pt-6 lg:pt-12" role="status" aria-label="Loading">
      <Bone className="mb-3 h-3 w-24" />
      <Bone className="mb-8 h-10 w-64" />
      <GridSkeleton />
    </div>
  );
}
