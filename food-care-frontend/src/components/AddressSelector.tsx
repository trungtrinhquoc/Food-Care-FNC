import { useEffect, useState } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';

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

    /* ================= LOAD PROVINCES ================= */
    useEffect(() => {
        fetch('https://provinces.open-api.vn/api/p/')
            .then(res => res.json())
            .then(setProvinces);
    }, []);

    /* ================= HANDLERS ================= */
    const handleProvinceChange = async (code: string) => {
        const province = provinces.find(p => p.code === Number(code));

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

    const handleWardChange = (name: string) => {
        onChange({
            province: value.province,
            district: value.district,
            ward: name,
        });
    };

    /* ================= RENDER ================= */
    return (
        <div className="grid md:grid-cols-3 gap-4">
            {/* PROVINCE */}
            <Select onValueChange={handleProvinceChange}>
                <SelectTrigger className="h-11 bg-white text-base">
                    <SelectValue placeholder="Tỉnh / Thành phố" />
                </SelectTrigger>
                <SelectContent
                    className="bg-white border shadow-lg z-50"
                    position="popper"
                >
                    {provinces.map(p => (
                        <SelectItem key={p.code} value={String(p.code)} className="py-2">
                            {p.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* DISTRICT */}
            <Select
                onValueChange={handleDistrictChange}
                disabled={!districts.length}
            >
                <SelectTrigger className="h-11 bg-white text-base">
                    <SelectValue placeholder="Quận / Huyện" />
                </SelectTrigger>
                <SelectContent
                    className="bg-white border shadow-lg z-50"
                    position="popper"
                >
                    {districts.map(d => (
                        <SelectItem key={d.code} value={String(d.code)} className="py-2">
                            {d.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* WARD */}
            <Select onValueChange={handleWardChange} disabled={!wards.length}>
                <SelectTrigger className="h-11 bg-white text-base">
                    <SelectValue placeholder="Phường / Xã" />
                </SelectTrigger>
                <SelectContent
                    className="bg-white border shadow-lg z-50"
                    position="popper"
                >
                    {wards.map(w => (
                        <SelectItem key={w.code} value={w.name} className="py-2">
                            {w.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
