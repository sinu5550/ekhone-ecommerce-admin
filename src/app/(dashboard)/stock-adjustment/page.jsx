// app/manage-stock/page.jsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Edit, Package, BarChart3, AlertTriangle, CheckCircle, Loader2, Barcode } from "lucide-react";
import { useProducts } from "@/lib/dataFetch";
import Link from "next/link";
import Pagination from "@/components/shared/pagination";
import StockEditModal from "@/components/modal/StockModal/StockEditModal";
import ProductBarcodeDrawer from "@/components/modal/ProductModal/ProductBarcodeDrawer";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";

const RECORDS_PER_PAGE = 20;

const StockAdjustment = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barcodeDrawerOpen, setBarcodeDrawerOpen] = useState(false);
    const [barcodeProduct, setBarcodeProduct] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const { hasPermission } = usePermission();

    // Build filters object for API
    const filters = useMemo(() => ({
        search: searchTerm,
        // Add any additional filters if needed
    }), [searchTerm]);

    // Updated hook with pagination parameters
    const {
        data: productData = [],
        pagination,
        isLoading,
        mutate
    } = useProducts(
        currentPage,
        RECORDS_PER_PAGE,
        searchTerm,
        filters
    );

    // Reset to page 1 when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Helper function to calculate variant stats
    const getVariantStats = useCallback((product) => {
        if (product.productType !== "variant" || !product.productVariants?.length) {
            return null;
        }

        const variants = product.productVariants;
        const totalStock = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        const prices = variants.map(v => parseFloat(v.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        return {
            variantCount: variants.length,
            totalStock,
            minPrice,
            maxPrice,
            priceRange: minPrice === maxPrice ? `৳${minPrice}` : `৳${minPrice} - ৳${maxPrice}`
        };
    }, []);

    // Calculate displayed range
    const indexOfFirstRecord = pagination?.totalItems > 0
        ? (pagination.currentPage - 1) * pagination.limit + 1
        : 0;
    const indexOfLastRecord = Math.min(
        pagination.currentPage * pagination.limit,
        pagination.totalItems
    );

    // Handlers
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    const handleEditStock = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleStockUpdateSuccess = (updatedProduct) => {
        if (updatedProduct && updatedProduct.id) {
            mutate((currentData) => {
                if (!currentData) return currentData;
                if (Array.isArray(currentData)) {
                    return currentData.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p);
                }
                if (currentData.products) {
                    return {
                        ...currentData,
                        products: currentData.products.map(p => p.id === updatedProduct.id ? { ...p, ...updatedProduct } : p)
                    };
                }
                return currentData;
            }, { revalidate: true });
        } else {
            mutate();
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedProduct(null);
    };

    // Calculate stock statistics
    const stockStats = useMemo(() => {
        let inStock = 0;
        let outOfStock = 0;
        let lowStock = 0;
        let variantProducts = 0;

        productData.forEach(product => {
            if (product.productType === "variant") {
                variantProducts++;
                const totalStock = product.productVariants?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0;
                if (totalStock === 0) {
                    outOfStock++;
                } else if (totalStock <= 10) {
                    lowStock++;
                } else {
                    inStock++;
                }
            } else {
                const stock = product.quantity || 0;
                if (stock === 0) {
                    outOfStock++;
                } else if (stock <= (product.quantityAlert || 10)) {
                    lowStock++;
                } else {
                    inStock++;
                }
            }
        });

        return {
            inStock,
            outOfStock,
            lowStock,
            variantProducts,
            total: pagination?.totalItems || productData.length
        };
    }, [productData, pagination]);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                <div className="mb-8">
                    <h1 className="text-3xl md:text-3xl font-bold text-gray-900 font-philosopher">Manage Stock</h1>
                    <p className="text-gray-600 mt-2">Update and monitor your product inventory</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Products</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">{stockStats.total}</p>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                                <BarChart3 className="h-6 w-6 text-teal-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">In Stock</p>
                                <p className="text-2xl font-bold text-green-600 mt-1">{stockStats.inStock}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg">
                                <CheckCircle className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Low Stock</p>
                                <p className="text-2xl font-bold text-yellow-600 mt-1">{stockStats.lowStock}</p>
                            </div>
                            <div className="p-3 bg-yellow-50 rounded-lg">
                                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Variant Products</p>
                                <p className="text-2xl font-bold text-purple-600 mt-1">{stockStats.variantProducts}</p>
                            </div>
                            <div className="p-3 bg-purple-50 rounded-lg">
                                <Package className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="overflow-hidden bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    <div className="flex flex-col justify-between gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-xl">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search products by name, SKU, category, or brand..."
                                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-600">
                                    Showing {indexOfFirstRecord + 1}-{Math.min(indexOfLastRecord, pagination?.totalItems || 0)} of {pagination?.totalItems || 0} products
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto p-6 border border-stone-200 rounded-lg">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        #
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Product Details
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Type & SKU
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Stock Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            {hasPermission('stock_adjustment.view') && (
                                <tbody className="divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12">
                                                <div className="flex items-center justify-center">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <span className="ml-3 text-gray-600">Loading products data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : productData.length > 0 ? (
                                        productData.map((product, index) => {
                                            const variantStats = getVariantStats(product);
                                            const isVariant = product.productType === "variant";
                                            const stockQuantity = isVariant ? (variantStats?.totalStock || 0) : (product.quantity || 0);

                                            // Determine stock status
                                            let stockStatus = {
                                                text: "In Stock",
                                                color: "bg-green-100 text-green-800",
                                                icon: "✓"
                                            };

                                            if (stockQuantity === 0) {
                                                stockStatus = {
                                                    text: "Out of Stock",
                                                    color: "bg-red-100 text-red-800",
                                                    icon: "!"
                                                };
                                            } else if (
                                                (isVariant && stockQuantity <= 10) ||
                                                (!isVariant && stockQuantity <= (product.quantityAlert || 10))
                                            ) {
                                                stockStatus = {
                                                    text: "Low Stock",
                                                    color: "bg-yellow-100 text-yellow-800",
                                                    icon: "⚠"
                                                };
                                            }

                                            return (
                                                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        {indexOfFirstRecord + index + 1}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <div className="font-medium text-gray-900">{product.productName}</div>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {product.subCategory?.category?.name || "Uncategorized"}
                                                                {product.brand?.name && ` • ${product.brand.name}`}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                {isVariant ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                                                                        <Package size={12} className="mr-1" />
                                                                        Variant ({variantStats?.variantCount || 0})
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                        Single
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-gray-600 font-mono">
                                                                {product.sku || "No SKU"}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="space-y-2">
                                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                                                                <span className="mr-1">{stockStatus.icon}</span>
                                                                {stockStatus.text}
                                                            </span>
                                                            <div className="text-sm text-gray-600">
                                                                {stockQuantity.toLocaleString()} unit{stockQuantity !== 1 ? 's' : ''}
                                                                {isVariant && variantStats && (
                                                                    <span className="text-xs text-gray-500 ml-1">
                                                                        ({variantStats.variantCount} variants)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => {
                                                                    setBarcodeProduct(product);
                                                                    setBarcodeDrawerOpen(true);
                                                                }}
                                                                className="p-2 border border-gray-200 hover:border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-2xs"
                                                                title="Print Barcode Tags"
                                                            >
                                                                <Barcode size={16} />
                                                            </button>
                                                            {hasPermission('stock_adjustment.update_stock') && (
                                                                <button
                                                                    onClick={() => handleEditStock(product)}
                                                                    className="px-3.5 py-2 bg-secound hover:bg-primary text-white rounded transition-colors duration-200 flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-2xs"
                                                                >
                                                                    <Edit size={15} />
                                                                    Update Stock
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12">
                                                <div className="text-center">
                                                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                                                    <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                                                    <p className="text-gray-600 mb-4">
                                                        {searchTerm ? "Try adjusting your search term" : "Add your first product to get started"}
                                                    </p>
                                                    {!searchTerm && productData.length === 0 && (
                                                        <Link
                                                            href="/create-product"
                                                            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded transition-colors"
                                                        >
                                                            Add First Product
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination?.totalPages > 1 && (
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={setCurrentPage}
                            totalRecords={pagination.totalItems}
                            indexOfFirstRecord={indexOfFirstRecord}
                            indexOfLastRecord={indexOfLastRecord}
                            className="border border-gray-200 px-6 py-4 rounded-lg bg-white"
                        />
                    )}
                </div>

                {/* Stock Edit Modal */}
                <StockEditModal
                    isOpen={isModalOpen}
                    onClose={handleModalClose}
                    product={selectedProduct}
                    onSuccess={handleStockUpdateSuccess}
                />

                {/* Barcode Tag Drawer */}
                {barcodeDrawerOpen && barcodeProduct && (
                    <ProductBarcodeDrawer
                        isOpen={barcodeDrawerOpen}
                        onClose={() => {
                            setBarcodeDrawerOpen(false);
                            setBarcodeProduct(null);
                        }}
                        product={barcodeProduct}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
};

export default StockAdjustment;