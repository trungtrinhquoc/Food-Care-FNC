import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../services/api';
import { subscriptionApi } from '../services/subscriptionApi';
import type { SubscriptionOption, CreateSubscriptionRequest } from '../services/subscriptionApi';
import { productsApi } from '../services/productsApi';
import { toast } from 'sonner';
import {
    Package, Calendar, TrendingUp, Pause, Play,
    X, Loader2, ChevronRight, Clock, AlertCircle, Plus, Search
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import type { Product } from '../types';

interface Subscription {
    id: string;
    productId: string;
    productName: string;
    productImages?: string[];
    frequency: string;
    quantity: number;
    status: string;
    nextDeliveryDate: string;
    pauseUntil?: string;
    createdAt: string;
    discountPercent: number;
}

function parseImageUrl(imageUrl?: string | string[]): string[] {
    if (!imageUrl) return [];
    if (Array.isArray(imageUrl)) return imageUrl;
    if (typeof imageUrl === 'string' && !imageUrl.startsWith('[')) {
        return [imageUrl];
    }
    try {
        const parsed = JSON.parse(imageUrl);
        return Array.isArray(parsed) ? parsed : [imageUrl];
    } catch {
        return [imageUrl];
    }
}

function CreateSubscriptionDialog({
    open,
    onOpenChange,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    onSuccess: () => void;
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedFrequency, setSelectedFrequency] = useState('');
    const [quantity, setQuantity] = useState(1);

    const { data: options = [] } = useQuery<SubscriptionOption[]>({
        queryKey: ['subscription-options'],
        queryFn: subscriptionApi.getOptions,
        enabled: open,
    });

    const { data: searchResults = [] } = useQuery({
        queryKey: ['product-search', searchTerm],
        queryFn: async () => {
            if (!searchTerm.trim()) return [];
            const res = await productsApi.getProducts({ searchTerm: searchTerm.trim(), pageSize: 5 });
            return res.products;
        },
        enabled: searchTerm.trim().length >= 2,
    });

    const createMutation = useMutation({
        mutationFn: subscriptionApi.createSubscription,
        onSuccess: () => {
            toast.success('Đã tạo đơn hàng định kỳ thành công!');
            onSuccess();
            resetAndClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Không thể tạo đơn định kỳ');
        },
    });

    const resetAndClose = () => {
        setSearchTerm('');
        setSelectedProduct(null);
        setSelectedFrequency('');
        setQuantity(1);
        onOpenChange(false);
    };

    const selectedOption = options.find(o => o.code === selectedFrequency);

    const handleSubmit = () => {
        if (!selectedProduct || !selectedFrequency || !selectedOption) return;
        const dto: CreateSubscriptionRequest = {
            productId: selectedProduct.id,
            frequency: selectedFrequency,
            quantity,
            discountPercent: selectedOption.discountPercent,
        };
        createMutation.mutate(dto);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else onOpenChange(v); }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-700">
                        <Plus className="w-5 h-5" />
                        Tạo Đơn Hàng Định Kỳ
                    </DialogTitle>
                    <DialogDescription>
                        Chọn sản phẩm và tần suất giao hàng tự động
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Product search */}
                    {!selectedProduct ? (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Chọn sản phẩm</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            {searchResults.length > 0 && (
                                <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                                    {searchResults.map((p: Product) => (
                                        <button
                                            key={p.id}
                                            className="w-full flex items-center gap-3 p-2 hover:bg-emerald-50 transition-colors text-left"
                                            onClick={() => { setSelectedProduct(p); setSearchTerm(''); }}
                                        >
                                            <ImageWithFallback
                                                src={p.images?.[0]}
                                                alt={p.name}
                                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                                                <p className="text-xs text-gray-500">{p.basePrice.toLocaleString('vi-VN')}đ/{p.unit}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                            <ImageWithFallback
                                src={selectedProduct.images?.[0]}
                                alt={selectedProduct.name}
                                className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{selectedProduct.name}</p>
                                <p className="text-xs text-gray-500">{selectedProduct.basePrice.toLocaleString('vi-VN')}đ/{selectedProduct.unit}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(null)} className="h-8 w-8 p-0">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    )}

                    {/* Frequency */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Tần suất giao hàng</label>
                        <Select value={selectedFrequency} onValueChange={setSelectedFrequency}>
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn tần suất..." />
                            </SelectTrigger>
                            <SelectContent>
                                {options.map((opt) => (
                                    <SelectItem key={opt.code} value={opt.code}>
                                        {opt.label} {opt.discountPercent > 0 && `(giảm ${opt.discountPercent}%)`}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Số lượng</label>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}>
                                <span className="text-lg">−</span>
                            </Button>
                            <span className="w-12 text-center text-sm font-semibold">{quantity}</span>
                            <Button variant="outline" size="sm" className="h-9 w-9 p-0" onClick={() => setQuantity(q => q + 1)}>
                                <span className="text-lg">+</span>
                            </Button>
                        </div>
                    </div>

                    {/* Summary */}
                    {selectedProduct && selectedOption && (
                        <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Giá gốc</span>
                                <span>{(selectedProduct.basePrice * quantity).toLocaleString('vi-VN')}đ</span>
                            </div>
                            {selectedOption.discountPercent > 0 && (
                                <div className="flex justify-between text-emerald-600">
                                    <span>Giảm giá ({selectedOption.discountPercent}%)</span>
                                    <span>-{(selectedProduct.basePrice * quantity * selectedOption.discountPercent / 100).toLocaleString('vi-VN')}đ</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold border-t pt-1">
                                <span>Tạm tính mỗi kỳ</span>
                                <span className="text-emerald-600">
                                    {(selectedProduct.basePrice * quantity * (1 - selectedOption.discountPercent / 100)).toLocaleString('vi-VN')}đ
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={resetAndClose} disabled={createMutation.isPending}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!selectedProduct || !selectedFrequency || createMutation.isPending}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {createMutation.isPending ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Đang tạo...</>
                        ) : (
                            'Tạo đơn định kỳ'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function SubscriptionsPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('all');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    const { data: subscriptions = [], isLoading } = useQuery({
        queryKey: ['subscriptions'],
        queryFn: profileApi.getSubscriptions,
    });

    const mutationOptions = {
        onSuccess: (data: any) => {
            toast.success(data.message || 'Thành công');
            queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Đã có lỗi xảy ra');
        }
    };

    const pauseMutation = useMutation({
        mutationFn: profileApi.pauseSubscription,
        ...mutationOptions
    });

    const resumeMutation = useMutation({
        mutationFn: profileApi.resumeSubscription,
        ...mutationOptions
    });

    const cancelMutation = useMutation({
        mutationFn: profileApi.cancelSubscription,
        ...mutationOptions
    });

    const handlePauseSubscription = (id: string) => pauseMutation.mutate(id);
    const handleResumeSubscription = (id: string) => resumeMutation.mutate(id);
    const handleCancelSubscription = (id: string) => {
        if (confirm('Bạn có chắc muốn hủy đơn định kỳ này?')) {
            cancelMutation.mutate(id);
        }
    };

    const filteredSubscriptions = subscriptions.filter((sub: Subscription) => {
        if (activeTab === 'all') return true;
        return sub.status === activeTab;
    });

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { label: string; color: string; icon: any }> = {
            active: { label: 'Hoạt động', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: Clock },
            paused: { label: 'Tạm dừng', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: Pause },
            cancelled: { label: 'Đã hủy', color: 'text-rose-600 bg-rose-50 border-rose-100', icon: X },
        };
        return configs[status] || configs.active;
    };

    const getFrequencyText = (frequency: string) => {
        const frequencyMap: Record<string, string> = {
            daily: 'Hàng ngày',
            weekly: 'Hàng tuần',
            biweekly: '2 tuần/lần',
            monthly: 'Hàng tháng',
        };
        return frequencyMap[frequency] || frequency;
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
                <p className="text-gray-500 font-medium">Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD]">
            {/* Standard Hero Header - Slimmer */}
            <div className="bg-white border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-8 text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                        Đơn Hàng Định Kỳ
                    </h1>
                    <p className="text-gray-500 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                        Theo dõi và quản lý các đơn hàng tự động của bạn một cách tiện lợi và nhanh chóng.
                    </p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Modern Slim Tabs - More Compact */}
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                        <TabsList className="bg-gray-100/80 p-0.5 rounded-lg w-full md:w-fit border-none shadow-sm">
                            {[
                                { id: 'all', label: 'Tất cả' },
                                { id: 'active', label: 'Hoạt động' },
                                { id: 'paused', label: 'Tạm dừng' },
                                { id: 'cancelled', label: 'Đã hủy' },
                            ].map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === tab.id
                                        ? 'bg-white text-emerald-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCreateDialogOpen(true)}
                        className="btn-outline h-9 px-4 border-emerald-500 text-emerald-600 font-bold text-xs"
                    >
                        <Plus className="w-3.5 h-3.5 mr-2" />
                        Đăng ký mới
                    </Button>
                </div>

                {/* Subscription List */}
                {filteredSubscriptions.length === 0 ? (
                    <div className="bg-white rounded-3xl border-2 border-dashed border-gray-100 p-20 text-center animate-fade-in shadow-sm">
                        <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Package className="w-10 h-10 text-emerald-500" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đơn hàng nào</h3>
                        <p className="text-gray-500 text-base mb-8 max-w-sm mx-auto">
                            Khám phá danh sách sản phẩm và bắt đầu cuộc sống tiện lợi với dịch vụ giao hàng định kỳ.
                        </p>
                        <Button
                            onClick={() => navigate('/products')}
                            className="btn-primary h-12 px-10 rounded-full"
                        >
                            Khám phá ngay
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredSubscriptions.map((sub, index) => {
                            const config = getStatusConfig(sub.status);
                            const StatusIcon = config.icon;

                            return (
                                <div
                                    key={sub.id}
                                    className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 hover:shadow-lg hover:border-emerald-100 transition-all duration-300 animate-slide-up group"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
                                        <div className="flex flex-row items-start gap-4 flex-1 w-full">
                                            {/* Product Image Section - Slimmer */}
                                            <div className="relative shrink-0">
                                                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden border border-gray-100 shadow-sm group-hover:scale-[1.05] transition-transform duration-500 bg-gray-50">
                                                    <ImageWithFallback
                                                        src={parseImageUrl(sub.productImages as any)[0]}
                                                        alt={sub.productName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-emerald-600 text-white rounded-md text-[9px] font-black shadow-lg">
                                                        -{sub.discountPercent}%
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Main Content Section - Tighter */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                                    <h3 className="text-base md:text-lg font-bold text-gray-900 truncate hover:text-emerald-600 transition-colors cursor-pointer" onClick={() => navigate(`/products/${sub.productId}`)}>
                                                        {sub.productName}
                                                    </h3>
                                                    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-tight uppercase border transition-colors ${config.color.replace('text-', '').split(' ')[0]} ${config.color}`}>
                                                        <StatusIcon className="w-2.5 h-2.5" />
                                                        {config.label}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Calendar className="w-2.5 h-2.5" /> Chu kỳ
                                                        </p>
                                                        <p className="text-xs font-bold text-gray-800">{getFrequencyText(sub.frequency)}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Package className="w-2.5 h-2.5" /> Số lượng
                                                        </p>
                                                        <p className="text-xs font-bold text-gray-800">{sub.quantity} sp</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <TrendingUp className="w-2.5 h-2.5" /> Tiết kiệm
                                                        </p>
                                                        <p className="text-xs font-bold text-emerald-600">Giảm {sub.discountPercent}%</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                                            <Clock className="w-2.5 h-2.5" /> Giao tiếp
                                                        </p>
                                                        <p className="text-xs font-bold text-gray-800">
                                                            {new Date(sub.nextDeliveryDate).toLocaleDateString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>

                                                {sub.pauseUntil && (
                                                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold border border-amber-100 italic">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Tạm dừng đến {new Date(sub.pauseUntil).toLocaleDateString('vi-VN')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions Section - Compact Buttons */}
                                        <div className="flex shrink-0 w-full md:w-32 flex-row md:flex-col items-center justify-between gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-gray-50">
                                            {sub.status === 'active' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handlePauseSubscription(sub.id)}
                                                    className="flex-1 md:w-full h-8 text-[11px] font-bold border-amber-200 text-amber-600 hover:bg-amber-50 rounded-lg"
                                                >
                                                    {pauseMutation.isPending && pauseMutation.variables === sub.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Pause className="w-3 h-3 mr-1" />}
                                                    Tạm dừng
                                                </Button>
                                            )}
                                            {sub.status === 'paused' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleResumeSubscription(sub.id)}
                                                    className="btn-primary flex-1 md:w-full h-8 text-[11px] font-bold rounded-lg"
                                                >
                                                    {resumeMutation.isPending && resumeMutation.variables === sub.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1 fill-white" />}
                                                    Kích hoạt
                                                </Button>
                                            )}
                                            {sub.status !== 'cancelled' ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleCancelSubscription(sub.id)}
                                                    className="flex-1 md:w-full h-8 text-[11px] font-bold text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                                >
                                                    {cancelMutation.isPending && cancelMutation.variables === sub.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <X className="w-3 h-3 mr-1" />}
                                                    Hủy bỏ
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => navigate(`/products/${sub.productId}`)}
                                                    className="flex-1 md:w-full h-8 text-[11px] font-bold text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-lg"
                                                >
                                                    Mua lại
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Promotional Banner - Slimmer */}
                <div className="mt-12 p-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl text-white shadow-lg shadow-emerald-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h4 className="text-xl font-bold mb-1">Tiết kiệm nhiều hơn với Food & Care</h4>
                            <p className="text-emerald-50 text-xs max-w-lg font-medium">
                                Đơn định kỳ giúp bạn tiết kiệm đến 15% chi phí và đảm bảo thực phẩm tươi ngon mỗi ngày. Bạn có toàn quyền quản lý bất kỳ lúc nào.
                            </p>
                        </div>
                        <Button
                            onClick={() => navigate('/products')}
                            className="bg-white text-emerald-600 hover:bg-emerald-50 h-10 px-6 font-bold rounded-lg shadow-md active:scale-95 transition-all shrink-0 text-xs"
                        >
                            Xem thêm sản phẩm
                        </Button>
                    </div>
                </div>
            </div>

            {/* Create subscription dialog */}
            <CreateSubscriptionDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['subscriptions'] })}
            />
        </div>
    );

}
