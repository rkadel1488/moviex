export default function AboutPage() {
  return (
    <div className="px-6 sm:px-10 pt-28 pb-16 bg-zinc-950 min-h-full text-white/80 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">About Us</h1>
      <p className="mb-4 leading-relaxed">
        MovieX is a movie discovery platform that helps you find and explore films
        across genres, languages, and regions. We aggregate metadata from The Movie
        Database (TMDB) to bring you up-to-date information on the latest releases,
        top-rated titles, and hidden gems.
      </p>
      <p className="leading-relaxed">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </p>
    </div>
  );
}
