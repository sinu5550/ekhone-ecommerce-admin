"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { X, Plus, Trash2, Search, Package, AlertCircle, ShoppingBag, TrendingUp, Percent, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { useProducts } from "@/lib/dataFetch";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";

const calculateBundlePricing = (bundleItems, discountType, discountValue) => {
    const totalBundlePrice = bundleItems.reduce((sum, item) =>
        sum + (Number(item.price) * item.quantity), 0
    );

    let discountAmount = 0;
    if (discountType === 'Percentage' && discountValue) {
        discountAmount = (totalBundlePrice * Number(discountValue)) / 100;
    } else if (discountType === 'Fixed' && discountValue) {
        discountAmount = Number(discountValue);
    }

    const priceAfterDiscount = Math.max(0, totalBundlePrice - discountAmount);

    let totalVAT = 0;
    const itemsWithCalculations = bundleItems.map(item => {
        const itemTotalPrice = Number(item.price) * item.quantity;
        const proportion = totalBundlePrice > 0 ? itemTotalPrice / totalBundlePrice : 0;
        const discountedItemPrice = priceAfterDiscount * proportion;

        let itemVAT = 0;
        if (item.taxType === 'inclusive') {
            const taxRate = (item.tax || 0) / 100;
            itemVAT = discountedItemPrice - (discountedItemPrice / (1 + taxRate));
        } else {
            itemVAT = discountedItemPrice * ((item.tax || 0) / 100);
        }

        totalVAT += itemVAT;

        return {
            ...item,
            discountedPrice: discountedItemPrice,
            vatAmount: itemVAT,
            finalItemPrice: discountedItemPrice + itemVAT
        };
    });

    const finalPrice = priceAfterDiscount + totalVAT;

    const weightedTaxRate = bundleItems.reduce((sum, item) => {
        const itemTotalPrice = Number(item.price) * item.quantity;
        const proportion = totalBundlePrice > 0 ? itemTotalPrice / totalBundlePrice : 0;
        return sum + ((item.tax || 0) * proportion);
    }, 0);

    return {
        totalBundlePrice: Number(totalBundlePrice.toFixed(2)),
        discountAmount: Number(discountAmount.toFixed(2)),
        priceAfterDiscount: Number(priceAfterDiscount.toFixed(2)),
        totalVAT: Number(totalVAT.toFixed(2)),
        finalPrice: Number(Math.max(0, finalPrice).toFixed(2)),
        weightedTaxRate: Number(weightedTaxRate.toFixed(2)),
        itemsWithCalculations
    };
};

