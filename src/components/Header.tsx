'use client';

import { useState } from 'react';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Shop', href: 'https://ultra1plus.com' },
    { label: 'Blog', href: 'https://ultra1plus.com/blog/' },
  ];

  return (
    <header className="bg-black text-white">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <a href="https://ultra1plus.com">
            <img
              src="https://cdn11.bigcommerce.com/s-w94u0bjkb6/images/stencil/original/recurso_1_1757027375__15872.original.png"
              alt="Ultra1Plus™ Premium Quality Oils"
              className="h-12 sm:h-14 w-auto"
            />
          </a>

          {/* Nav links - desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-gray-300 hover:text-[#FFC700] transition-colors uppercase tracking-wide"
              >
                {link.label}
              </a>
            ))}
            <span className="text-sm font-bold text-[#FFC700] uppercase tracking-wide border-b-2 border-[#FFC700] pb-1">
              Maintenance Guide
            </span>
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            <span className={`hamburger-line ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? 'opacity-0' : ''}`} />
            <span className={`hamburger-line ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <nav className="md:hidden border-t border-gray-800 animate-slide-down">
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-6 py-3.5 text-sm font-medium text-gray-300 hover:text-[#FFC700] hover:bg-gray-900 transition-colors uppercase tracking-wide"
              >
                {link.label}
              </a>
            ))}
            <span className="px-6 py-3.5 text-sm font-bold text-[#FFC700] uppercase tracking-wide bg-gray-900 border-l-2 border-[#FFC700]">
              Maintenance Guide
            </span>
          </div>
        </nav>
      )}

      {/* Gold accent line */}
      <div className="h-[3px] bg-[#FFC700]" />
    </header>
  );
}
