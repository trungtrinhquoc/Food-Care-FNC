import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../services/productsApi';
import { categoriesApi } from '../services/api';
import { useCart } from '../contexts/CartContext';
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import type { Product } from '../types'
import { ProductCard } from '../components/ProductCard'
import { useNavigate } from 'react-router-dom'
import { SimplePagination } from '../components/ui/pagination';




export default function ProductsPage() {
    const navigate = useNavigate()
    const pageSize = 12;
    const [currentPage, setCurrentPage] = useState(1);

    const handleViewDetail = (product: Product) => {
        navigate(`/products/${product.id}`)
    }

    const handleAddToCart = (product: Product) => {
        addToCart(product, 1)
    }
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesApi.getCategories,
    });
    const { data, isLoading, error } = useQuery({
        queryKey: ['products', selectedCategory, searchQuery, currentPage],
        queryFn: () =>
            productsApi.getProducts({
                page: currentPage,
                pageSize,
                searchTerm: searchQuery || undefined,
                categoryId: selectedCategory === 'all' ? undefined : parseInt(selectedCategory, 10),
            }),
    });

    const totalPages = data?.totalPages || Math.ceil((data?.totalCount || 0) / pageSize);
    const totalItems = data?.totalCount || data?.products.length || 0;

    // Reset page when filters change
    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    const handleSearch = () => {
        setSearchQuery(searchInput);
        setCurrentPage(1);
    };

    const { addToCart } = useCart();

    if (isLoading) {
        return <div className="text-center py-12">Đang tải...</div>;
    }

    if (error) {
        return (
            <div className="text-center py-12 text-red-600">
                Không thể tải sản phẩm. Vui lòng thử lại sau.
            </div>
        );
    }

    return (
        <div>
            <section >
                <div className="container mx-auto px-4 py-8">
                    <h1 className="mb-2">Sản Phẩm Thiết Yếu</h1>
                    <p className="text-gray-600">
                        Khám phá các sản phẩm chất lượng cao với giá ưu đãi khi đặt hàng định kỳ
                    </p>
                </div>
            </section>

            <section className="bg-white border-b sticky top-[73px] z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">

                        {/* Category Tabs */}
                        <Tabs defaultValue="all">
                            <TabsList
                                className="
            flex gap-2
            overflow-x-auto
            whitespace-nowrap
            max-w-full
            scrollbar-hide
        "
                            >
                                <TabsTrigger
                                    value="all"
                                    onClick={() => handleCategoryChange('all')}
                                    className={`
                px-4 py-2 rounded-md transition
                ${selectedCategory === 'all'
                                            ? 'bg-primary text-white'
                                            : 'bg-muted text-muted-foreground hover:bg-accent'
                                        }
            `}
                                >
                                    Tất cả
                                </TabsTrigger>

                                {categories?.map((category) => {
                                    const value = category.id.toString();
                                    const isActive = selectedCategory === value;

                                    return (
                                        <TabsTrigger
                                            key={category.id}
                                            value={value}
                                            onClick={() => handleCategoryChange(value)}
                                            className={`
                        px-4 py-2 rounded-md transition
                        ${isActive
                                                    ? 'bg-primary text-white'
                                                    : 'bg-muted text-muted-foreground hover:bg-accent'
                                                }
                    `}
                                        >
                                            {category.name}
                                        </TabsTrigger>
                                    );
                                })}
                            </TabsList>
                        </Tabs>

                        {/* Search */}
                        <div className="relative w-full md:w-80">
                            <input
                                type="text"
                                placeholder="Tìm kiếm sản phẩm..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                                className="w-full pl-10 pr-20 py-2 border rounded-md"
                            />


                        </div>
                        {/* <div className="flex gap-2 items-center">
                            <button
                                onClick={() => {
                                    setEditingProduct(undefined)
                                    setOpenDialog(true)
                                }}
                                className="btn-primary"
                            >
                                + Thêm sản phẩm
                            </button>
                        </div> */}

                    </div>
                </div>
            </section>




            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {data?.products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onViewDetail={handleViewDetail}
                            onAddToCart={handleAddToCart}
                        />
                    ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-8">
                        <SimplePagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={totalItems}
                            pageSize={pageSize}
                            onPageChange={setCurrentPage}
                            itemLabel="sản phẩm"
                        />
                    </div>
                )}
            </div>
            {/* <ProductDialog
                open={openDialog}
                onOpenChange={setOpenDialog}
                product={editingProduct}
                categories={categories ?? []}
                // suppliers={[]} // nếu chưa load supplier thì để []
                onSuccess={() => {
                    setOpenDialog(false)
                    // refetch products
                }}
            /> */}
        </div>
    );
}
