export default function PrivacyPage() {
  return (
    <div className="px-6 sm:px-10 pt-28 pb-16 bg-zinc-950 min-h-full text-white/80 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
      <p className="mb-4 leading-relaxed">
        We do not require an account to use MovieX. Browsing history used for the
        &quot;Continue Watching&quot; and &quot;Recently Watched&quot; features is
        stored only in your browser&apos;s local storage and is never transmitted to
        our servers.
      </p>
      <p className="mb-4 leading-relaxed">
        Movie metadata and artwork are sourced from The Movie Database (TMDB).
        Video playback is provided by third-party embed partners, which may set
        their own cookies and serve their own advertisements subject to their
        respective privacy policies.
      </p>
      <p className="leading-relaxed">
        We may display advertisements from third-party ad networks. These networks
        may use cookies or similar technologies to serve relevant ads.
      </p>
    </div>
  );
}
