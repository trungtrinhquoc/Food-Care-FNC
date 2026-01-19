import { useEffect, useState, useCallback } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Switch } from './ui/switch'
import { productsApi } from '../services/productsApi'
import { categoriesApi } from '../services/api'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from './ui/select'

import type { Product, Category } from '../types'
import type {
    CreateProductRequest,
    UpdateProductRequest,
} from '../types/index'
import { uploadMultipleToCloudinary } from '../utils/cloudinary'

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    product?: Product // có → edit | không → create
    categories?: Category[]
    onSuccess?: () => void
    // Optional: External form control for admin use
    externalForm?: CreateProductRequest
    onFormChange?: (form: CreateProductRequest) => void
    onSave?: () => void // If provided, skip API call and use this callback
}

const defaultForm: CreateProductRequest = {
    name: '',
    description: '',
    basePrice: 0,
    originalPrice: undefined,
    sku: '',
    stockQuantity: 0,
    categoryId: undefined,
    supplierId: undefined,
    isSubscriptionAvailable: false,
    images: [],
}

export function ProductDialog({
    open,
    onOpenChange,
    product,
    categories: externalCategories,
    onSuccess,
    externalForm,
    onFormChange,
    onSave,
}: ProductDialogProps) {
    const isEdit = !!product
    const [internalCategories, setInternalCategories] = useState<Category[]>([])
    const [internalForm, setInternalForm] = useState<CreateProductRequest>(defaultForm)
    const [loading, setLoading] = useState(false)

    // Use external or internal form/categories
    const categories = externalCategories || internalCategories
    const form = externalForm || internalForm

    const handleChange = useCallback(<K extends keyof CreateProductRequest>(
        key: K,
        value: CreateProductRequest[K]
    ) => {
        if (onFormChange) {
            onFormChange({ ...form, [key]: value })
        } else {
            setInternalForm((prev) => ({ ...prev, [key]: value }))
        }
    }, [form, onFormChange])

    // Load categories if not provided externally
    useEffect(() => {
        if (!open || externalCategories) return
        categoriesApi.getCategories().then(setInternalCategories)
    }, [open, externalCategories])

    // Load data when editing (only for internal form)
    useEffect(() => {
        if (!open) return
        
        if (product && !externalForm) {
            setInternalForm({
                name: product.name,
                description: product.description ?? '',
                basePrice: product.basePrice,
                originalPrice: product.originalPrice,
                sku: product.sku ?? '',
                stockQuantity: product.stockQuantity,
                categoryId: product.categoryId ? Number(product.categoryId) : undefined,
                supplierId: undefined,
                isSubscriptionAvailable: product.isSubscriptionAvailable,
                images: product.images ?? [],
            })
        } else if (!product && !externalForm) {
            setInternalForm(defaultForm)
        }
    }, [product, open, externalForm])

    const handleSubmit = async () => {
        // If external onSave is provided, use it instead of API call
        if (onSave) {
            onSave()
            return
        }

        try {
            setLoading(true)

            if (isEdit && product) {
                const updateData: UpdateProductRequest = {
                    ...form,
                }
                await productsApi.updateProduct(product.id, updateData)
            } else {
                await productsApi.createProduct(form)
            }

            onSuccess?.()
            onOpenChange(false)
        } catch (error) {
            console.error('Save product failed', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                    </DialogTitle>
                    <DialogDescription>
                        Nhập thông tin chi tiết của sản phẩm
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Name */}
                    <div>
                        <Label>Tên sản phẩm *</Label>
                        <Input
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="VD: Gạo ST25 Cao Cấp"
                        />
                    </div>
                    {/* Category */}
                    <div>
                        <Label>Danh mục *</Label>
                        <Select
                            value={form.categoryId?.toString()}
                            onValueChange={(v) => handleChange('categoryId', Number(v))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn danh mục" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>



                    {/* SKU */}
                    <div>
                        <Label>SKU</Label>
                        <Input
                            value={form.sku}
                            onChange={(e) => handleChange('sku', e.target.value)}
                            placeholder="SKU-001"
                        />
                    </div>

                    {/* Price */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Giá bán *</Label>
                            <Input
                                type="number"
                                value={form.basePrice}
                                onChange={(e) =>
                                    handleChange('basePrice', Number(e.target.value))
                                }
                            />
                        </div>

                        <div>
                            <Label>Giá gốc</Label>
                            <Input
                                type="number"
                                value={form.originalPrice ?? ''}
                                onChange={(e) =>
                                    handleChange(
                                        'originalPrice',
                                        e.target.value
                                            ? Number(e.target.value)
                                            : undefined
                                    )
                                }
                            />
                        </div>
                    </div>

                    {/* Stock */}
                    <div>
                        <Label>Tồn kho *</Label>
                        <Input
                            type="number"
                            value={form.stockQuantity}
                            onChange={(e) =>
                                handleChange('stockQuantity', Number(e.target.value))
                            }
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label>Mô tả</Label>
                        <Textarea
                            rows={3}
                            value={form.description}
                            onChange={(e) =>
                                handleChange('description', e.target.value)
                            }
                        />
                    </div>

                    {/* Images upload */}
                    <div className="space-y-2">
                        <Label>Hình ảnh sản phẩm</Label>

                        <Input
                            type="file"
                            accept="image/*"
                            multiple
                            disabled={loading}
                            onChange={async (e) => {
                                if (!e.target.files) return

                                try {
                                    setLoading(true)

                                    const results = await uploadMultipleToCloudinary(
                                        Array.from(e.target.files)
                                    )

                                    handleChange('images', [
                                        ...(form.images ?? []),
                                        ...results.map((r) => r.url),
                                    ])
                                } catch (err) {
                                    alert((err as Error).message)
                                } finally {
                                    setLoading(false)
                                }
                            }}
                        />

                        {/* Preview images */}
                        {form.images && form.images.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {form.images.map((url, index) => (
                                    <div key={index} className="relative group">
                                        <img
                                            src={url}
                                            className="h-24 w-full object-cover rounded-md border"
                                        />

                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleChange(
                                                    'images',
                                                    form.images!.filter((_, i) => i !== index)
                                                )
                                            }
                                            className="
              absolute top-1 right-1
              bg-black/60 text-white text-xs
              px-2 py-1 rounded
              opacity-0 group-hover:opacity-100
              transition
            "
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Subscription */}
                    <div className="flex items-center justify-between border rounded-lg p-4">
                        <div>
                            <Label>Cho phép đăng ký định kỳ</Label>
                            <p className="text-sm text-gray-500">
                                Bật nếu sản phẩm hỗ trợ subscription
                            </p>
                        </div>
                        <Switch
                            checked={form.isSubscriptionAvailable}
                            onCheckedChange={(v) =>
                                handleChange('isSubscriptionAvailable', v)
                            }
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {isEdit ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}