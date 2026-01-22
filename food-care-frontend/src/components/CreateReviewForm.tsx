import { useState, useRef } from "react";
import { Star, Upload, X, Loader2 } from "lucide-react";
import { uploadMultipleToCloudinary } from "../utils/cloudinary";

interface CreateReviewFormProps {
    productId: string;
    onSubmit: (payload: {
        productId: string;
        rating: number;
        comment: string;
        images: string[];
    }) => Promise<void>;
}

export function CreateReviewForm({
    productId,
    onSubmit,
}: CreateReviewFormProps) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);

            // Validate basic (size check is also in util but good to check early)
            const validFiles = newFiles.filter(f => f.size <= 5 * 1024 * 1024 && f.type.startsWith('image/'));

            if (validFiles.length + files.length > 5) {
                alert("Bạn chỉ được tải lên tối đa 5 ảnh.");
                return;
            }

            setFiles(prev => [...prev, ...validFiles]);

            // Create preview URLs
            const newPreviews = validFiles.map(f => URL.createObjectURL(f));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removeFile = (index: number) => {
        const newFiles = [...files];
        const newPreviews = [...previewUrls];

        // Revoke object URL to avoid memory leaks
        URL.revokeObjectURL(newPreviews[index]);

        newFiles.splice(index, 1);
        newPreviews.splice(index, 1);

        setFiles(newFiles);
        setPreviewUrls(newPreviews);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async () => {
        if (!rating || !comment.trim()) return;

        try {
            // 1. Upload images first
            let uploadedImageUrls: string[] = [];
            if (files.length > 0) {
                const results = await uploadMultipleToCloudinary(files);
                uploadedImageUrls = results.map(r => r.url);
            }

            // 2. Submit review with image URLs
            await onSubmit({
                productId,
                rating,
                comment,
                images: uploadedImageUrls,
            });

            // reset form
            setRating(0);
            setComment("");
            setFiles([]);
            setPreviewUrls([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mb-6 p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Viết đánh giá</h3>

            {/* RATING */}
            <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(star => (
                    <Star
                        key={star}
                        className={`w-5 h-5 cursor-pointer ${star <= rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                            }`}
                        onClick={() => setRating(star)}
                    />
                ))}
            </div>

            {/* COMMENT */}
            <textarea
                className="w-full border rounded p-2 text-sm"
                rows={3}
                placeholder="Chia sẻ cảm nhận của bạn..."
                value={comment}
                onChange={e => setComment(e.target.value)}
            />

            {/* IMAGE UPLOAD */}
            <div className="mt-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <button
                        type="button"
                        onClick={triggerFileInput}
                        disabled={submitting}
                        className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                        <Upload className="w-4 h-4" />
                        Thêm ảnh (Tối đa 5)
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <span className="text-xs text-gray-400">
                        {files.length}/5 ảnh
                    </span>
                </div>

                {/* VISUAL PREVIEW LIST */}
                {previewUrls.length > 0 && (
                    <div className="flex flex-wrap gap-3 mt-4">
                        {previewUrls.map((url, idx) => (
                            <div key={idx} className="relative w-24 h-24 border rounded-lg overflow-hidden group shadow-sm">
                                <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                                <button
                                    onClick={() => removeFile(idx)}
                                    className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* SUBMIT */}
            <button
                disabled={submitting}
                onClick={handleSubmit}
                className="mt-6 flex items-center gap-2 px-6 py-2 bg-black text-white text-sm font-medium rounded-full disabled:opacity-50 hover:bg-gray-800 transition-colors"
            >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
        </div>
    );
}
