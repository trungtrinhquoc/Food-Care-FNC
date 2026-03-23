import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { martApi } from '../services/martApi';
import { useAuth } from '../contexts/AuthContext';
import { AddressSelector, type AddressValue } from '../components/AddressSelector';
import { profileApi } from '../services/api';
import { geocodeAddressWithGoong, getCoordinatesFromPlaceId } from '../services/addressApi';
import { toast } from 'sonner';
import {
    MapPin, Star, Package, Navigation,
    Store, CheckCircle2, ArrowRight, AlertCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import type { NearbyMart } from '../types/mart';

// Default coordinates for Đà Nẵng — used when we cannot geocode the address
const DA_NANG_LAT = 16.047079;
const DA_NANG_LNG = 108.20623;

function toRad(value: number) {
    return (value * Math.PI) / 180;
}

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return earthRadiusKm * 2 * Math.asin(Math.sqrt(a));
}

function formatDistance(distanceKm: number) {
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
    return `${distanceKm.toFixed(1)}km`;
}

// Geocode an AddressValue using Goong APIs.
// 1) If user picked autocomplete suggestion, use place_id -> Place Detail (most accurate)
// 2) Else use full text Geocode
// Falls back to Đà Nẵng centre only when both fail.
async function geocodeAddress(address: AddressValue): Promise<{ lat: number; lng: number }> {
    const parts = [address.street, address.ward, address.district, address.province].filter(Boolean);
    if (parts.length === 0) return { lat: DA_NANG_LAT, lng: DA_NANG_LNG };

    if (address.placeId) {
        const fromPlaceId = await getCoordinatesFromPlaceId(address.placeId);
        if (fromPlaceId) return fromPlaceId;
    }

    const fullAddress = `${parts.join(', ')}, Việt Nam`;
    const fromGeocode = await geocodeAddressWithGoong(fullAddress);
    if (fromGeocode) return fromGeocode;

    return { lat: DA_NANG_LAT, lng: DA_NANG_LNG };
}

