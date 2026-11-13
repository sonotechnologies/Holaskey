import { Bone, GridSkeleton } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="wrap pb-16 pt-6 lg:pt-12" role="status" aria-label="Loading products">
      <Bone className="mb-3 h-3 w-28" />
      <Bone className="mb-6 h-10 w-56" />
      <Bone className="mb-6 h-11 w-full" />
      <div className="flex gap-12">
        <div className="hidden w-[220px] flex-none flex-col gap-2 lg:flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <Bone key={i} className="h-10" />
          ))}
        </div>
        <div className="flex-1">
          <GridSkeleton count={9} />
        </div>
      </div>
    </div>
  );
}
