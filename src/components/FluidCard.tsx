'use client';

import { FluidSpec } from '@/data/types';

interface Props {
  fluid: FluidSpec;
}

/** Convert "Capacity X.X litre" to include quarts */
function addQuarts(capacity: string): string {
  const match = capacity.match(/(\d+(?:\.\d+)?)\s*litre/i);
  if (!match) return capacity;
  const liters = parseFloat(match[1]);
  const quarts = (liters * 1.05669).toFixed(1);
  return capacity.replace(
    /(\d+(?:\.\d+)?)\s*litre/i,
    `${match[1]} litre (${quarts} qt)`
  );
}

/** Convert "X grams" to oz where useful */
function addOz(capacity: string): string {
  const match = capacity.match(/(\d+(?:-\d+)?)\s*grams/i);
  if (!match) return capacity;
  // If it's a range like "100-135 grams"
  if (match[1].includes('-')) {
    const [lo, hi] = match[1].split('-').map(Number);
    const loOz = (lo * 0.03527396).toFixed(1);
    const hiOz = (hi * 0.03527396).toFixed(1);
    return capacity.replace(match[0], `${match[1]} g (${loOz}-${hiOz} oz)`);
  }
  const grams = parseInt(match[1]);
  const oz = (grams * 0.03527396).toFixed(1);
  return capacity.replace(match[0], `${match[1]} g (${oz} oz)`);
}

/** Convert km intervals to include miles */
function addMiles(interval: string): string {
  // Already has miles? skip
  if (interval.includes('mile')) return interval;
  const match = interval.match(/(\d+)\s*km/i);
  if (!match) return interval;
  const km = parseInt(match[1]);
  const miles = Math.round(km * 0.621371);
  const milesFormatted = miles >= 1000 ? `${(miles / 1000).toFixed(0)}k` : String(miles);
  return interval.replace(
    /(\d+)\s*km/i,
    `${match[1]} km / ${milesFormatted} mi`
  );
}

function formatCapacity(c: string): string {
  return addOz(addQuarts(c));
}

function formatInterval(i: string): string {
  return addMiles(i);
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
