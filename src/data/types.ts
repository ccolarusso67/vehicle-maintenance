export type VehicleDomain = 'automotive' | 'motorcycle' | 'marine' | 'heavy-duty';

export const VEHICLE_DOMAINS: { id: VehicleDomain; label: string; icon: string }[] = [
  { id: 'automotive', label: 'Automotive', icon: '🚗' },
  { id: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
  { id: 'marine', label: 'Marine', icon: '⛵' },
  { id: 'heavy-duty', label: 'Heavy-Duty', icon: '🚛' },
];

/** Returns the data path prefix for a given domain */
export function domainDataPath(domain: VehicleDomain): string {
  if (domain === 'automotive') return '/data/';
  return `/data/${domain}/`;
}

/** Keywords that indicate domain intent in chat messages (generic nouns only) */
export const DOMAIN_INTENT_KEYWORDS: Record<VehicleDomain, string[]> = {
  automotive: ['car', 'suv', 'van', 'sedan', 'auto', 'automobile'],
  motorcycle: ['motorcycle', 'bike', 'motorbike', 'cruiser', 'sportbike', 'dirtbike', 'dirt bike', 'scooter'],
  marine: ['boat', 'marine', 'outboard', 'watercraft', 'pwc', 'jet ski', 'jetski', 'pontoon', 'vessel'],
  'heavy-duty': ['heavy duty', 'heavy-duty', 'semi', 'truck tractor', 'fleet truck', 'class 8',
                  'diesel truck', 'semi truck', 'tractor trailer', 'big rig', 'class 7', 'class 6'],
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
  'freightliner': 'heavy-duty',
  'peterbilt': 'heavy-duty',
  'kenworth': 'heavy-duty',
  'mack': 'heavy-duty',
  'volvo truck': 'heavy-duty',
  'volvo trucks': 'heavy-duty',
  'western star': 'heavy-duty',
  'hino': 'heavy-duty',
  'international truck': 'heavy-duty',
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
  fluids: FluidSpec[] | number;
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
