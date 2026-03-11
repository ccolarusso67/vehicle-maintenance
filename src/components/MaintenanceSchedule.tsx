'use client';

import { MaintenanceItem } from '@/data/types';

interface Props {
  items: MaintenanceItem[];
}

const priorityConfig = {
  critical: {
    label: 'Critical',
    bg: 'bg-[#fff8e1]',
    border: 'border-[#FFC700]',
    badge: 'bg-[#FFC700] text-black',
    dot: 'bg-[#FFC700]',
  },
  important: {
    label: 'Important',
    bg: 'bg-[#f5f5f5]',
    border: 'border-[#888]',
    badge: 'bg-[#333] text-white',
    dot: 'bg-[#333]',
  },
  recommended: {
    label: 'Recommended',
    bg: 'bg-white',
    border: 'border-[#DFDFDF]',
    badge: 'bg-[#DFDFDF] text-[#333]',
    dot: 'bg-[#DFDFDF]',
  },
};

function formatMiles(miles: number): string {
  if (miles >= 1000) {
    return `${(miles / 1000).toFixed(miles % 1000 === 0 ? 0 : 1)}k`;
  }
  return miles.toLocaleString();
}

export default function MaintenanceSchedule({ items }: Props) {
  const sorted = [...items].sort((a, b) => a.intervalMiles - b.intervalMiles);

  return (
    <div className="bg-white border border-[#DFDFDF] p-6 sm:p-8">
      <h2 className="text-xl font-bold text-black mb-1 flex items-center gap-2 uppercase tracking-wide">
        <span className="text-[#FFC700]">&#9670;</span>
        Maintenance Schedule
      </h2>
      <p className="text-sm text-[#888] mb-6">
        Sorted by service interval. Follow the shorter interval for severe driving conditions.
      </p>

      <div className="flex flex-wrap gap-4 mb-6">
        {(['critical', 'important', 'recommended'] as const).map((p) => (
          <div key={p} className="flex items-center gap-2 text-sm">
            <span className={`w-3 h-3 ${priorityConfig[p].dot}`} />
            <span className="text-[#333] font-medium uppercase text-xs tracking-wide">{priorityConfig[p].label}</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {sorted.map((item) => {
          const config = priorityConfig[item.priority];
          return (
            <div
              key={item.name}
              className={`flex items-center gap-4 p-4 border-l-4 ${config.bg} ${config.border} transition-all hover:shadow-md`}
            >
              <span className="text-2xl flex-shrink-0">{item.icon}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-black uppercase tracking-wide text-sm">{item.name}</h3>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badge}`}>
                    {config.label}
                  </span>
                </div>
                <p className="text-sm text-[#666] mt-1">{item.description}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-lg font-black text-black">
                  {formatMiles(item.intervalMiles)} mi
                </div>
                {item.intervalMonths && (
                  <div className="text-[10px] text-[#888] font-bold uppercase tracking-wider">
                    or {item.intervalMonths} mo
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
