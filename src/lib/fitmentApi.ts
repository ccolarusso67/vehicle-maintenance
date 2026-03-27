/**
 * Fitment API Client — Protected access to vehicle fitment data.
 *
 * Manages access tokens and makes rate-limited API calls to the backend
 * for fluid details. Falls back to local JSON files when API is unavailable.
 *
 * Tier 1 (Public): Make/model browsing — available without token
 * Tier 2 (Protected): Fluid details — requires access token
 */

import { VehicleDomain, FluidSpec } from '@/data/types';

// Backend API URL — set at build time or defaults to empty (disabled)
const API_BASE = process.env.NEXT_PUBLIC_FITMENT_API_URL || '';

// ── Types ──────────────────────────────────────────────────────────

interface TokenResponse {
  token: string;
  expires_at: string;
  rate_limit: number;
  rate_window: number;
}

interface ApiMake {
  name: string;
  id: string;
  models: number;
}

interface ApiModelType {
  name: string;
}

interface ApiModel {
  name: string;
  types: ApiModelType[];
}

interface ApiFluidResult {
  type: string;
  fluids: FluidSpec[];
}

interface ApiVehicleFluidsResponse {
  domain: string;
  make: string;
  model: string;
  type: string | null;
  vehicle_types: ApiFluidResult[];
}

// ── State ──────────────────────────────────────────────────────────

let _token: string | null = null;
let _tokenExpiry: number = 0;
let _tokenPromise: Promise<string | null> | null = null;

// ── Core ───────────────────────────────────────────────────────────

/** Check if the API is configured (has a base URL) */
export function isApiEnabled(): boolean {
  return API_BASE.length > 0;
}

/** Get or create an access token (cached, auto-refreshes) */
async function getToken(): Promise<string | null> {
  if (!isApiEnabled()) return null;

  // Return cached token if still valid (with 5 min buffer)
  if (_token && Date.now() < _tokenExpiry - 300_000) {
    return _token;
  }

  // Deduplicate concurrent token requests
  if (_tokenPromise) return _tokenPromise;

  _tokenPromise = (async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/v1/fitment/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!resp.ok) {
        console.warn('[FitmentAPI] Token request failed:', resp.status);
        return null;
      }
      const data: TokenResponse = await resp.json();
      if (!data.token || !data.expires_at) {
        console.warn('[FitmentAPI] Invalid token response');
        return null;
      }
      _token = data.token;
      _tokenExpiry = new Date(data.expires_at).getTime();
      if (isNaN(_tokenExpiry)) {
        console.warn('[FitmentAPI] Invalid expiry date:', data.expires_at);
        _token = null;
        return null;
      }
      return _token;
    } catch (err) {
      console.warn('[FitmentAPI] Token request error:', err);
      return null;
    } finally {
      _tokenPromise = null;
    }
  })();

  return _tokenPromise;
}

/** Make an authenticated API request */
async function apiFetch<T>(path: string, requireToken = false): Promise<T | null> {
  if (!isApiEnabled()) return null;

  const headers: Record<string, string> = {};

  if (requireToken) {
    const token = await getToken();
    if (!token) return null;
    headers['X-Fitment-Token'] = token;
  }

  try {
    const resp = await fetch(`${API_BASE}${path}`, { headers });
    if (resp.status === 429) {
      console.warn('[FitmentAPI] Rate limited');
      return null;
    }
    if (resp.status === 401) {
      // Token expired, clear and retry once
      _token = null;
      _tokenExpiry = 0;
      if (requireToken) {
        const token = await getToken();
        if (!token) return null;
        const retry = await fetch(`${API_BASE}${path}`, {
          headers: { 'X-Fitment-Token': token },
        });
        if (!retry.ok) return null;
        try {
          return await retry.json();
        } catch {
          console.warn('[FitmentAPI] Retry JSON parse failed');
          return null;
        }
      }
      return null;
    }
    if (!resp.ok) return null;
    return resp.json();
  } catch (err) {
    console.warn(`[FitmentAPI] Request error on ${path}:`, err);
    return null;
  }
}

// ── Public API (no token) ──────────────────────────────────────────

/** Fetch makes for a domain via API (public tier) */
export async function fetchMakesApi(domain: VehicleDomain): Promise<ApiMake[] | null> {
  const data = await apiFetch<{ makes: ApiMake[] }>(
    `/api/v1/fitment/${domain}/makes`
  );
  return data?.makes ?? null;
}

/** Fetch models for a make via API (public tier) */
export async function fetchModelsApi(
  domain: VehicleDomain,
  makeId: string
): Promise<ApiModel[] | null> {
  const data = await apiFetch<{ models: ApiModel[] }>(
    `/api/v1/fitment/${domain}/makes/${makeId}/models`
  );
  return data?.models ?? null;
}

// ── Protected API (token required) ─────────────────────────────────

/** Fetch fluid details for a specific vehicle (protected tier) */
export async function fetchVehicleFluids(
  domain: VehicleDomain,
  make: string,
  model: string,
  typeName?: string
): Promise<FluidSpec[] | null> {
  const params = new URLSearchParams({
    make,
    model,
    ...(typeName ? { type: typeName } : {}),
  });
  const data = await apiFetch<ApiVehicleFluidsResponse>(
    `/api/v1/fitment/${domain}/vehicle/fluids?${params}`,
    true  // requires token
  );
  if (!data?.vehicle_types?.length) return null;
  // Return fluids from the first matching type (or all if no type specified)
  return data.vehicle_types[0]?.fluids ?? null;
}

/** Search vehicles by keyword (protected tier) */
export async function searchVehiclesApi(
  domain: VehicleDomain,
  query: string,
  limit = 20
): Promise<{ make: string; model: string; years: string; engine: string }[] | null> {
  const data = await apiFetch<{ results: { make: string; model: string; years: string; engine: string }[] }>(
    `/api/v1/fitment/${domain}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    true  // requires token
  );
  return data?.results ?? null;
}

// ── Initialization ─────────────────────────────────────────────────

/** Pre-warm the token on app load (non-blocking) */
export function initFitmentApi(): void {
  if (isApiEnabled()) {
    getToken().catch(err => console.warn('[FitmentAPI] Token pre-warm failed:', err));
  }
}
