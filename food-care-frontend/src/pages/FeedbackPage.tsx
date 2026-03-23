import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MessageSquare, Send, Loader2, Star } from 'lucide-react';
import { feedbackApi } from '../services/feedbackApi';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';

export default function FeedbackPage() {
    const [description, setDescription] = useState('');
    const [rating, setRating] = useState(5);

    const { data: history = [], refetch, isLoading } = useQuery({
        queryKey: ['my-feedbacks'],
        queryFn: () => feedbackApi.getMyFeedbacks(),
        retry: 1,
    });

    const submitMutation = useMutation({
        mutationFn: () =>
            feedbackApi.submitFeedback({
                description: description.trim(),
                rating,
            }),
        onSuccess: () => {
            toast.success('Cảm ơn bạn đã gửi góp ý!');
            setDescription('');
            setRating(5);
            refetch();
        },
        onError: () => toast.error('Không thể gửi góp ý. Vui lòng thử lại.'),
    });

    const handleSubmit = () => {
        if (!description.trim()) {
            toast.error('Vui lòng nhập nội dung góp ý');
            return;
        }
        submitMutation.mutate();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-white rounded-2xl border p-6">
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-emerald-600" />
                        Góp ý về nền tảng
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Ý kiến của bạn giúp Food & Care cải thiện trải nghiệm tốt hơn.</p>

                    <div className="mt-5 space-y-3">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={6}
                            placeholder="Ví dụ: Tôi muốn thêm bộ lọc theo thương hiệu ở trang tìm kiếm..."
                            className="w-full px-3 py-2 rounded-lg border text-sm resize-none"
                        />

                        <div>
                            <span className="text-sm text-gray-600">Chấm điểm trải nghiệm:</span>
                            <div className="mt-2 flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setRating(v)}
                                        className="p-1"
                                        aria-label={`Đánh giá ${v} sao`}
                                    >
                                        <Star className={`w-6 h-6 ${v <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                                <span className="ml-2 text-sm text-gray-500">{rating}/5</span>
                            </div>
                        </div>

                        <Button onClick={handleSubmit} disabled={submitMutation.isPending} className="inline-flex items-center gap-1">
                            {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Gửi góp ý
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border p-6 mt-5">
                    <h2 className="text-lg font-semibold text-gray-900">Lịch sử góp ý của bạn</h2>
                    {isLoading ? (
                        <p className="text-sm text-gray-500 mt-3">Đang tải...</p>
                    ) : history.length === 0 ? (
                        <p className="text-sm text-gray-500 mt-3">Bạn chưa gửi góp ý nào.</p>
                    ) : (
                        <div className="mt-3 space-y-2">
                            {history.map((item) => (
                                <div key={item.id} className="rounded-lg border p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-medium text-gray-900">Góp ý nền tảng</p>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 inline-flex items-center gap-1">
                                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {item.rating || 0}/5
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{item.message}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
