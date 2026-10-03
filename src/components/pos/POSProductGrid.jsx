"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { Search, Package, Layers, Plus, Minus, Check, RotateCcw, Filter, X } from "lucide-react";
import { extractBarcodeFromSKU } from "@/lib/barcodeTagPDF";

// Safe image parser
const getProductImage = (p, variant = null) => {
    if (variant?.image && typeof variant.image === 'string' && variant.image.trim()) {
        return variant.image.trim();
    }
    if (!p) return null;
    if (typeof p.image === 'string' && p.image.trim()) return p.image.trim();
    if (p.image?.url && typeof p.image.url === 'string') return p.image.url.trim();
    if (Array.isArray(p.images) && p.images.length > 0) {
        const first = p.images[0];
        if (typeof first === 'string' && first.trim()) return first.trim();
        if (first && typeof first === 'object' && first.url) return first.url;
    }
    if (typeof p.images === 'string' && p.images.trim()) {
        try {
            const parsed = JSON.parse(p.images);
            if (Array.isArray(parsed) && parsed.length > 0) {
                const first = parsed[0];
                if (typeof first === 'string' && first.trim()) return first.trim();
                if (first && typeof first === 'object' && first.url) return first.url;
            } else if (typeof parsed === 'string' && parsed.trim()) {
                return parsed.trim();
            }
        } catch {
            if (p.images.startsWith('http://') || p.images.startsWith('https://') || p.images.startsWith('/')) {
                return p.images.trim();
            }
        }
    }
    if (Array.isArray(p.productVariants) && p.productVariants.length > 0) {
        const variantWithImg = p.productVariants.find(v => v?.image);
        if (variantWithImg?.image) return variantWithImg.image;
    }
    return null;
};

