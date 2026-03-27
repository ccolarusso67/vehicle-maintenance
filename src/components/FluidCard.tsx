'use client';

import { FluidSpec } from '@/data/types';

interface Props {
  fluid: FluidSpec;
}

/** Convert liters to imperial (quarts or gallons) as primary display */
function formatCapacity(c: string): string {
  // Handle range patterns like "9-10 litre" first
  let result = c.replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*litre/gi, (_match, lo, hi) => {
    const loL = parseFloat(lo), hiL = parseFloat(hi);
    if (hiL >= 3.785) {
      return `${(loL / 3.785).toFixed(1)}-${(hiL / 3.785).toFixed(1)} gal`;
    }
    return `${(loL * 1.05669).toFixed(1)}-${(hiL * 1.05669).toFixed(1)} qt`;
  });
  // Convert single values: "X.X litre" → quarts/gallons
  result = result.replace(/(\d+(?:\.\d+)?)\s*litre/gi, (_match, num) => {
    const liters = parseFloat(num);
    if (liters >= 3.785) {
      return `${(liters / 3.785).toFixed(1)} gal`;
    }
    return `${(liters * 1.05669).toFixed(1)} qt`;
  });
  // Strip "Capacity " prefix — redundant with the "Cap." label
  result = result.replace(/Capacity\s+/gi, '');
  // Convert grams → oz
  result = result.replace(/(\d+(?:-\d+)?)\s*grams?/gi, (_match, num) => {
    if (num.includes('-')) {
      const [lo, hi] = num.split('-').map(Number);
      return `${(lo * 0.03527396).toFixed(1)}-${(hi * 0.03527396).toFixed(1)} oz`;
    }
    return `${(parseInt(num) * 0.03527396).toFixed(1)} oz`;
  });
  return result;
}

/** Convert intervals to miles-only display */
function formatInterval(i: string): string {
  let result = i;
  // Strip "Change " prefix — redundant with label
  result = result.replace(/^Change\s+/i, '');
  // If already in miles only, return as-is
  if (result.includes('mile') && !result.includes('km')) return result;
  // Convert km to miles, drop km portion
  result = result.replace(/(\d+)\s*km/gi, (_match, num) => {
    const km = parseInt(num);
    const miles = Math.round(km * 0.621371);
    return miles >= 1000 ? `${Math.round(miles / 1000)}k miles` : `${miles.toLocaleString()} miles`;
  });
  // Clean up any "/ " left from dual display
  result = result.replace(/\s*\/\s*(?=\d+k?\s*mi)/g, '');
  return result;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs font-bold text-[#888] uppercase tracking-widest w-16 flex-shrink-0 pt-0.5">
        {label}
      </span>
      <span className="text-sm text-[#333] font-medium">{value}</span>
    </div>
  );
}

export default function FluidCard({ fluid }: Props) {
  const hasProduct = fluid.p && fluid.p !== 'Special Product';
  const isSpecial = fluid.p === 'Special Product';

  return (
    <div className="border border-[#DFDFDF] bg-white hover:border-[#FFC700] transition-all hover:shadow-lg group">
      {/* Header: icon + name */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#f0f0f0]">
        <span className="text-2xl flex-shrink-0">{fluid.ic}</span>
        <h3 className="font-bold text-black text-base uppercase tracking-wide truncate">
          {fluid.n}
        </h3>
      </div>

      {/* Body: specs */}
      <div className="px-5 py-4 space-y-2.5">
        {/* Ultra1Plus product highlight */}
        {hasProduct && (
          <div className="bg-[#FFF8E1] border border-[#FFC700]/30 px-3 py-2.5 -mx-1">
            <div className="flex items-start gap-2">
              <span className="text-xs font-bold text-[#FFC700] uppercase tracking-widest w-16 flex-shrink-0 pt-0.5">
                U1P
              </span>
              <div className="min-w-0">
                <span className="text-sm text-[#333] font-bold block truncate">
                  {fluid.p}
                </span>
                {fluid.u1pSku && (
                  <span className="text-xs text-[#888] font-mono mt-0.5 block">
                    SKU: {fluid.u1pSku}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {isSpecial && (
          <DetailRow label="Product" value="OEM / Special Product" />
        )}

        {fluid.pc && <DetailRow label="Part" value={fluid.pc} />}
        {fluid.c && <DetailRow label="Cap." value={formatCapacity(fluid.c)} />}
        {fluid.i && <DetailRow label="Intv." value={formatInterval(fluid.i)} />}
      </div>

      {/* Gold bottom accent on hover */}
      <div className="h-[2px] bg-[#DFDFDF] group-hover:bg-[#FFC700] transition-colors" />
    </div>
  );
}
