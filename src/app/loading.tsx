import { HeroSkeleton, MovieRowSkeleton } from "@/components/Skeletons";

export default function Loading() {
  return (
    <div className="bg-zinc-950 min-h-full">
      <HeroSkeleton />
      <div className="relative -mt-16 z-10 pt-4">
        <MovieRowSkeleton />
        <MovieRowSkeleton />
        <MovieRowSkeleton />
        <MovieRowSkeleton />
      </div>
    </div>
  );
}
