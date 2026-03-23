import { useEffect, useState } from 'react';
import { MessageSquare, Loader2, Search, Star } from 'lucide-react';
import { feedbackApi } from '../../services/feedbackApi';
import type { PlatformFeedback } from '../../services/feedbackApi';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

export function FeedbackTab() {
    const [items, setItems] = useState<PlatformFeedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [ratingFilter, setRatingFilter] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await feedbackApi.getAdminFeedbacks(1, 100);
            setItems(res?.items ?? []);
        } catch {
            toast.error('Không thể tải góp ý người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const filtered = items.filter((x) => {
        const textMatch = [x.message || '', x.customerName || '']
            .join(' ')
            .toLowerCase()
            .includes(search.toLowerCase());
        const ratingMatch = ratingFilter == null || x.rating === ratingFilter;
        return textMatch && ratingMatch;
    });

    const averageRating = items.length > 0
        ? (items.reduce((sum, i) => sum + (i.rating || 0), 0) / items.length).toFixed(1)
        : '0.0';

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-xl border p-4">
                <h2 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-orange-500" />
                    Góp ý nền tảng từ người dùng
                </h2>
                <p className="text-sm text-gray-500 mt-1">Theo dõi ý kiến để cải thiện sản phẩm.</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="relative md:col-span-2">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm trong nội dung góp ý..." className="pl-9" />
                    </div>
                    <select
                        value={ratingFilter ?? ''}
                        onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
                        className="h-10 px-3 border rounded-lg text-sm"
                    >
                        <option value="">Tất cả số sao</option>
                        <option value="5">5 sao</option>
                        <option value="4">4 sao</option>
                        <option value="3">3 sao</option>
                        <option value="2">2 sao</option>
                        <option value="1">1 sao</option>
                    </select>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium">Tổng: {items.length} feedback</span>
                    <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-medium inline-flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        Trung bình: {averageRating}/5
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-xl border p-8 text-center text-gray-500 inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Đang tải feedback...
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-xl border p-6 text-gray-500">Chưa có góp ý nào.</div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((item) => (
                        <div key={item.id} className="bg-white rounded-xl border p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-medium text-gray-900">{item.customerName || 'Khách hàng ẩn danh'}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {item.rating || 0}/5
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{item.message}</p>
                            {item.createdAt && <p className="text-xs text-gray-400 mt-2">{new Date(item.createdAt).toLocaleString('vi-VN')}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