export default function MartSelectionPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user, refreshUser } = useAuth();
    const queryClient = useQueryClient();

    // Onboarding mode: /onboarding/mart shows step indicator, hides skip link
    const isOnboarding = location.pathname === '/onboarding/mart';

    // ── State ────────────────────────────────────────────────────────────────
    const [phase, setPhase] = useState<'address' | 'mart'>('address');
    const [address, setAddress] = useState<AddressValue>({});
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [selectedMartId, setSelectedMartId] = useState<number | null>(null);
    const [recipientName, setRecipientName] = useState(user?.fullName ?? '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
    const [rankedMarts, setRankedMarts] = useState<NearbyMart[] | null>(null);

    // Prefill from current default address so returning users can update quickly.
    useEffect(() => {
        if (!isAuthenticated) return;

        let cancelled = false;

        const prefillDefaultAddress = async () => {
            try {
                const addresses = await profileApi.getAddresses();
                const defaultAddress = addresses.find((a) => a.isDefault);
                if (!defaultAddress || cancelled) return;

                setRecipientName(defaultAddress.recipientName || user?.fullName || '');
                setPhoneNumber(defaultAddress.phoneNumber || user?.phoneNumber || '');
                setAddress({
                    province: defaultAddress.city,
                    district: defaultAddress.district,
                    ward: defaultAddress.ward,
                    street: defaultAddress.addressLine1,
                });

                if (typeof defaultAddress.latitude === 'number' && typeof defaultAddress.longitude === 'number') {
                    setCoords({ lat: defaultAddress.latitude, lng: defaultAddress.longitude });
                }
            } catch {
                // Keep manual entry UX if profile address fetch fails.
            }
        };

        prefillDefaultAddress();

        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, user?.fullName, user?.phoneNumber]);

    // ── Fetch marts ──────────────────────────────────────────────────────────
    const { data: marts, isLoading: loadingMarts, isError: martsError } = useQuery({
        queryKey: ['nearby-marts', coords?.lat, coords?.lng],
        queryFn: () => martApi.getNearbyMarts({
            latitude: coords!.lat,
            longitude: coords!.lng,
            radiusKm: 0,
            maxResults: 4,
        }),
        enabled: !!coords,
        retry: 1,
        select: (data) => {
            if (!data.length) return data;
            const hasPreSelected = data.some((m) => m.isPreSelected);
            if (!hasPreSelected) {
                return data.map((m, idx) => ({ ...m, isPreSelected: idx === 0 }));
            }
            return data;
        },
    });

    useEffect(() => {
        if (!marts || marts.length === 0 || !coords) {
            setRankedMarts(marts ?? null);
            return;
        }

        let cancelled = false;

        const recomputeDistance = async () => {
            const updated = marts.map((mart) => {
                if (typeof mart.latitude !== 'number' || typeof mart.longitude !== 'number') {
                    return mart;
                }

                const distanceKm = haversineDistanceKm(coords.lat, coords.lng, mart.latitude, mart.longitude);
                return { ...mart, distanceKm };
            });

            const sorted = [...updated]
                .sort((a, b) => (a.distanceKm - b.distanceKm) || ((b.rating ?? 0) - (a.rating ?? 0)))
                .map((m, idx) => ({ ...m, isPreSelected: idx === 0 }));

            if (!cancelled) {
                setRankedMarts(sorted);
            }
        };

        recomputeDistance();

        return () => {
            cancelled = true;
        };
    }, [coords, marts]);

    const displayMarts = rankedMarts ?? marts ?? [];

    // Set default selection to the first (pre-selected) mart — derived, no useEffect needed
    const defaultMartId = displayMarts.find((m) => m.isPreSelected)?.id ?? displayMarts[0]?.id ?? null;
    const effectiveSelectedId = selectedMartId ?? defaultMartId;

    // ── Select mart mutation ─────────────────────────────────────────────────
    const confirmMutation = useMutation({
        mutationFn: (martId: number) => martApi.selectMart(martId),
        onSuccess: async () => {
            queryClient.invalidateQueries({ queryKey: ['selected-mart'] });
            await refreshUser();
            localStorage.setItem('onboarding_completed', 'true');
            localStorage.removeItem('onboarding_pending');
            toast.success('Đã chọn mart thành công!');
            navigate(`/products?martId=${effectiveSelectedId}`, { replace: true });
        },
        onError: () => {
            toast.error('Không thể chọn mart. Vui lòng thử lại.');
        },
    });

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleAddressConfirm = async () => {
        if (!recipientName.trim()) {
            toast.error('Vui lòng nhập tên người nhận');
            return;
        }

        if (!phoneNumber.trim()) {
            toast.error('Vui lòng nhập số điện thoại');
            return;
        }

        if (!address.street?.trim() || !address.province?.trim() || !address.district?.trim()) {
            toast.error('Vui lòng nhập đầy đủ địa chỉ giao hàng');
            return;
        }

        setIsGeocoding(true);
        const result = await geocodeAddress(address);

        if (isAuthenticated) {
            try {
                const addresses = await profileApi.getAddresses();
                const defaultAddress = addresses.find((a) => a.isDefault);

                const payload = {
                    recipientName: recipientName.trim(),
                    phoneNumber: phoneNumber.trim(),
                    addressLine1: address.street?.trim() || '',
                    addressLine2: '',
                    city: address.province?.trim() || '',
                    district: address.district?.trim(),
                    ward: address.ward?.trim(),
                    latitude: result.lat,
                    longitude: result.lng,
                    isDefault: true,
                };

                if (defaultAddress) {
                    await profileApi.updateAddress(defaultAddress.id, payload);
                } else {
                    await profileApi.createAddress(payload);
                }
            } catch {
                setIsGeocoding(false);
                toast.error('Không thể lưu địa chỉ. Vui lòng thử lại.');
                return;
            }
        }

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

    const handleSkip = () => {
        localStorage.removeItem('onboarding_pending');
        navigate('/', { replace: true });
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
                                    className={`h-1.5 rounded-full flex-1 transition-colors ${step === 3 ? 'bg-emerald-500' : 'bg-emerald-200'
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
                            Nhập địa chỉ để chúng tôi tìm mart gần bạn nhất.
                        </p>
                        <div className="space-y-3 mb-4">
                            <Input
                                value={recipientName}
                                onChange={(e) => setRecipientName(e.target.value)}
                                placeholder="Tên người nhận"
                            />
                            <Input
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Số điện thoại"
                            />
                        </div>
                        <AddressSelector
                            value={address}
                            onChange={setAddress}
                            lockProvince={undefined}
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

                        {martsError && (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                                <p className="font-medium text-gray-700">Không thể tải danh sách mart</p>
                                <p className="text-sm text-gray-500 mt-1 mb-6">
                                    Hệ thống chưa có dữ liệu mart cho khu vực này. Bạn có thể thử lại sau.
                                </p>
                                <div className="flex flex-col items-center gap-3">
                                    <Button variant="outline" onClick={() => setPhase('address')}>
                                        Thử địa chỉ khác
                                    </Button>
                                    <button
                                        className="text-sm text-gray-400 hover:text-gray-600 underline"
                                        onClick={handleSkip}
                                    >
                                        Bỏ qua, vào trang chủ
                                    </button>
                                </div>
                            </div>
                        )}

                        {!martsError && displayMarts.length === 0 && (
                            <div className="text-center py-12">
                                <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                                <p className="font-medium text-gray-700">Không tìm thấy mart nào phù hợp</p>
                                <p className="text-sm text-gray-500 mt-1 mb-6">
                                    Hiện chưa có mart đang hoạt động để phục vụ khu vực của bạn.
                                </p>
                                <div className="flex flex-col items-center gap-3">
                                    <Button variant="outline" onClick={() => setPhase('address')}>
                                        Thay đổi địa chỉ
                                    </Button>
                                    <button
                                        className="text-sm text-gray-400 hover:text-gray-600 underline"
                                        onClick={handleSkip}
                                    >
                                        Bỏ qua, vào trang chủ
                                    </button>
                                </div>
                            </div>
                        )}

                        {displayMarts.length > 0 && (
                            <div className="space-y-3">
                                {displayMarts.map((mart: NearbyMart) => {
                                    const isSelected = mart.id === effectiveSelectedId;
                                    return (
                                        <button
                                            key={mart.id}
                                            onClick={() => setSelectedMartId(mart.id)}
                                            className={`w-full text-left bg-white rounded-2xl border-2 p-4 transition-all ${isSelected
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
                                                            {formatDistance(mart.distanceKm)}
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
                                                <div className={`ml-3 shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected
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
            {phase === 'mart' && displayMarts.length > 0 && (
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
                                'Xác nhận & xem sản phẩm mart'
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


