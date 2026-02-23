import { useEffect, useState } from 'react';
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
    const [provinces, setProvinces] = useState<any[]>([]);
    const [districts, setDistricts] = useState<any[]>([]);
    const [wards, setWards] = useState<any[]>([]);

    // Store selected codes locally to manage levels correctly
    const [selectedProvCode, setSelectedProvCode] = useState<string>("");
    const [selectedDistCode, setSelectedDistCode] = useState<string>("");

    /* ================= LOAD PROVINCES ================= */
    useEffect(() => {
        fetch('https://provinces.open-api.vn/api/p/')
            .then(res => res.json())
            .then(data => {
                setProvinces(data);
                // Try to find code if name exists in props
                if (value.province) {
                    const found = data.find((p: any) => p.name === value.province);
                    if (found) setSelectedProvCode(String(found.code));
                }
            });
    }, []);

    // Sync codes if names change from outside
    useEffect(() => {
        if (value.province && provinces.length > 0) {
            const found = provinces.find(p => p.name === value.province);
            if (found) setSelectedProvCode(String(found.code));
        } else if (!value.province) {
            setSelectedProvCode("");
        }
    }, [value.province, provinces]);

    /* ================= HANDLERS ================= */
    const handleProvinceChange = async (code: string) => {
        const province = provinces.find(p => p.code === Number(code));
        setSelectedProvCode(code);
        setSelectedDistCode("");

        onChange({
            province: province?.name,
            district: undefined,
            ward: undefined,
        });

        setDistricts([]);
        setWards([]);

        const res = await fetch(
            `https://provinces.open-api.vn/api/p/${code}?depth=2`
        );
        const data = await res.json();
        setDistricts(data.districts || []);
    };

    const handleDistrictChange = async (code: string) => {
        const district = districts.find(d => d.code === Number(code));
        setSelectedDistCode(code);

        onChange({
            province: value.province,
            district: district?.name,
            ward: undefined,
        });

        setWards([]);

        const res = await fetch(
            `https://provinces.open-api.vn/api/d/${code}?depth=2`
        );
        const data = await res.json();
        setWards(data.wards || []);
    };

    const handleWardChange = (nameWithCode: string) => {
        // Since searchable select uses value as key, we use name here
        onChange({
            province: value.province,
            district: value.district,
            ward: nameWithCode,
        });
    };

    /* ================= RENDER ================= */
    return (
        <div className="grid md:grid-cols-3 gap-4">
            {/* PROVINCE */}
            <SearchableSelect
                placeholder="Tỉnh / Thành phố"
                options={provinces.map(p => ({ value: String(p.code), label: p.name }))}
                value={selectedProvCode}
                onValueChange={handleProvinceChange}
            />

            {/* DISTRICT */}
            <SearchableSelect
                placeholder="Quận / Huyện"
                disabled={!districts.length}
                options={districts.map(d => ({ value: String(d.code), label: d.name }))}
                value={selectedDistCode}
                onValueChange={handleDistrictChange}
            />

            {/* WARD */}
            <SearchableSelect
                placeholder="Phường / Xã"
                disabled={!wards.length}
                options={wards.map(w => ({ value: w.name, label: w.name }))}
                value={value.ward}
                onValueChange={handleWardChange}
            />
        </div>
    );
}