const POSProductGrid = ({
    products = [],
    categories = [],
    isLoading = false,
    onAddToCart,
    onUpdateQuantity,
    cartItems = [],
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("all");
    const [variantModalProduct, setVariantModalProduct] = useState(null);
    const searchInputRef = useRef(null);

    // Map cart item quantities by productId (for non-variant or total) and itemKey
    const cartQtyMap = useMemo(() => {
        const map = {};
        cartItems.forEach(item => {
            map[item.itemKey] = item.quantity;
            map[`prod_${item.id}`] = (map[`prod_${item.id}`] || 0) + item.quantity;
        });
        return map;
    }, [cartItems]);

    // Count products per category
    const categoryCounts = useMemo(() => {
        const counts = {};
        products.forEach(p => {
            const catId = p.categoryId || p.subCategory?.categoryId || p.category?.id;
            if (catId) {
                counts[catId] = (counts[catId] || 0) + 1;
            }
        });
        return counts;
    }, [products]);

    // Filter products locally by search & category
    const filteredProducts = useMemo(() => {
        let list = Array.isArray(products) ? products : [];

        if (selectedCategoryId !== "all") {
            list = list.filter(p => {
                const catId = p.categoryId || p.subCategory?.categoryId || p.category?.id;
                return String(catId) === String(selectedCategoryId);
            });
        }

        const q = searchQuery.trim().toLowerCase();
        if (q) {
            list = list.filter(p => {
                const nameMatch = p.productName?.toLowerCase().includes(q);
                const skuMatch = p.sku?.toLowerCase().includes(q);
                const barcodeMatch = extractBarcodeFromSKU(p.sku, p.id).includes(q);
                const descMatch = p.description?.toLowerCase().includes(q);
                const catMatch = p.category?.name?.toLowerCase().includes(q) || p.subCategory?.name?.toLowerCase().includes(q);
                const variantMatch = p.productVariants?.some(v => 
                    v.sku?.toLowerCase().includes(q) || 
                    extractBarcodeFromSKU(v.sku, v.id).includes(q) ||
                    `${v.color || ''} ${v.size || ''}`.toLowerCase().includes(q)
                );
                return nameMatch || skuMatch || barcodeMatch || descMatch || catMatch || variantMatch;
            });
        }

        return list;
    }, [products, selectedCategoryId, searchQuery]);

    // Fast handle barcode enter key (supports both full SKU and 6-digit barcode scan)
    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            const trimmed = searchQuery.trim().toLowerCase();
            if (!trimmed) return;

            let matchedProduct = null;
            let matchedVariant = null;

            for (const p of products) {
                const pBarcode = extractBarcodeFromSKU(p.sku, p.id).toLowerCase();
                if (p.sku?.toLowerCase() === trimmed || pBarcode === trimmed) {
                    matchedProduct = p;
                    break;
                }
                const v = p.productVariants?.find(varItem => {
                    const vBarcode = extractBarcodeFromSKU(varItem.sku, varItem.id).toLowerCase();
                    return varItem.sku?.toLowerCase() === trimmed || vBarcode === trimmed;
                });
                if (v) {
                    matchedProduct = p;
                    matchedVariant = v;
                    break;
                }
            }

            if (!matchedProduct && filteredProducts.length === 1) {
                matchedProduct = filteredProducts[0];
            }

            if (matchedProduct) {
                if (!matchedVariant && matchedProduct.productVariants?.length > 0) {
                    setVariantModalProduct(matchedProduct);
                } else {
                    onAddToCart(matchedProduct, matchedVariant);
                    setSearchQuery("");
                }
            }
        }
    };

    const handleProductClick = (product) => {
        if (Array.isArray(product.productVariants) && product.productVariants.length > 0) {
            setVariantModalProduct(product);
        } else {
            onAddToCart(product, null);
        }
    };

    return (
        <div className="flex flex-col h-full bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
            {/* Header: Menu Categories Title + Filter Bar */}
            <div className="p-4 border-b border-gray-100 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-gray-800 tracking-tight">
                            Menu Categories
                        </h2>
                        <span className="text-xs text-gray-400 font-medium">
                            ({filteredProducts.length} Items)
                        </span>
                    </div>

                    {/* Search & Action Bar */}
                    <div className="flex items-center gap-2">
                        <div className="relative w-64 sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Search or scan barcode..."
                                className="w-full pl-9 pr-8 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:border-secound focus:bg-white transition shadow-2xs"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        {/* Reset Search / Filter */}
                        <button
                            type="button"
                            onClick={() => {
                                setSearchQuery("");
                                setSelectedCategoryId("all");
                            }}
                            className="p-2 text-gray-500 hover:text-secound bg-gray-50 hover:bg-secound/10 rounded border border-gray-200 transition cursor-pointer"
                            title="Reset filters"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>

                {/* Category Cards Carousel / Row (Matching Reference Image) */}
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
                    {/* All Categories Chip */}
                    <button
                        type="button"
                        onClick={() => setSelectedCategoryId("all")}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded border transition cursor-pointer shrink-0 text-left ${
                            selectedCategoryId === "all"
                                ? "bg-secound text-white border-secound shadow-xs"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                        }`}
                    >
                        <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                            selectedCategoryId === "all" ? "bg-white/20 text-white" : "bg-secound/10 text-secound"
                        }`}>
                            All
                        </div>
                        <div className="min-w-0 pr-1">
                            <p className="text-xs font-bold leading-none truncate">All Menus</p>
                            <p className={`text-[10px] mt-0.5 ${selectedCategoryId === "all" ? "text-white/80" : "text-gray-400"}`}>
                                {products.length} Items
                            </p>
                        </div>
                    </button>

                    {/* Dynamic Categories */}
                    {categories.map((cat) => {
                        const isSelected = String(selectedCategoryId) === String(cat.id);
                        const count = categoryCounts[cat.id] || 0;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setSelectedCategoryId(cat.id)}
                                className={`flex items-center gap-2.5 px-3 py-2 rounded border transition cursor-pointer shrink-0 text-left ${
                                    isSelected
                                        ? "bg-secound text-white border-secound shadow-xs"
                                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                                }`}
                            >
                                <div className={`w-8 h-8 rounded flex items-center justify-center font-bold text-xs ${
                                    isSelected ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                                }`}>
                                    {cat.name?.charAt(0)?.toUpperCase() || "C"}
                                </div>
                                <div className="min-w-0 pr-1">
                                    <p className="text-xs font-bold leading-none truncate">{cat.name}</p>
                                    <p className={`text-[10px] mt-0.5 ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                                        {count} Items
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Products Grid Area */}
            <div className="flex-1 p-4 overflow-y-auto">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="animate-pulse bg-gray-100 rounded p-3 h-52 flex flex-col justify-between">
                                <div className="bg-gray-200 h-28 rounded w-full mb-2"></div>
                                <div className="bg-gray-200 h-4 rounded w-3/4 mb-1"></div>
                                <div className="bg-gray-200 h-3 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Package size={44} className="stroke-[1.5] mb-2 text-gray-300" />
                        <p className="text-sm font-medium text-gray-500">No products found</p>
                        <p className="text-xs text-gray-400 mt-0.5">Try searching with another keyword or barcode</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                        {filteredProducts.map((product) => {
                            const hasVariants = Array.isArray(product.productVariants) && product.productVariants.length > 0;
                            const totalStock = hasVariants
                                ? product.productVariants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0)
                                : (parseInt(product.quantity) || 0);

                            const isOutOfStock = totalStock <= 0;
                            const displayPrice = product.salePrice || product.price || 0;
                            const imageUrl = getProductImage(product);
                            const categoryName = product.category?.name || product.subCategory?.name || "Product";
                            const cartQty = hasVariants
                                ? (cartQtyMap[`prod_${product.id}`] || 0)
                                : (cartQtyMap[`${product.id}`] || 0);

                            return (
                                <div
                                    key={product.id}
                                    className={`group flex flex-col justify-between bg-white rounded border transition-all duration-200 p-2.5 select-none ${
                                        isOutOfStock
                                            ? "border-gray-200 opacity-60 bg-gray-50"
                                            : cartQty > 0
                                                ? "border-secound/80 shadow-md ring-1 ring-secound/20"
                                                : "border-gray-200 hover:border-secound/60 hover:shadow-md"
                                    }`}
                                >
                                    {/* Image & Badges */}
                                    <div 
                                        onClick={() => !isOutOfStock && handleProductClick(product)}
                                        className="relative w-full aspect-square bg-gray-50 rounded overflow-hidden flex items-center justify-center border border-gray-100 mb-2 cursor-pointer"
                                    >
                                        {imageUrl ? (
                                            <Image
                                                src={imageUrl}
                                                alt={product.productName || "Product"}
                                                fill
                                                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                unoptimized={typeof imageUrl === 'string' && imageUrl.startsWith('http')}
                                            />
                                        ) : (
                                            <Package size={30} className="text-gray-300" />
                                        )}

                                        {/* Stock badge top left */}
                                        <div className="absolute top-1.5 left-1.5">
                                            {isOutOfStock ? (
                                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white shadow-xs">
                                                    Out of stock
                                                </span>
                                            ) : (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-xs ${
                                                    totalStock <= 5 ? "bg-amber-500" : "bg-emerald-600"
                                                }`}>
                                                    Stock: {totalStock}
                                                </span>
                                            )}
                                        </div>

                                        {/* Variant tag bottom right */}
                                        {hasVariants && (
                                            <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 bg-gray-900/80 text-white rounded text-[10px] font-medium flex items-center gap-1 backdrop-blur-xs">
                                                <Layers size={10} />
                                                <span>{product.productVariants.length} var</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block truncate">
                                                {categoryName}
                                            </span>
                                            <h4 
                                                onClick={() => !isOutOfStock && handleProductClick(product)}
                                                className="text-xs font-bold text-gray-900 line-clamp-2 leading-snug min-h-[32px] cursor-pointer hover:text-secound transition-colors"
                                                title={product.productName}
                                            >
                                                {product.productName}
                                            </h4>
                                        </div>

                                        {/* Price and Action Counter (Matching User Reference Image) */}
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                            <div>
                                                <span className="text-xs font-extrabold text-secound">
                                                    ৳{parseFloat(displayPrice).toLocaleString()}
                                                </span>
                                            </div>

                                            {/* Action / Qty Controller right on card */}
                                            {hasVariants ? (
                                                <button
                                                    type="button"
                                                    disabled={isOutOfStock}
                                                    onClick={() => handleProductClick(product)}
                                                    className="px-2 py-1 text-[11px] font-bold text-secound hover:bg-secound hover:text-white rounded border border-secound/40 transition cursor-pointer"
                                                >
                                                    {cartQty > 0 ? `In Cart (${cartQty})` : "Options"}
                                                </button>
                                            ) : (
                                                <div className="flex items-center bg-gray-50 border border-gray-200 rounded overflow-hidden">
                                                    <button
                                                        type="button"
                                                        disabled={cartQty === 0 || isOutOfStock}
                                                        onClick={() => onUpdateQuantity(`${product.id}`, cartQty - 1)}
                                                        className="px-1.5 py-0.5 text-gray-600 hover:text-rose-600 hover:bg-gray-200 transition disabled:opacity-40 cursor-pointer"
                                                    >
                                                        <Minus size={11} />
                                                    </button>
                                                    <span className="px-1.5 text-xs font-bold text-gray-800 min-w-[18px] text-center">
                                                        {cartQty}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={isOutOfStock || cartQty >= totalStock}
                                                        onClick={() => onAddToCart(product, null)}
                                                        className="px-1.5 py-0.5 text-gray-600 hover:text-secound hover:bg-gray-200 transition disabled:opacity-40 cursor-pointer"
                                                    >
                                                        <Plus size={11} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Variant Selection Modal */}
            {variantModalProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded shadow-2xl border border-gray-200 max-w-md w-full p-5 space-y-4">
                        <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 line-clamp-1">
                                    {variantModalProduct.productName}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">Select a variant to add to ticket</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setVariantModalProduct(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Variants List */}
                        <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                            {variantModalProduct.productVariants?.map((v) => {
                                const vStock = parseInt(v.quantity) || 0;
                                const vOutOfStock = vStock <= 0;
                                const vPrice = v.price || variantModalProduct.salePrice || variantModalProduct.price || 0;
                                const vName = [v.color, v.size].filter(Boolean).join(" / ") || v.sku || "Variant";
                                const itemKey = `${variantModalProduct.id}-v${v.id}`;
                                const vQty = cartQtyMap[itemKey] || 0;

                                return (
                                    <div
                                        key={v.id}
                                        onClick={() => {
                                            if (!vOutOfStock) {
                                                onAddToCart(variantModalProduct, v);
                                                setVariantModalProduct(null);
                                            }
                                        }}
                                        className={`flex items-center justify-between p-3 rounded border transition ${
                                            vOutOfStock
                                                ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                                : "border-gray-200 hover:border-secound hover:bg-secound/5 cursor-pointer"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200 overflow-hidden relative flex-shrink-0 flex items-center justify-center">
                                                {v.image || getProductImage(variantModalProduct) ? (
                                                    <Image
                                                        src={v.image || getProductImage(variantModalProduct)}
                                                        alt={vName}
                                                        fill
                                                        className="object-cover"
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <Package size={18} className="text-gray-400" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-800">{vName}</p>
                                                <p className="text-[11px] font-mono text-gray-400">{v.sku || "No SKU"}</p>
                                            </div>
                                        </div>

                                        <div className="text-right flex items-center gap-3">
                                            <div>
                                                <p className="text-xs font-bold text-secound">৳{parseFloat(vPrice).toLocaleString()}</p>
                                                <p className={`text-[10px] font-semibold ${vOutOfStock ? "text-rose-500" : "text-emerald-600"}`}>
                                                    {vOutOfStock ? "Out of Stock" : `Stock: ${vStock}`}
                                                </p>
                                            </div>
                                            {vQty > 0 && (
                                                <span className="px-2 py-0.5 rounded bg-secound text-white text-[11px] font-bold">
                                                    x{vQty}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default POSProductGrid;
