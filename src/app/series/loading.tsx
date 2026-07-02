import { MovieRowSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="bg-zinc-950 min-h-full pt-24 pb-24">
      <div className="px-6 sm:px-10 mb-8">
        <div className="h-9 w-48 rounded bg-white/10 animate-pulse" />
        <div className="h-4 w-72 rounded bg-white/5 animate-pulse mt-2" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <MovieRowSkeleton key={i} />
      ))}
    </div>
  );
}
