import { useState } from 'react';
import { DANANG_DISTRICTS, DA_NANG_PROVINCE_NAME } from '../data/daNangAddresses';
import { MapPin } from 'lucide-react';
import { SearchableSelect } from './ui/searchable-select';

interface AddressValue {
    province?: string;
    district?: string;
    ward?: string;
}

interface AddressSelectorProps {
    value: AddressValue;
    onChange: (value: AddressValue) => void;
}

export function AddressSelector({ value, onChange }: AddressSelectorProps) {
    const [selectedDistName, setSelectedDistName] = useState<string>(value.district || '');

    const selectedDistrict = DANANG_DISTRICTS.find(d => d.name === selectedDistName);
    const wards = selectedDistrict?.wards ?? [];

    const handleDistrictChange = (distName: string) => {
        setSelectedDistName(distName);
        onChange({
            province: DA_NANG_PROVINCE_NAME,
            district: distName,
            ward: undefined,
        });
    };

    const handleWardChange = (wardName: string) => {
        onChange({
            province: DA_NANG_PROVINCE_NAME,
            district: selectedDistName,
            ward: wardName,
        });
    };

    return (
        <div className="space-y-3">
            {/* Badge tỉnh cố định */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-semibold text-emerald-700">
                <MapPin className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>
                    Tỉnh / Thành phố:{' '}
                    <span className="font-bold">Thành phố Đà Nẵng</span>
                    <span className="ml-1 text-[10px] text-emerald-500">(sau sáp nhập Quảng Nam)</span>
                </span>
                <span className="ml-auto text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold shrink-0">
                    Cố định
                </span>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
                {/* QUẬN / HUYỆN / TP */}
                <SearchableSelect
                    placeholder="Chọn Quận / Huyện / TP"
                    options={DANANG_DISTRICTS.map(d => ({ value: d.name, label: d.name }))}
                    value={selectedDistName}
                    onValueChange={handleDistrictChange}
                />

                {/* PHƯỜNG / XÃ */}
                <SearchableSelect
                    placeholder="Chọn Phường / Xã"
                    disabled={!selectedDistName}
                    options={wards.map(w => ({ value: w.name, label: w.name }))}
                    value={value.ward ?? ''}
                    onValueChange={handleWardChange}
                />
            </div>
        </div>
    );
}
