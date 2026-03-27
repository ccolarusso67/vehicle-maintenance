const STORAGE_KEY = 'u1p_recent_vehicles';
const MAX_RECENT = 5;

export interface RecentVehicle {
  make: string;
  model: string;
  type: string;
  domain: string;
  timestamp: number;
}

export function getRecentVehicles(): RecentVehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentVehicle[];
  } catch { return []; }
}

export function addRecentVehicle(v: RecentVehicle): void {
  try {
    const existing = getRecentVehicles().filter(
      r => !(r.make === v.make && r.model === v.model && r.type === v.type)
    );
    existing.unshift({ ...v, timestamp: Date.now() });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, MAX_RECENT)));
  } catch { /* localStorage unavailable */ }
}
