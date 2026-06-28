import { PosterGridSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="px-6 sm:px-10 pt-28 pb-16 bg-zinc-950 min-h-full">
      <div className="h-9 w-56 rounded bg-white/10 animate-pulse mb-6" />
      <PosterGridSkeleton />
    </div>
  );
}
