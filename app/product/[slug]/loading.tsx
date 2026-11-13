import { Bone } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="wrap pb-16 pt-4 lg:pt-8" role="status" aria-label="Loading product">
      <Bone className="mb-6 h-3 w-32" />
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-16">
        <Bone className="aspect-[4/5]" />
        <div className="flex flex-col gap-4">
          <Bone className="h-3 w-24" />
          <Bone className="h-12 w-3/4" />
          <Bone className="h-6 w-28" />
          <Bone className="mt-6 h-11 w-40" />
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bone key={i} className="h-12" />
            ))}
          </div>
          <Bone className="h-12" />
        </div>
      </div>
    </div>
  );
}
