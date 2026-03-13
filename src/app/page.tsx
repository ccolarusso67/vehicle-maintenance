'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import VehicleSelector from '@/components/VehicleSelector';
import FluidCard from '@/components/FluidCard';
import ChatBot from '@/components/ChatBot';
import { VehicleType, MakeIndex } from '@/data/types';

interface SelectedVehicle {
  make: string;
  model: string;
  type: VehicleType;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+`;
  return String(n);
}

function cleanMakeName(name: string): string {
  return name.replace(/\s*\(.*\)$/, '');
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '') // remove parentheses like (USA / CAN)
    .replace(/[^a-z0-9]+/g, '-')   // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '');       // trim leading/trailing hyphens
}

function getUrlParams(): { make: string; model: string; type: string } {
  if (typeof window === 'undefined') return { make: '', model: '', type: '' };
  const path = window.location.pathname.replace(/^\//, '').replace(/\/$/, '');
  if (!path) return { make: '', model: '', type: '' };
  const parts = path.split('/');
  return {
    make: decodeURIComponent(parts[0] || ''),
    model: decodeURIComponent(parts[1] || ''),
    type: decodeURIComponent(parts[2] || ''),
  };
}

export default function Home() {
  const [vehicle, setVehicle] = useState<SelectedVehicle | null>(null);
  const [stats, setStats] = useState({ makes: 0, models: 0 });
  const [urlParams] = useState(getUrlParams);

  useEffect(() => {
    fetch('/data/index.json')
      .then(r => r.json())
      .then((makes: MakeIndex[]) => {
        const totalModels = makes.reduce((sum, m) => sum + m.models, 0);
        setStats({ makes: makes.length, models: totalModels });
      })
      .catch(console.error);
  }, []);

  // Update URL when vehicle changes — clean slugs, no special characters
  const handleVehicleSelect = useCallback((v: SelectedVehicle | null) => {
    setVehicle(v);
    if (v) {
      const slug = `/${toSlug(v.make)}/${toSlug(v.model)}/${toSlug(v.type.name)}`;
      window.history.replaceState({}, '', slug);
    } else {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <Header />

      <main className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full flex-1 bg-white">
        <VehicleSelector
          onSelect={handleVehicleSelect}
          initialMake={urlParams.make}
          initialModel={urlParams.model}
          initialType={urlParams.type}
        />

        {vehicle && (
          <div className="animate-fade-in">
            {/* Vehicle Info Banner */}
            <div className="bg-black text-white p-6 mb-8">
              <div className="flex items-center gap-4">
                <div className="w-1 h-12 bg-[#FFC700]" />
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-wide">
                    {cleanMakeName(vehicle.make)}
                  </h2>
                  <p className="text-[#FFC700] mt-1 font-medium">
                    {vehicle.type.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Fluids Section */}
            <div>
              <h2 className="text-xl font-bold text-black mb-1 flex items-center gap-2 uppercase tracking-wide">
                <span className="text-[#FFC700]">&#9670;</span>
                Fluids &amp; Specifications
              </h2>
              <p className="text-sm text-[#888] mb-4">
                {vehicle.type.fluids.length} fluid specifications found for this vehicle
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {vehicle.type.fluids.map((fluid, idx) => (
                  <div
                    key={fluid.n}
                    className="animate-fade-in"
                    style={{ animationDelay: `${idx * 60}ms` }}
                  >
                    <FluidCard fluid={fluid} />
                  </div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <div className="bg-[#fff8e1] border-l-4 border-[#FFC700] p-5 text-sm text-[#333] mt-8">
              <p className="font-bold mb-1 uppercase tracking-wide text-xs">Disclaimer</p>
              <p className="text-[#666]">
                This information is provided as a general guide. Always consult your
                vehicle&apos;s owner&apos;s manual for the most accurate and up-to-date
                specifications. Fluid types and capacities may vary by trim level,
                production date, and regional market. When in doubt, consult a certified
                mechanic or your dealership.
              </p>
            </div>
          </div>
        )}

        {!vehicle && (
          <div className="text-center py-20">
            <div className="text-6xl mb-6">&#9670;</div>
            <h2 className="text-3xl font-black text-black mb-3 uppercase tracking-wide">
              Select your vehicle above
            </h2>
            <p className="text-[#666] max-w-md mx-auto">
              Choose your vehicle&apos;s make and model to see all the fluids you need
              with recommended products, capacities, and service intervals.
            </p>
            <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-xl mx-auto">
              <div className="flex flex-col items-center gap-2 p-4 border border-[#DFDFDF] hover:border-[#FFC700] transition-colors">
                <span className="text-[#FFC700] text-3xl font-black">
                  {stats.makes || '...'}
                </span>
                <span className="text-xs font-bold text-[#888] uppercase tracking-widest">Makes</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border border-[#DFDFDF] hover:border-[#FFC700] transition-colors">
                <span className="text-[#FFC700] text-3xl font-black">
                  {stats.models ? formatNumber(stats.models) : '...'}
                </span>
                <span className="text-xs font-bold text-[#888] uppercase tracking-widest">Models</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border border-[#DFDFDF] hover:border-[#FFC700] transition-colors">
                <span className="text-[#FFC700] text-3xl font-black">All</span>
                <span className="text-xs font-bold text-[#888] uppercase tracking-widest">Fluids</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 border border-[#DFDFDF] hover:border-[#FFC700] transition-colors">
                <span className="text-[#FFC700] text-3xl font-black">&#10003;</span>
                <span className="text-xs font-bold text-[#888] uppercase tracking-widest">Intervals</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Blog Section */}
      <section className="bg-white py-16">
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-wide flex items-center justify-center gap-3">
              <span className="text-[#FFC700]">&#9670;</span>
              From the Blog
            </h2>
            <p className="text-sm text-[#888] mt-2">
              Tips, guides, and insights from Ultra1Plus experts
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Engine Oil Contamination Explained',
                desc: 'Engine oil can become contaminated during storage and while in use. Learn the causes and how to prevent it.',
                img: 'https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/640w/uploaded_images/u1p-blog-oil-contam-02.jpg',
                url: 'https://ultra1plus.com/blog/engine-oil-contamination-explained-causes-sources-and-how-it-happens/',
              },
              {
                title: 'Power Steering Fluid Explained',
                desc: 'Discover the key role power steering fluid plays in making your vehicle easier, safer, and more comfortable to steer.',
                img: 'https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/640w/uploaded_images/u1p-blog-power-steering.jpg',
                url: 'https://ultra1plus.com/blog/power-steering-fluid-explained-the-invisible-force-behind-effortless-control/',
              },
              {
                title: 'How Long Does Motor Oil Last?',
                desc: 'Understanding oil longevity is essential for maintaining your engine, preventing wear, and ensuring protection.',
                img: 'https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/640w/uploaded_images/u1p-blog-2560x948-aceite1.jpg',
                url: 'https://ultra1plus.com/blog/how-long-does-motor-oil-last/',
              },
              {
                title: 'Motor Oil Viscosity Explained',
                desc: 'Viscosity determines how easily oil flows in your engine, especially across various temperatures.',
                img: 'https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/640w/uploaded_images/u1p-blog-2560x948-viscosity.jpg',
                url: 'https://ultra1plus.com/blog/motor-oil-viscosity-explained/',
              },
              {
                title: 'Motor Oil Color: What It Means',
                desc: 'The color of motor oil reveals a lot about your engine\'s health and oil condition.',
                img: 'https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/640w/uploaded_images/u1p-blog-2560x948-color.jpg',
                url: 'https://ultra1plus.com/blog/what-should-you-know-about-motor-oil-color/',
              },
              {
                title: '5W-30 Motor Oil Complete Guide',
                desc: 'Everything you need to know about 5W-30 oil — what the numbers mean, benefits, and limitations.',
                img: 'https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/640w/uploaded_images/gemini-generated-image-39jogs39jogs39jo.png',
                url: 'https://ultra1plus.com/blog/5w30-motor-oil-guide',
              },
            ].map((post) => (
              <a
                key={post.title}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#B8B8B8] bg-white hover:border-[#FFC700] transition-all hover:shadow-lg group flex flex-col"
              >
                <div className="aspect-[16/9] overflow-hidden bg-[#f0f0f0]">
                  <img
                    src={post.img}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-extrabold text-black text-lg leading-tight mb-2 group-hover:text-[#FFC700] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[#666] flex-1">
                    {post.desc}
                  </p>
                  <span className="mt-4 text-xs font-bold text-[#FFC700] uppercase tracking-widest">
                    Read more &rarr;
                  </span>
                </div>
              </a>
            ))}
          </div>
          <div className="text-center mt-10">
            <a
              href="https://ultra1plus.com/blog/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold"
            >
              View All Articles
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-black text-white mt-0">
        <div className="h-[3px] bg-[#FFC700]" />
        <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/original/recurso_1_1757027375__15872.original.png" alt="Ultra1Plus™" className="h-10 w-auto" />
              <span className="text-gray-500 text-sm">Vehicle Maintenance Guide</span>
            </div>
            <p className="text-gray-500 text-sm">
              For reference only &middot; Always consult your owner&apos;s manual
            </p>
          </div>
        </div>
      </footer>

      <ChatBot />
    </div>
  );
}
