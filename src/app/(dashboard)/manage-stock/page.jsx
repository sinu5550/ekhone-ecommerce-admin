// app/manage-stock/page.jsx
"use client";

import { useState, useMemo, useCallback, useEffect, Fragment } from "react";
import { Search, Package, BarChart3, AlertTriangle, CheckCircle, ArrowDown, ArrowUp, PackagePlus, Loader2, ChevronDown, ChevronRight, Edit, RotateCcw, AlertCircle, Barcode } from "lucide-react";
import { useProducts, useMainCategories, useCategories, useSubCategories, useBrands } from "@/lib/dataFetch";
import { usePagination } from "@/hooks/usePagination";
import Link from "next/link";
import Image from "next/image";
import { toast } from "react-hot-toast";
import Pagination from "@/components/shared/pagination";
import StockEditModal from "@/components/modal/StockModal/StockEditModal";
import ProductBarcodeDrawer from "@/components/modal/ProductModal/ProductBarcodeDrawer";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";
import { apiClient } from "@/lib/apiClient";
import { extractBarcodeFromSKU } from "@/lib/barcodeTagPDF";

const RECORDS_PER_PAGE = 20;

const ManageStock = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [barcodeDrawerOpen, setBarcodeDrawerOpen] = useState(false);
    const [barcodeProduct, setBarcodeProduct] = useState(null);
    const [barcodeVariantId, setBarcodeVariantId] = useState(null);
    const [stockSortOrder, setStockSortOrder] = useState("desc"); // "desc" = stock out first, "asc" = in stock first
    const [expandedProducts, setExpandedProducts] = useState({});
    const [editingStockId, setEditingStockId] = useState(null);

    // Filters states
    const [stockStatusFilter, setStockStatusFilter] = useState("all"); // "all" | "in_stock" | "low_stock" | "out_of_stock"
    const [mainCategoryFilter, setMainCategoryFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [subCategoryFilter, setSubCategoryFilter] = useState("all");
    const [brandFilter, setBrandFilter] = useState("all");
    const [productTypeFilter, setProductTypeFilter] = useState("all");

    const { hasPermission } = usePermission();

    // Fetch lists for filter dropdowns
    const { data: mainCategoriesData = [] } = useMainCategories();
    const { data: categoriesData = [] } = useCategories();
    const { data: subCategoriesData = [] } = useSubCategories();
    const { data: brandsData = [] } = useBrands();

    // Load full catalog products for catalog-wide stock filtering, sorting, and stats
    const {
        data: allProducts = [],
        isLoading,
        mutate
    } = useProducts(1, 1000);

    // Unified stock calculation helper for single & variant products
    const getProductStockInfo = useCallback((product) => {
        const isVariant = product.productType === "variant";
        let stockQuantity = 0;
        let variantCount = 0;
        let priceRange = "";

        if (isVariant && product.productVariants?.length) {
            const variants = product.productVariants;
            variantCount = variants.length;
            stockQuantity = variants.reduce((sum, v) => sum + (v.quantity || 0), 0);
            const prices = variants.map(v => parseFloat(v.price) || 0);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            priceRange = minPrice === maxPrice ? `৳${minPrice}` : `৳${minPrice} - ৳${maxPrice}`;
        } else {
            stockQuantity = product.quantity || 0;
        }

        const alertThreshold = isVariant ? 10 : (product.quantityAlert || 10);

        let statusKey = "in_stock";
        let statusText = "In Stock";
        let statusColor = "bg-green-100 text-green-800";
        let statusIcon = "✓";
        let priority = 3; // 1 = out_of_stock, 2 = low_stock, 3 = in_stock

        if (stockQuantity === 0) {
            statusKey = "out_of_stock";
            statusText = "Out of Stock";
            statusColor = "bg-red-100 text-red-800";
            statusIcon = "!";
            priority = 1;
        } else if (stockQuantity <= alertThreshold) {
            statusKey = "low_stock";
            statusText = "Low Stock";
            statusColor = "bg-yellow-100 text-yellow-800";
            statusIcon = "⚠";
            priority = 2;
        }

        return {
            isVariant,
            stockQuantity,
            variantCount,
            priceRange,
            statusKey,
            statusText,
            statusColor,
            statusIcon,
            priority
        };
    }, []);

    const getVariantStats = useCallback((product) => {
        if (product.productType !== "variant" || !product.productVariants?.length) {
            return null;
        }
        const info = getProductStockInfo(product);
        return {
            variantCount: info.variantCount,
            totalStock: info.stockQuantity,
            priceRange: info.priceRange
        };
    }, [getProductStockInfo]);

    // Catalog-wide statistics
    const stockStats = useMemo(() => {
        let inStock = 0;
        let outOfStock = 0;
        let lowStock = 0;
        let variantProducts = 0;

        allProducts.forEach(product => {
            const info = getProductStockInfo(product);
            if (info.isVariant) variantProducts++;
            if (info.statusKey === "out_of_stock") outOfStock++;
            else if (info.statusKey === "low_stock") lowStock++;
            else inStock++;
        });

        return {
            inStock,
            outOfStock,
            lowStock,
            variantProducts,
            total: allProducts.length
        };
    }, [allProducts, getProductStockInfo]);

    // Filter and sort products across entire dataset
    const filteredAndSortedProducts = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();

        const filtered = allProducts.filter((product) => {
            const stockInfo = getProductStockInfo(product);

            // 1. Stock Status Filter
            if (stockStatusFilter !== "all" && stockInfo.statusKey !== stockStatusFilter) {
                return false;
            }

            // 2. Main Category Filter
            if (mainCategoryFilter !== "all") {
                const mainCatId = product.subCategory?.category?.mainCategory?.id || product.subCategory?.category?.mainCategoryId;
                if (mainCatId?.toString() !== mainCategoryFilter.toString()) {
                    return false;
                }
            }

            // 3. Category Filter
            if (categoryFilter !== "all") {
                const catId = product.subCategory?.category?.id || product.subCategory?.categoryId;
                if (catId?.toString() !== categoryFilter.toString()) {
                    return false;
                }
            }

            // 4. Sub Category Filter
            if (subCategoryFilter !== "all") {
                const subCatId = product.subCategory?.id || product.subCategoryId;
                if (subCatId?.toString() !== subCategoryFilter.toString()) {
                    return false;
                }
            }

            // 5. Brand Filter
            if (brandFilter !== "all") {
                const bId = product.brand?.id || product.brandId;
                if (bId?.toString() !== brandFilter.toString()) {
                    return false;
                }
            }

            // 6. Product Type Filter
            if (productTypeFilter !== "all") {
                if (product.productType !== productTypeFilter) {
                    return false;
                }
            }

            // 7. Search Term (Name, SKU, Barcode, categories, brand, variant SKUs)
            if (term) {
                const matches = [
                    product.productName,
                    product.sku,
                    extractBarcodeFromSKU(product.sku, product.id),
                    product.subCategory?.name,
                    product.subCategory?.category?.name,
                    product.subCategory?.category?.mainCategory?.name,
                    product.brand?.name,
                    ...(product.productVariants?.map(v => v.sku) || []),
                    ...(product.productVariants?.map(v => extractBarcodeFromSKU(v.sku, v.id)) || [])
                ].some(field => field?.toLowerCase().includes(term));

                if (!matches) return false;
            }

            return true;
        });

        filtered.sort((a, b) => {
            const stockInfoA = getProductStockInfo(a);
            const stockInfoB = getProductStockInfo(b);

            if (stockSortOrder === "desc") {
                // Out of Stock First: priority 1 (out) < priority 2 (low) < priority 3 (in)
                if (stockInfoA.priority !== stockInfoB.priority) {
                    return stockInfoA.priority - stockInfoB.priority;
                }
                return stockInfoA.stockQuantity - stockInfoB.stockQuantity;
            } else if (stockSortOrder === "asc") {
                // In Stock First: priority 3 (in) > priority 2 (low) > priority 1 (out)
                if (stockInfoA.priority !== stockInfoB.priority) {
                    return stockInfoB.priority - stockInfoA.priority;
                }
                return stockInfoB.stockQuantity - stockInfoA.stockQuantity;
            }
            return 0;
        });

        return filtered;
    }, [
        allProducts,
        searchTerm,
        stockStatusFilter,
        mainCategoryFilter,
        categoryFilter,
        subCategoryFilter,
        brandFilter,
        productTypeFilter,
        stockSortOrder,
        getProductStockInfo
    ]);

    // Client-side pagination over full filtered & sorted dataset
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
        resetToFirstPage
    } = usePagination(filteredAndSortedProducts, RECORDS_PER_PAGE);

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

    const toggleStockSortOrder = () => {
        setStockSortOrder(prev => prev === "desc" ? "asc" : "desc");
        resetToFirstPage();
    };

    const toggleProductExpanded = (productId) => {
        setExpandedProducts(prev => ({
            ...prev,
            [productId]: !prev[productId]
        }));
    };

    const executeStockUpdate = async (productId, payload) => {
        const response = await apiClient(`/api/product/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response || (!response.success && !response.data && response.status !== 'success')) {
            throw new Error(response?.message || "Failed to update stock");
        }
        return response;
    };

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        resetToFirstPage();
    }, [resetToFirstPage]);

    const handleEditStock = (product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handlePrintBarcode = (product, variantId = null) => {
        setBarcodeProduct(product);
        setBarcodeVariantId(variantId);
        setBarcodeDrawerOpen(true);
    };

    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setStockStatusFilter("all");
        setMainCategoryFilter("all");
        setCategoryFilter("all");
        setSubCategoryFilter("all");
        setBrandFilter("all");
        setProductTypeFilter("all");
        setStockSortOrder("desc");
        resetToFirstPage();
    }, [resetToFirstPage]);

    const hasActiveFilters = searchTerm || stockStatusFilter !== "all" || mainCategoryFilter !== "all" || categoryFilter !== "all" || subCategoryFilter !== "all" || brandFilter !== "all" || productTypeFilter !== "all";

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-3xl font-bold text-gray-900 font-philosopher">Manage Stock</h1>
                    <p className="text-gray-600 mt-2">Update and monitor your product inventory</p>
                </div>

                {/* Stats Cards - Interactive quick filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    {/* Total Products Card */}
                    <div
                        onClick={() => { setStockStatusFilter("all"); resetToFirstPage(); }}
                        className={`bg-white rounded-xl p-5 border ${stockStatusFilter === "all" ? "border-blue-500 ring-2 ring-blue-500/20 shadow-md" : "border-slate-100 shadow-sm hover:border-slate-300"} flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer`}
                        title="Click to view all products"
                    >
                        <div className="absolute top-0 right-0 h-1.5 w-full bg-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{stockStats.total}</h3>
                            <p className="text-xs text-slate-400 mt-1">Catalog items tracked</p>
                        </div>
                    </div>

                    {/* In Stock Card */}
                    <div
                        onClick={() => { setStockStatusFilter(prev => prev === "in_stock" ? "all" : "in_stock"); resetToFirstPage(); }}
                        className={`bg-white rounded-xl p-5 border ${stockStatusFilter === "in_stock" ? "border-green-500 ring-2 ring-green-500/20 shadow-md" : "border-slate-100 shadow-sm hover:border-slate-300"} flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer`}
                        title="Click to filter in-stock products"
                    >
                        <div className="absolute top-0 right-0 h-1.5 w-full bg-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Stock</span>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-green-600">{stockStats.inStock}</h3>
                            <p className="text-xs text-slate-400 mt-1">Sufficient inventory</p>
                        </div>
                    </div>

                    {/* Low Stock Card */}
                    <div
                        onClick={() => { setStockStatusFilter(prev => prev === "low_stock" ? "all" : "low_stock"); resetToFirstPage(); }}
                        className={`bg-white rounded-xl p-5 border ${stockStatusFilter === "low_stock" ? "border-yellow-500 ring-2 ring-yellow-500/20 shadow-md" : "border-slate-100 shadow-sm hover:border-slate-300"} flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer`}
                        title="Click to filter low-stock products"
                    >
                        <div className="absolute top-0 right-0 h-1.5 w-full bg-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock</span>
                            <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-yellow-600">{stockStats.lowStock}</h3>
                            <p className="text-xs text-slate-400 mt-1">Nearing reorder point</p>
                        </div>
                    </div>

                    {/* Out of Stock Card */}
                    <div
                        onClick={() => { setStockStatusFilter(prev => prev === "out_of_stock" ? "all" : "out_of_stock"); resetToFirstPage(); }}
                        className={`bg-white rounded-xl p-5 border ${stockStatusFilter === "out_of_stock" ? "border-red-500 ring-2 ring-red-500/20 shadow-md" : "border-slate-100 shadow-sm hover:border-slate-300"} flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer`}
                        title="Click to filter out-of-stock products"
                    >
                        <div className="absolute top-0 right-0 h-1.5 w-full bg-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Out of Stock</span>
                            <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                                <AlertCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-red-600">{stockStats.outOfStock}</h3>
                            <p className="text-xs text-slate-400 mt-1">Requires immediate restock</p>
                        </div>
                    </div>

                    {/* Variant Products Card */}
                    <div
                        onClick={() => { setProductTypeFilter(prev => prev === "variant" ? "all" : "variant"); resetToFirstPage(); }}
                        className={`bg-white rounded-xl p-5 border ${productTypeFilter === "variant" ? "border-purple-500 ring-2 ring-purple-500/20 shadow-md" : "border-slate-100 shadow-sm hover:border-slate-300"} flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300 cursor-pointer`}
                        title="Click to filter variant products"
                    >
                        <div className="absolute top-0 right-0 h-1.5 w-full bg-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Variant Products</span>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Package className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-purple-600">{stockStats.variantProducts}</h3>
                            <p className="text-xs text-slate-400 mt-1">Items with sizing/colors</p>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="overflow-hidden bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    {/* Search & Filters Bar */}
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
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
                                <button
                                    onClick={toggleStockSortOrder}
                                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors cursor-pointer text-sm font-medium ${
                                        stockSortOrder === "desc"
                                            ? "bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100"
                                            : "bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100"
                                    }`}
                                    title={stockSortOrder === "desc" ? "Showing out-of-stock items first across catalog. Click to sort in-stock first." : "Showing in-stock items first across catalog. Click to sort out-of-stock first."}
                                >
                                    {stockSortOrder === "desc" ? (
                                        <>
                                            <ArrowDown size={16} className="text-amber-600" />
                                            <span>Stock Out First</span>
                                        </>
                                    ) : (
                                        <>
                                            <ArrowUp size={16} className="text-emerald-600" />
                                            <span>In Stock First</span>
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={resetFilters}
                                    disabled={!hasActiveFilters}
                                    className="px-3 py-2 border border-dashed border-gray-300 rounded text-xs font-semibold text-gray-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw size={13} />
                                    Reset Filters
                                </button>

                                <div className="text-sm text-gray-600 whitespace-nowrap">
                                    Showing {totalRecords > 0 ? indexOfFirstRecord : 0}-{indexOfLastRecord} of {totalRecords} products
                                </div>
                            </div>
                        </div>

                        {/* Dropdowns Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {/* Stock Status Filter */}
                            <select
                                value={stockStatusFilter}
                                onChange={(e) => { setStockStatusFilter(e.target.value); resetToFirstPage(); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm font-medium text-gray-700"
                            >
                                <option value="all">All Stock Status ({stockStats.total})</option>
                                <option value="in_stock">In Stock ({stockStats.inStock})</option>
                                <option value="low_stock">Low Stock ({stockStats.lowStock})</option>
                                <option value="out_of_stock">Out of Stock ({stockStats.outOfStock})</option>
                            </select>

                            <select
                                value={mainCategoryFilter}
                                onChange={(e) => { setMainCategoryFilter(e.target.value); resetToFirstPage(); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            >
                                <option value="all">All Main Categories</option>
                                {mainCategoriesData.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            <select
                                value={categoryFilter}
                                onChange={(e) => { setCategoryFilter(e.target.value); resetToFirstPage(); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            >
                                <option value="all">All Categories</option>
                                {categoriesData.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            <select
                                value={subCategoryFilter}
                                onChange={(e) => { setSubCategoryFilter(e.target.value); resetToFirstPage(); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            >
                                <option value="all">All Sub Categories</option>
                                {subCategoriesData.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>

                            <select
                                value={brandFilter}
                                onChange={(e) => { setBrandFilter(e.target.value); resetToFirstPage(); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            >
                                <option value="all">All Brands</option>
                                {brandsData.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>

                            <select
                                value={productTypeFilter}
                                onChange={(e) => { setProductTypeFilter(e.target.value); resetToFirstPage(); }}
                                className="px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                            >
                                <option value="all">All Types</option>
                                <option value="single">Single Products</option>
                                <option value="variant">Variant Products</option>
                            </select>
                        </div>
                    </div>

                    {/* Dismissible Active Filter Chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 py-1 px-1 bg-white border border-gray-100 rounded-lg shadow-2xs">
                            <span className="text-xs text-gray-400 font-medium ml-2">Active filters:</span>
                            {searchTerm && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Search: "{searchTerm}"
                                    <button
                                        onClick={() => { setSearchTerm(""); resetToFirstPage(); }}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {stockStatusFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                    Stock: {stockStatusFilter === "in_stock" ? "In Stock" : stockStatusFilter === "low_stock" ? "Low Stock" : "Out of Stock"}
                                    <button
                                        onClick={() => { setStockStatusFilter("all"); resetToFirstPage(); }}
                                        className="hover:bg-amber-200 hover:text-amber-900 text-amber-500 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {mainCategoryFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Main Category: {mainCategoriesData.find(c => c.id.toString() === mainCategoryFilter)?.name || mainCategoryFilter}
                                    <button
                                        onClick={() => { setMainCategoryFilter("all"); resetToFirstPage(); }}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {categoryFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Category: {categoriesData.find(c => c.id.toString() === categoryFilter)?.name || categoryFilter}
                                    <button
                                        onClick={() => { setCategoryFilter("all"); resetToFirstPage(); }}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {subCategoryFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Sub Category: {subCategoriesData.find(c => c.id.toString() === subCategoryFilter)?.name || subCategoryFilter}
                                    <button
                                        onClick={() => { setSubCategoryFilter("all"); resetToFirstPage(); }}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {brandFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Brand: {brandsData.find(b => b.id.toString() === brandFilter)?.name || brandFilter}
                                    <button
                                        onClick={() => { setBrandFilter("all"); resetToFirstPage(); }}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {productTypeFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Type: {productTypeFilter === "single" ? "Single" : "Variant"}
                                    <button
                                        onClick={() => { setProductTypeFilter("all"); resetToFirstPage(); }}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={resetFilters}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 ml-auto cursor-pointer hover:underline transition-all"
                            >
                                Reset All
                            </button>
                        </div>
                    )}

                    {/* Products Table */}
                    <div className="overflow-x-auto p-6 border border-stone-200 rounded-lg">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">#</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Image</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Product Details</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type & SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Stock Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            {hasPermission('manage_stock.view') && (
                                <tbody className="divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12">
                                                <div className="flex items-center justify-center">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                    <span className="ml-3 text-gray-600">Loading products data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentRecords.length > 0 ? (
                                        currentRecords.map((product, index) => {
                                            const stockInfo = getProductStockInfo(product);
                                            const variantStats = getVariantStats(product);
                                            const isVariant = stockInfo.isVariant;
                                            const stockQuantity = stockInfo.stockQuantity;
                                            const stockStatus = {
                                                text: stockInfo.statusText,
                                                color: stockInfo.statusColor,
                                                icon: stockInfo.statusIcon
                                            };

                                            return (
                                                <Fragment key={product.id}>
                                                    <tr className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">{indexOfFirstRecord + index}</td>
                                                        <td className="px-6 py-4">
                                                            <div className="w-12 h-12 relative rounded-lg border border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                                                                {product.images?.[0] ? (
                                                                    <Image
                                                                        src={product.images[0]}
                                                                        alt={product.productName}
                                                                        fill
                                                                        sizes="48px"
                                                                        className="object-cover"
                                                                    />
                                                                ) : (
                                                                    <Package className="w-6 h-6 text-gray-300" />
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div>
                                                                <div className="flex items-center gap-1.5 font-medium text-gray-900">
                                                                    {isVariant && (
                                                                        <button
                                                                            onClick={() => toggleProductExpanded(product.id)}
                                                                            className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded transition-colors cursor-pointer"
                                                                        >
                                                                            {expandedProducts[product.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                        </button>
                                                                    )}
                                                                    {product.productName}
                                                                </div>
                                                                <div className="text-sm text-gray-500 mt-1 pl-6">
                                                                    {product.subCategory?.category?.name || "Uncategorized"}
                                                                    {product.brand?.name && ` • ${product.brand.name}`}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    {isVariant ? (
                                                                        <span
                                                                            onClick={() => toggleProductExpanded(product.id)}
                                                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 cursor-pointer hover:bg-purple-200"
                                                                        >
                                                                            <Package size={12} className="mr-1" />
                                                                            Variant ({variantStats?.variantCount || 0})
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                                                            Single
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm text-gray-600 font-mono">{product.sku || "No SKU"}</div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="space-y-2">
                                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                                                                    <span className="mr-1">{stockStatus.icon}</span>
                                                                    {stockStatus.text}
                                                                </span>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    {!isVariant ? (
                                                                        editingStockId === product.id ? (
                                                                            <div className="flex items-center gap-1">
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    autoFocus
                                                                                    key={product.id + "-" + product.quantity}
                                                                                    defaultValue={product.quantity}
                                                                                    onKeyDown={(e) => {
                                                                                        if (e.key === "Enter") e.target.blur();
                                                                                        if (e.key === "Escape") setEditingStockId(null);
                                                                                    }}
                                                                                    onBlur={async (e) => {
                                                                                        const val = parseInt(e.target.value);
                                                                                        setEditingStockId(null);
                                                                                        if (isNaN(val) || val < 0) return;
                                                                                        if (val === product.quantity) return;

                                                                                        // Optimistic update
                                                                                        mutate((currentData) => {
                                                                                            if (!currentData) return currentData;
                                                                                            if (Array.isArray(currentData)) {
                                                                                                return currentData.map(p => p.id === product.id ? { ...p, quantity: val } : p);
                                                                                            }
                                                                                            if (currentData.products) {
                                                                                                return {
                                                                                                    ...currentData,
                                                                                                    products: currentData.products.map(p => p.id === product.id ? { ...p, quantity: val } : p)
                                                                                                };
                                                                                            }
                                                                                            return currentData;
                                                                                        }, { revalidate: false });

                                                                                        try {
                                                                                            const res = await executeStockUpdate(product.id, {
                                                                                                quantity: val,
                                                                                                productType: "single"
                                                                                            });
                                                                                            toast.success("Stock updated inline");
                                                                                            if (res?.data) {
                                                                                                handleStockUpdateSuccess(res.data);
                                                                                            }
                                                                                        } catch (err) {
                                                                                            toast.error(err.message || "Failed to update stock");
                                                                                            mutate();
                                                                                        }
                                                                                    }}
                                                                                    className="w-18 px-1.5 py-1 border border-gray-300 rounded text-sm text-center font-semibold focus:ring-1 focus:ring-primary focus:border-primary bg-white"
                                                                                />
                                                                                <span className="text-xs text-gray-400">units</span>
                                                                            </div>
                                                                        ) : (
                                                                            <div
                                                                                onClick={() => setEditingStockId(product.id)}
                                                                                className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all cursor-pointer group"
                                                                                title="Click to edit stock inline"
                                                                            >
                                                                                <span className="text-sm font-semibold text-gray-700">{product.quantity}</span>
                                                                                <span className="text-xs text-gray-400">units</span>
                                                                                <Edit size={11} className="text-gray-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                            </div>
                                                                        )
                                                                    ) : (
                                                                        <div className="text-sm text-gray-600">
                                                                            {stockQuantity.toLocaleString()} units
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handlePrintBarcode(product)}
                                                                    className="p-2 border border-gray-200 hover:border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 rounded transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-2xs"
                                                                    title="Print Barcode Tags for this product"
                                                                >
                                                                    <Barcode size={16} />
                                                                </button>
                                                                {hasPermission('manage_stock.update') && (
                                                                    <button
                                                                        onClick={() => handleEditStock(product)}
                                                                        className="px-3.5 py-2 bg-secound hover:bg-primary text-white rounded transition-colors duration-200 flex items-center gap-1.5 text-xs font-medium cursor-pointer shadow-2xs"
                                                                    >
                                                                        <PackagePlus size={15} />
                                                                        Update Stock
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    {isVariant && expandedProducts[product.id] && product.productVariants?.map((variant) => (
                                                        <tr key={variant.id} className="bg-purple-50/20 hover:bg-purple-50/40 border-t border-purple-100 transition-colors">
                                                            <td className="px-6 py-2 text-xs text-gray-400 font-mono text-center">↳</td>
                                                            <td className="px-6 py-2">
                                                                {variant.image && (
                                                                    <div className="w-8 h-8 relative rounded border border-gray-100 overflow-hidden bg-white">
                                                                        <Image
                                                                            src={variant.image}
                                                                            alt="Variant view"
                                                                            fill
                                                                            sizes="32px"
                                                                            className="object-cover"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-2">
                                                                <div className="flex flex-wrap gap-1">
                                                                    {Object.entries(variant.attributes || {}).map(([key, val]) => (
                                                                        <span key={key} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 font-medium">
                                                                            {key}: {val}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-2 text-xs text-gray-500 font-mono">{variant.sku || "No SKU"}</td>
                                                            <td className="px-6 py-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    {editingStockId === variant.id ? (
                                                                        <div className="flex items-center gap-1">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                autoFocus
                                                                                key={variant.id + "-" + variant.quantity}
                                                                                defaultValue={variant.quantity}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === "Enter") e.target.blur();
                                                                                    if (e.key === "Escape") setEditingStockId(null);
                                                                                }}
                                                                                onBlur={async (e) => {
                                                                                    const val = parseInt(e.target.value);
                                                                                    setEditingStockId(null);
                                                                                    if (isNaN(val) || val < 0) return;
                                                                                    if (val === variant.quantity) return;

                                                                                    const updatedVariants = product.productVariants.map(v => ({
                                                                                        id: v.id,
                                                                                        sku: v.sku,
                                                                                        price: parseFloat(v.price),
                                                                                        quantity: v.id === variant.id ? val : v.quantity,
                                                                                        attributes: v.attributes,
                                                                                        image: v.image || null,
                                                                                        isDefault: v.isDefault || false,
                                                                                    }));

                                                                                    // Optimistic update
                                                                                    mutate((currentData) => {
                                                                                        if (!currentData) return currentData;
                                                                                        if (Array.isArray(currentData)) {
                                                                                            return currentData.map(p => p.id === product.id ? { ...p, productVariants: updatedVariants } : p);
                                                                                        }
                                                                                        if (currentData.products) {
                                                                                            return {
                                                                                                ...currentData,
                                                                                                products: currentData.products.map(p => p.id === product.id ? { ...p, productVariants: updatedVariants } : p)
                                                                                            };
                                                                                        }
                                                                                        return currentData;
                                                                                    }, { revalidate: false });

                                                                                    try {
                                                                                        const res = await executeStockUpdate(product.id, {
                                                                                            variants: updatedVariants,
                                                                                            productType: "variant",
                                                                                            quantity: 0
                                                                                        });
                                                                                        toast.success("Variant stock updated inline");
                                                                                        if (res?.data) {
                                                                                            handleStockUpdateSuccess(res.data);
                                                                                        }
                                                                                    } catch (err) {
                                                                                        toast.error(err.message || "Failed to update variant stock");
                                                                                        mutate();
                                                                                    }
                                                                                }}
                                                                                className="w-18 px-1.5 py-1 border border-purple-200 rounded text-sm text-center bg-white font-semibold focus:ring-1 focus:ring-purple-400 focus:border-purple-400"
                                                                            />
                                                                            <span className="text-xs text-purple-400">units</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div
                                                                            onClick={() => setEditingStockId(variant.id)}
                                                                            className="flex items-center gap-1 px-2 py-1 rounded border border-dashed border-purple-100 hover:border-purple-300 hover:bg-purple-50/20 transition-all cursor-pointer group"
                                                                            title="Click to edit variant stock inline"
                                                                        >
                                                                            <span className="text-sm font-semibold text-purple-700">{variant.quantity}</span>
                                                                            <span className="text-xs text-purple-400">units</span>
                                                                            <Edit size={11} className="text-purple-400 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-2">
                                                                <button
                                                                    onClick={() => handlePrintBarcode(product, variant.id)}
                                                                    className="px-2.5 py-1 text-xs border border-purple-200 hover:border-purple-400 bg-white hover:bg-purple-50 text-purple-700 rounded transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs font-medium"
                                                                    title="Print Barcode Tag for this variant"
                                                                >
                                                                    <Barcode size={13} />
                                                                    <span>Print Tag</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </Fragment>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12">
                                                <div className="text-center">
                                                    <Search size={48} className="mx-auto text-gray-300 mb-4" />
                                                    <p className="text-lg font-medium text-gray-900 mb-2">No products found</p>
                                                    <p className="text-gray-600 mb-4">
                                                        {hasActiveFilters ? "No products match the selected filters. Try clearing some filters." : "Add your first product to get started"}
                                                    </p>
                                                    {hasActiveFilters ? (
                                                        <button
                                                            onClick={resetFilters}
                                                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors text-sm font-medium cursor-pointer"
                                                        >
                                                            <RotateCcw size={14} />
                                                            Reset Filters
                                                        </button>
                                                    ) : allProducts.length === 0 ? (
                                                        <Link
                                                            href="/create-product"
                                                            className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded transition-colors"
                                                        >
                                                            Add First Product
                                                        </Link>
                                                    ) : null}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalRecords={totalRecords}
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
                            setBarcodeVariantId(null);
                        }}
                        product={barcodeProduct}
                        initialVariantId={barcodeVariantId}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
};

export default ManageStock;