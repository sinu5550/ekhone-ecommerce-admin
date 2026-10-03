// components/modal/StockModal/StockEditModal.jsx
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Package,
    AlertTriangle,
    CheckCircle,
    Loader2,
    Info,
    Plus,
    Minus,
    RotateCcw,
    Layers,
    ArrowRight,
    TrendingUp,
    TrendingDown,
    Search,
    Sparkles,
    Tag
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";

const StockEditModal = ({ isOpen, onClose, product: initialProduct, onSuccess }) => {
    const [remoteProduct, setRemoteProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [stockUpdates, setStockUpdates] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [variantSearch, setVariantSearch] = useState("");

    const product = remoteProduct || initialProduct;

    const isVariant = useMemo(() => {
        return product?.productType === "variant";
    }, [product]);

    // Initial stock values reference
    const initialStockMap = useMemo(() => {
        if (!product) return {};
        if (product.productType === "single") {
            return { main: product.quantity || 0 };
        }
        const map = {};
        if (product.productVariants) {
            product.productVariants.forEach(v => {
                map[v.id] = v.quantity || 0;
            });
        }
        return map;
    }, [product]);

    const totalVariantStock = useMemo(() => {
        if (!product || !isVariant || !product.productVariants) return 0;
        return product.productVariants.reduce((sum, variant) => {
            const currentStock = stockUpdates[variant.id] !== undefined
                ? stockUpdates[variant.id]
                : variant.quantity || 0;
            return sum + currentStock;
        }, 0);
    }, [product, isVariant, stockUpdates]);

    const initialTotalStock = useMemo(() => {
        if (!product) return 0;
        if (!isVariant) return product.quantity || 0;
        return (product.productVariants || []).reduce((sum, v) => sum + (v.quantity || 0), 0);
    }, [product, isVariant]);

    const currentTotalStock = isVariant ? totalVariantStock : (stockUpdates.main !== undefined ? stockUpdates.main : (product?.quantity || 0));
    const totalDelta = currentTotalStock - initialTotalStock;

    const hasChanges = useMemo(() => {
        if (!product) return false;
        if (isVariant) {
            return product.productVariants?.some(variant => {
                const currentValue = variant.quantity || 0;
                const newValue = stockUpdates[variant.id];
                return newValue !== undefined && newValue !== currentValue;
            }) || false;
        } else {
            const currentValue = product.quantity || 0;
            const newValue = stockUpdates.main;
            return newValue !== undefined && newValue !== currentValue;
        }
    }, [product, isVariant, stockUpdates]);

    const getStockStatus = useCallback((quantity) => {
        const threshold = product?.quantityAlert || 10;
        if (quantity <= 0) return { label: "Out of Stock", color: "bg-red-100 text-red-800 border-red-200" };
        if (quantity <= threshold) return { label: "Low Stock", color: "bg-amber-100 text-amber-800 border-amber-200" };
        return { label: "In Stock", color: "bg-emerald-100 text-emerald-800 border-emerald-200" };
    }, [product]);

    const getProductImage = useCallback((prod) => {
        if (!prod) return null;
        if (Array.isArray(prod.images) && prod.images.length > 0) return prod.images[0];
        if (typeof prod.images === "string") {
            try {
                const parsed = JSON.parse(prod.images);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
                return parsed;
            } catch {
                return prod.images;
            }
        }
        return prod.thumbnail || null;
    }, []);

    // Sync initial stock updates when product or modal open changes
    useEffect(() => {
        if (isOpen && initialProduct) {
            setRemoteProduct(null);
            setErrorMessage("");
            setSuccessMessage("");
            setVariantSearch("");

            if (initialProduct.productType === "single") {
                setStockUpdates({ main: initialProduct.quantity || 0 });
            } else if (initialProduct.productType === "variant" && initialProduct.productVariants) {
                const variantUpdates = {};
                initialProduct.productVariants.forEach(variant => {
                    variantUpdates[variant.id] = variant.quantity || 0;
                });
                setStockUpdates(variantUpdates);
            }
        } else if (!isOpen) {
            setRemoteProduct(null);
            setStockUpdates({});
            setSuccessMessage("");
            setErrorMessage("");
            setVariantSearch("");
        }
    }, [isOpen, initialProduct]);

    // Escape listener
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen && !loading) {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose, loading]);

    const handleStockChange = useCallback((variantId, value) => {
        if (!product) return;
        const numValue = Math.max(0, Math.min(999999, parseInt(value) || 0));

        if (product.productType === "single") {
            setStockUpdates(prev => ({ ...prev, main: numValue }));
        } else {
            setStockUpdates(prev => ({ ...prev, [variantId]: numValue }));
        }
    }, [product]);

    const handleStepChange = useCallback((variantId, delta) => {
        if (!product) return;
        if (product.productType === "single") {
            const current = stockUpdates.main !== undefined ? stockUpdates.main : (product.quantity || 0);
            handleStockChange(null, current + delta);
        } else {
            const current = stockUpdates[variantId] !== undefined
                ? stockUpdates[variantId]
                : (product.productVariants?.find(v => v.id === variantId)?.quantity || 0);
            handleStockChange(variantId, current + delta);
        }
    }, [product, stockUpdates, handleStockChange]);

    const handleApplyBulkVariantAdjustment = useCallback((delta) => {
        if (!product || !isVariant || !product.productVariants) return;
        setStockUpdates(prev => {
            const updated = { ...prev };
            product.productVariants.forEach(v => {
                const cur = updated[v.id] !== undefined ? updated[v.id] : (v.quantity || 0);
                updated[v.id] = Math.max(0, cur + delta);
            });
            return updated;
        });
    }, [product, isVariant]);

    const handleResetToInitial = useCallback(() => {
        setStockUpdates(initialStockMap);
    }, [initialStockMap]);

    const getCurrentStockValue = useCallback((variantId = null) => {
        if (!product) return 0;
        if (product.productType === "single") {
            return stockUpdates.main !== undefined ? stockUpdates.main : (product.quantity || 0);
        } else if (variantId) {
            return stockUpdates[variantId] !== undefined
                ? stockUpdates[variantId]
                : (product.productVariants?.find(v => v.id === variantId)?.quantity || 0);
        }
        return 0;
    }, [product, stockUpdates]);

    const handleUpdateStock = useCallback(async () => {
        if (!product) return;

        try {
            setLoading(true);
            setSuccessMessage("");
            setErrorMessage("");

            const updatePayload = {};

            if (isVariant) {
                const variants = product.productVariants.map(variant => ({
                    id: variant.id,
                    sku: variant.sku,
                    price: parseFloat(variant.price),
                    quantity: stockUpdates[variant.id] !== undefined
                        ? parseInt(stockUpdates[variant.id])
                        : parseInt(variant.quantity) || 0,
                    attributes: variant.attributes,
                    image: variant.image || null,
                    isDefault: variant.isDefault || false,
                }));

                updatePayload.variants = variants;
                updatePayload.productType = "variant";
                updatePayload.quantity = 0;
            } else {
                const newQuantity = stockUpdates.main !== undefined
                    ? parseInt(stockUpdates.main)
                    : parseInt(product.quantity) || 0;

                updatePayload.quantity = newQuantity;
                updatePayload.productType = "single";
            }

            const response = await apiClient(`/api/product/${product.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatePayload)
            });

            if (response && (response.success || response.data || response.status === 'success')) {
                const returnedProduct = response.data || response.product || {};
                const mergedProduct = {
                    ...product,
                    ...(typeof returnedProduct === 'object' ? returnedProduct : {}),
                    ...(isVariant ? {
                        productVariants: (product.productVariants || []).map(v => ({
                            ...v,
                            quantity: stockUpdates[v.id] !== undefined ? parseInt(stockUpdates[v.id]) : v.quantity
                        }))
                    } : {
                        quantity: stockUpdates.main !== undefined ? parseInt(stockUpdates.main) : product.quantity
                    })
                };

                toast.success("Stock updated successfully!");
                if (onSuccess) {
                    onSuccess(mergedProduct);
                }
                onClose();
            } else {
                throw new Error(response?.message || "Failed to update stock. Please try again.");
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            const errorMsg = error.message || "Failed to update stock. Please try again.";
            setErrorMessage(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [product, isVariant, stockUpdates, onSuccess, onClose]);

    const filteredVariants = useMemo(() => {
        if (!product?.productVariants) return [];
        if (!variantSearch.trim()) return product.productVariants;
        const q = variantSearch.toLowerCase();
        return product.productVariants.filter(v => {
            const skuMatch = v.sku?.toLowerCase().includes(q);
            const attrMatch = v.attributes && Object.values(v.attributes).some(val => String(val).toLowerCase().includes(q));
            return skuMatch || attrMatch;
        });
    }, [product, variantSearch]);

    const productImage = getProductImage(product || initialProduct);

    return (
        <AnimatePresence>
            {isOpen && product && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={loading ? undefined : onClose}
                    />

                    {/* Modal Window */}
                    <motion.div
                        className={`relative w-full ${isVariant ? 'max-w-4xl' : 'max-w-xl'} bg-white rounded shadow-2xl flex flex-col max-h-[92vh] border border-gray-200 z-10`}
                        initial={{ scale: 0.96, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            {productImage ? (
                                <img
                                    src={productImage}
                                    alt={product?.productName || "Product"}
                                    className="w-12 h-12 object-cover rounded border border-gray-200 bg-white shrink-0 shadow-xs"
                                />
                            ) : (
                                <div className="w-12 h-12 rounded bg-primary flex items-center justify-center text-white shrink-0 shadow-xs">
                                    <Package size={22} />
                                </div>
                            )}

                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate font-philosopher">
                                        {fetching ? "Loading Product..." : (product?.productName || initialProduct?.productName || "Update Stock")}
                                    </h2>
                                    {isVariant ? (
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[11px] font-semibold rounded border border-purple-200">
                                            Variant
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-semibold rounded border border-blue-200">
                                            Single
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                                    <span className="font-mono bg-gray-200/80 px-1.5 py-0.2 rounded text-gray-700 font-medium">
                                        SKU: {product?.sku || initialProduct?.sku || "N/A"}
                                    </span>
                                    {product?.brand?.name && (
                                        <>
                                            <span>•</span>
                                            <span>{product.brand.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer disabled:opacity-40"
                            title="Close modal (Esc)"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Stock Overview Banner */}
                    {product && !fetching && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 px-6 py-3 bg-white border-b border-gray-100 text-xs">
                            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                                <span className="text-gray-500 block text-[11px]">Current Stock</span>
                                <span className="text-base font-bold text-gray-900 mt-0.5 block">
                                    {initialTotalStock} <span className="text-xs font-normal text-gray-500">units</span>
                                </span>
                            </div>

                            <div className="bg-blue-50/70 border border-blue-100 rounded p-2.5">
                                <span className="text-blue-800 block text-[11px]">Updated Stock</span>
                                <span className="text-base font-bold text-gray-900 mt-0.5 block">
                                    {currentTotalStock} <span className="text-xs font-normal text-gray-500">units</span>
                                </span>
                            </div>

                            <div className="bg-emerald-50/60 border border-emerald-100 rounded p-2.5">
                                <span className="text-emerald-800 block text-[11px]">Net Change</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                    {totalDelta > 0 ? (
                                        <span className="text-base font-bold text-emerald-700 flex items-center">
                                            <TrendingUp size={15} className="mr-0.5" /> +{totalDelta}
                                        </span>
                                    ) : totalDelta < 0 ? (
                                        <span className="text-base font-bold text-rose-600 flex items-center">
                                            <TrendingDown size={15} className="mr-0.5" /> {totalDelta}
                                        </span>
                                    ) : (
                                        <span className="text-base font-bold text-gray-500">0</span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded p-2.5">
                                <span className="text-gray-500 block text-[11px]">New Status</span>
                                <div className="mt-0.5">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStockStatus(currentTotalStock).color}`}>
                                        {getStockStatus(currentTotalStock).label}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-slate-50/40">
                        {fetching ? (
                            <div className="flex flex-col items-center justify-center py-14">
                                <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                                <p className="text-sm font-semibold text-gray-800">Loading product inventory...</p>
                                <p className="text-xs text-gray-400 mt-1">Fetching latest quantity and variant breakdown</p>
                            </div>
                        ) : !product ? (
                            <div className="py-12 text-center">
                                <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
                                <h3 className="text-sm font-semibold text-gray-900">Failed to Load Product</h3>
                                <p className="text-xs text-gray-500 mt-1 mb-4">{errorMessage || "Product not found."}</p>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded font-medium cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        ) : (
                            <>
                                {/* Alerts */}
                                {errorMessage && (
                                    <div className="p-3 bg-rose-50 border border-rose-200 rounded flex items-center gap-2 text-xs text-rose-700">
                                        <AlertTriangle size={15} className="shrink-0" />
                                        <span>{errorMessage}</span>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded flex items-center gap-2 text-xs text-emerald-700">
                                        <CheckCircle size={15} className="shrink-0" />
                                        <span>{successMessage}</span>
                                    </div>
                                )}

                                {/* SINGLE PRODUCT STOCK EDITOR */}
                                {!isVariant ? (
                                    <div className="bg-white border border-gray-200 rounded p-6 shadow-xs space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-900">Available Stock Quantity</h3>
                                                <p className="text-xs text-gray-500 mt-0.5">Adjust the active inventory available for sale</p>
                                            </div>
                                            {product.quantityAlert && (
                                                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-800">
                                                    <Info size={13} />
                                                    <span>Reorder Alert at {product.quantityAlert} units</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Stepper / Input Control */}
                                        <div className="flex items-center justify-center gap-3 p-4 bg-slate-50 border border-gray-200 rounded">
                                            <button
                                                type="button"
                                                onClick={() => handleStepChange(null, -1)}
                                                disabled={getCurrentStockValue() <= 0 || loading}
                                                className="w-10 h-10 rounded bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                                                title="Subtract 1 unit"
                                            >
                                                <Minus size={16} />
                                            </button>

                                            <div className="relative max-w-xs flex-1 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="999999"
                                                    step="1"
                                                    value={getCurrentStockValue()}
                                                    onChange={(e) => handleStockChange(null, e.target.value)}
                                                    className="w-full px-4 py-2.5 bg-white border-2 border-primary/40 focus:border-primary rounded text-center text-2xl font-bold text-gray-900 focus:outline-none shadow-xs"
                                                    disabled={loading}
                                                />
                                                <span className="text-[11px] text-gray-400 block mt-1 font-medium">units</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => handleStepChange(null, 1)}
                                                disabled={loading}
                                                className="w-10 h-10 rounded bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 flex items-center justify-center font-bold text-lg transition-colors cursor-pointer disabled:opacity-40 shadow-xs"
                                                title="Add 1 unit"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>

                                        {/* Quick Adjustment Presets */}
                                        <div>
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                                                Quick Add / Presets
                                            </span>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {[5, 10, 25, 50, 100].map(amt => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => handleStepChange(null, amt)}
                                                        disabled={loading}
                                                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold transition-colors cursor-pointer"
                                                    >
                                                        +{amt}
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => handleStockChange(null, 0)}
                                                    disabled={loading}
                                                    className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-xs font-semibold transition-colors cursor-pointer ml-auto"
                                                >
                                                    Set to 0 (Out of Stock)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    /* VARIANT PRODUCT STOCK EDITOR */
                                    <div className="space-y-4">
                                        {/* Filter & Bulk Quick Controls */}
                                        <div className="bg-white border border-gray-200 rounded p-4 shadow-xs space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                <div className="relative flex-1 max-w-sm">
                                                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search variant by SKU or attribute..."
                                                        value={variantSearch}
                                                        onChange={(e) => setVariantSearch(e.target.value)}
                                                        className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-primary"
                                                    />
                                                </div>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-medium text-gray-500">Bulk Adjust All:</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyBulkVariantAdjustment(5)}
                                                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition cursor-pointer"
                                                    >
                                                        +5 to all
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyBulkVariantAdjustment(10)}
                                                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition cursor-pointer"
                                                    >
                                                        +10 to all
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApplyBulkVariantAdjustment(50)}
                                                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition cursor-pointer"
                                                    >
                                                        +50 to all
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Variants List Cards */}
                                        <div className="space-y-3">
                                            {filteredVariants.map((variant) => {
                                                const currentStock = variant.quantity || 0;
                                                const newStock = getCurrentStockValue(variant.id);
                                                const delta = newStock - currentStock;
                                                const status = getStockStatus(newStock);

                                                return (
                                                    <div
                                                        key={variant.id}
                                                        className={`bg-white border rounded p-4 transition-colors shadow-xs ${
                                                            delta !== 0 ? "border-primary/40 bg-primary/2" : "border-gray-200"
                                                        }`}
                                                    >
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            {/* Variant Info */}
                                                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                                                {variant.image ? (
                                                                    <img
                                                                        src={variant.image}
                                                                        alt={variant.sku}
                                                                        className="w-12 h-12 rounded border border-gray-200 object-cover shrink-0 bg-white"
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 rounded bg-slate-100 border border-gray-200 flex items-center justify-center text-gray-400 shrink-0">
                                                                        <Tag size={18} />
                                                                    </div>
                                                                )}

                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <span className="font-semibold text-sm text-gray-900 font-mono">
                                                                            {variant.sku}
                                                                        </span>
                                                                        {variant.isDefault && (
                                                                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[10px] font-semibold rounded">
                                                                                Default
                                                                            </span>
                                                                        )}
                                                                        <span className={`px-2 py-0.2 text-[10px] font-semibold rounded border ${status.color}`}>
                                                                            {status.label}
                                                                        </span>
                                                                    </div>

                                                                    {/* Attributes */}
                                                                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                                        {variant.attributes && Object.entries(variant.attributes).map(([key, val]) => (
                                                                            <span key={key} className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] text-gray-700">
                                                                                <span className="text-gray-400 capitalize">{key}:</span> {val}
                                                                            </span>
                                                                        ))}
                                                                    </div>

                                                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                                                                        <span>Price: <strong className="text-gray-900">৳{variant.price}</strong></span>
                                                                        <span>Current: <strong className="text-gray-900">{currentStock} units</strong></span>
                                                                        {delta !== 0 && (
                                                                            <span className={delta > 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"}>
                                                                                {delta > 0 ? `+${delta}` : delta} change
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Quantity Input Stepper */}
                                                            <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStepChange(variant.id, -1)}
                                                                    disabled={newStock <= 0 || loading}
                                                                    className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                                                    title="Subtract 1 unit"
                                                                >
                                                                    <Minus size={14} />
                                                                </button>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max="999999"
                                                                    step="1"
                                                                    value={newStock}
                                                                    onChange={(e) => handleStockChange(variant.id, e.target.value)}
                                                                    className="w-20 px-2 py-1.5 text-center text-sm font-bold border border-gray-300 focus:border-primary rounded focus:outline-none"
                                                                    disabled={loading}
                                                                />

                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleStepChange(variant.id, 1)}
                                                                    disabled={loading}
                                                                    className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center font-bold cursor-pointer disabled:opacity-40"
                                                                    title="Add 1 unit"
                                                                >
                                                                    <Plus size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {filteredVariants.length === 0 && (
                                                <div className="text-center py-8 text-xs text-gray-500 bg-white rounded border border-gray-200">
                                                    No variants match "{variantSearch}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    {product && (
                        <div className="px-6 py-4 border-t border-gray-200 bg-white flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={handleResetToInitial}
                                disabled={loading || !hasChanges}
                                className="px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 rounded hover:bg-gray-100 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                <RotateCcw size={14} />
                                <span>Reset Edits</span>
                            </button>

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    disabled={loading}
                                    className="px-4 py-2 text-xs font-semibold rounded border border-gray-300 text-gray-700 hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateStock}
                                    disabled={loading || !hasChanges}
                                    className={`px-5 py-2 text-xs font-semibold rounded bg-primary text-white hover:bg-primary-hover transition shadow-xs ${
                                        loading || !hasChanges ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            Updating Stock...
                                        </span>
                                    ) : (
                                        "Save Changes"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
};

export default StockEditModal;