/**
 * useAddressApi — Hook for cascading address selection using Vietnam provinces API + Goong.io
 *
 * Manages:
 * - Province/District/Ward cascading dropdowns (from provinces.open-api.vn)
 * - Street autocomplete (from Goong.io)
 * - Loading states for each level
 * - Auto-lock province (default: Đà Nẵng)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  searchStreetAutocomplete,
  DA_NANG_PROVINCE_CODE,
  DA_NANG_PROVINCE_NAME,
  DA_NANG_LOCATION,
  type VNProvince,
  type VNDistrict,
  type VNWard,
  type GoongPrediction,
} from '../services/addressApi';

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface AddressValue {
  province?: string;
  provinceCode?: number;
  district?: string;
  districtCode?: number;
  ward?: string;
  wardCode?: number;
  street?: string;
}

interface UseAddressApiOptions {
  /** Lock province to a specific name (e.g. "Đà Nẵng"). Pass undefined to allow all provinces. */
  lockProvince?: string;
  /** Initial address value to populate cascading selects */
  initialValue?: AddressValue;
}

interface UseAddressApiReturn {
  // Data lists
  provinces: VNProvince[];
  districts: VNDistrict[];
  wards: VNWard[];
  streetSuggestions: GoongPrediction[];

  // Selected values
  selectedProvince: { code: number; name: string } | null;
  selectedDistrict: { code: number; name: string } | null;
  selectedWard: { code: number; name: string } | null;
  streetValue: string;

  // Loading states
  loadingProvinces: boolean;
  loadingDistricts: boolean;
  loadingWards: boolean;
  loadingStreet: boolean;

  // Whether province is locked
  isProvinceLocked: boolean;

  // Actions
  selectProvince: (code: number, name: string) => void;
  selectDistrict: (code: number, name: string) => void;
  selectWard: (code: number, name: string) => void;
  setStreetValue: (value: string) => void;
  selectStreetSuggestion: (prediction: GoongPrediction) => void;
  clearStreetSuggestions: () => void;

  /** Get the current full AddressValue */
  getAddressValue: () => AddressValue;
}

// ─── Hook ───────────────────────────────────────────────────────────────────────

