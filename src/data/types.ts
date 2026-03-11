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
