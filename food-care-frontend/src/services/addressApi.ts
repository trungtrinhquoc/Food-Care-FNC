/**
 * Address API Service
 *
 * Uses two external APIs:
 * 1. provinces.open-api.vn — Vietnam administrative divisions (province/district/ward)
 * 2. Goong.io — Street-level autocomplete (geocoding)
 *
 * Currently locked to Đà Nẵng (province code 48).
 * Set lockProvince to undefined to unlock all 63 provinces.
 */

import axios from 'axios';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface VNProvince {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  phone_code: number;
}

export interface VNDistrict {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  province_code: number;
}

export interface VNWard {
  code: number;
  name: string;
  codename: string;
  division_type: string;
  district_code: number;
}

export interface VNProvinceDetail extends VNProvince {
  districts: VNDistrict[];
}

export interface VNDistrictDetail extends VNDistrict {
  wards: VNWard[];
}

export interface GoongPrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  compound: {
    commune: string;
    district: string;
    province: string;
  };
}

export interface GoongAutoCompleteResponse {
  predictions: GoongPrediction[];
  status: string;
}

interface GoongPlaceDetailResponse {
  result?: {
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  };
  status?: string;
}

interface GoongGeocodeResponse {
  results?: Array<{
    geometry?: {
      location?: {
        lat?: number;
        lng?: number;
      };
    };
  }>;
  status?: string;
}

// ─── Axios instances ────────────────────────────────────────────────────────────

const provincesApi = axios.create({
  baseURL: 'https://provinces.open-api.vn/api',
  timeout: 10000,
});

const goongApi = axios.create({
  baseURL: 'https://rsapi.goong.io',
  timeout: 10000,
});

// ─── In-memory cache ────────────────────────────────────────────────────────────

const cache = {
  provinces: null as VNProvince[] | null,
  districts: new Map<number, VNDistrict[]>(),
  wards: new Map<number, VNWard[]>(),
};

// ─── API functions ──────────────────────────────────────────────────────────────

/**
 * Get all 63 provinces/cities in Vietnam.
 * Results are cached in memory.
 */
export async function getProvinces(): Promise<VNProvince[]> {
  if (cache.provinces) return cache.provinces;

  const { data } = await provincesApi.get<VNProvince[]>('/p/');
  cache.provinces = data;
  return data;
}

/**
 * Get districts for a given province code.
 * Results are cached in memory.
 */
export async function getDistrictsByProvince(provinceCode: number): Promise<VNDistrict[]> {
  if (cache.districts.has(provinceCode)) {
    return cache.districts.get(provinceCode)!;
  }

  const { data } = await provincesApi.get<VNProvinceDetail>(`/p/${provinceCode}?depth=2`);
  const districts = data.districts || [];
  cache.districts.set(provinceCode, districts);
  return districts;
}

/**
 * Get wards for a given district code.
 * Results are cached in memory.
 */
export async function getWardsByDistrict(districtCode: number): Promise<VNWard[]> {
  if (cache.wards.has(districtCode)) {
    return cache.wards.get(districtCode)!;
  }

  const { data } = await provincesApi.get<VNDistrictDetail>(`/d/${districtCode}?depth=2`);
  const wards = data.wards || [];
  cache.wards.set(districtCode, wards);
  return wards;
}

/**
 * Autocomplete street address using Goong.io.
 * Returns suggestions for a given text input.
 *
 * @param input - The search text (e.g., "123 Nguyễn Văn Linh")
 * @param location - Optional lat,lng to bias results (e.g., "16.047079,108.206230" for Đà Nẵng)
 */
export async function searchStreetAutocomplete(
  input: string,
  location?: string,
): Promise<GoongPrediction[]> {
  const apiKey = import.meta.env.VITE_GOONG_API_KEY;
  if (!apiKey || input.trim().length < 2) return [];

  try {
    const params: Record<string, string> = {
      api_key: apiKey,
      input: input.trim(),
    };

    if (location) {
      params.location = location;
      params.radius = '50000'; // 50km radius
    }

    const { data } = await goongApi.get<GoongAutoCompleteResponse>('/Place/AutoComplete', {
      params,
    });

    return data.predictions || [];
  } catch {
    console.warn('[AddressAPI] Goong autocomplete failed, falling back to manual input');
    return [];
  }
}

export async function getCoordinatesFromPlaceId(
  placeId: string,
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOONG_API_KEY;
  if (!apiKey || !placeId?.trim()) return null;

  try {
    const { data } = await goongApi.get<GoongPlaceDetailResponse>('/Place/Detail', {
      params: {
        place_id: placeId,
        api_key: apiKey,
      },
    });

    const lat = data?.result?.geometry?.location?.lat;
    const lng = data?.result?.geometry?.location?.lng;

    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }

    return null;
  } catch {
    return null;
  }
}

export async function geocodeAddressWithGoong(
  address: string,
): Promise<{ lat: number; lng: number } | null> {
  const apiKey = import.meta.env.VITE_GOONG_API_KEY;
  if (!apiKey || !address?.trim()) return null;

  try {
    const { data } = await goongApi.get<GoongGeocodeResponse>('/Geocode', {
      params: {
        address: address.trim(),
        api_key: apiKey,
      },
    });

    const lat = data?.results?.[0]?.geometry?.location?.lat;
    const lng = data?.results?.[0]?.geometry?.location?.lng;

    if (typeof lat === 'number' && typeof lng === 'number') {
      return { lat, lng };
    }

    return null;
  } catch {
    return null;
  }
}

// ─── Constants ──────────────────────────────────────────────────────────────────

/** Đà Nẵng province code in Vietnam administrative system */
export const DA_NANG_PROVINCE_CODE = 48;
export const DA_NANG_PROVINCE_NAME = 'Thành phố Đà Nẵng';

/** Default location bias for Goong.io (center of Đà Nẵng) */
export const DA_NANG_LOCATION = '16.047079,108.206230';