export function useAddressApi(options: UseAddressApiOptions = {}): UseAddressApiReturn {
  const { lockProvince = 'Đà Nẵng' } = options;
  const isProvinceLocked = !!lockProvince;
  const initialValueApplied = useRef(false);

  // Capture initialValue once to avoid re-triggering effects when parent re-renders
  const initialValueRef = useRef(options.initialValue);

  // Data lists
  const [provinces, setProvinces] = useState<VNProvince[]>([]);
  const [districts, setDistricts] = useState<VNDistrict[]>([]);
  const [wards, setWards] = useState<VNWard[]>([]);
  const [streetSuggestions, setStreetSuggestions] = useState<GoongPrediction[]>([]);

  // Selected values
  const [selectedProvince, setSelectedProvince] = useState<{ code: number; name: string } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{ code: number; name: string } | null>(null);
  const [selectedWard, setSelectedWard] = useState<{ code: number; name: string } | null>(null);
  const [streetValue, setStreetValueState] = useState('');

  // Loading
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [loadingStreet, setLoadingStreet] = useState(false);

  // Debounce timer ref
  const streetDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Load provinces on mount ────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoadingProvinces(true);

    getProvinces()
      .then((data) => {
        if (cancelled) return;
        setProvinces(data);

        // If province is locked, auto-select it
        if (lockProvince) {
          const match = data.find(
            (p) =>
              p.name.toLowerCase().includes(lockProvince.toLowerCase()) ||
              lockProvince.toLowerCase().includes(p.name.toLowerCase()),
          );
          if (match) {
            setSelectedProvince({ code: match.code, name: match.name });
          } else {
            // Fallback to Đà Nẵng by code
            setSelectedProvince({ code: DA_NANG_PROVINCE_CODE, name: DA_NANG_PROVINCE_NAME });
          }
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('[useAddressApi] Failed to load provinces:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingProvinces(false);
      });

    return () => { cancelled = true; };
  }, [lockProvince]);

  // ─── Load districts when province changes ──────────────────────────────────

  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      return;
    }

    let cancelled = false;
    setLoadingDistricts(true);

    getDistrictsByProvince(selectedProvince.code)
      .then((data) => {
        if (cancelled) return;
        setDistricts(data);

        // If initialValue has district name, try to match
        if (!initialValueApplied.current && initialValueRef.current?.district) {
          const match = data.find(
            (d) => d.name === initialValueRef.current!.district,
          );
          if (match) {
            setSelectedDistrict({ code: match.code, name: match.name });
          }
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('[useAddressApi] Failed to load districts:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvince?.code]);

  // ─── Load wards when district changes ──────────────────────────────────────

  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      return;
    }

    let cancelled = false;
    setLoadingWards(true);

    getWardsByDistrict(selectedDistrict.code)
      .then((data) => {
        if (cancelled) return;
        setWards(data);

        // If initialValue has ward name, try to match
        if (!initialValueApplied.current && initialValueRef.current?.ward) {
          const match = data.find(
            (w) => w.name === initialValueRef.current!.ward,
          );
          if (match) {
            setSelectedWard({ code: match.code, name: match.name });
            initialValueApplied.current = true;
          }
        }
      })
      .catch((err) => {
        if (!cancelled) console.error('[useAddressApi] Failed to load wards:', err);
      })
      .finally(() => {
        if (!cancelled) setLoadingWards(false);
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDistrict?.code]);

  // ─── Initialize street from initial value (one-time) ───────────────────────

  useEffect(() => {
    if (initialValueRef.current?.street && !initialValueApplied.current) {
      setStreetValueState(initialValueRef.current.street);
    }
  }, []);

  // ─── Actions ──────────────────────────────────────────────────────────────────

  const selectProvince = useCallback((code: number, name: string) => {
    setSelectedProvince({ code, name });
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
    setStreetValueState('');
    setStreetSuggestions([]);
  }, []);

  const selectDistrict = useCallback((code: number, name: string) => {
    setSelectedDistrict({ code, name });
    setSelectedWard(null);
    setWards([]);
    setStreetValueState('');
    setStreetSuggestions([]);
  }, []);

  const selectWard = useCallback((code: number, name: string) => {
    setSelectedWard({ code, name });
  }, []);

  const setStreetValue = useCallback((value: string) => {
    setStreetValueState(value);

    // Debounced autocomplete
    if (streetDebounceRef.current) {
      clearTimeout(streetDebounceRef.current);
    }

    if (value.trim().length < 2) {
      setStreetSuggestions([]);
      return;
    }

    streetDebounceRef.current = setTimeout(async () => {
      setLoadingStreet(true);
      try {
        const predictions = await searchStreetAutocomplete(value, DA_NANG_LOCATION);
        setStreetSuggestions(predictions);
      } catch {
        setStreetSuggestions([]);
      } finally {
        setLoadingStreet(false);
      }
    }, 300);
  }, []);

  const selectStreetSuggestion = useCallback((prediction: GoongPrediction) => {
    setStreetValueState(prediction.structured_formatting.main_text);
    setStreetSuggestions([]);
  }, []);

  const clearStreetSuggestions = useCallback(() => {
    setStreetSuggestions([]);
  }, []);

  const getAddressValue = useCallback((): AddressValue => ({
    province: selectedProvince?.name,
    provinceCode: selectedProvince?.code,
    district: selectedDistrict?.name,
    districtCode: selectedDistrict?.code,
    ward: selectedWard?.name,
    wardCode: selectedWard?.code,
    street: streetValue,
  }), [selectedProvince, selectedDistrict, selectedWard, streetValue]);

  // ─── Cleanup debounce on unmount ──────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (streetDebounceRef.current) {
        clearTimeout(streetDebounceRef.current);
      }
    };
  }, []);

  return {
    provinces,
    districts,
    wards,
    streetSuggestions,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    streetValue,
    loadingProvinces,
    loadingDistricts,
    loadingWards,
    loadingStreet,
    isProvinceLocked,
    selectProvince,
    selectDistrict,
    selectWard,
    setStreetValue,
    selectStreetSuggestion,
    clearStreetSuggestions,
    getAddressValue,
  };
}
