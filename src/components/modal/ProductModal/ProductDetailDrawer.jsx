'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    X,
    Package,
    Tag,
    Layers,
    Barcode,
    Edit2,
    Trash2,
    CheckCircle,
    XCircle,
    Check,
    Pipette,
    Calendar,
    Building2,
    Store,
    Sparkles,
    ShieldCheck,
    AlertCircle,
    Loader2,
    Maximize2,
    DollarSign,
    Boxes,
    FileText,
    Image as ImageIcon,
    Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { apiClient } from '@/lib/apiClient';
import VariantAttributes from '@/components/ui/ColorSwatch';
import { isColorValue, isHexColor, getContrastColor } from '@/lib/colorUtils';

export default function ProductDetailDrawer({
    isOpen,
    onClose,
    product,
    onEdit,
    onPrintBarcode,
    onDelete,
    onToggleVisibility,
    hasPermission = () => true,
    initialTab = 'overview'
}) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [detailedData, setDetailedData] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [error, setError] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [mainImage, setMainImage] = useState('');
    const [selectedAttributes, setSelectedAttributes] = useState({});
    const [previewImage, setPreviewImage] = useState(null);
    const [isTogglingPublish, setIsTogglingPublish] = useState(false);

    // Sync tab when opened
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab || 'overview');
        }
    }, [isOpen, initialTab]);

    // Escape key listener & prevent body scroll
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                if (previewImage) {
                    setPreviewImage(null);
                } else {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, previewImage]);

    // Fetch full product details
    useEffect(() => {
        if (!isOpen || !product) {
            setDetailedData(null);
            setError(null);
            setSelectedVariant(null);
            setMainImage('');
            setSelectedAttributes({});
            return;
        }

        let isMounted = true;
        const identifier = product.slug || product.id;

        const fetchDetails = async () => {
            setIsLoadingDetails(true);
            setError(null);
            try {
                const response = await apiClient(`/api/product/${identifier}`);
                if (isMounted) {
                    let prodData = response?.data || response;
                    if (prodData?.data && !prodData.productName) {
                        prodData = prodData.data;
                    }
                    if (prodData && (prodData.id || prodData.productName)) {
                        setDetailedData(prodData);
                        initializeVariantState(prodData);
                    } else {
                        setDetailedData(product);
                        initializeVariantState(product);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching product drawer details:', err);
                    setDetailedData(product);
                    initializeVariantState(product);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingDetails(false);
                }
            }
        };

        const initializeVariantState = (prod) => {
            if (prod?.productType === 'variant' && prod?.productVariants?.length > 0) {
                const defaultVariant = prod.productVariants.find(v => v.isDefault) || prod.productVariants[0];
                setSelectedVariant(defaultVariant);
                setSelectedAttributes(defaultVariant.attributes || {});
                setMainImage(defaultVariant.image || (prod.images && prod.images[0]) || '');
            } else {
                setSelectedVariant(null);
                setMainImage((prod?.images && prod.images[0]) || '');
            }
        };

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [isOpen, product]);

    const activeProduct = detailedData || product;

    // Helper functions for attribute handling
    const isColorAttribute = (attributeName) => {
        return attributeName?.toLowerCase().includes('color');
    };

    const getAttributeTypes = () => {
        if (!activeProduct || activeProduct.productType !== 'variant') return [];
        const attributeTypes = new Set();
        activeProduct.productVariants?.forEach(variant => {
            if (variant.attributes) {
                Object.keys(variant.attributes).forEach(key => attributeTypes.add(key));
            }
        });
        return Array.from(attributeTypes);
    };

    const getAttributeValues = (attributeType) => {
        if (!activeProduct) return [];
        const values = new Set();
        activeProduct.productVariants?.forEach(variant => {
            if (variant.attributes && variant.attributes[attributeType]) {
                values.add(variant.attributes[attributeType]);
            }
        });
        return Array.from(values);
    };

    const isAttributeValueAvailable = (attributeType, value) => {
        if (!activeProduct || activeProduct.productType !== 'variant') return true;
        const testAttributes = {
            ...selectedAttributes,
            [attributeType]: value
        };
        return activeProduct.productVariants?.some(variant => {
            return variant.attributes && Object.keys(testAttributes).every(
                key => !variant.attributes[key] || variant.attributes[key] === testAttributes[key]
            );
        });
    };

    const handleAttributeSelect = (attributeType, value) => {
        const newAttributes = {
            ...selectedAttributes,
            [attributeType]: value
        };
        setSelectedAttributes(newAttributes);

        const matchingVariant = activeProduct.productVariants?.find(variant => {
            return variant.attributes && Object.keys(newAttributes).every(
                key => variant.attributes[key] === newAttributes[key]
            );
        });

        if (matchingVariant) {
            setSelectedVariant(matchingVariant);
            setMainImage(matchingVariant.image || activeProduct.images?.[0] || '');
        } else {
            setSelectedVariant(null);
            toast.error('This combination is currently not available');
        }
    };

    const renderAttributeButton = (attributeType, value) => {
        const isSelected = selectedAttributes[attributeType] === value;
        const isAvailable = isAttributeValueAvailable(attributeType, value);
        const isColor = (isColorAttribute(attributeType) || isHexColor(value)) && isHexColor(value);

        if (isColor) {
            return (
                <button
                    key={value}
                    type="button"
                    onClick={() => isAvailable && handleAttributeSelect(attributeType, value)}
                    disabled={!isAvailable}
                    className={`relative p-0.5 rounded-full transition-all duration-150 cursor-pointer ${
                        isSelected ? 'ring-2 ring-primary ring-offset-2 scale-105' : 'hover:scale-105'
                    } ${!isAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                    title={value}
                >
                    <div
                        className="w-7 h-7 rounded-full border border-gray-300 shadow-2xs"
                        style={{ backgroundColor: value }}
                    />
                    {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Check size={12} className="text-white drop-shadow" style={{ color: getContrastColor(value) }} />
                        </div>
                    )}
                </button>
            );
        }

        return (
            <button
                key={value}
                type="button"
                onClick={() => isAvailable && handleAttributeSelect(attributeType, value)}
                disabled={!isAvailable}
                className={`px-3 py-1.5 text-xs font-semibold rounded border transition-all duration-150 cursor-pointer ${
                    isSelected
                        ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                        : isAvailable
                        ? 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                }`}
            >
                {value}
            </button>
        );
    };

    // Current price, stock and SKU calculations
    const currentPrice = useMemo(() => {
        if (activeProduct?.productType === 'variant' && selectedVariant) {
            return parseFloat(selectedVariant.price || 0);
        }
        return parseFloat(activeProduct?.price || 0);
    }, [activeProduct, selectedVariant]);

    const currentStock = useMemo(() => {
        if (activeProduct?.productType === 'variant' && selectedVariant) {
            return parseInt(selectedVariant.quantity) || 0;
        }
        return parseInt(activeProduct?.quantity) || 0;
    }, [activeProduct, selectedVariant]);

    const currentSKU = useMemo(() => {
        if (activeProduct?.productType === 'variant' && selectedVariant) {
            return selectedVariant.sku;
        }
        return activeProduct?.sku || 'N/A';
    }, [activeProduct, selectedVariant]);

    const discountedPrice = useMemo(() => {
        if (!activeProduct?.discountType || !activeProduct?.discountValue) return currentPrice;
        const discountVal = parseFloat(activeProduct.discountValue) || 0;
        if (activeProduct.discountType === 'Percentage') {
            return currentPrice - (currentPrice * discountVal / 100);
        } else if (activeProduct.discountType === 'Fixed') {
            return currentPrice - discountVal;
        }
        return currentPrice;
    }, [currentPrice, activeProduct]);

    const discountAmount = currentPrice - discountedPrice;

    // Total stock across variants
    const totalVariantStock = useMemo(() => {
        if (activeProduct?.productType !== 'variant' || !activeProduct?.productVariants) return activeProduct?.quantity || 0;
        return activeProduct.productVariants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);
    }, [activeProduct]);

    const priceRange = useMemo(() => {
        if (activeProduct?.productType !== 'variant' || !activeProduct?.productVariants?.length) return `৳${currentPrice.toFixed(2)}`;
        const prices = activeProduct.productVariants.map(v => parseFloat(v.price || 0)).filter(p => !isNaN(p));
        if (!prices.length) return `৳${currentPrice.toFixed(2)}`;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? `৳${min.toFixed(2)}` : `৳${min.toFixed(2)} - ৳${max.toFixed(2)}`;
    }, [activeProduct, currentPrice]);

    // Format currency
    const formatCurrency = (val) => {
        if (isNaN(val) || val === null || val === undefined) return '৳0.00';
        return `৳${parseFloat(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid date';
        }
    };

    // Handle delete
    const handleDeleteProduct = async () => {
        if (!activeProduct?.id) return;
        const result = await Swal.fire({
            title: 'Delete Product?',
            text: `Are you sure you want to delete "${activeProduct.productName}"? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            if (onDelete) {
                onDelete(activeProduct.id);
                onClose();
            } else {
                const toastId = toast.loading('Deleting product...');
                try {
                    const res = await apiClient(`/api/product/${activeProduct.id}`, { method: 'DELETE' });
                    const msg = res?.data?.message || res?.message || 'Product deleted';
                    toast.success(msg, { id: toastId });
                    onClose();
                } catch (err) {
                    toast.error(err.message || 'Failed to delete product', { id: toastId });
                }
            }
        }
    };

    // Handle toggle visibility
    const handleTogglePublish = async () => {
        if (!activeProduct?.id) return;
        const currentVis = activeProduct.visibility || 'public';
        const newVis = currentVis === 'public' ? 'unpublish' : 'public';
        setIsTogglingPublish(true);

        if (onToggleVisibility) {
            await onToggleVisibility(activeProduct.id, currentVis);
            setDetailedData(prev => prev ? ({ ...prev, visibility: newVis }) : null);
            setIsTogglingPublish(false);
        } else {
            const toastId = toast.loading(`${newVis === 'public' ? 'Publishing' : 'Unpublishing'} product...`);
            try {
                const res = await apiClient(`/api/product/visibility/${activeProduct.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ visibility: newVis })
                });
                if (res.success || res.status) {
                    toast.success(`Product ${newVis === 'public' ? 'Published' : 'Unpublished'} successfully`, { id: toastId });
                    setDetailedData(prev => prev ? ({ ...prev, visibility: newVis }) : null);
                } else {
                    throw new Error(res.message || 'Failed to update visibility');
                }
            } catch (err) {
                toast.error(err.message || 'Failed to update visibility', { id: toastId });
            } finally {
                setIsTogglingPublish(false);
            }
        }
    };

    const isPublished = activeProduct?.visibility === 'public' || !activeProduct?.visibility;
    const isVariantProduct = activeProduct?.productType === 'variant';
    const variantsList = activeProduct?.productVariants || [];
    const allImages = useMemo(() => {
        const imgSet = new Set();
        if (Array.isArray(activeProduct?.images)) {
            activeProduct.images.forEach(img => {
                if (typeof img === 'string' && img.trim()) imgSet.add(img);
                else if (img?.url) imgSet.add(img.url);
            });
        }
        if (Array.isArray(activeProduct?.productVariants)) {
            activeProduct.productVariants.forEach(v => {
                if (v.image) imgSet.add(v.image);
                if (Array.isArray(v.images)) {
                    v.images.forEach(img => {
                        if (typeof img === 'string' && img.trim()) imgSet.add(img);
                        else if (img?.url) imgSet.add(img.url);
                    });
                }
            });
        }
        return Array.from(imgSet);
    }, [activeProduct]);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Package },
        ...(isVariantProduct ? [{ id: 'variants', label: 'Variants', icon: Layers, count: variantsList.length }] : []),
        { id: 'details', label: 'Description & Media', icon: FileText, count: allImages.length }
    ];

    return (
        <AnimatePresence>
            {isOpen && activeProduct && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={onClose}
                    />

                    {/* Sliding Drawer Panel (Half Screen on Desktop) */}
                    <motion.div
                        className="fixed inset-y-0 right-0 w-full md:w-[60vw] lg:w-[50vw] xl:w-[50vw] bg-white shadow-2xl flex flex-col h-full border-l border-gray-200 z-50 overflow-hidden"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                    >
                    {/* Drawer Header */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/90 flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded bg-teal-50 border border-teal-200 flex items-center justify-center text-primary shadow-xs shrink-0">
                                <Package size={24} />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate max-w-[280px] sm:max-w-md" title={activeProduct.productName}>
                                        {activeProduct.productName}
                                    </h2>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                        isPublished
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-amber-50 text-amber-700 border-amber-200'
                                    }`}>
                                        {isPublished ? <CheckCircle size={11} /> : <Clock size={11} />}
                                        {isPublished ? 'Published' : 'Unpublished'}
                                    </span>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                        isVariantProduct
                                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                                            : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}>
                                        {isVariantProduct ? <Layers size={11} /> : <Package size={11} />}
                                        {isVariantProduct ? 'Variant Product' : 'Single Product'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                                    <span className="font-mono font-medium text-gray-700 bg-gray-200/70 px-1.5 py-0.5 rounded text-[11px]">
                                        SKU: {currentSKU}
                                    </span>
                                    {activeProduct.id && (
                                        <>
                                            <span>•</span>
                                            <span>ID #{activeProduct.id}</span>
                                        </>
                                    )}
                                    {activeProduct.brand?.name && (
                                        <>
                                            <span>•</span>
                                            <span className="font-medium text-slate-700">Brand: {activeProduct.brand.name}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Header Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* Barcode Tag Button */}
                            {onPrintBarcode && (
                                <button
                                    onClick={() => onPrintBarcode(activeProduct, selectedVariant)}
                                    className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Print Barcode Tag"
                                >
                                    <Barcode size={14} className="text-amber-700" />
                                    <span className="hidden sm:inline">Barcode</span>
                                </button>
                            )}

                            {/* Edit Button */}
                            {hasPermission('product.update') && onEdit && (
                                <button
                                    onClick={() => onEdit(activeProduct)}
                                    className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 rounded border border-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    title="Edit Product"
                                >
                                    <Edit2 size={13} />
                                    <span className="hidden sm:inline">Edit</span>
                                </button>
                            )}

                            {/* Delete Product */}
                            {hasPermission('product.delete') && (
                                <button
                                    onClick={handleDeleteProduct}
                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200 text-xs transition-colors cursor-pointer shadow-2xs"
                                    title="Delete Product"
                                >
                                    <Trash2 size={15} />
                                </button>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer ml-1"
                                title="Close drawer (Esc)"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Metric Quick Stats Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3 bg-white border-b border-gray-100 shrink-0">
                        {/* Price Card */}
                        <div className="bg-teal-50/70 border border-teal-100 rounded p-3 flex flex-col justify-between">
                            <span className="text-[11px] font-semibold text-teal-900 uppercase tracking-wider block truncate">
                                {discountAmount > 0 ? 'Sale Price' : 'Price'}
                            </span>
                            <div className="mt-1">
                                <p className="text-base font-bold text-teal-800 truncate">
                                    {formatCurrency(discountedPrice)}
                                </p>
                                {discountAmount > 0 && (
                                    <p className="text-[11px] text-gray-400 line-through truncate">
                                        Regular: {formatCurrency(currentPrice)}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Stock Card */}
                        <div className={`border rounded p-3 flex flex-col justify-between ${
                            (isVariantProduct ? totalVariantStock : currentStock) <= (activeProduct.quantityAlert || 5)
                                ? 'bg-rose-50/70 border-rose-100 text-rose-900'
                                : 'bg-emerald-50/70 border-emerald-100 text-emerald-900'
                        }`}>
                            <span className="text-[11px] font-semibold uppercase tracking-wider block truncate">
                                Available Stock
                            </span>
                            <div className="mt-1 flex items-baseline gap-1.5">
                                <p className="text-base font-bold truncate">
                                    {isVariantProduct ? totalVariantStock : currentStock}
                                </p>
                                <span className="text-xs opacity-75">
                                    {isVariantProduct ? 'total units' : 'units'}
                                </span>
                            </div>
                        </div>

                        {/* Discount Card */}
                        <div className="bg-purple-50/70 border border-purple-100 rounded p-3 flex flex-col justify-between">
                            <span className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider block truncate">
                                Discount Info
                            </span>
                            <p className="text-base font-bold text-purple-800 mt-1 truncate">
                                {activeProduct.discountValue > 0 && activeProduct.discountType
                                    ? activeProduct.discountType === 'Percentage'
                                        ? `${activeProduct.discountValue}% OFF`
                                        : `-৳${activeProduct.discountValue}`
                                    : 'No Discount'}
                            </p>
                        </div>

                        {/* Status / Publish Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block truncate">
                                    Visibility
                                </span>
                                {hasPermission('product.update') && (
                                    <button
                                        type="button"
                                        onClick={handleTogglePublish}
                                        disabled={isTogglingPublish}
                                        className="text-[10px] text-primary hover:underline font-semibold cursor-pointer"
                                    >
                                        {isPublished ? 'Unpublish' : 'Publish'}
                                    </button>
                                )}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                                <span className={`w-2 h-2 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                <span className="text-xs font-bold text-slate-800">
                                    {isPublished ? 'Public / Online' : 'Draft / Hidden'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex items-center overflow-x-auto border-b border-gray-200 bg-white px-6 shrink-0 hide-scrollbar">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                                        isActive
                                            ? 'border-primary text-primary'
                                            : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon size={14} />
                                    {tab.label}
                                    {tab.count !== undefined && tab.count > 0 && (
                                        <span
                                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                                isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                                            }`}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Scrollable Drawer Body */}
                    <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60 space-y-6">
                        {isLoadingDetails && (
                            <div className="flex items-center gap-2 text-xs text-primary bg-teal-50 border border-teal-200 px-3 py-2 rounded">
                                <Loader2 size={14} className="animate-spin" />
                                <span>Syncing latest product details...</span>
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded">
                                <AlertCircle size={14} />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* ================= TAB 1: OVERVIEW ================= */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Top Showcase: Interactive Gallery & Core Product Specs */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Image Showcase Card */}
                                    <div className="bg-white rounded border border-gray-200 p-4 shadow-2xs space-y-3">
                                        <div className="relative aspect-square rounded border border-gray-200 overflow-hidden bg-gray-50 group">
                                            {mainImage ? (
                                                <>
                                                    <Image
                                                        src={mainImage}
                                                        alt={activeProduct.productName || 'Product'}
                                                        fill
                                                        sizes="(max-width: 768px) 100vw, 50vw"
                                                        className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
                                                        priority
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setPreviewImage(mainImage)}
                                                        className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded text-xs flex items-center gap-1 backdrop-blur-xs transition cursor-pointer"
                                                        title="Zoom Image"
                                                    >
                                                        <Maximize2 size={13} />
                                                    </button>
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                    <Package size={48} className="opacity-40 mb-2" />
                                                    <span className="text-xs">No image available</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Thumbnail row */}
                                        {allImages.length > 1 && (
                                            <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
                                                {allImages.map((img, idx) => (
                                                    <button
                                                        key={idx}
                                                        type="button"
                                                        onClick={() => setMainImage(img)}
                                                        className={`relative w-14 h-14 rounded border-2 overflow-hidden shrink-0 transition-all cursor-pointer ${
                                                            mainImage === img ? 'border-primary ring-2 ring-primary/20 scale-105' : 'border-gray-200 opacity-70 hover:opacity-100'
                                                        }`}
                                                    >
                                                        <Image
                                                            src={img}
                                                            alt={`Thumb ${idx + 1}`}
                                                            fill
                                                            sizes="56px"
                                                            className="object-cover"
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Primary Info & Interactive Variant Attributes */}
                                    <div className="space-y-4">
                                        {/* Pricing Card */}
                                        <div className="bg-white rounded border border-gray-200 p-4 shadow-2xs space-y-3">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <DollarSign size={14} className="text-primary" />
                                                Pricing & Financials
                                            </h3>
                                            <div className="divide-y divide-gray-100 text-xs">
                                                <div className="py-1.5 flex items-center justify-between">
                                                    <span className="text-gray-500">Regular Price:</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(currentPrice)}</span>
                                                </div>
                                                {discountAmount > 0 && (
                                                    <>
                                                        <div className="py-1.5 flex items-center justify-between text-rose-600">
                                                            <span>Discount:</span>
                                                            <span className="font-semibold">
                                                                {activeProduct.discountType === 'Percentage'
                                                                    ? `-${activeProduct.discountValue}% (-${formatCurrency(discountAmount)})`
                                                                    : `-${formatCurrency(discountAmount)}`}
                                                            </span>
                                                        </div>
                                                        <div className="py-1.5 flex items-center justify-between">
                                                            <span className="text-gray-900 font-bold">Net Selling Price:</span>
                                                            <span className="text-base font-bold text-primary">{formatCurrency(discountedPrice)}</span>
                                                        </div>
                                                    </>
                                                )}
                                                {/* Unit Cost & Margin */}
                                                <div className="py-1.5 flex items-center justify-between">
                                                    <span className="text-gray-500">Unit Cost (Buying):</span>
                                                    <span className="font-semibold text-gray-800">
                                                        {formatCurrency(
                                                            (activeProduct?.productType === 'variant' && selectedVariant && selectedVariant.costPrice != null && selectedVariant.costPrice > 0)
                                                                ? selectedVariant.costPrice
                                                                : (activeProduct?.costPrice || 0)
                                                        )}
                                                    </span>
                                                </div>
                                                {(() => {
                                                    const cost = (activeProduct?.productType === 'variant' && selectedVariant && selectedVariant.costPrice != null && selectedVariant.costPrice > 0)
                                                        ? parseFloat(selectedVariant.costPrice)
                                                        : parseFloat(activeProduct?.costPrice || 0);
                                                    const sellPrice = discountedPrice || currentPrice;
                                                    if (cost > 0 && sellPrice > 0) {
                                                        const profit = sellPrice - cost;
                                                        const margin = (profit / sellPrice) * 100;
                                                        return (
                                                            <div className="py-1.5 flex items-center justify-between">
                                                                <span className="text-gray-500">Gross Profit (Est.):</span>
                                                                <span className={`font-semibold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                                                                    {formatCurrency(profit)} ({margin.toFixed(1)}%)
                                                                </span>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                                {isVariantProduct && (
                                                    <div className="py-1.5 flex items-center justify-between">
                                                        <span className="text-gray-500">Catalog Price Range:</span>
                                                        <span className="font-mono text-gray-700">{priceRange}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stock & SKU Card */}
                                        <div className="bg-white rounded border border-gray-200 p-4 shadow-2xs space-y-3">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <Boxes size={14} className="text-primary" />
                                                Inventory & Identifiers
                                            </h3>
                                            <div className="divide-y divide-gray-100 text-xs">
                                                <div className="py-1.5 flex items-center justify-between">
                                                    <span className="text-gray-500">Current SKU:</span>
                                                    <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                                        {currentSKU}
                                                    </span>
                                                </div>
                                                <div className="py-1.5 flex items-center justify-between">
                                                    <span className="text-gray-500">Stock Availability:</span>
                                                    <span className={`font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                                                        currentStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                        {currentStock > 0 ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                        {currentStock > 0 ? `${currentStock} in stock` : 'Out of stock'}
                                                    </span>
                                                </div>
                                                {activeProduct.quantityAlert !== undefined && (
                                                    <div className="py-1.5 flex items-center justify-between">
                                                        <span className="text-gray-500">Low Stock Alert Limit:</span>
                                                        <span className="font-medium text-gray-700">{activeProduct.quantityAlert} units</span>
                                                    </div>
                                                )}
                                                {activeProduct.unit?.name && (
                                                    <div className="py-1.5 flex items-center justify-between">
                                                        <span className="text-gray-500">Unit of Measure:</span>
                                                        <span className="font-medium text-gray-800">{activeProduct.unit.name}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Interactive Variant Selector (If Variant Product) */}
                                {isVariantProduct && getAttributeTypes().length > 0 && (
                                    <div className="bg-white rounded border border-gray-200 p-5 shadow-2xs space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <Layers size={14} className="text-primary" />
                                                Interactive Variant Selector
                                            </h3>
                                            {selectedVariant && (
                                                <button
                                                    onClick={() => onPrintBarcode && onPrintBarcode(activeProduct, selectedVariant)}
                                                    className="text-xs text-amber-700 hover:text-amber-900 font-semibold flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Barcode size={12} /> Print Selected Tag
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-3.5">
                                            {getAttributeTypes().map(attributeType => {
                                                const isColor = isColorAttribute(attributeType);
                                                return (
                                                    <div key={attributeType} className="space-y-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <label className="text-xs font-semibold text-gray-700 capitalize">
                                                                {attributeType}:
                                                            </label>
                                                            {selectedAttributes[attributeType] && (
                                                                <span className="text-xs font-mono font-medium text-primary">
                                                                    {selectedAttributes[attributeType]}
                                                                </span>
                                                            )}
                                                            {isColor && (
                                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-purple-50 text-purple-700 border border-purple-200 rounded text-[10px]">
                                                                    <Pipette size={10} /> Color Palette
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {getAttributeValues(attributeType).map(value =>
                                                                renderAttributeButton(attributeType, value)
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Categorization & Storage Hierarchy */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Category Hierarchy */}
                                    <div className="bg-white rounded border border-gray-200 p-4 shadow-2xs space-y-3">
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Tag size={14} className="text-primary" />
                                            Category & Taxonomy
                                        </h3>
                                        <div className="space-y-2 text-xs">
                                            {activeProduct.subCategory ? (
                                                <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1.5">
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                        <span className="font-semibold text-slate-700">
                                                            {activeProduct.subCategory.category?.mainCategory?.name || 'Main Category'}
                                                        </span>
                                                        <span>/</span>
                                                        <span className="text-slate-600">
                                                            {activeProduct.subCategory.category?.name || 'Category'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-gray-400">Subcategory:</span>
                                                        <span className="font-bold text-primary">
                                                            {activeProduct.subCategory.name}
                                                        </span>
                                                        {activeProduct.subCategory.code && (
                                                            <span className="font-mono text-[10px] text-gray-500">
                                                                ({activeProduct.subCategory.code})
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-gray-400 italic">No category assigned</p>
                                            )}

                                            {/* Collections */}
                                            {activeProduct.collections && activeProduct.collections.length > 0 && (
                                                <div className="pt-2 border-t border-gray-100">
                                                    <span className="text-gray-500 block mb-1.5">Collections / Campaigns:</span>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {activeProduct.collections.map((pc) => (
                                                            <span
                                                                key={pc.id || pc.collectionId}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                                                            >
                                                                <Sparkles size={10} className="text-amber-500" />
                                                                {pc.collection?.name || 'Collection'}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Warehouse & Storage Location */}
                                    <div className="bg-white rounded border border-gray-200 p-4 shadow-2xs space-y-3">
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Building2 size={14} className="text-primary" />
                                            Store & System Metadata
                                        </h3>
                                        <div className="divide-y divide-gray-100 text-xs">
                                            {activeProduct.store && (
                                                <div className="py-2 flex items-center justify-between">
                                                    <span className="text-gray-500 flex items-center gap-1"><Store size={12} /> Store:</span>
                                                    <span className="font-semibold text-gray-900">{activeProduct.store}</span>
                                                </div>
                                            )}
                                            {activeProduct.warehouse && (
                                                <div className="py-2 flex items-center justify-between">
                                                    <span className="text-gray-500 flex items-center gap-1"><Building2 size={12} /> Warehouse:</span>
                                                    <span className="font-semibold text-gray-900">{activeProduct.warehouse}</span>
                                                </div>
                                            )}
                                            {activeProduct.warranty?.name && (
                                                <div className="py-2 flex items-center justify-between">
                                                    <span className="text-gray-500 flex items-center gap-1"><ShieldCheck size={12} /> Warranty:</span>
                                                    <span className="font-semibold text-gray-900">{activeProduct.warranty.name}</span>
                                                </div>
                                            )}
                                            <div className="py-2 flex items-center justify-between">
                                                <span className="text-gray-500 flex items-center gap-1"><Calendar size={12} /> Created:</span>
                                                <span className="font-medium text-gray-700">{formatDate(activeProduct.createdAt)}</span>
                                            </div>
                                            <div className="py-2 flex items-center justify-between">
                                                <span className="text-gray-500 flex items-center gap-1"><Clock size={12} /> Last Updated:</span>
                                                <span className="font-medium text-gray-700">{formatDate(activeProduct.updatedAt)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= TAB 2: VARIANTS LIST ================= */}
                        {activeTab === 'variants' && isVariantProduct && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        All Product Variants ({variantsList.length})
                                    </h3>
                                    {onPrintBarcode && (
                                        <button
                                            onClick={() => onPrintBarcode(activeProduct)}
                                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                        >
                                            <Barcode size={13} /> Print All Barcode Tags
                                        </button>
                                    )}
                                </div>

                                <div className="border border-gray-200 rounded bg-white overflow-hidden shadow-2xs">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-gray-50/90 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                                                <tr>
                                                    <th className="px-4 py-3">Variant</th>
                                                    <th className="px-4 py-3">Attributes</th>
                                                    <th className="px-4 py-3">SKU</th>
                                                    <th className="px-4 py-3">Price</th>
                                                    <th className="px-4 py-3">Unit Cost</th>
                                                    <th className="px-4 py-3">Stock</th>
                                                    <th className="px-4 py-3 text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {variantsList.map((v, idx) => {
                                                    const vImg = v.image || (Array.isArray(v.images) && v.images[0]) || activeProduct.images?.[0];
                                                    const isCurSel = selectedVariant?.id === v.id;

                                                    return (
                                                        <tr
                                                            key={v.id || idx}
                                                            className={`hover:bg-slate-50 transition-colors ${
                                                                isCurSel ? 'bg-teal-50/40' : ''
                                                            }`}
                                                        >
                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div
                                                                        onClick={() => vImg && setPreviewImage(vImg)}
                                                                        className="w-10 h-10 rounded border border-gray-200 overflow-hidden relative bg-gray-50 shrink-0 cursor-pointer group"
                                                                    >
                                                                        {vImg ? (
                                                                            <Image
                                                                                src={vImg}
                                                                                alt={v.sku || 'Variant'}
                                                                                fill
                                                                                sizes="40px"
                                                                                className="object-cover group-hover:scale-105 transition-transform"
                                                                            />
                                                                        ) : (
                                                                            <Package size={16} className="text-gray-400 m-auto" />
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-semibold text-gray-900 flex items-center gap-1">
                                                                            <span>Variant #{idx + 1}</span>
                                                                            {v.isDefault && (
                                                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                                                                                    Default
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="px-4 py-3">
                                                                <VariantAttributes variant={v} size="xs" />
                                                            </td>

                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className="font-mono font-semibold bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[11px]">
                                                                    {v.sku}
                                                                </span>
                                                            </td>

                                                            <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">
                                                                {formatCurrency(v.price)}
                                                            </td>

                                                            <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-700">
                                                                {formatCurrency(v.costPrice != null ? v.costPrice : (activeProduct?.costPrice || 0))}
                                                            </td>

                                                            <td className="px-4 py-3 whitespace-nowrap">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] ${
                                                                    parseInt(v.quantity) > 0
                                                                        ? 'bg-emerald-100 text-emerald-800'
                                                                        : 'bg-rose-100 text-rose-800'
                                                                }`}>
                                                                    {v.quantity} in stock
                                                                </span>
                                                            </td>

                                                            <td className="px-4 py-3 whitespace-nowrap text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedVariant(v);
                                                                            setSelectedAttributes(v.attributes || {});
                                                                            setMainImage(v.image || activeProduct.images?.[0] || '');
                                                                            setActiveTab('overview');
                                                                        }}
                                                                        className="px-2 py-1 text-primary hover:bg-teal-50 rounded font-semibold text-[11px] transition cursor-pointer"
                                                                        title="Select as active variant"
                                                                    >
                                                                        Select
                                                                    </button>

                                                                    {onPrintBarcode && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => onPrintBarcode(activeProduct, v)}
                                                                            className="p-1.5 text-amber-700 hover:bg-amber-50 rounded transition cursor-pointer"
                                                                            title="Print Barcode Tag for this Variant"
                                                                        >
                                                                            <Barcode size={15} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ================= TAB 3: DESCRIPTION & MEDIA ================= */}
                        {activeTab === 'details' && (
                            <div className="space-y-6">
                                {/* Description Card */}
                                <div className="bg-white rounded border border-gray-200 p-5 shadow-2xs space-y-3">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <FileText size={14} className="text-primary" />
                                        Full Product Description
                                    </h3>
                                    {activeProduct.description ? (
                                        <div
                                            className="prose prose-sm max-w-none text-gray-700 leading-relaxed overflow-hidden text-xs sm:text-sm pt-2 border-t border-gray-100"
                                            dangerouslySetInnerHTML={{ __html: activeProduct.description }}
                                        />
                                    ) : (
                                        <p className="text-gray-400 italic text-xs">No detailed description entered for this product.</p>
                                    )}
                                </div>

                                {/* Media Gallery Grid */}
                                <div className="bg-white rounded border border-gray-200 p-5 shadow-2xs space-y-4">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                        <ImageIcon size={14} className="text-primary" />
                                        All Product Media & Variant Photos ({allImages.length})
                                    </h3>
                                    {allImages.length > 0 ? (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {allImages.map((img, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => setPreviewImage(img)}
                                                    className="group relative aspect-square rounded border border-gray-200 overflow-hidden bg-gray-50 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                                                >
                                                    <Image
                                                        src={img}
                                                        alt={`Product image ${idx + 1}`}
                                                        fill
                                                        sizes="(max-width: 768px) 50vw, 25vw"
                                                        className="object-cover group-hover:scale-105 transition-transform duration-200"
                                                    />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                                                        <Maximize2 size={18} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-400 italic text-xs">No media files available.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Drawer Footer Actions */}
                    <div className="px-6 py-3.5 bg-white border-t border-gray-200 flex items-center justify-between gap-3 shrink-0">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>Status:</span>
                            <span className={`font-semibold ${isPublished ? 'text-emerald-600' : 'text-amber-600'}`}>
                                {isPublished ? 'Live in Store' : 'Draft Mode'}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {onPrintBarcode && (
                                <button
                                    onClick={() => onPrintBarcode(activeProduct, selectedVariant)}
                                    className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                                >
                                    <Barcode size={15} />
                                    <span>Print Barcode</span>
                                </button>
                            )}

                            {hasPermission('product.update') && onEdit && (
                                <button
                                    onClick={() => {
                                        onClose();
                                        onEdit(activeProduct);
                                    }}
                                    className="px-3.5 py-2 bg-primary hover:bg-primary-hover text-white font-semibold rounded text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                                >
                                    <Edit2 size={14} />
                                    <span>Edit Product</span>
                                </button>
                            )}

                            <button
                                onClick={onClose}
                                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded text-xs transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Lightbox Image Preview Modal */}
                <AnimatePresence>
                    {previewImage && (
                        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="relative max-w-3xl max-h-[85vh] w-full h-full flex items-center justify-center"
                            >
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full cursor-pointer transition"
                                >
                                    <X size={20} />
                                </button>
                                <div className="relative w-full h-full max-h-[80vh]">
                                    <Image
                                        src={previewImage}
                                        alt="Preview"
                                        fill
                                        sizes="90vw"
                                        className="object-contain"
                                    />
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
            )}
        </AnimatePresence>
    );
}
