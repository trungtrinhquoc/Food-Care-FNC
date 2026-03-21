import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { martApi } from '../services/martApi';
import { useAuth } from '../contexts/AuthContext';
import { AddressSelector, type AddressValue } from '../components/AddressSelector';
import { toast } from 'sonner';
import {
    MapPin, Star, Package, Navigation,
    Store, CheckCircle2, ArrowRight, AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import type { NearbyMart } from '../types/mart';

// Default coordinates for Đà Nẵng — used when we cannot geocode the address
const DA_NANG_LAT = 16.047079;
const DA_NANG_LNG = 108.20623;

// Geocode an AddressValue into lat/lng using the browser's Nominatim-proxied endpoint
// Falls back to Đà Nẵng centre if anything fails.
async function geocodeAddress(address: AddressValue): Promise<{ lat: number; lng: number }> {
    const parts = [address.street, address.ward, address.district, address.province].filter(Boolean);
    if (parts.length === 0) return { lat: DA_NANG_LAT, lng: DA_NANG_LNG };

    const q = encodeURIComponent(parts.join(', ') + ', Việt Nam');
    try {
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&accept-language=vi`,
            { headers: { 'Accept-Language': 'vi' } }
        );
        const json: Array<{ lat: string; lon: string }> = await res.json();
        if (json.length > 0) {
            return { lat: parseFloat(json[0].lat), lng: parseFloat(json[0].lon) };
        }
    } catch {
        /* fall through */
    }
    return { lat: DA_NANG_LAT, lng: DA_NANG_LNG };
}

export default function MartSelectionPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();

    // Onboarding mode: /onboarding/mart shows step indicator, hides skip link
    const isOnboarding = location.pathname === '/onboarding/mart';

    // ── State ────────────────────────────────────────────────────────────────
    const [phase, setPhase] = useState<'address' | 'mart'>('address');
    const [address, setAddress] = useState<AddressValue>({});
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [selectedMartId, setSelectedMartId] = useState<number | null>(null);

    // Auto-geocode with GPS on mount (best-effort)
    useEffect(() => {
        navigator.geolocation?.getCurrentPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setPhase('mart'); // skip address phase if GPS works
            },
            () => { /* user denied — stay in address phase */ }
        );
    }, []);

    // ── Fetch marts ──────────────────────────────────────────────────────────
    const { data: marts, isLoading: loadingMarts } = useQuery({
        queryKey: ['nearby-marts', coords?.lat, coords?.lng],
        queryFn: () => martApi.getNearbyMarts({
            latitude: coords!.lat,
            longitude: coords!.lng,
            radiusKm: 3,
            maxResults: 4, // PRD: show 3-4 marts, first pre-selected
        }),
        enabled: !!coords,
        select: (data) => {
            // Enforce pre-selection on first item if API doesn't set it
            if (!data.length) return data;
            const hasPreSelected = data.some((m) => m.isPreSelected);
            if (!hasPreSelected) {
                return data.map((m, idx) => ({ ...m, isPreSelected: idx === 0 }));
            }
            return data;
        },
    });

    // Set default selection to the first (pre-selected) mart — derived, no useEffect needed
    const defaultMartId = marts?.find((m) => m.isPreSelected)?.id ?? marts?.[0]?.id ?? null;
    const effectiveSelectedId = selectedMartId ?? defaultMartId;

    // ── Select mart mutation ─────────────────────────────────────────────────
    const confirmMutation = useMutation({
        mutationFn: (martId: number) => martApi.selectMart(martId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['selected-mart'] });
            localStorage.setItem('onboarding_completed', 'true');
            localStorage.removeItem('onboarding_pending');
            toast.success('Đã chọn mart thành công!');
            navigate('/', { replace: true });
        },
        onError: () => {
            toast.error('Không thể chọn mart. Vui lòng thử lại.');
        },
    });

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleAddressConfirm = async () => {
        if (!address.province && !address.district) {
            toast.error('Vui lòng nhập ít nhất quận/huyện');
            return;
        }
        setIsGeocoding(true);
        const result = await geocodeAddress(address);
        setCoords(result);
        setPhase('mart');
        setIsGeocoding(false);
    };

    const handleConfirmMart = () => {
        if (!isAuthenticated) {
            localStorage.setItem('onboarding_pending', 'true');
            navigate('/login?redirect=/onboarding/mart');
            return;
        }
        if (!effectiveSelectedId) {
            toast.error('Vui lòng chọn một mart');
            return;
        }
        confirmMutation.mutate(effectiveSelectedId!);
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* ── Header ── */}
            <div className="bg-white border-b px-4 py-4">
                <div className="max-w-lg mx-auto">
                    {isOnboarding && (
                        <div className="flex items-center gap-2 mb-3">
                            {/* Step indicator: 1 · 2 · [3] */}
                            {[1, 2, 3].map((step) => (
                                <div
                                    key={step}
                                    className={`h-1.5 rounded-full flex-1 transition-colors ${
                                        step === 3 ? 'bg-emerald-500' : 'bg-emerald-200'
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        <Store className="w-6 h-6 text-emerald-600 shrink-0" />
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                {phase === 'address' ? 'Địa chỉ của bạn' : 'Chọn Mart gần nhà'}
                            </h1>
                            <p className="text-xs text-gray-500">
                                {phase === 'address'
                                    ? 'Để tìm mart phục vụ bạn'
                                    : 'Hàng sẽ đến từ mart bạn chọn'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">

                {/* ── Phase 1: Address input ── */}
                {phase === 'address' && (
                    <div className="bg-white rounded-2xl border p-5">
                        <p className="text-sm text-gray-600 mb-4">
                            Nhập địa chỉ để chúng tôi tìm mart trong bán kính 3 km.
                        </p>
                        <AddressSelector
                            value={address}
                            onChange={setAddress}
                            lockProvince="Đà Nẵng"
                        />
                        <Button
                            className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3"
                            onClick={handleAddressConfirm}
                            disabled={isGeocoding}
                        >
                            {isGeocoding ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang tìm kiếm...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Tìm mart gần đây
                                    <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </Button>
                    </div>
                )}

                {/* ── Phase 2: Mart list ── */}
                {phase === 'mart' && (
                    <>
                        {/* Change address link */}
                        <button
                            className="text-sm text-emerald-600 hover:underline mb-4 flex items-center gap-1"
                            onClick={() => { setPhase('address'); setSelectedMartId(null); }}
                        >
                            <MapPin className="w-3.5 h-3.5" />
                            Thay đổi địa chỉ
                        </button>

                        {loadingMarts && (
                            <div className="flex flex-col items-center py-16">
                                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                                <p className="mt-4 text-sm text-gray-500">Đang tìm mart gần bạn...</p>
                            </div>
                        )}

                        {marts && marts.length === 0 && (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                <p className="font-medium text-gray-700">Không tìm thấy mart nào trong 3 km</p>
                                <p className="text-sm text-gray-500 mt-1 mb-4">
                                    Hiện chưa có mart phục vụ khu vực này. Thử địa chỉ khác?
                                </p>
                                <Button variant="outline" onClick={() => setPhase('address')}>
                                    Thay đổi địa chỉ
                                </Button>
                            </div>
                        )}

                        {marts && marts.length > 0 && (
                            <div className="space-y-3">
                                {marts.map((mart: NearbyMart) => {
                                    const isSelected = mart.id === effectiveSelectedId;
                                    return (
                                        <button
                                            key={mart.id}
                                            onClick={() => setSelectedMartId(mart.id)}
                                            className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all ${
                                                isSelected
                                                    ? 'border-emerald-500 ring-2 ring-emerald-100 shadow-sm'
                                                    : 'border-gray-100 hover:border-emerald-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {mart.storeName}
                                                        </h3>
                                                        {mart.isPreSelected && !isSelected && (
                                                            <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full shrink-0 border border-emerald-100">
                                                                Gợi ý
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1 flex items-center gap-1">
                                                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                                                        {mart.address}
                                                    </p>
                                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1">
                                                            <Navigation className="w-3.5 h-3.5 text-blue-500" />
                                                            {mart.distanceKm.toFixed(1)} km
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                                            {mart.rating.toFixed(1)}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Package className="w-3.5 h-3.5 text-emerald-500" />
                                                            {mart.productCount} sp
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className={`ml-3 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                    isSelected
                                                        ? 'bg-emerald-500 border-emerald-500'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white fill-white" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Sticky bottom CTA — show only in mart phase ── */}
            {phase === 'mart' && marts && marts.length > 0 && (
                <div className="sticky bottom-0 bg-white border-t px-4 py-4">
                    <div className="max-w-lg mx-auto">
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-base font-semibold"
                            disabled={!effectiveSelectedId || confirmMutation.isPending}
                            onClick={handleConfirmMart}
                        >
                            {confirmMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Đang xác nhận...
                                </span>
                            ) : (
                                'Xác nhận & vào trang chủ'
                            )}
                        </Button>
                        {!isOnboarding && (
                            <button
                                className="w-full mt-2 text-sm text-gray-400 hover:text-gray-600 py-1"
                                onClick={() => navigate('/')}
                            >
                                Bỏ qua
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


