export type VehicleDomain = 'automotive' | 'motorcycle' | 'marine';

export const VEHICLE_DOMAINS: { id: VehicleDomain; label: string; icon: string }[] = [
  { id: 'automotive', label: 'Automotive', icon: '🚗' },
  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { id: 'marine', label: 'Marine', icon: '⛵' },
];

/** Returns the data path prefix for a given domain */
export function domainDataPath(domain: VehicleDomain): string {
  return domain === 'automotive' ? '/data/' : `/data/${domain}/`;
}

/** Keywords that indicate domain intent in chat messages (generic nouns only) */
export const DOMAIN_INTENT_KEYWORDS: Record<VehicleDomain, string[]> = {
  automotive: ['car', 'truck', 'suv', 'van', 'sedan', 'auto', 'automobile'],
  motorcycle: ['motorcycle', 'bike', 'motorbike', 'cruiser', 'sportbike', 'dirtbike', 'dirt bike', 'scooter'],
  marine: ['boat', 'marine', 'outboard', 'watercraft', 'pwc', 'jet ski', 'jetski', 'pontoon', 'vessel'],
};

/** Makes strongly associated with a single non-automotive domain (NOT ambiguous makes like Honda/Yamaha) */
export const DOMAIN_MAKE_HINTS: Record<string, VehicleDomain> = {
  'harley-davidson': 'motorcycle',
  'harley': 'motorcycle',
  'indian': 'motorcycle',
  'ducati': 'motorcycle',
  'ktm': 'motorcycle',
  'triumph': 'motorcycle',
  'mercury': 'marine',
  'evinrude': 'marine',
  'johnson': 'marine',
  'nautique': 'marine',
  'malibu boats': 'marine',
  'mastercraft': 'marine',
};

export interface FluidSpec {
  n: string;      // name (e.g., "Engine", "Transmission, automatic")
  c: string;      // capacity
  i: string;      // interval
  p: string;      // product recommendation (Ultra1Plus)
  ic: string;     // icon emoji
  pc?: string;    // part code (optional)
  ravenol?: string;  // original Ravenol product name (crossref)
  u1pSku?: string;   // Ultra1Plus SKU
}

export interface VehicleType {
  name: string;     // e.g., "Camry 2.5L (2018-2025)"
  fluids: FluidSpec[];
}

export interface ModelData {
  name: string;     // e.g., "Camry (2018-2025)"
  types: VehicleType[];
}

export interface MakeData {
  make: string;
  models: ModelData[];
}

export interface MakeIndex {
  name: string;
  id: string;
  models: number;
  source?: 'fitment' | 'legacy';
}

// Used by vehicles.ts static data
export interface MaintenanceItem {
  name: string;
  intervalMiles: number;
  intervalMonths?: number;
  description: string;
  icon: string;
  priority: 'critical' | 'important' | 'recommended';
}

export interface VehicleFluid {
  name: string;
  type: string;
  capacity?: string;
  changeInterval: string;
  icon: string;
}

export interface VehicleData {
  make: string;
  model: string;
  years: string;
  engine: string;
  fluids: VehicleFluid[];
  maintenance: MaintenanceItem[];
}
