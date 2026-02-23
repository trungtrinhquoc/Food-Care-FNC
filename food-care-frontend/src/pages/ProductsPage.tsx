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
            <section className="bg-emerald-50/30">
                <div className="container mx-auto px-4 py-6 md:py-10">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Sản Phẩm Thiết Yếu</h1>
                    <p className="text-sm md:text-base text-gray-600 max-w-2xl">
                        Khám phá các sản phẩm chất lượng cao với giá ưu đãi khi đặt hàng định kỳ
                    </p>
                </div>
            </section>

            <section className="bg-white border-b sticky top-[64px] z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 md:py-4">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Category Tabs */}
                        <div className="w-full lg:w-auto overflow-hidden">
                            <Tabs value={selectedCategory} className="w-full">
                                <TabsList
                                    className="flex gap-1.5 p-1 bg-gray-50/50 rounded-xl overflow-x-auto whitespace-nowrap scrollbar-hide no-scrollbar"
                                >
                                    <TabsTrigger
                                        value="all"
                                        onClick={() => handleCategoryChange('all')}
                                        className={`
                                            px-4 py-1.5 text-sm font-medium rounded-lg transition-all
                                            ${selectedCategory === 'all'
                                                ? 'bg-white text-emerald-600 shadow-sm'
                                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
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
                                                    px-4 py-1.5 text-sm font-medium rounded-lg transition-all
                                                    ${isActive
                                                        ? 'bg-white text-emerald-600 shadow-sm'
                                                        : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                                                    }
                                                `}
                                            >
                                                {category.name}
                                            </TabsTrigger>
                                        );
                                    })}
                                </TabsList>
                            </Tabs>
                        </div>

                        {/* Search */}
                        <div className="relative w-full lg:w-80">
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 group-focus-within:text-emerald-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </span>
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
                                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:bg-white transition-all duration-300"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-6 md:py-8 lg:py-12">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
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
