import { useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, Navigation } from 'lucide-react';
import { SearchableSelect } from './ui/searchable-select';
import { useAddressApi, type AddressValue } from '../hooks/useAddressApi';

export type { AddressValue };

interface AddressSelectorProps {
    value: AddressValue;
    onChange: (value: AddressValue) => void;
    /** Lock province selection (default: "Đà Nẵng"). Pass undefined to allow all provinces. */
    lockProvince?: string;
    /** Show street input with Goong.io autocomplete (default: true) */
    showStreet?: boolean;
    /** Disabled state */
    disabled?: boolean;
}

export function AddressSelector({
    value,
    onChange,
    lockProvince = 'Đà Nẵng',
    showStreet = true,
    disabled = false,
}: AddressSelectorProps) {
    const {
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
    } = useAddressApi({
        lockProvince,
        initialValue: value,
    });

    // Note: initial value sync is handled entirely by the useAddressApi hook
    // via initialValue. No additional sync effect needed here.

    // Stable ref to onChange — prevents emitChange from recreating when
    // the parent passes an inline arrow function (avoids infinite re-render loop)
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // Propagate changes to parent via onChange
    const prevAddressRef = useRef<string>('');

    const emitChange = useCallback(() => {
        const addr = getAddressValue();
        const key = JSON.stringify(addr);
        if (key !== prevAddressRef.current) {
            prevAddressRef.current = key;
            onChangeRef.current(addr);
        }
    }, [getAddressValue]);

    useEffect(() => {
        emitChange();
    }, [selectedProvince, selectedDistrict, selectedWard, streetValue, emitChange]);

    // Street dropdown click-outside
    const streetContainerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                streetContainerRef.current &&
                !streetContainerRef.current.contains(event.target as Node)
            ) {
                clearStreetSuggestions();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [clearStreetSuggestions]);

    // ─── Handlers ──────────────────────────────────────────────────────

    const handleProvinceChange = (code: string) => {
        const prov = provinces.find((p) => p.code === Number(code));
        if (prov) selectProvince(prov.code, prov.name);
    };

    const handleDistrictChange = (code: string) => {
        const dist = districts.find((d) => d.code === Number(code));
        if (dist) selectDistrict(dist.code, dist.name);
    };

    const handleWardChange = (code: string) => {
        const w = wards.find((wd) => wd.code === Number(code));
        if (w) selectWard(w.code, w.name);
    };

    // ─── Render ─────────────────────────────────────────────────────────

    return (
        <div className="space-y-3">
            {/* Province — locked badge or dropdown */}
            {isProvinceLocked ? (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-700">
                    <MapPin className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>
                        Tỉnh / Thành phố:{' '}
                        <span className="font-bold">
                            {selectedProvince?.name || 'Đang tải...'}
                        </span>
                    </span>
                    <span className="ml-auto text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">
                        Cố định
                    </span>
                </div>
            ) : (
                <div>
                    {loadingProvinces ? (
                        <div className="flex items-center gap-2 h-11 px-3 border rounded-md text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải tỉnh/thành...
                        </div>
                    ) : (
                        <SearchableSelect
                            placeholder="Chọn Tỉnh / Thành phố"
                            options={provinces.map((p) => ({
                                value: String(p.code),
                                label: p.name,
                            }))}
                            value={selectedProvince ? String(selectedProvince.code) : ''}
                            onValueChange={handleProvinceChange}
                            disabled={disabled}
                        />
                    )}
                </div>
            )}

            {/* District + Ward */}
            <div className="grid md:grid-cols-2 gap-3">
                {/* District */}
                {loadingDistricts ? (
                    <div className="flex items-center gap-2 h-11 px-3 border rounded-md text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải quận/huyện...
                    </div>
                ) : (
                    <SearchableSelect
                        placeholder="Chọn Quận / Huyện"
                        options={districts.map((d) => ({
                            value: String(d.code),
                            label: d.name,
                        }))}
                        value={selectedDistrict ? String(selectedDistrict.code) : ''}
                        onValueChange={handleDistrictChange}
                        disabled={disabled || !selectedProvince}
                    />
                )}

                {/* Ward */}
                {loadingWards ? (
                    <div className="flex items-center gap-2 h-11 px-3 border rounded-md text-sm text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải phường/xã...
                    </div>
                ) : (
                    <SearchableSelect
                        placeholder="Chọn Phường / Xã"
                        options={wards.map((w) => ({
                            value: String(w.code),
                            label: w.name,
                        }))}
                        value={selectedWard ? String(selectedWard.code) : ''}
                        onValueChange={handleWardChange}
                        disabled={disabled || !selectedDistrict}
                    />
                )}
            </div>

            {/* Street autocomplete (Goong.io) */}
            {showStreet && (
                <div className="relative" ref={streetContainerRef}>
                    <div className="relative">
                        <input
                            type="text"
                            className="flex h-11 w-full rounded-md border border-input bg-white px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 pr-8"
                            placeholder="Số nhà, tên đường..."
                            value={streetValue}
                            onChange={(e) => setStreetValue(e.target.value)}
                            disabled={disabled}
                        />
                        {loadingStreet && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Suggestions dropdown */}
                    {streetSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 z-[100] mt-1 max-h-60 overflow-y-auto rounded-md border bg-white shadow-lg animate-in fade-in zoom-in-95 duration-100">
                            {streetSuggestions.map((prediction) => (
                                <div
                                    key={prediction.place_id}
                                    className="flex items-start gap-2 px-3 py-2.5 cursor-pointer hover:bg-emerald-50 hover:text-emerald-900 transition-colors text-sm"
                                    onClick={() => selectStreetSuggestion(prediction)}
                                >
                                    <Navigation className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                        <p className="font-medium truncate">
                                            {prediction.structured_formatting.main_text}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {prediction.structured_formatting.secondary_text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
