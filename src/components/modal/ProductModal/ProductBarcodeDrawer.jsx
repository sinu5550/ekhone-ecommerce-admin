'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    X,
    Printer,
    Download,
    Barcode as BarcodeIcon,
    Layers,
    Tag,
    Sliders,
    Sparkles,
    Check,
    ChevronLeft,
    ChevronRight,
    Plus,
    Minus,
    CheckCircle2,
    Eye,
    Package,
    Loader2,
    Info,
    Settings2,
    Palette
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import JsBarcode from 'jsbarcode';
import {
    LABEL_SIZES,
    buildTagItemsList,
    extractBarcodeFromSKU,
    generateBarcodeDataURL,
    generateProductTagsPDF,
    printProductTagsDirect,
    formatPrice
} from '@/lib/barcodeTagPDF';

export default function ProductBarcodeDrawer({
    isOpen,
    onClose,
    product,
    initialTab = 'preview',
    initialVariantId = null
}) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [labelSize, setLabelSize] = useState('50x30');
    const [storeName, setStoreName] = useState('EKHONE');
    const [showStoreName, setShowStoreName] = useState(true);
    const [showProductName, setShowProductName] = useState(true);
    const [showAttributes, setShowAttributes] = useState(true);
    const [showPrice, setShowPrice] = useState(true);
    const [showMRP, setShowMRP] = useState(true);
    const [showSKUText, setShowSKUText] = useState(true);
    const [customNote, setCustomNote] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    // Variant selections / Quantities
    const [variantItems, setVariantItems] = useState([]);
    const [activePreviewIndex, setActivePreviewIndex] = useState(0);

    const previewBarcodeRef = useRef(null);

    // Sync tab when opened
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab || 'preview');
        }
    }, [isOpen, initialTab]);

    // Escape key listener & prevent body scroll
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
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
    }, [isOpen, onClose]);

    // Initialize product items
    useEffect(() => {
        if (!isOpen || !product) {
            setVariantItems([]);
            setActivePreviewIndex(0);
            return;
        }

        const isVariant = product.productType === 'variant' &&
            Array.isArray(product.productVariants) &&
            product.productVariants.length > 0;

        if (isVariant) {
            const initialVariants = product.productVariants.map(v => {
                let attrStr = '';
                if (v.attributes) {
                    if (typeof v.attributes === 'object') {
                        attrStr = Object.entries(v.attributes)
                            .map(([k, val]) => `${k}: ${val}`)
                            .join(' | ');
                    } else {
                        attrStr = String(v.attributes);
                    }
                } else if (v.color || v.size) {
                    attrStr = [v.color, v.size].filter(Boolean).join(' | ');
                }

                // If a specific variant was requested, only set 1 for that variant
                const defaultQty = initialVariantId
                    ? (v.id === initialVariantId ? 1 : 0)
                    : 1;

                return {
                    id: v.id,
                    sku: v.sku || product.sku || `SKU-${v.id}`,
                    attributes: v.attributes || {},
                    attributesText: attrStr,
                    price: v.price || product.price || 0,
                    stock: v.quantity ?? 0,
                    image: v.image || product.images?.[0] || '',
                    printQuantity: defaultQty
                };
            });
            setVariantItems(initialVariants);
        } else {
            // Single product
            setVariantItems([{
                id: product.id,
                sku: product.sku || `SKU-${product.id}`,
                attributes: {},
                attributesText: '',
                price: product.price || 0,
                stock: product.quantity ?? 0,
                image: product.images?.[0] || '',
                printQuantity: 1
            }]);
        }
        setActivePreviewIndex(0);
    }, [isOpen, product, initialVariantId]);

    // Computed Tags list
    const tagItemsList = useMemo(() => {
        if (!product) return [];
        return buildTagItemsList(product, variantItems);
    }, [product, variantItems]);

    const totalLabelsCount = tagItemsList.length;
    const activePreviewTag = tagItemsList[activePreviewIndex] || tagItemsList[0] || null;

    // Render Barcode in Preview SVG
    useEffect(() => {
        if (previewBarcodeRef.current && activePreviewTag) {
            try {
                const barcodeValue = activePreviewTag.barcodeNumber || extractBarcodeFromSKU(activePreviewTag.sku, activePreviewTag.variantId || activePreviewTag.productId);
                JsBarcode(previewBarcodeRef.current, barcodeValue, {
                    format: 'CODE128',
                    width: 1.8,
                    height: 38,
                    displayValue: false,
                    margin: 0,
                    background: '#ffffff',
                    lineColor: '#000000'
                });
            } catch (err) {
                console.warn('JsBarcode render error in preview:', err);
            }
        }
    }, [activePreviewTag, labelSize, showSKUText, activeTab]);

    // Handlers for Quantities
    const handleQuantityChange = (id, newQty) => {
        const qty = Math.max(0, parseInt(newQty) || 0);
        setVariantItems(prev => prev.map(item => item.id === id ? { ...item, printQuantity: qty } : item));
    };

    const handleSetAllQuantities = (qty) => {
        setVariantItems(prev => prev.map(item => ({ ...item, printQuantity: Math.max(0, qty) })));
    };

    const handleFillStockQuantities = () => {
        setVariantItems(prev => prev.map(item => ({ ...item, printQuantity: Math.max(1, item.stock || 1) })));
        toast.success('Quantities set to match available stock');
    };

    // Print & Download
    const handleDirectPrint = () => {
        if (totalLabelsCount === 0) {
            toast.error('Please set at least 1 label quantity to print.');
            return;
        }

        try {
            setIsGenerating(true);
            const settings = {
                labelSize,
                storeName,
                showStoreName,
                showProductName,
                showAttributes,
                showPrice,
                showMRP,
                showSKUText,
                customNote
            };
            printProductTagsDirect(tagItemsList, settings);
            toast.success(`Printing ${totalLabelsCount} tag${totalLabelsCount > 1 ? 's' : ''}...`);
        } catch (error) {
            console.error('Print error:', error);
            toast.error(error.message || 'Failed to trigger print dialog');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadPDF = async () => {
        if (totalLabelsCount === 0) {
            toast.error('Please set at least 1 label quantity to print.');
            return;
        }

        try {
            setIsGenerating(true);
            const settings = {
                labelSize,
                storeName,
                showStoreName,
                showProductName,
                showAttributes,
                showPrice,
                showMRP,
                showSKUText,
                customNote
            };
            const doc = await generateProductTagsPDF(tagItemsList, settings);
            const filename = `Barcode_Tags_${(product.sku || product.productName || 'product').replace(/[^a-zA-Z0-9_-]/g, '_')}_${labelSize}.pdf`;
            doc.save(filename);
            toast.success(`Downloaded ${totalLabelsCount} barcode tags PDF!`);
        } catch (error) {
            console.error('PDF generation error:', error);
            toast.error(error.message || 'Failed to generate PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    const currentSizeConfig = LABEL_SIZES[labelSize] || LABEL_SIZES['50x30'];
    const isVariantProduct = product?.productType === 'variant' && variantItems.length > 1;

    const tabs = [
        { id: 'preview', label: 'Preview & Print', icon: Eye },
        { id: 'variants', label: 'Variants & Qty', icon: Layers, count: isVariantProduct ? variantItems.length : null },
        { id: 'settings', label: 'Tag Customization', icon: Settings2 }
    ];

    return (
        <AnimatePresence>
            {isOpen && product && (
                <div className="fixed inset-0 z-[70] overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sliding Drawer Panel */}
                    <motion.div
                        className="fixed inset-y-0 right-0 w-full md:w-[65vw] lg:w-[55vw] xl:w-[50vw] bg-white shadow-2xl flex flex-col h-full border-l border-gray-200 z-[70]"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                    >
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/90 flex items-center justify-between gap-4 shrink-0">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-secound/10 border border-secound/20 flex items-center justify-center text-secound shadow-xs shrink-0">
                                    <BarcodeIcon size={24} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-lg font-bold text-gray-900 font-mono tracking-tight truncate">
                                            {product.sku ? `SKU: ${product.sku}` : (product.productName || 'Product Barcode')}
                                        </h2>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                            isVariantProduct
                                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                                : 'bg-sky-100 text-sky-800 border border-sky-200'
                                        }`}>
                                            {isVariantProduct ? `Variant (${variantItems.length})` : 'Single Item'}
                                        </span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                                            Code 128
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 truncate">
                                        <span className="font-medium text-gray-800 truncate">{product.productName}</span>
                                        {product.subCategory?.name && (
                                            <>
                                                <span>•</span>
                                                <span className="text-gray-500">{product.subCategory.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer shrink-0"
                                title="Close Drawer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="px-6 bg-white border-b border-gray-200 flex space-x-6 overflow-x-auto shrink-0 scrollbar-none">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-3.5 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                                            isActive
                                                ? 'border-secound text-secound'
                                                : 'border-transparent text-gray-500 hover:text-gray-900'
                                        }`}
                                    >
                                        <Icon size={15} />
                                        <span>{tab.label}</span>
                                        {tab.count !== null && tab.count !== undefined && (
                                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                                isActive ? 'bg-secound/10 text-secound' : 'bg-gray-100 text-gray-600'
                                            }`}>
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
                            
                            {/* ─────────────────────────────────────────────────────────────
                                TAB 1: Preview & Print
                               ───────────────────────────────────────────────────────────── */}
                            {activeTab === 'preview' && (
                                <div className="space-y-6 animate-in fade-in duration-150">
                                    
                                    {/* Thermal Sticker Size Preset Selector */}
                                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <Tag className="w-3.5 h-3.5 text-secound" />
                                                Thermal Sticker Size Preset
                                            </label>
                                            <span className="text-xs text-secound font-bold bg-secound/10 px-2 py-0.5 rounded">
                                                {currentSizeConfig.width}mm × {currentSizeConfig.height}mm
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                            {Object.values(LABEL_SIZES).map((size) => {
                                                const isSelected = labelSize === size.id;
                                                return (
                                                    <button
                                                        key={size.id}
                                                        type="button"
                                                        onClick={() => setLabelSize(size.id)}
                                                        className={`flex flex-col text-left p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                                                            isSelected
                                                                ? 'border-secound bg-secound/5 text-gray-900 shadow-xs ring-1 ring-secound'
                                                                : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between w-full">
                                                            <span className="font-bold">{size.name.split(' (')[0]}</span>
                                                            {isSelected && <Check className="w-3.5 h-3.5 text-secound" />}
                                                        </div>
                                                        <span className="text-[11px] text-gray-500 mt-1 line-clamp-1">
                                                            {size.description}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Live Realistic Tag Preview Card */}
                                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <Eye className="w-3.5 h-3.5 text-secound" />
                                                Live Sticker Preview (WYSIWYG)
                                            </span>

                                            {totalLabelsCount > 1 && (
                                                <div className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePreviewIndex(prev => Math.max(0, prev - 1))}
                                                        disabled={activePreviewIndex <= 0}
                                                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer"
                                                        title="Previous Tag"
                                                    >
                                                        <ChevronLeft size={14} />
                                                    </button>
                                                    <span className="font-mono font-medium text-[11px] px-1">
                                                        Tag {activePreviewIndex + 1} of {totalLabelsCount}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActivePreviewIndex(prev => Math.min(totalLabelsCount - 1, prev + 1))}
                                                        disabled={activePreviewIndex >= totalLabelsCount - 1}
                                                        className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 cursor-pointer"
                                                        title="Next Tag"
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Physical Thermal Label Simulation Box */}
                                        <div className="flex items-center justify-center p-8 bg-gray-100 rounded-xl border border-dashed border-gray-300 min-h-[260px]">
                                            {activePreviewTag ? (
                                                <div
                                                    className="bg-white border-2 border-gray-900 rounded shadow-md p-3 flex flex-col items-center justify-between text-center transition-all duration-200"
                                                    style={{
                                                        width: `${Math.min(300, currentSizeConfig.width * 5)}px`,
                                                        minHeight: `${Math.max(140, currentSizeConfig.height * 4.6)}px`
                                                    }}
                                                >
                                                    {/* Store Header */}
                                                    {showStoreName && (
                                                        <div className="text-[11px] font-black tracking-wider text-gray-900 uppercase">
                                                            {storeName || 'EKHONE'}
                                                        </div>
                                                    )}

                                                    {/* Product Name */}
                                                    {showProductName && (
                                                        <div className="text-[10px] font-semibold text-gray-800 line-clamp-1 max-w-[95%] mt-0.5">
                                                            {activePreviewTag.productName}
                                                        </div>
                                                    )}

                                                    {/* Attributes */}
                                                    {showAttributes && activePreviewTag.attributesText && (
                                                        <div className="text-[9px] font-medium text-gray-600 mt-0.5">
                                                            {activePreviewTag.attributesText}
                                                        </div>
                                                    )}

                                                    {/* Barcode SVG */}
                                                    <div className="my-1.5 w-full flex justify-center items-center bg-white">
                                                        <svg ref={previewBarcodeRef} className="max-w-[95%] h-auto"></svg>
                                                    </div>

                                                    {/* SKU Code Text */}
                                                    {showSKUText && (
                                                        <div className="font-mono text-[10px] font-bold text-gray-900 tracking-wider">
                                                            {activePreviewTag.sku}
                                                        </div>
                                                    )}

                                                    {/* Price */}
                                                    {showPrice && (
                                                        <div className="flex items-center justify-center gap-2 mt-1">
                                                            <span className="text-xs font-black text-gray-900">
                                                                ৳ {formatPrice(activePreviewTag.salePrice)}
                                                            </span>
                                                            {activePreviewTag.hasDiscount && showMRP && (
                                                                <span className="text-[10px] text-gray-400 line-through">
                                                                    MRP: ৳ {formatPrice(activePreviewTag.regularPrice)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Custom Note */}
                                                    {customNote && (
                                                        <div className="text-[8px] text-gray-500 italic mt-0.5">
                                                            {customNote}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center text-gray-400 text-xs">
                                                    <BarcodeIcon className="w-10 h-10 mx-auto mb-2 opacity-40" />
                                                    <p>Please set print quantity &gt; 0 to preview</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Compatibility Banner */}
                                        <div className="bg-amber-50 rounded-lg p-3.5 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                                            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                            <div className="space-y-0.5">
                                                <p className="font-bold text-amber-900">Thermal Printer & Scanner Ready</p>
                                                <p className="text-[11px] text-amber-800 leading-relaxed">
                                                    Generated in <strong>Code 128</strong> barcode standard. Plug-and-play compatible with Xprinter, Zebra, TSC, and all standard POS barcode scanner guns.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─────────────────────────────────────────────────────────────
                                TAB 2: Variants & Quantities
                               ───────────────────────────────────────────────────────────── */}
                            {activeTab === 'variants' && (
                                <div className="space-y-6 animate-in fade-in duration-150">
                                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs space-y-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                    <Layers className="w-3.5 h-3.5 text-secound" />
                                                    Print Quantity Configuration
                                                </h3>
                                                <p className="text-[11px] text-gray-500 mt-0.5">
                                                    Specify how many barcode tags you want to generate for each SKU
                                                </p>
                                            </div>

                                            {isVariantProduct && (
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetAllQuantities(1)}
                                                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs font-semibold transition cursor-pointer"
                                                    >
                                                        All 1
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={handleFillStockQuantities}
                                                        className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-xs font-semibold transition cursor-pointer"
                                                    >
                                                        Match Stock
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetAllQuantities(0)}
                                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-semibold transition cursor-pointer"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Variants list table / cards */}
                                        <div className="space-y-2.5 divide-y divide-gray-100">
                                            {variantItems.map((item, idx) => (
                                                <div
                                                    key={item.id || idx}
                                                    className={`pt-2.5 first:pt-0 flex items-center justify-between p-3 rounded-lg border transition-all ${
                                                        item.printQuantity > 0
                                                            ? 'border-secound/30 bg-secound/5'
                                                            : 'border-gray-200 bg-gray-50/50 opacity-60'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        {item.image ? (
                                                            <div className="w-11 h-11 rounded-lg border border-gray-200 overflow-hidden relative shrink-0 bg-white shadow-2xs">
                                                                <Image
                                                                    src={item.image}
                                                                    alt={item.sku}
                                                                    fill
                                                                    sizes="44px"
                                                                    className="object-cover"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="w-11 h-11 rounded-lg border border-gray-200 flex items-center justify-center bg-gray-100 text-gray-400 shrink-0">
                                                                <Package className="w-5 h-5" />
                                                            </div>
                                                        )}

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-mono text-xs font-bold text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                                                    {item.sku}
                                                                </span>
                                                                {item.attributesText && (
                                                                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 truncate">
                                                                        {item.attributesText}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                                <span className="font-semibold text-gray-800">৳ {formatPrice(item.price)}</span>
                                                                <span>•</span>
                                                                <span>Stock: <strong className="text-gray-700">{item.stock}</strong></span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Stepper Quantity Control */}
                                                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.id, item.printQuantity - 1)}
                                                            disabled={item.printQuantity <= 0}
                                                            className="w-8 h-8 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="999"
                                                            value={item.printQuantity}
                                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                            className="w-14 text-center text-xs font-bold py-1.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-secound bg-white"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleQuantityChange(item.id, item.printQuantity + 1)}
                                                            className="w-8 h-8 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 flex items-center justify-center cursor-pointer shadow-2xs"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ─────────────────────────────────────────────────────────────
                                TAB 3: Tag Customization Settings
                               ───────────────────────────────────────────────────────────── */}
                            {activeTab === 'settings' && (
                                <div className="space-y-6 animate-in fade-in duration-150">
                                    <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-xs space-y-4">
                                        <div>
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <Sliders className="w-3.5 h-3.5 text-secound" />
                                                Visible Fields On Sticker
                                            </h3>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Choose which information elements appear on the printed barcode stickers
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                                <input
                                                    type="checkbox"
                                                    checked={showStoreName}
                                                    onChange={(e) => setShowStoreName(e.target.checked)}
                                                    className="rounded text-secound focus:ring-secound w-4 h-4"
                                                />
                                                <div>
                                                    <span className="text-gray-800 font-semibold block">Store Brand Header</span>
                                                    <span className="text-[11px] text-gray-500">Prints store name on top</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                                <input
                                                    type="checkbox"
                                                    checked={showProductName}
                                                    onChange={(e) => setShowProductName(e.target.checked)}
                                                    className="rounded text-secound focus:ring-secound w-4 h-4"
                                                />
                                                <div>
                                                    <span className="text-gray-800 font-semibold block">Product Title</span>
                                                    <span className="text-[11px] text-gray-500">Prints product name</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                                <input
                                                    type="checkbox"
                                                    checked={showAttributes}
                                                    onChange={(e) => setShowAttributes(e.target.checked)}
                                                    className="rounded text-secound focus:ring-secound w-4 h-4"
                                                />
                                                <div>
                                                    <span className="text-gray-800 font-semibold block">Variant Attributes</span>
                                                    <span className="text-[11px] text-gray-500">e.g. Color, Size</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                                <input
                                                    type="checkbox"
                                                    checked={showPrice}
                                                    onChange={(e) => setShowPrice(e.target.checked)}
                                                    className="rounded text-secound focus:ring-secound w-4 h-4"
                                                />
                                                <div>
                                                    <span className="text-gray-800 font-semibold block">Selling Price</span>
                                                    <span className="text-[11px] text-gray-500">Prints formatted BDT price (৳)</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                                <input
                                                    type="checkbox"
                                                    checked={showMRP}
                                                    onChange={(e) => setShowMRP(e.target.checked)}
                                                    className="rounded text-secound focus:ring-secound w-4 h-4"
                                                />
                                                <div>
                                                    <span className="text-gray-800 font-semibold block">MRP Strike-Through</span>
                                                    <span className="text-[11px] text-gray-500">Shows regular price when on sale</span>
                                                </div>
                                            </label>

                                            <label className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition">
                                                <input
                                                    type="checkbox"
                                                    checked={showSKUText}
                                                    onChange={(e) => setShowSKUText(e.target.checked)}
                                                    className="rounded text-secound focus:ring-secound w-4 h-4"
                                                />
                                                <div>
                                                    <span className="text-gray-800 font-semibold block">SKU Text Code</span>
                                                    <span className="text-[11px] text-gray-500">Prints alphanumeric SKU under barcode</span>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Store Name & Custom Note Inputs */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                                            {showStoreName && (
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                        Store Header Text
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={storeName}
                                                        onChange={(e) => setStoreName(e.target.value)}
                                                        placeholder="EKHONE"
                                                        className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secound focus:border-transparent bg-white"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                    Custom Footer Text (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={customNote}
                                                    onChange={(e) => setCustomNote(e.target.value)}
                                                    placeholder="e.g. VAT Included / Non-Refundable"
                                                    className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secound focus:border-transparent bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Sticky Footer */}
                        <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between gap-4 shrink-0 shadow-lg">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secound/10 text-secound border border-secound/20">
                                    <CheckCircle2 size={14} />
                                    Total: {totalLabelsCount} Tag{totalLabelsCount === 1 ? '' : 's'}
                                </span>
                                <span className="text-xs text-gray-500 hidden sm:inline">
                                    ({currentSizeConfig.width}×{currentSizeConfig.height}mm)
                                </span>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                                >
                                    Close
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDownloadPDF}
                                    disabled={isGenerating || totalLabelsCount === 0}
                                    className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                                >
                                    <Download size={14} className="text-gray-500" />
                                    <span>PDF</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleDirectPrint}
                                    disabled={isGenerating || totalLabelsCount === 0}
                                    className="flex items-center gap-2 px-5 py-2 bg-secound hover:bg-secound-hover text-white rounded font-medium text-xs shadow-xs transition duration-200 cursor-pointer disabled:opacity-50"
                                >
                                    {isGenerating ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Printer size={14} />
                                    )}
                                    <span>Direct Print ({totalLabelsCount})</span>
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
