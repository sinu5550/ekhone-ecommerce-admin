"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Edit, Trash2, Plus, RotateCcw, Eye, Package, Loader2, TrendingUp, Sparkles, X, Barcode } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import Pagination from "../shared/pagination";
import { useModal } from "@/hooks/useModal";
import { apiClient } from "@/lib/apiClient";
import { useProducts, useDashboardSummary, useCollections } from "@/lib/dataFetch";
import Link from "next/link";
import Image from "next/image";
import ProductEditDrawer from "../modal/ProductModal/ProductEditDrawer";
import ProductBarcodeDrawer from "../modal/ProductModal/ProductBarcodeDrawer";
import ProductDetailDrawer from "../modal/ProductModal/ProductDetailDrawer";
import { FaFileExcel, FaFilePdf } from "react-icons/fa";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { usePermission } from "@/context/PermissionProvider";

const RECORDS_PER_PAGE = 20;

const ProductTable = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [mainCategoryFilter, setMainCategoryFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [subCategoryFilter, setSubCategoryFilter] = useState("all");
    const [brandFilter, setBrandFilter] = useState("all");
    const [productTypeFilter, setProductTypeFilter] = useState("all");
    const [collectionFilter, setCollectionFilter] = useState("all");
    const [visibilityFilter, setVisibilityFilter] = useState("all");
    const [isTogglingVisibility, setIsTogglingVisibility] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState(null);
    const [selectedDetailProduct, setSelectedDetailProduct] = useState(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const editModal = useModal();
    const barcodeModal = useModal();
    const detailDrawer = useModal();
    const { hasPermission } = usePermission();
    const { data: collectionsData = [] } = useCollections();

    const handleOpenDetails = (product) => {
        setSelectedDetailProduct(product);
        detailDrawer.open();
    };

    // Build filters object
    const filters = useMemo(() => ({
        mainCategoryId: mainCategoryFilter,
        categoryId: categoryFilter,
        subCategoryId: subCategoryFilter,
        brandId: brandFilter,
        productType: productTypeFilter,
        collectionId: collectionFilter,
        visibility: visibilityFilter,
    }), [mainCategoryFilter, categoryFilter, subCategoryFilter, brandFilter, productTypeFilter, collectionFilter, visibilityFilter]);

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

    const { data: dashboardData } = useDashboardSummary();

    const categorySales = useMemo(() => {
        const topProducts = dashboardData?.topProducts || [];
        const salesMap = {};
        let totalSales = 0;

        topProducts.forEach(tp => {
            const matchingProd = productData.find(p => p.productName === tp.name);
            const categoryName = tp.category || matchingProd?.subCategory?.category?.name || "Uncategorized";
            const salesCount = Number(tp.sales) || 0;

            salesMap[categoryName] = (salesMap[categoryName] || 0) + salesCount;
            totalSales += salesCount;
        });

        if (totalSales === 0) return { topCategory: "N/A", percentage: 0, totalSales: 0 };

        const sorted = Object.entries(salesMap).sort((a, b) => b[1] - a[1]);
        const topCat = sorted[0][0];
        const pct = Math.round((sorted[0][1] / totalSales) * 100);

        return {
            topCategory: topCat,
            percentage: pct,
            totalSales
        };
    }, [dashboardData, productData]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, mainCategoryFilter, categoryFilter, subCategoryFilter, brandFilter, productTypeFilter, collectionFilter, visibilityFilter]);

    // Extract unique main categories for filter dropdown
    const mainCategories = useMemo(() => {
        const uniqueMainCategories = new Map();
        productData.forEach(product => {
            if (product.subCategory?.category?.mainCategory) {
                uniqueMainCategories.set(
                    product.subCategory.category.mainCategory.id,
                    product.subCategory.category.mainCategory
                );
            }
        });
        return Array.from(uniqueMainCategories.values());
    }, [productData]);

    // Extract unique categories for filter dropdown
    const categories = useMemo(() => {
        const uniqueCategories = new Map();
        productData.forEach(product => {
            if (product.subCategory?.category) {
                uniqueCategories.set(
                    product.subCategory.category.id,
                    product.subCategory.category
                );
            }
        });
        return Array.from(uniqueCategories.values());
    }, [productData]);

    // Extract unique subcategories for filter dropdown
    const availableSubCategories = useMemo(() => {
        const uniqueSubCategories = new Map();
        productData.forEach(product => {
            if (product.subCategory) {
                uniqueSubCategories.set(product.subCategory.id, {
                    id: product.subCategory.id,
                    name: product.subCategory.name,
                    code: product.subCategory.code
                });
            }
        });
        return Array.from(uniqueSubCategories.values());
    }, [productData]);

    // Extract unique brands for filter dropdown
    const brands = useMemo(() => {
        const uniqueBrands = new Map();
        productData.forEach(product => {
            if (product.brand) {
                uniqueBrands.set(product.brand.id, product.brand);
            }
        });
        return Array.from(uniqueBrands.values());
    }, [productData]);

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

    // Helper function to get product price for export
    const getProductPrice = useCallback((product) => {
        if (product.productType === "variant" && product.productVariants?.length) {
            const prices = product.productVariants.map(v => parseFloat(v.price));
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            return minPrice === maxPrice ? minPrice : `${minPrice} - ${maxPrice}`;
        }
        return product.price || 0;
    }, []);

    // Helper function to get product stock for export
    const getProductStock = useCallback((product) => {
        if (product.productType === "variant" && product.productVariants?.length) {
            return product.productVariants.reduce((sum, v) => sum + (v.quantity || 0), 0);
        }
        return product.quantity || 0;
    }, []);

    // Helper function to extract product thumbnail image
    const getProductImage = useCallback((product) => {
        if (!product) return null;

        // 1. Direct array of images
        if (Array.isArray(product.images) && product.images.length > 0) {
            const first = product.images[0];
            if (typeof first === "string" && first.trim()) return first.trim();
            if (first && typeof first === "object" && first.url) return first.url;
        }

        // 2. JSON string representation of images
        if (typeof product.images === "string" && product.images.trim()) {
            try {
                const parsed = JSON.parse(product.images);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const first = parsed[0];
                    if (typeof first === "string" && first.trim()) return first.trim();
                    if (first && typeof first === "object" && first.url) return first.url;
                } else if (typeof parsed === "string" && parsed.trim()) {
                    return parsed.trim();
                }
            } catch {
                if (product.images.startsWith("http://") || product.images.startsWith("https://") || product.images.startsWith("/")) {
                    return product.images.trim();
                }
            }
        }

        // 3. Fallback to variant image
        if (Array.isArray(product.productVariants) && product.productVariants.length > 0) {
            const variantWithImg = product.productVariants.find(v => v?.image);
            if (variantWithImg?.image) return variantWithImg.image;
        }

        return null;
    }, []);

    // Calculate displayed range
    const indexOfFirstRecord = pagination?.totalItems > 0
        ? (pagination.currentPage - 1) * pagination.limit + 1
        : 0;
    const indexOfLastRecord = Math.min(
        pagination.currentPage * pagination.limit,
        pagination.totalItems
    );

    /** Handlers */
    const handleSearch = useCallback(value => {
        setSearchTerm(value);
    }, []);

    const handleMainCategoryFilter = useCallback(value => {
        setMainCategoryFilter(value);
    }, []);

    const handleCategoryFilter = useCallback(value => {
        setCategoryFilter(value);
    }, []);

    const handleSubCategoryFilter = useCallback(value => {
        setSubCategoryFilter(value);
    }, []);

    const handleBrandFilter = useCallback(value => {
        setBrandFilter(value);
    }, []);

    const handleProductTypeFilter = useCallback(value => {
        setProductTypeFilter(value);
    }, []);

    const handleCollectionFilter = useCallback(value => {
        setCollectionFilter(value);
    }, []);

    const handleVisibilityFilter = useCallback(value => {
        setVisibilityFilter(value);
    }, []);

    /** Toggle product visibility (publish / unpublish) */
    const handleToggleVisibility = async (productId, currentVisibility) => {
        const isCurrentlyPublic = currentVisibility === "public" || !currentVisibility;
        const nextVisibility = isCurrentlyPublic ? "unpublish" : "public";

        setIsTogglingVisibility(productId);
        try {
            await apiClient(`/api/product/${productId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visibility: nextVisibility }),
            });

            await mutate();
            toast.success(nextVisibility === "public" ? "Product published successfully" : "Product unpublished successfully");
        } catch (error) {
            console.error("Failed to update visibility:", error);
            toast.error(error.message || "Failed to update product visibility");
        } finally {
            setIsTogglingVisibility(null);
        }
    };

    /** Delete product */
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Product?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) return;

        try {
            const res = await apiClient(`/api/product/${id}`, { method: "DELETE" });
            await mutate();

            const msg = res?.data?.message || res?.message || "Action completed";

            if (msg.includes("archived")) {
                toast.success("Product deleted (archived) successfully");
            } else {
                toast.success("Product deleted successfully");
            }
        } catch (err) {
            console.error("Delete failed:", err);
            const backendMessage =
                err?.response?.data?.message ||
                err?.response?.data?.error ||
                err?.response?.statusText ||
                err?.message ||
                "Failed to delete product";
            toast.error(backendMessage);
        }
    };

    const handleEditSuccess = () => {
        mutate();
        editModal.close();
        setSelectedItem(null);
    };

    const resetFilters = () => {
        setSearchTerm("");
        setMainCategoryFilter("all");
        setCategoryFilter("all");
        setSubCategoryFilter("all");
        setBrandFilter("all");
        setProductTypeFilter("all");
        setCollectionFilter("all");
        setVisibilityFilter("all");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm || mainCategoryFilter !== "all" ||
        categoryFilter !== "all" || subCategoryFilter !== "all" ||
        brandFilter !== "all" || productTypeFilter !== "all" ||
        collectionFilter !== "all" || visibilityFilter !== "all";

    // Export to Excel
    const handleExportExcel = async () => {
        try {
            setIsExportingExcel(true);

            // Fetch all products for export
            const response = await apiClient(`/api/products?limit=10000`);
            const exportData = response?.products || [];

            if (exportData.length === 0) {
                toast.error("No products available to export");
                setIsExportingExcel(false);
                return;
            }

            const excelData = exportData.map((product, index) => {
                const variantStats = getVariantStats(product);
                const isVariant = product.productType === "variant";

                return {
                    'SL No': index + 1,
                    'SKU': product.sku || '',
                    'Product Name': product.productName || '',
                    'Product Type': isVariant ? 'Variant' : 'Single',
                    'Main Category': product.subCategory?.category?.mainCategory?.name || '',
                    'Category': product.subCategory?.category?.name || '',
                    'Sub Category': product.subCategory?.name || '',
                    'Brand': product.brand?.name || '',
                    'Price': getProductPrice(product),
                    'Stock': getProductStock(product),
                    'Visibility': product.visibility === 'unpublish' ? 'Unpublished' : 'Published',
                    'Variant Count': isVariant ? variantStats?.variantCount || 0 : 0,
                    'Created At': product.createdAt ? new Date(product.createdAt).toLocaleString() : '',
                    'Updated At': product.updatedAt ? new Date(product.updatedAt).toLocaleString() : '',
                };
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            const colWidths = [
                { wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 12 },
                { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 15 },
                { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 }
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Products');

            const date = new Date();
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const fileName = `Product list Ekhone e-commerce ${dateStr}.xlsx`;

            XLSX.writeFile(wb, fileName);

            toast.success(`Successfully exported ${exportData.length} products to Excel`);
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export products to Excel. Please try again.");
        } finally {
            setIsExportingExcel(false);
        }
    };

    // Export to PDF
    const handleExportPDF = async () => {
        try {
            setIsExportingPDF(true);

            // Fetch all products for export
            const response = await apiClient(`/api/products?limit=10000`);
            const exportData = response?.products || [];

            if (exportData.length === 0) {
                toast.error("No products available to export");
                setIsExportingPDF(false);
                return;
            }

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            doc.setFontSize(18);
            doc.setTextColor(40, 40, 40);
            doc.setFont('helvetica', 'bold');
            doc.text('Product List - Ekhone E-commerce', pageWidth / 2, 18, { align: 'center' });

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.setFont('helvetica', 'normal');
            const dateStr = new Date().toLocaleString();
            doc.text(`Generated: ${dateStr}  |  Total Products: ${exportData.length}`, pageWidth / 2, 25, { align: 'center' });

            doc.setDrawColor(200, 200, 200);
            doc.line(10, 28, pageWidth - 10, 28);

            const tableData = exportData.map((product, index) => {
                const variantStats = getVariantStats(product);
                const isVariant = product.productType === "variant";
                const categoryHierarchy = [
                    product.subCategory?.category?.mainCategory?.name,
                    product.subCategory?.category?.name,
                    product.subCategory?.name
                ].filter(Boolean).join(' > ');

                return [
                    index + 1,
                    product.sku || '',
                    product.productName || '',
                    isVariant ? 'Variant' : 'Single',
                    categoryHierarchy || '-',
                    product.brand?.name || '',
                    getProductPrice(product).toString(),
                    getProductStock(product).toString(),
                    product.visibility === 'unpublish' ? 'Unpublished' : 'Published',
                    isVariant ? variantStats?.variantCount || 0 : 0,
                ];
            });

            autoTable(doc, {
                head: [[
                    'SL', 'SKU', 'Product Name', 'Type', 'Category',
                    'Brand', 'Price (৳)', 'Stock', 'Visibility', 'Variants'
                ]],
                body: tableData,
                startY: 32,
                styles: {
                    fontSize: 7,
                    cellPadding: 2,
                    textColor: [40, 40, 40],
                    lineColor: [220, 220, 220],
                    lineWidth: 0.1,
                },
                headStyles: {
                    fillColor: [90, 12, 61],
                    textColor: [255, 255, 255],
                    fontSize: 8,
                    fontStyle: 'bold',
                    halign: 'center',
                },
                alternateRowStyles: {
                    fillColor: [249, 250, 251],
                },
                columnStyles: {
                    0: { cellWidth: 10, halign: 'center' },
                    1: { cellWidth: 26 },
                    2: { cellWidth: 46 },
                    3: { cellWidth: 18, halign: 'center' },
                    4: { cellWidth: 50 },
                    5: { cellWidth: 24 },
                    6: { cellWidth: 20, halign: 'right' },
                    7: { cellWidth: 18, halign: 'center' },
                    8: { cellWidth: 22, halign: 'center' },
                    9: { cellWidth: 18, halign: 'center' },
                },
                margin: { top: 32, left: 10, right: 10, bottom: 20 },
                didDrawPage: function (data) {
                    const pageCount = doc.internal.getNumberOfPages();
                    const currentPage = data.pageNumber || 1;

                    doc.setFontSize(8);
                    doc.setTextColor(150, 150, 150);
                    doc.setFont('helvetica', 'italic');
                    doc.text(
                        `Page ${currentPage} of ${pageCount}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: 'center' }
                    );

                    doc.setDrawColor(220, 220, 220);
                    doc.line(10, pageHeight - 14, pageWidth - 10, pageHeight - 14);
                },
            });

            const fileName = `Product list Ekhone E-commerce ${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            toast.success(`Successfully exported ${exportData.length} products to PDF`);
        } catch (error) {
            console.error("PDF export failed:", error);
            toast.error("Failed to export products to PDF. Please try again.");
        } finally {
            setIsExportingPDF(false);
        }
    };

    return (
        <div className="space-y-6 text-gray-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher">
                        Products List: ({pagination?.totalItems || 0})
                    </h1>
                    <p className="text-gray-600 text-sm">Manage your products list</p>
                </div>
                {/* Top Buttons */}
                <div className="md:flex items-center justify-between mb-4 gap-10 space-y-3 md:space-y-0">
                    <div className="flex gap-4">
                        {hasPermission('product.export_pdf') && (
                            <button
                                onClick={handleExportPDF}
                                disabled={isExportingPDF}
                                title="PDF download"
                                className="p-2 border rounded bg-red-50 text-red-600 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-500 cursor-pointer"
                            >
                                {isExportingPDF ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <FaFilePdf size={18} />
                                )}
                            </button>
                        )}
                        {hasPermission('product.export_excel') && (
                            <button
                                onClick={handleExportExcel}
                                disabled={isExportingExcel}
                                title="Excel download"
                                className="p-2 border rounded bg-green-50 text-green-600 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-500 cursor-pointer"
                            >
                                {isExportingExcel ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <FaFileExcel size={18} />
                                )}
                            </button>
                        )}
                        <button
                            onClick={resetFilters}
                            title="Reset"
                            className="p-2 border rounded bg-sky-50 text-sky-600 hover:bg-sky-200 transition-colors duration-500 cursor-pointer"
                        >
                            <RotateCcw size={18} />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href={'/create-product'}
                            className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                        >
                            <Plus size={18} /> Add Product
                        </Link>
                    </div>
                </div>
            </div>

            {/* Product Performance Dashboard Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Total Products Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Catalog Products</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{pagination?.totalItems || 0}</h3>
                        <p className="text-xs text-slate-400 mt-2">Active items in catalog</p>
                    </div>
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                        <Package className="w-6 h-6" />
                    </div>
                </div>

                {/* Overall Units Sold Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overall Top Units Sold</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {categorySales.totalSales.toLocaleString()} units
                        </h3>
                        <p className="text-xs text-slate-400 mt-2">Sum of top products sales</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                {/* Filters Section (2 Rows) */}
                <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200/80">
                    {/* Row 1: Search & Categories */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Search products..."
                                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all text-sm"
                            />
                        </div>

                        {/* Main Category Filter */}
                        <select
                            value={mainCategoryFilter}
                            onChange={e => handleMainCategoryFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all text-sm cursor-pointer"
                        >
                            <option value="all">All Main Categories</option>
                            {mainCategories.map(mainCat => (
                                <option key={mainCat.id} value={mainCat.id}>
                                    {mainCat.name}
                                </option>
                            ))}
                        </select>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={e => handleCategoryFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all text-sm cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>

                        {/* Sub Category Filter */}
                        <select
                            value={subCategoryFilter}
                            onChange={e => handleSubCategoryFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all text-sm cursor-pointer"
                        >
                            <option value="all">All Sub Categories</option>
                            {availableSubCategories.map(subCategory => (
                                <option key={subCategory.id} value={subCategory.id}>
                                    {subCategory.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Row 2: Attributes, Visibility & Reset */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
                        {/* Brand Filter */}
                        <select
                            value={brandFilter}
                            onChange={e => handleBrandFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all text-sm cursor-pointer"
                        >
                            <option value="all">All Brands</option>
                            {brands.map(brand => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>

                        {/* Product Type Filter */}
                        <select
                            value={productTypeFilter}
                            onChange={e => handleProductTypeFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all text-sm cursor-pointer"
                        >
                            <option value="all">All Types</option>
                            <option value="single">Single Products</option>
                            <option value="variant">Variant Products</option>
                        </select>

                        {/* Collection Filter */}
                        <select
                            value={collectionFilter}
                            onChange={e => handleCollectionFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all text-sm cursor-pointer"
                        >
                            <option value="all">All Collections</option>
                            {collectionsData?.map(col => (
                                <option key={col.id} value={col.id}>
                                    {col.name}
                                </option>
                            ))}
                        </select>

                        {/* Visibility Filter */}
                        <select
                            value={visibilityFilter}
                            onChange={e => handleVisibilityFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition-all text-sm cursor-pointer"
                        >
                            <option value="all">All Visibility</option>
                            <option value="public">Published</option>
                            <option value="unpublish">Unpublished</option>
                        </select>

                        {/* Reset Filters Button */}
                        <button
                            onClick={resetFilters}
                            disabled={!hasActiveFilters}
                            className="px-3 py-2 border border-dashed border-gray-300 rounded text-xs font-semibold text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer bg-white"
                        >
                            <RotateCcw size={13} />
                            Reset Filters
                        </button>
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
                                    onClick={() => handleSearch("")}
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
                                    onClick={() => handleProductTypeFilter("all")}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {collectionFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                <Sparkles size={12} className="text-amber-500" />
                                Collection: {collectionsData.find(c => c.id === parseInt(collectionFilter))?.name || collectionFilter}
                                <button
                                    onClick={() => handleCollectionFilter("all")}
                                    className="hover:bg-amber-200 hover:text-amber-900 text-amber-500 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {mainCategoryFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                Main Category: {mainCategories.find(c => c.id === mainCategoryFilter)?.name || mainCategoryFilter}
                                <button
                                    onClick={() => handleMainCategoryFilter("all")}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {categoryFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                Category: {categories.find(c => c.id === categoryFilter)?.name || categoryFilter}
                                <button
                                    onClick={() => handleCategoryFilter("all")}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {subCategoryFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                Sub Category: {availableSubCategories.find(c => c.id === subCategoryFilter)?.name || subCategoryFilter}
                                <button
                                    onClick={() => handleSubCategoryFilter("all")}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {brandFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                Brand: {brands.find(c => c.id === brandFilter)?.name || brandFilter}
                                <button
                                    onClick={() => handleBrandFilter("all")}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {visibilityFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                Visibility: {visibilityFilter === "public" ? "Published" : "Unpublished"}
                                <button
                                    onClick={() => handleVisibilityFilter("all")}
                                    className="hover:bg-emerald-200 hover:text-emerald-900 text-emerald-500 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
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

                {/* Table */}
                <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto relative">
                        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 lg:hidden"></div>

                        <table className="w-full min-w-[1200px]">
                            <thead className="bg-neutral-50 text-white sticky top-0 z-20 shadow-xs">
                                <tr>
                                    {[
                                        { label: "#", width: "w-12", minWidth: "min-w-[50px]" },
                                        { label: "Image", width: "w-16", minWidth: "min-w-[64px]" },
                                        { label: "SKU", width: "w-24", minWidth: "min-w-[100px]" },
                                        { label: "Product Name", width: "w-48", minWidth: "min-w-[180px]" },
                                        { label: "Category", width: "w-52", minWidth: "min-w-[190px]" },
                                        { label: "Price", width: "w-28", minWidth: "min-w-[110px]" },
                                        { label: "Discount", width: "w-24", minWidth: "min-w-[90px]" },
                                        { label: "Stock", width: "w-24", minWidth: "min-w-[100px]" },
                                        { label: "Visibility", width: "w-36", minWidth: "min-w-[140px]" },
                                        { label: "Actions", width: "w-32", minWidth: "min-w-[130px]" }
                                    ].map((header) => (
                                        <th
                                            key={header.label}
                                            className={`${header.width} ${header.minWidth} px-3 py-3.5 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider`}
                                        >
                                            {header.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                <span className="ml-2">Loading products data...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : productData.length > 0 ? (
                                    productData.map((product, index) => {
                                        const variantStats = getVariantStats(product);
                                        const isVariant = product.productType === "variant";

                                        return (
                                            <tr
                                                key={product.id}
                                                className="hover:bg-gray-50 transition-colors duration-150 group"
                                            >
                                                <td className="px-3 py-3 text-sm text-gray-900 text-center whitespace-nowrap">
                                                    {indexOfFirstRecord + index}
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {(() => {
                                                        const imageUrl = getProductImage(product);
                                                        const imageElement = (
                                                            <div className="w-12 h-12 relative rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-2xs">
                                                                {imageUrl ? (
                                                                    <Image
                                                                        src={imageUrl}
                                                                        alt={product.productName || "Product image"}
                                                                        fill
                                                                        sizes="48px"
                                                                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                                                                        unoptimized={typeof imageUrl === "string" && imageUrl.startsWith("http://")}
                                                                    />
                                                                ) : (
                                                                    <Package className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                        );

                                                        if (hasPermission('product.view_details')) {
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleOpenDetails(product)}
                                                                    className="inline-block cursor-pointer focus:outline-none"
                                                                    title={`View details for ${product.productName}`}
                                                                >
                                                                    {imageElement}
                                                                </button>
                                                            );
                                                        }

                                                        return imageElement;
                                                    })()}
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex flex-col gap-1">
                                                        {isVariant && variantStats ? (
                                                            <span className="text-xs text-gray-500">
                                                                {variantStats.variantCount} variants
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex font-medium items-center px-2 py-0.5 rounded text-xs bg-sky-50 text-sky-800">
                                                                {product.sku}
                                                            </span>
                                                        )}
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium w-fit ${isVariant ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>
                                                            {isVariant ? (
                                                                <>
                                                                    <Package size={10} className="mr-1" />
                                                                    Variant
                                                                </>
                                                            ) : "Single"}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-3 py-3 text-sm text-gray-900 min-w-[150px]">
                                                    {hasPermission('product.view_details') ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenDetails(product)}
                                                            className="text-left font-medium text-slate-800 hover:text-primary hover:underline line-clamp-2 transition-colors cursor-pointer"
                                                            title={`View details for ${product.productName}`}
                                                        >
                                                            {product.productName}
                                                        </button>
                                                    ) : (
                                                        <div className="line-clamp-2 font-medium text-slate-800">
                                                            {product.productName}
                                                        </div>
                                                    )}
                                                    {product.collections && product.collections.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {product.collections.map((pc) => (
                                                                <span
                                                                    key={pc.id || pc.collectionId}
                                                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                                                                >
                                                                    <Sparkles size={9} className="text-amber-500" />
                                                                    {pc.collection?.name || "Collection"}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 text-sm text-gray-700 min-w-[190px]">
                                                    {product.subCategory ? (
                                                        <div className="flex flex-col gap-0.5">
                                                            {/* Hierarchy breadcrumb */}
                                                            <div className="flex items-center gap-1 text-[11px] text-gray-500">
                                                                <span
                                                                    className="font-medium text-slate-700 truncate max-w-[90px]"
                                                                    title={product.subCategory.category?.mainCategory?.name}
                                                                >
                                                                    {product.subCategory.category?.mainCategory?.name || "—"}
                                                                </span>
                                                                <span className="text-gray-300">/</span>
                                                                <span
                                                                    className="text-slate-600 truncate max-w-[90px]"
                                                                    title={product.subCategory.category?.name}
                                                                >
                                                                    {product.subCategory.category?.name || "—"}
                                                                </span>
                                                            </div>
                                                            {/* Subcategory leaf badge */}
                                                            <div className="flex items-center">
                                                                <span
                                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 truncate max-w-[180px]"
                                                                    title={`Sub Category: ${product.subCategory.name} (${product.subCategory.code || ''})`}
                                                                >
                                                                    {product.subCategory.name}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 text-sm">-</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 text-sm text-gray-900 whitespace-nowrap">
                                                    {isVariant && variantStats ? (
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{variantStats.priceRange}</span>
                                                            {product.costPrice > 0 && (
                                                                <span className="text-[10px] text-gray-500">Cost: ৳{product.costPrice}</span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        product.discountValue > 0 && product.discountType ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-slate-900">
                                                                    ৳ {(
                                                                        product.discountType === "Percentage"
                                                                            ? parseFloat(product.price) - (parseFloat(product.price) * product.discountValue / 100)
                                                                            : parseFloat(product.price) - product.discountValue
                                                                    ).toFixed(2)}
                                                                </span>
                                                                <span className="text-xs text-gray-400 line-through">
                                                                    ৳ {product.price}
                                                                </span>
                                                                {product.costPrice > 0 && (
                                                                    <span className="text-[10px] text-emerald-700 font-medium">
                                                                        Cost: ৳{product.costPrice}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <span>৳ {product.price}</span>
                                                                {product.costPrice > 0 && (
                                                                    <span className="text-[10px] text-emerald-700 font-medium">
                                                                        Cost: ৳{product.costPrice}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {product.discountValue > 0 && product.discountType ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                                            {product.discountType === "Percentage"
                                                                ? `-${product.discountValue}%`
                                                                : `-৳${product.discountValue}`}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 text-xs">—</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {isVariant && variantStats ? (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStats.totalStock === 0
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-purple-100 text-purple-800"
                                                            }`}>
                                                            {variantStats.totalStock}
                                                        </span>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${product.quantity <= product.quantityAlert
                                                            ? "bg-red-100 text-red-800"
                                                            : "bg-purple-100 text-purple-800"
                                                            }`}>
                                                            {product.quantity}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {(() => {
                                                        const isPublic = product.visibility === "public" || !product.visibility;
                                                        const isToggling = isTogglingVisibility === product.id;

                                                        return (
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    disabled={isToggling || !hasPermission('product.update')}
                                                                    onClick={() => handleToggleVisibility(product.id, product.visibility)}
                                                                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed ${isPublic ? "bg-emerald-500" : "bg-gray-300"
                                                                        }`}
                                                                    title={isPublic ? "Click to unpublish" : "Click to publish"}
                                                                >
                                                                    <span
                                                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${isPublic ? "translate-x-4" : "translate-x-0"
                                                                            }`}
                                                                    />
                                                                </button>
                                                                {isToggling ? (
                                                                    <Loader2 size={13} className="animate-spin text-gray-500" />
                                                                ) : (
                                                                    <span
                                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${isPublic
                                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                            : "bg-amber-50 text-amber-700 border border-amber-200"
                                                                            }`}
                                                                    >
                                                                        {isPublic ? "Published" : "Unpublished"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>

                                                <td className="px-3 py-3">
                                                    <div className="flex gap-1">
                                                        {hasPermission('product.view_details') && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenDetails(product)}
                                                                className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors duration-200 cursor-pointer"
                                                                title="View Product Details"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => {
                                                                setSelectedBarcodeProduct(product);
                                                                barcodeModal.open();
                                                            }}
                                                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors duration-200 cursor-pointer"
                                                            title="Print Barcode Tag"
                                                        >
                                                            <Barcode size={16} />
                                                        </button>
                                                        {hasPermission('product.update') && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedItem(product);
                                                                    editModal.open();
                                                                }}
                                                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors duration-200 cursor-pointer"
                                                                title="Edit"
                                                            >
                                                                <Edit size={16} />
                                                            </button>
                                                        )}

                                                        {hasPermission('product.delete') && (
                                                            <button
                                                                onClick={() => handleDelete(product.id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200 cursor-pointer"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={10} className="px-6 py-12 text-center">
                                            <div className="text-gray-500 flex flex-col items-center mx-auto w-full">
                                                <Search size={48} className="mx-auto mb-3 text-gray-300" />
                                                <p className="text-lg font-medium text-gray-900">No products found</p>
                                                <p className="text-sm mt-1 text-gray-600">
                                                    {pagination?.totalItems === 0
                                                        ? "Get started by adding your first product"
                                                        : "Try adjusting your search or filters"
                                                    }
                                                </p>
                                                {pagination?.totalItems === 0 && (
                                                    <Link
                                                        href={'/create-product'}
                                                        className="mt-4 px-4 py-2 bg-secound hover:bg-secound-hover text-white rounded transition-colors duration-200"
                                                    >
                                                        Add First Product
                                                    </Link>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="lg:hidden flex items-center justify-center gap-2 py-2 text-xs text-gray-400 border-t border-gray-100 bg-gray-50">
                        <span className="animate-pulse">←</span>
                        <span>Scroll horizontally to see all columns</span>
                        <span className="animate-pulse">→</span>
                    </div>
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

            {selectedDetailProduct && (
                <ProductDetailDrawer
                    isOpen={detailDrawer.isOpen}
                    onClose={() => {
                        detailDrawer.close();
                    }}
                    product={selectedDetailProduct}
                    onEdit={(prod) => {
                        setSelectedItem(prod);
                        editModal.open();
                    }}
                    onPrintBarcode={(prod, variant) => {
                        setSelectedBarcodeProduct(prod);
                        barcodeModal.open();
                    }}
                    onDelete={(id) => handleDelete(id)}
                    onToggleVisibility={(id, currentVis) => handleToggleVisibility(id, currentVis)}
                    hasPermission={hasPermission}
                />
            )}

            {selectedItem && (
                <ProductEditDrawer
                    isOpen={editModal.isOpen}
                    onClose={() => {
                        editModal.close();
                    }}
                    product={selectedItem}
                    onSuccess={handleEditSuccess}
                />
            )}

            {selectedBarcodeProduct && (
                <ProductBarcodeDrawer
                    isOpen={barcodeModal.isOpen}
                    onClose={() => {
                        barcodeModal.close();
                    }}
                    product={selectedBarcodeProduct}
                />
            )}
        </div>
    );
};

export default ProductTable;