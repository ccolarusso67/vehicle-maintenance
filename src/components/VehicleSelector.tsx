'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MakeIndex, MakeData, VehicleType, VehicleDomain, domainDataPath } from '@/data/types';

/** Strip region suffix like "(USA / CAN)" or "(USA)" from make names */
function cleanMakeName(name: string): string {
  return name.replace(/\s*\(.*\)$/, '');
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s*\(.*?\)\s*/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchSlug(name: string, slug: string): boolean {
  return toSlug(name) === slug;
}

interface Props {
  domain: VehicleDomain;
  onSelect: (vehicle: { make: string; model: string; type: VehicleType } | null) => void;
  initialMake?: string;
  initialModel?: string;
  initialType?: string;
}

interface DropdownOption {
  value: string;
  label: string;
  sublabel?: string;
}

const POPULAR_VEHICLES = [
  { make: 'Ford (USA)', model: 'F-150', label: 'Ford F-150' },
  { make: 'Chevrolet (USA / CAN)', model: 'Silverado', label: 'Chevy Silverado' },
  { make: 'Ram', model: '1500', label: 'Ram 1500' },
  { make: 'Toyota (USA / CAN)', model: 'Camry', label: 'Toyota Camry' },
  { make: 'Toyota (USA / CAN)', model: 'RAV4', label: 'Toyota RAV4' },
  { make: 'Honda (USA / CAN)', model: 'Civic', label: 'Honda Civic' },
  { make: 'Honda (USA / CAN)', model: 'CR-V', label: 'Honda CR-V' },
  { make: 'Tesla (USA)', model: 'Model', label: 'Tesla Model 3/Y' },
  { make: 'Jeep (USA / CAN)', model: 'Grand Cherokee', label: 'Jeep Grand Cherokee' },
  { make: 'Nissan (USA / CAN)', model: 'Rogue', label: 'Nissan Rogue' },
];

function SearchableDropdown({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  loading = false,
}: {
  label: string;
  placeholder: string;
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightIdx, setHighlightIdx] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options;

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, []);

  // Auto-focus input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Reset highlight when filtered list changes
  useEffect(() => {
    setHighlightIdx(0);
  }, [search]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (open && listRef.current) {
      const item = listRef.current.children[highlightIdx] as HTMLElement;
      if (item) item.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIdx, open]);

  const handleSelect = useCallback((val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  }, [onChange]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[highlightIdx]) {
      e.preventDefault();
      handleSelect(filtered[highlightIdx].value);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setSearch('');
    }
  }

  const displayValue = options.find(o => o.value === value)?.label;

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-bold text-[#FFC700] mb-2 uppercase tracking-widest">
        {label}
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => { if (!disabled) setOpen(!open); }}
        disabled={disabled}
        className={`w-full px-4 py-3.5 border-2 bg-white text-left flex items-center justify-between
          text-sm font-medium transition-all min-h-[48px] uppercase tracking-wide
          ${disabled ? 'opacity-40 cursor-not-allowed border-[#DFDFDF]' : 'cursor-pointer border-[#DFDFDF] hover:border-[#FFC700]/50'}
          ${open ? 'border-[#FFC700] ring-2 ring-[#FFC700]/20' : ''}
        `}
      >
        <span className={displayValue ? 'text-[#333] truncate' : 'text-[#999]'}>
          {loading ? 'Loading...' : (displayValue || placeholder)}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 ml-2 text-[#888] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="search-dropdown absolute top-full left-0 right-0 mt-1 bg-white border-2 border-[#FFC700] shadow-xl animate-slide-down">
          {/* Search input */}
          {options.length > 5 && (
            <div className="sticky top-0 bg-white p-2 border-b border-[#DFDFDF] z-10">
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Search ${label.toLowerCase()}...`}
                className="w-full px-3 py-2.5 text-sm border border-[#DFDFDF] bg-[#f9f9f9]
                  focus:outline-none focus:border-[#FFC700] normal-case tracking-normal"
              />
            </div>
          )}

          {/* Options */}
          <div ref={listRef} className="max-h-[300px] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[#999] italic normal-case">
                No matches found
              </div>
            ) : (
              filtered.map((option, idx) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightIdx(idx)}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors
                    border-b border-[#f0f0f0] last:border-0 min-h-[44px] flex items-center justify-between
                    ${idx === highlightIdx ? 'bg-[#FFF8E1] text-black' : 'text-[#333] hover:bg-[#FFF8E1]'}
                    ${option.value === value ? 'font-bold' : ''}
                  `}
                >
                  <span className="truncate normal-case">{option.label}</span>
                  {option.sublabel && (
                    <span className="text-xs text-[#999] ml-3 flex-shrink-0 normal-case">
                      {option.sublabel}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function VehicleSelector({ domain, onSelect, initialMake, initialModel, initialType }: Props) {
  const [makes, setMakes] = useState<MakeIndex[]>([]);
  const [makeData, setMakeData] = useState<MakeData | null>(null);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const initializedRef = useRef(false);

  const basePath = domainDataPath(domain);

  // Reset state when domain changes
  useEffect(() => {
    setMakes([]);
    setMakeData(null);
    setSelectedMake('');
    setSelectedModel('');
    setSelectedType('');
    initializedRef.current = false;
    onSelect(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  useEffect(() => {
    fetch(basePath + 'index.json')
      .then(r => r.json())
      .then((data: MakeIndex[]) => {
        setMakes(data);
      })
      .catch(console.error);
  }, [basePath]);

  // Handle initial selection from URL params
  useEffect(() => {
    if (initializedRef.current || !makes.length || !initialMake) return;
    initializedRef.current = true;

    const makeInfo = makes.find(m => m.name === initialMake || matchSlug(m.name, initialMake));
    if (!makeInfo) return;

    setSelectedMake(makeInfo.name);
    setLoading(true);

    fetch(`${basePath}${makeInfo.id}.json`)
      .then(r => r.json())
      .then((data: MakeData) => {
        setMakeData(data);
        setLoading(false);

        if (initialModel) {
          const model = data.models.find(m => m.name === initialModel || matchSlug(m.name, initialModel));
          if (model) {
            setSelectedModel(model.name);
            if (initialType) {
              const type = model.types.find(t => t.name === initialType || matchSlug(t.name, initialType));
              if (type) {
                setSelectedType(type.name);
                onSelect({ make: data.make, model: model.name, type });
              }
            } else if (model.types.length === 1) {
              setSelectedType(model.types[0].name);
              onSelect({ make: data.make, model: model.name, type: model.types[0] });
            }
          }
        }
      })
      .catch(() => setLoading(false));
  }, [makes, initialMake, initialModel, initialType, onSelect]);

  function handleMakeChange(make: string) {
    setSelectedMake(make);
    setSelectedModel('');
    setSelectedType('');
    setMakeData(null);
    onSelect(null);

    if (!make) return;

    const makeInfo = makes.find(m => m.name === make);
    if (!makeInfo) return;

    setLoading(true);
    fetch(`${basePath}${makeInfo.id}.json`)
      .then(r => r.json())
      .then((data: MakeData) => {
        setMakeData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function handleModelChange(model: string) {
    setSelectedModel(model);
    setSelectedType('');
    onSelect(null);

    if (!makeData || !model) return;

    const modelData = makeData.models.find(m => m.name === model);
    if (!modelData) return;

    if (modelData.types.length === 1) {
      setSelectedType(modelData.types[0].name);
      onSelect({ make: makeData.make, model, type: modelData.types[0] });
    }
  }

  function handleTypeChange(typeName: string) {
    setSelectedType(typeName);

    if (!makeData || !selectedModel || !typeName) {
      onSelect(null);
      return;
    }

    const model = makeData.models.find(m => m.name === selectedModel);
    const type = model?.types.find(t => t.name === typeName);
    if (type) {
      onSelect({ make: makeData.make, model: selectedModel, type });
    }
  }

  function handleQuickPick(qp: typeof POPULAR_VEHICLES[0]) {
    const makeInfo = makes.find(m => m.name === qp.make);
    if (!makeInfo) return;

    setSelectedMake(qp.make);
    setSelectedModel('');
    setSelectedType('');
    setMakeData(null);
    onSelect(null);
    setLoading(true);

    fetch(`${basePath}${makeInfo.id}.json`)
      .then(r => r.json())
      .then((data: MakeData) => {
        setMakeData(data);
        setLoading(false);

        // Find best model match
        const model = data.models.find(m => m.name.includes(qp.model));
        if (model) {
          setSelectedModel(model.name);
          if (model.types.length === 1) {
            setSelectedType(model.types[0].name);
            onSelect({ make: data.make, model: model.name, type: model.types[0] });
          }
        }
      })
      .catch(() => setLoading(false));
  }

  const models = makeData?.models ?? [];
  const currentModel = models.find(m => m.name === selectedModel);
  const types = currentModel?.types ?? [];

  const makeOptions: DropdownOption[] = makes.map(m => ({
    value: m.name,
    label: cleanMakeName(m.name),
    sublabel: `${m.models} models`,
  }));

  const modelOptions: DropdownOption[] = models.map(m => ({
    value: m.name,
    label: m.name,
    sublabel: `${m.types.length} variant${m.types.length !== 1 ? 's' : ''}`,
  }));

  const typeOptions: DropdownOption[] = types.map(t => ({
    value: t.name,
    label: t.name,
  }));

  return (
    <div className="bg-black text-white p-6 sm:p-8">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2 uppercase tracking-wide">
        <span className="text-[#FFC700]">&#9670;</span>
        Select Your Vehicle
      </h2>
      <p className="text-sm text-gray-400 mb-6">
        Choose your vehicle to see fluids and maintenance schedules
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SearchableDropdown
          label="Make"
          placeholder="Choose make..."
          options={makeOptions}
          value={selectedMake}
          onChange={handleMakeChange}
        />
        <SearchableDropdown
          label="Model"
          placeholder={loading ? 'Loading...' : 'Choose model...'}
          options={modelOptions}
          value={selectedModel}
          onChange={handleModelChange}
          disabled={!selectedMake || loading}
          loading={loading}
        />
        <SearchableDropdown
          label="Engine / Variant"
          placeholder={types.length <= 1 ? (types[0]?.name || 'Choose model first...') : 'Choose variant...'}
          options={typeOptions}
          value={selectedType}
          onChange={handleTypeChange}
          disabled={!selectedModel || types.length <= 1}
        />
      </div>

      {selectedMake && !loading && (
        <p className="text-sm text-gray-500 mt-4">
          {makes.find(m => m.name === selectedMake)?.models ?? 0} models available for {cleanMakeName(selectedMake)}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-3 mt-4">
          <div className="h-3 w-32 animate-shimmer" />
          <div className="h-3 w-20 animate-shimmer" />
        </div>
      )}

      {/* Popular vehicles quick-pick */}
      {!selectedMake && makes.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-800">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Popular vehicles</p>
          <div className="flex flex-wrap gap-2">
            {POPULAR_VEHICLES.map(qp => (
              <button
                key={qp.label}
                type="button"
                onClick={() => handleQuickPick(qp)}
                className="px-3 py-2 text-xs font-medium border border-gray-700 text-gray-300
                  hover:border-[#FFC700] hover:text-[#FFC700] transition-colors uppercase tracking-wide"
              >
                {qp.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