const BundleAddModal = ({ isOpen, onClose, onSuccess }) => {

    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [errors, setErrors] = useState({});

    const { data, isLoading: productsLoading } = useProducts();
    const productsData = data?.products || [];

    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        image: "",
        description: "",
        discountType: "Percentage",
        discountValue: "",
        status: true,
        stockQuantity: 0,
        minQuantity: 1,
        maxQuantity: "",
        startDate: "",
        endDate: "",
        sortOrder: 0,
    });

    const [bundleItems, setBundleItems] = useState([]);

    // Filter products
    const filteredProducts = useMemo(() => {
        if (!searchTerm.trim()) return [];
        const term = searchTerm.toLowerCase();
        return productsData
            .filter(product =>
                product.productName?.toLowerCase().includes(term) ||
                product.sku?.toLowerCase().includes(term) ||
                product.description?.toLowerCase().includes(term)
            )
            .slice(0, 10);
    }, [productsData, searchTerm]);

    // Calculate stats
    const bundleStats = useMemo(() => {
        if (bundleItems.length === 0) {
            return {
                totalProducts: 0,
                totalBundlePrice: 0,
                discountAmount: 0,
                priceAfterDiscount: 0,
                totalVAT: 0,
                finalPrice: 0,
                totalSavings: 0,
                savingsPercentage: 0,
                weightedTaxRate: 0,
                itemsWithCalculations: []
            };
        }

        const pricing = calculateBundlePricing(bundleItems, formData.discountType, formData.discountValue);
        const totalProducts = bundleItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalSavings = pricing.totalBundlePrice - pricing.finalPrice;
        const savingsPercentage = pricing.totalBundlePrice > 0
            ? (totalSavings / pricing.totalBundlePrice * 100)
            : 0;

        return {
            totalProducts,
            ...pricing,
            totalSavings: Number(totalSavings.toFixed(2)),
            savingsPercentage: Number(savingsPercentage.toFixed(1))
        };
    }, [bundleItems, formData.discountType, formData.discountValue]);

    useEffect(() => {
        if (isOpen) resetForm();
    }, [isOpen]);

    const resetForm = () => {
        setFormData({
            name: "",
            slug: "",
            image: "",
            description: "",
            discountType: "Percentage",
            discountValue: "",
            status: true,
            stockQuantity: 0,
            minQuantity: 1,
            maxQuantity: "",
            startDate: "",
            endDate: "",
            sortOrder: 0,
        });
        setBundleItems([]);
        setSearchTerm("");
        setImageUrl("");
        setErrors({});
    };

    const clearError = (fieldName) => {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[fieldName];
            return newErrors;
        });
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'name') {
            setFormData(prev => ({ ...prev, slug: generateSlug(value) }));
            if (errors.slug) clearError('slug');
        }

        if (errors[name]) clearError(name);
    };

    const handleImageUpload = useCallback((url) => {
        setImageUrl(url);
        setFormData(prev => ({ ...prev, image: url }));
        clearError("image");
    }, []);

    const handleImageError = useCallback((error) => {
        setErrors(prev => ({ ...prev, image: error }));
    }, []);

    const handleAddProduct = (product) => {
        if (bundleItems.find(item => item.productId === product.id)) {
            toast.error('Product already added');
            return;
        }

        if (product.quantity <= 0) {
            toast.error(`${product.productName} is out of stock`);
            return;
        }

        const newItem = {
            productId: product.id,
            productName: product.productName,
            price: product.price,
            tax: product.tax || 0,
            taxType: product.taxType || 'exclusive',
            image: product.images?.[0] || '/placeholder-product.jpg',
            quantity: 1,
            stock: product.quantity || 0,
            sku: product.sku
        };

        setBundleItems(prev => [...prev, newItem]);
        setSearchTerm("");
        toast.success(`${product.productName} added!`);
    };

    const handleRemoveProduct = (productId) => {
        setBundleItems(prev => prev.filter(item => item.productId !== productId));
    };

    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity < 1) return;

        const item = bundleItems.find(i => i.productId === productId);
        if (newQuantity > item.stock) {
            toast.error(`Only ${item.stock} available in stock`);
            return;
        }

        setBundleItems(prev =>
            prev.map(item =>
                item.productId === productId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) newErrors.name = "Bundle name is required";
        if (!formData.slug.trim()) newErrors.slug = "Slug is required";
        if (!formData.image.trim()) newErrors.image = "Image is required";
        if (!formData.discountValue || Number(formData.discountValue) < 0) {
            newErrors.discountValue = "Valid discount value is required";
        }

        if (bundleItems.length < 2) {
            toast.error('Add at least 2 products');
            return false;
        }

        if (bundleStats.finalPrice < 0) {
            toast.error('Final price cannot be negative');
            return false;
        }

        const insufficientStock = bundleItems.find(item => item.quantity > item.stock);
        if (insufficientStock) {
            toast.error(`${insufficientStock.productName} exceeds available stock`);
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            const payload = {
                name: formData.name.trim(),
                slug: formData.slug.trim(),
                image: formData.image.trim(),
                description: formData.description?.trim(),
                discountType: formData.discountType,
                discountValue: Number(formData.discountValue),
                status: formData.status,
                stockQuantity: Number(formData.stockQuantity),
                minQuantity: Number(formData.minQuantity),
                maxQuantity: formData.maxQuantity ? Number(formData.maxQuantity) : null,
                startDate: formData.startDate || null,
                endDate: formData.endDate || null,
                sortOrder: Number(formData.sortOrder),
                items: bundleItems.map(item => ({
                    productId: item.productId,
                    quantity: item.quantity
                }))
            };

            await apiClient('/api/bundle-product', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            toast.success('Bundle created successfully! 🎉');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Create bundle failed:', error);
            toast.error(error.message || 'Failed to create bundle');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 md:p-6">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={isLoading ? undefined : onClose}
                    />

                    {/* Modal Window */}
                    <motion.div
                        className="relative w-full max-w-6xl bg-white rounded-xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200 z-10"
                        initial={{ scale: 0.96, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modern Header */}
                        <div className="relative shadow px-8 py-3 bg-white">
                            <div className="flex items-center justify-between text-gray-800">
                                <h2 className="text-xl font-semibold font-exo">Create Bundle Product</h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 cursor-pointer"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                <form onSubmit={handleSubmit} className="flex flex-col h-[calc(95vh-100px)]">
                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="grid lg:grid-cols-1 gap-8">
                            {/* Left Column - Products & Basic Info */}
                            <div className="space-y-6">
                                {/* Product Search */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                                        Search & Add Products
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-4 py-2 border-2 border-gray-200 rounded focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                                            placeholder="Search by name, SKU, or description..."
                                        />
                                    </div>

                                    {/* Search Results */}
                                    {searchTerm && filteredProducts.length > 0 && (
                                        <div className="mt-3 rounded bg-white shadow-xl max-h-80 overflow-y-auto p-3 space-y-2">
                                            {filteredProducts.map(product => (
                                                <button
                                                    key={product.id}
                                                    type="button"
                                                    onClick={() => handleAddProduct(product)}
                                                    className="flex gap-6 items-center p-1 border border-teal-100 bg-teal-50/50 hover:bg-amber-50 rounded transition-all w-full text-left"
                                                >
                                                    <img
                                                        src={product.images?.[0] || '/placeholder-product.jpg'}
                                                        alt={product.productName}
                                                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-100"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-gray-900">
                                                            {product.productName}
                                                        </div>
                                                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                                                            <span className="font-medium text-green-600">
                                                                ৳{Number(product.price).toFixed(2)}
                                                            </span>
                                                            <span>•</span>
                                                            <span>Stock: {product.quantity}</span>
                                                            <span>•</span>
                                                            <span>SKU: {product.sku}</span>
                                                        </div>
                                                    </div>
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <Plus className="w-5 h-5 text-green-600" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {searchTerm && filteredProducts.length === 0 && !productsLoading && (
                                        <div className="mt-3 text-center py-12 border-2 border-dashed border-gray-200 rounded">
                                            <div className="text-gray-400 mb-2">🔍</div>
                                            <p className="text-gray-600">No products found for "{searchTerm}"</p>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Products */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-bold text-gray-900">
                                            Selected Products ({bundleItems.length})
                                        </h3>
                                        {bundleItems.length < 2 && (
                                            <span className="text-sm text-amber-600 font-medium bg-amber-50 px-3 py-1 rounded-full">
                                                ⚠️ Add minimum 2 products
                                            </span>
                                        )}
                                        {bundleItems.length >= 2 && (
                                            <span className="text-sm text-green-600 font-medium bg-green-50 px-3 py-1 rounded-full">
                                                ✓ Ready to create
                                            </span>
                                        )}
                                    </div>

                                    {bundleItems.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                                            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                            <p className="text-lg font-medium text-gray-600 mb-1">
                                                No products added yet
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                Search and add products above to start building your bundle
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {bundleStats.itemsWithCalculations.map((item, index) => (
                                                <div
                                                    key={item.productId}
                                                    className="group bg-white border-2 border-gray-100 rounded px-5 py-2 hover:border-amber-200 hover:shadow-lg transition-all"
                                                >
                                                    <div className="flex items-center gap-5">
                                                        {/* Number Badge */}
                                                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                                            {index + 1}
                                                        </div>

                                                        {/* Product Image */}
                                                        <img
                                                            src={item.image}
                                                            alt={item.productName}
                                                            className="w-20 h-20 rounded-lg object-cover border-2 border-gray-100"
                                                        />

                                                        {/* Product Info */}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-gray-900 truncate">
                                                                {item.productName}
                                                            </h4>
                                                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                                                <span className="px-2 py-1 bg-gray-100 rounded">
                                                                    SKU: {item.sku}
                                                                </span>
                                                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
                                                                    Tax: {item.tax}%
                                                                </span>
                                                                <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                                                    Stock: {item.stock}
                                                                </span>
                                                            </div>
                                                            <div className="mt-2 text-sm font-medium text-amber-600">
                                                                Final: ৳{item.finalItemPrice?.toFixed(2)}
                                                                <span className="text-xs text-gray-500 ml-2">
                                                                    (৳{item.discountedPrice?.toFixed(2)} + ৳{item.vatAmount?.toFixed(2)} VAT)
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Quantity Controls */}
                                                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                                                disabled={item.quantity <= 1}
                                                                className="w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:text-amber-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all font-semibold"
                                                            >
                                                                -
                                                            </button>
                                                            <span className="w-12 text-center font-bold text-gray-900">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                                                className="w-9 h-9 flex items-center justify-center bg-white border-2 border-gray-200 rounded-lg hover:border-amber-500 hover:text-amber-600 transition-all font-semibold"
                                                            >
                                                                +
                                                            </button>
                                                        </div>

                                                        {/* Price */}
                                                        <div className="text-right">
                                                            <div className="text-lg font-bold text-gray-900">
                                                                ৳{(Number(item.price) * item.quantity).toFixed(2)}
                                                            </div>
                                                            <div className="text-xs text-gray-500">Original</div>
                                                        </div>

                                                        {/* Remove Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveProduct(item.productId)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>

                                                    {item.quantity > item.stock && (
                                                        <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Quantity exceeds available stock ({item.stock} available)
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Basic Information */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <Tag className="w-5 h-5 text-amber-600" />
                                        Bundle Information
                                    </h3>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-4 transition-all ${errors.name
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                                : 'border-gray-200 focus:border-amber-500 focus:ring-amber-100'
                                                }`}
                                            placeholder="e.g., Summer Electronics Bundle"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" /> {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Slug <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="slug"
                                            value={formData.slug}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-4 transition-all ${errors.slug
                                                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                                : 'border-gray-200 focus:border-amber-500 focus:ring-amber-100'
                                                }`}
                                            placeholder="summer-electronics-bundle"
                                        />
                                        {errors.slug && (
                                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" /> {errors.slug}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <CloudinaryImageInput
                                            label="Image"
                                            onUpload={handleImageUpload}
                                            onError={handleImageError}
                                            initialImage={formData.image}
                                        />
                                        {errors.image && (
                                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle className="w-4 h-4" /> {errors.image}
                                            </p>
                                        )}
                                        {imageUrl && (
                                            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                <span className="text-sm text-green-700 font-medium">
                                                    Image uploaded successfully
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                Start Date <span className="text-[10px]">(optional)</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="startDate"
                                                value={formData.startDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                End Date <span className="text-[10px]">(optional)</span>
                                            </label>
                                            <input
                                                type="datetime-local"
                                                name="endDate"
                                                value={formData.endDate}
                                                onChange={handleInputChange}
                                                className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-4 py-2 border border-gray-200 rounded focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all resize-none"
                                            placeholder="Describe this bundle and its benefits..."
                                        />
                                    </div>

                                    <div className="flex gap-6 pt-4 mt-4 border-t border-gray-200">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    name="status"
                                                    checked={formData.status}
                                                    onChange={handleInputChange}
                                                    className="w-5 h-5 rounded border-2 border-gray-300 text-amber-600 focus:ring-4 focus:ring-amber-100"
                                                />
                                            </div>
                                            <span className="font-medium text-gray-700 group-hover:text-gray-900">
                                                Active Bundle
                                            </span>
                                        </label>
                                    </div>
                                </div>

                                {/* Right Column - Pricing & Settings */}
                                <div className="space-y-6">
                                    {/* Discount Settings */}
                                    <div className="bg-gradient-to-br from-amber-50 to-pink-50 p-6 rounded-xl border-2 border-amber-100 mt-15">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Percent className="w-5 h-5 text-amber-600" />
                                            Discount Settings
                                        </h3>

                                        <div className="space-y-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Type
                                                </label>
                                                <select
                                                    name="discountType"
                                                    value={formData.discountType}
                                                    onChange={handleInputChange}
                                                    className="w-full px-4 py-3 border-2 border-white rounded focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all bg-white"
                                                >
                                                    <option value="Percentage">Percentage (%)</option>
                                                    <option value="Fixed">Fixed Amount (৳)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                                    Value
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        name="discountValue"
                                                        value={formData.discountValue}
                                                        onChange={handleInputChange}
                                                        min="0"
                                                        step="0.01"
                                                        className={`w-full px-4 py-3 pr-12 border-2 rounded focus:outline-none focus:ring-4 transition-all bg-white ${errors.discountValue
                                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                                            : 'border-white focus:border-amber-500 focus:ring-amber-100'
                                                            }`}
                                                        placeholder="10"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-semibold">
                                                        {formData.discountType === 'Percentage' ? '%' : '৳'}
                                                    </span>
                                                </div>
                                                {errors.discountValue && (
                                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                                        <AlertCircle className="w-4 h-4" /> {errors.discountValue}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pricing Summary */}
                                    <div className="bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50 p-6 rounded-xl border-2 border-purple-100">
                                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-purple-600" />
                                            Pricing Summary
                                        </h3>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center pb-2 border-b border-purple-200">
                                                <span className="text-sm text-gray-600">Total Products:</span>
                                                <span className="font-bold text-gray-900">{bundleStats.totalProducts}</span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Original Price:</span>
                                                <span className="font-semibold text-gray-900">
                                                    ৳{bundleStats.totalBundlePrice.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Bundle Discount:</span>
                                                <span className="font-semibold text-red-600">
                                                    -৳{bundleStats.discountAmount.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="flex justify-between items-center font-medium">
                                                <span className="text-sm text-gray-700">After Discount:</span>
                                                <span className="text-amber-600">
                                                    ৳{bundleStats.priceAfterDiscount.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="border-t border-purple-200 pt-2"></div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-gray-600">Total VAT/TAX:</span>
                                                <span className="font-semibold text-orange-600">
                                                    +৳{bundleStats.totalVAT.toFixed(2)}
                                                </span>
                                            </div>

                                            <div className="border-t-2 border-purple-300 pt-3 mt-2">
                                                <div className="flex justify-between items-center bg-white p-4 rounded shadow-sm">
                                                    <span className="font-bold text-gray-900">Final Price:</span>
                                                    <span className="text-2xl font-bold text-green-600">
                                                        ৳{bundleStats.finalPrice.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="border-t border-gray-200 bg-gray-50 px-8 py-3">
                        <div className="flex items-center justify-end gap-5">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-3 text-gray-700 font-medium border-2 border-gray-300 rounded hover:bg-gray-100 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={isLoading || bundleItems.length < 2}
                                className="px-5 py-3 bg-secound hover:bg-secound-hover text-white font-bold rounded disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Creating Bundle...
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-5 h-5" />
                                        Create Bundle Product
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </div>
            )}
        </AnimatePresence>
    );
};

export default BundleAddModal;