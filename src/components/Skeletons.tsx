export function PosterGridSkeleton({ count = 18 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-8">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
          <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function MovieRowSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="mb-10">
      <div className="h-6 w-40 rounded bg-white/5 animate-pulse mb-3 ml-6 sm:ml-10" />
      <div className="flex gap-3 overflow-x-hidden px-6 sm:px-10">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="shrink-0 w-[140px] sm:w-[180px] aspect-[2/3] rounded-md bg-white/5 animate-pulse"
          />
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return <div className="w-full h-[56vw] max-h-[60vh] sm:max-h-[80vh] min-h-[340px] sm:min-h-[420px] bg-white/5 animate-pulse" />;
}

export function MovieDetailSkeleton() {
  return (
    <div className="bg-zinc-950 min-h-full">
      <div className="w-full h-[40vh] sm:h-[50vh] bg-white/5 animate-pulse" />
      <div className="px-6 sm:px-10 max-w-5xl mx-auto -mt-24 relative pb-16">
        <div className="flex flex-col sm:flex-row gap-6 mb-8">
          <div className="w-32 sm:w-44 aspect-[2/3] rounded-xl bg-white/10 animate-pulse shrink-0" />
          <div className="flex flex-col justify-end gap-3 flex-1">
            <div className="h-8 w-2/3 rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-24 rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-full rounded bg-white/10 animate-pulse" />
            <div className="h-4 w-5/6 rounded bg-white/10 animate-pulse" />
          </div>
        </div>
        <div className="aspect-video w-full rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
