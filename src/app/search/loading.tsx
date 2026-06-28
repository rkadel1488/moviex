import { PosterGridSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="px-6 sm:px-10 pt-28 pb-16 bg-zinc-950 min-h-full">
      <div className="h-8 w-40 rounded bg-white/10 animate-pulse mb-6" />
      <div className="h-12 w-full rounded-lg bg-white/10 animate-pulse mb-6" />
      <PosterGridSkeleton />
    </div>
  );
}
