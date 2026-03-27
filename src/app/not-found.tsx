import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Gold top bar */}
      <div className="h-[3px] bg-[#FFC700]" />

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="text-8xl font-black text-[#FFC700] mb-4">404</div>
          <h1 className="text-3xl font-black text-black uppercase tracking-wide mb-3">
            Vehicle Not Found
          </h1>
          <p className="text-[#666] mb-8">
            We couldn&apos;t find that page. The vehicle or URL you&apos;re looking for may have
            been moved or doesn&apos;t exist.
          </p>

          <div className="space-y-4">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-[#FFC700] text-black font-bold uppercase tracking-wide hover:bg-[#e6b400] transition-colors"
            >
              &#9670; Find Your Vehicle
            </Link>

            <div className="text-sm text-[#888]">
              <p className="mb-3">Popular lookups:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['ford/f-150', 'toyota/camry', 'chevrolet/silverado', 'honda/civic', 'jeep/wrangler'].map(slug => (
                  <Link
                    key={slug}
                    href={`/${slug}`}
                    className="px-3 py-1.5 border border-[#DFDFDF] text-xs font-bold uppercase tracking-wide hover:border-[#FFC700] hover:text-black transition-colors"
                  >
                    {slug.replace('/', ' ').replace('-', ' ')}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer bar */}
      <div className="h-[3px] bg-[#FFC700]" />
    </div>
  );
}
