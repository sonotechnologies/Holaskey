import { Bone } from '@/components/Skeletons';

export default function Loading() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Loading">
      {Array.from({ length: 5 }).map((_, i) => (
        <Bone key={i} className="h-16" />
      ))}
    </div>
  );
}
