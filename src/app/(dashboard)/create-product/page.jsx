'use client'

import SingleProductFields from "@/components/product/ProductVariant/SingleProductFields";
import VariantProductFields from "@/components/product/ProductVariant/VariantProductFields";
import TinyEditor from "@/components/TinyEditor/Editor";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import { usePermission } from "@/context/PermissionProvider";
import { apiClient } from "@/lib/apiClient";
import { useBrands, useCollections, useMainCategories, useUnits, useVariantAttributes, useWarranties } from "@/lib/dataFetch";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { ArrowLeft, FileDiff, Image, Images, RotateCcw, Sparkles, Check } from "lucide-react";
import Link from "next/link";
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from "react-hot-toast";
import { FaProductHunt } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";


const CreateProduct = () => {

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productType, setProductType] = useState("single");
    const { data: variantData = [] } = useVariantAttributes();
    const { data: warrantyData = [] } = useWarranties();
    const { data: categoryData = [] } = useMainCategories();
    const { data: brandData = [] } = useBrands();
    const { data: unitData = [] } = useUnits();
    const { data: collectionsData = [] } = useCollections();
    const [selectedCollections, setSelectedCollections] = useState([]);
    const [isSlugEdited, setIsSlugEdited] = useState(false);
    const [isSkuEdited, setIsSkuEdited] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState("");
    const [selectedValue, setSelectedValue] = useState("");
    const [images, setImages] = useState([]);
    const [warrantyEnabled, setWarrantyEnabled] = useState(false);
    const [expireEnabled, setExpireEnabled] = useState(false);
    const [variants, setVariants] = useState([]);
    const previousProductNameRef = useRef('');
    const previousProductTypeRef = useRef('single');
    const { hasPermission } = usePermission();


    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        clearErrors,
        watch,
        setValue,
        getValues
    } = useForm({
        mode: "onChange",
        defaultValues: {
            visibility: "public"
        }
    });

    // Watch form values
    const watchedMainCategory = watch('mainCategory');
    const watchedCategory = watch('category');
    const watchedProductName = watch('productName');

    // Auto-generate SKU based on product name and product type (only if not manually edited)
    useEffect(() => {
        const currentProductName = watchedProductName?.trim();
        const currentProductType = productType;

        // Check if product name or product type has changed
        const productNameChanged = currentProductName !== previousProductNameRef.current;
        const productTypeChanged = currentProductType !== previousProductTypeRef.current;

        // Update refs
        previousProductNameRef.current = currentProductName;
        previousProductTypeRef.current = currentProductType;

        // Only auto-generate if SKU hasn't been manually edited OR product name/type changed
        if (!isSkuEdited || productNameChanged || productTypeChanged) {
            if (currentProductName && currentProductName !== '') {
                // Generate base SKU initials from product name words (e.g. "Burgundy Silk Katan..." -> "BSK")
                const words = currentProductName
                    .trim()
                    .replace(/[^a-zA-Z0-9\s]/g, '')
                    .split(/\s+/)
                    .filter(Boolean);

                let baseSKU = "";
                if (words.length >= 3) {
                    baseSKU = words.slice(0, 3).map(w => w[0]).join('');
                } else if (words.length === 2) {
                    baseSKU = words.map(w => w[0]).join('');
                } else if (words.length === 1) {
                    baseSKU = words[0].slice(0, 3);
                }

                baseSKU = (baseSKU || "PRD").toUpperCase();

                // Add prefix based on product type
                const skuPrefix = productType === "single" ? "SGL-" : "VAR-";
                const timestamp = Date.now().toString().slice(-6);
                const autoSKU = `${skuPrefix}${baseSKU}-${timestamp}`;

                setValue('sku', autoSKU);

                // Reset manual edit flag if product name or type changed
                if (productNameChanged || productTypeChanged) {
                    setIsSkuEdited(false);
                }
            } else {
                setValue('sku', '');
            }
        }
    }, [watchedProductName, productType, setValue, isSkuEdited]);

    const handleImageUpload = useCallback((url, index) => {
        setImages(prev => {
            const newImages = [...prev];
            newImages[index] = url;
            return newImages;
        });
        clearErrors("images");
    }, [clearErrors]);

    const handleImageRemove = useCallback((index) => {
        setImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Handle manual SKU edit
    const handleSkuChange = (e) => {
        setIsSkuEdited(true);
        setValue('sku', e.target.value, { shouldValidate: true });
    };

    // ✅ SUBMIT HANDLER - Updated for variants
    const onSubmit = async (data) => {

        // if (images.length === 0 || !images[0]) {
        //     toast.error("Please upload at least one main image before submitting.");
        //     return;
        // }

        // Validate variants if product type is variant
        if (productType === "variant") {
            if (variants.length === 0) {
                toast.error("Please add at least one variant for variant products.");
                return;
            }

            // Check if all variants have required fields
            const invalidVariants = variants.filter(v =>
                !v.sku || !v.price || v.quantity === undefined || !v.image
            );

            if (invalidVariants.length > 0) {
                toast.error("All variants must have SKU, price, quantity, and image.");
                return;
            }
        }

        try {
            setIsSubmitting(true);

            // Prepare base product payload
            const payload = {
                ...data,
                productType,
                // Convert numeric fields
                subCategoryId: data.subCategoryId ? parseInt(data.subCategoryId) : undefined,
                brandId: data.brandId ? parseInt(data.brandId) : undefined,
                unitId: data.unitId ? parseInt(data.unitId) : undefined,
                warrantyId: data.warrantyId ? parseInt(data.warrantyId) : undefined,
                price: data.price ? parseFloat(data.price) : 0,
                costPrice: data.costPrice !== undefined && data.costPrice !== '' ? parseFloat(data.costPrice) : 0,
                quantity: data.quantity ? parseInt(data.quantity) : 0,
                tax: data.tax ? parseFloat(data.tax) : undefined,
                discountType: (data.discountType && data.discountValue !== undefined && data.discountValue !== '' && !isNaN(parseInt(data.discountValue)) && parseInt(data.discountValue) > 0) ? data.discountType : null,
                discountValue: (data.discountType && data.discountValue !== undefined && data.discountValue !== '' && !isNaN(parseInt(data.discountValue)) && parseInt(data.discountValue) > 0) ? parseInt(data.discountValue) : 0,
                quantityAlert: data.quantityAlert ? parseInt(data.quantityAlert) : undefined,
                manufacturerData: data.manufacturerData ? new Date(data.manufacturerData).toISOString() : undefined,
                expireOn: data.expireOn ? new Date(data.expireOn).toISOString() : undefined,
                images: images.filter(img => img),
                insideDhakaDeliveryCharge: data.insideDhakaDeliveryCharge ? parseFloat(data.insideDhakaDeliveryCharge) : undefined,
                outsideDhakaDeliveryCharge: data.outsideDhakaDeliveryCharge ? parseFloat(data.outsideDhakaDeliveryCharge) : undefined,
                collectionIds: selectedCollections.length > 0 ? selectedCollections : undefined,
                // Remove UI-only fields
                mainCategory: undefined,
                category: undefined
            };

            // Add variants if product type is variant
            if (productType === "variant") {
                payload.variants = variants.map(v => ({
                    sku: v.sku,
                    price: parseFloat(v.price),
                    costPrice: v.costPrice !== undefined && v.costPrice !== '' ? parseFloat(v.costPrice) : 0,
                    quantity: parseInt(v.quantity),
                    attributes: v.attributes, // Object like { "Color": "Red", "Size": "M" }
                    image: v.image
                }));

                // For variant products, use first variant's price and costPrice as base
                payload.price = parseFloat(variants[0].price);
                if (variants[0].costPrice) {
                    payload.costPrice = parseFloat(variants[0].costPrice);
                }
            }

            // Clean up undefined and empty values
            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined || payload[key] === '') {
                    delete payload[key];
                }
            });

            console.log("Final Payload:", payload);

            await apiClient("/api/product", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            toast.success("Product created successfully!");
            handleRefresh();
        } catch (error) {
            console.error("Error creating product:", error);
            toast.error(error.message || "Failed to create product. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRefresh = () => {
        reset({ visibility: "public" });
        setImages([]);
        setSelectedCollections([]);
        setIsSlugEdited(false);
        setIsSkuEdited(false);
        setWarrantyEnabled(false);
        setExpireEnabled(false);
        setSelectedVariant("");
        setSelectedValue("");
        setVariants([]);
        setProductType("single");
        previousProductNameRef.current = '';
        previousProductTypeRef.current = 'single';
    };

    // Extract main categories - ONLY ACTIVE
    const mainCategories = useMemo(() => {
        return categoryData
            .filter(mainCat => Boolean(mainCat.status))
            .map(mainCat => ({
                id: mainCat.id,
                name: mainCat.name,
                code: mainCat.code
            }));
    }, [categoryData]);

    // Extract categories based on selected main category - ONLY ACTIVE
    const availableCategories = useMemo(() => {
        if (!watchedMainCategory) return [];
        const selectedMainCategory = categoryData.find(mainCat => mainCat.id.toString() === watchedMainCategory && Boolean(mainCat.status));
        return (selectedMainCategory?.categories || []).filter(cat => Boolean(cat.status));
    }, [watchedMainCategory, categoryData]);

    // Extract subcategories based on selected category - ONLY ACTIVE
    const availableSubCategories = useMemo(() => {
        if (!watchedCategory) return [];
        const selectedCategory = availableCategories.find(cat => cat.id.toString() === watchedCategory && Boolean(cat.status));
        return (selectedCategory?.subCategories || []).filter(subCat => Boolean(subCat.status));
    }, [watchedCategory, availableCategories]);

    // Reset child category selections when parent changes
    useEffect(() => {
        if (watchedMainCategory) {
            setValue('category', '');
            setValue('subCategoryId', '');
        }
    }, [watchedMainCategory, setValue]);

    useEffect(() => {
        if (watchedCategory) {
            setValue('subCategoryId', '');
        }
    }, [watchedCategory, setValue]);

    // Auto-generate slug
    useMemo(() => {
        if (!isSlugEdited && watchedProductName) {
            const autoSlug = watchedProductName
                ?.toLowerCase()
                ?.trim()
                ?.replace(/[^a-z0-9\s-]/g, '')
                ?.replace(/\s+/g, '-')
                ?.replace(/-+/g, '-') || '';
            setValue('slug', autoSlug);
        }
    }, [watchedProductName, isSlugEdited, setValue]);

    // Warranty data filter
    const warrantyFilter = useMemo(() => {
        return warrantyData.filter(warranty => warranty.status === true);
    }, [warrantyData]);

    const handleWarrantyChange = (checked) => {
        setWarrantyEnabled(checked);
        if (!checked) setValue('warrantyId', '');
    };

    const handleExpireChange = (checked) => {
        setExpireEnabled(checked);
        if (!checked) {
            setValue('manufacturer', '');
            setValue('manufacturerData', '');
            setValue('expireOn', '');
        }
    };

    return (
        <ProtectedRoute >
            <div className="text-gray-800">
                <div className="md:flex justify-between gap-10">
                    <div className="mb-6">
                        <h2 className="text-2xl font-semibold font-philosopher">Create Product</h2>
                        <p className="text-sm text-gray-500">Create new product (single or variant)</p>
                    </div>
                    <div className="md:flex items-center justify-between mb-4 gap-10 space-y-3 md:space-y-0">
                        <button
                            title="Refresh"
                            onClick={handleRefresh}
                            className="p-2 border rounded shadow bg-sky-50 text-sky-600 hover:bg-sky-200 cursor-pointer"
                            type="button"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <Link
                            href="/products"
                            className="flex items-center gap-2 px-3 py-2 rounded bg-secound text-white hover:bg-secound-hover"
                        >
                            <ArrowLeft size={18} /> Back to Products
                        </Link>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Product Information Section */}
                    <div className="bg-white p-6 rounded shadow border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <span className="text-yellow-500"><FaProductHunt /></span> Product Information
                            </h3>
                            <button type="button" className="text-gray-500 hover:text-gray-700">
                                <IoIosArrowDown />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                            {/* Store */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Store <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('store', { required: 'Store is required' })}
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.store ? 'border-red-500' : 'border-stone-300'}`}
                                >
                                    <option value="">Select Store</option>
                                    <option value="Main Store-1">Main Store-1</option>
                                    <option value="Main Store-2">Main Store-2</option>
                                    <option value="Main Store-3">Main Store-3</option>
                                </select>
                                {errors.store && <p className="mt-1 text-sm text-red-500">{errors.store.message}</p>}
                            </div>

                            {/* Warehouse */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Warehouse <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('warehouse', { required: 'Warehouse is required' })}
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.warehouse ? 'border-red-500' : 'border-stone-300'}`}
                                >
                                    <option value="">Select Warehouse</option>
                                    <option value="Central Warehouse">Central Warehouse</option>
                                    <option value="East Warehouse">East Warehouse</option>
                                    <option value="West Warehouse">West Warehouse</option>
                                    <option value="Main Warehouse">Main Warehouse</option>
                                </select>
                                {errors.warehouse && <p className="mt-1 text-sm text-red-500">{errors.warehouse.message}</p>}
                            </div>

                            {/* Product Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Product Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('productName', {
                                        required: 'Product name is required',
                                        minLength: { value: 2, message: 'Product name must be at least 2 characters' }
                                    })}
                                    placeholder="Enter your product name"
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.productName ? 'border-red-500' : 'border-stone-300'
                                        }`}
                                />
                            </div>

                            {/* Slug */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Slug <span className="text-red-500">*</span>
                                </label>
                                <input
                                    {...register('slug', {
                                        required: 'Slug is required',
                                        pattern: {
                                            value: /^[a-z0-9-]+$/,
                                            message: 'Slug can only contain lowercase letters, numbers, and hyphens'
                                        }
                                    })}
                                    placeholder="Auto-generated from product name"
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.slug ? 'border-red-500' : 'border-stone-300'}`}
                                    onChange={(e) => {
                                        setIsSlugEdited(true);
                                        register('slug').onChange(e);
                                    }}
                                />
                                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
                            </div>
                            {/* SKU - Editable but auto-generated */}
                            {productType === "single" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        SKU <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('sku', {
                                            required: 'SKU is required',
                                            minLength: { value: 3, message: 'SKU must be at least 3 characters' }
                                        })}
                                        placeholder="Auto-generated from product name"
                                        className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.sku ? 'border-red-500' : 'border-stone-300'}`}
                                        onChange={handleSkuChange}
                                    />
                                    {errors.sku && <p className="mt-1 text-sm text-red-500">{errors.sku.message}</p>}
                                </div>
                            )}

                            {/* Selling Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selling Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('sellingType', { required: 'Selling type is required' })}
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.sellingType ? 'border-red-500' : 'border-stone-300'}`}
                                >
                                    <option value="">Select</option>
                                    <option value="retail">Online</option>
                                </select>
                                {errors.sellingType && <p className="mt-1 text-sm text-red-500">{errors.sellingType.message}</p>}
                            </div>

                            {/* Visibility Status */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Visibility Status
                                </label>
                                <select
                                    {...register('visibility')}
                                    defaultValue="public"
                                    className="w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition border-stone-300 bg-white"
                                >
                                    <option value="public">Published (Visible)</option>
                                    <option value="unpublish">Unpublished (Hidden)</option>
                                </select>
                            </div>

                            {/* Main Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Main Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('mainCategory', { required: 'Main category is required' })}
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.mainCategory ? 'border-red-500' : 'border-stone-300'}`}
                                >
                                    <option value="">Select Main Category</option>
                                    {mainCategories.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.mainCategory && <p className="mt-1 text-sm text-red-500">{errors.mainCategory.message}</p>}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('category', { required: 'Category is required' })}
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.category ? 'border-red-500' : 'border-stone-300'}`}
                                    disabled={!watchedMainCategory}
                                >
                                    <option value="">Select Category</option>
                                    {availableCategories.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>}
                            </div>

                            {/* Subcategory */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subcategory <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('subCategoryId', { required: 'Subcategory is required' })}
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.subCategoryId ? 'border-red-500' : 'border-stone-300'}`}
                                    disabled={!watchedCategory}
                                >
                                    <option value="">Select Sub category</option>
                                    {availableSubCategories.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.subCategoryId && <p className="mt-1 text-sm text-red-500">{errors.subCategoryId.message}</p>}
                            </div>

                            {/* Brand */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                <select {...register('brandId')} className="w-full p-2 border border-stone-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition">
                                    <option value="">Select Brand</option>
                                    {brandData?.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Unit */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('unitId', { required: 'Unit is required' })}
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition ${errors.unitId ? 'border-red-500' : 'border-stone-300'}`}
                                >
                                    <option value="">Select unit</option>
                                    {unitData?.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                                {errors.unitId && <p className="mt-1 text-sm text-red-500">{errors.unitId.message}</p>}
                            </div>
                        </div>

                        {/* Collections (Multi-select) */}
                        <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                    <Sparkles size={16} className="text-amber-500" />
                                    Assign to Collections (Optional)
                                </label>
                                <span className="text-xs text-gray-500">Select one or multiple collections (e.g. Eid Collection, Summer Collection)</span>
                            </div>

                            {collectionsData.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No collections created yet. You can create collections dynamically in the Collections menu.</p>
                            ) : (
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {collectionsData.map((col) => {
                                        const isSelected = selectedCollections.includes(col.id);
                                        return (
                                            <button
                                                key={col.id}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedCollections(prev =>
                                                        prev.includes(col.id)
                                                            ? prev.filter(id => id !== col.id)
                                                            : [...prev, col.id]
                                                    );
                                                }}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                                                    isSelected
                                                        ? "bg-amber-100 text-amber-900 border-amber-400 shadow-sm"
                                                        : "bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50/50"
                                                }`}
                                            >
                                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                                    isSelected ? "bg-amber-500 border-amber-600 text-white" : "border-gray-300"
                                                }`}>
                                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                                </span>
                                                {col.name}
                                                {!col.status && (
                                                    <span className="text-[10px] text-gray-400 italic">(draft)</span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <TinyEditor
                                value={watch('description')}
                                onChange={(content) => setValue('description', content, { shouldValidate: true })}
                            />
                            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description.message}</p>}
                        </div>
                    </div>

                    {/* Pricing and Stocks */}
                    <div className="bg-white p-6 rounded shadow border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <span className="text-yellow-500"><FaProductHunt /></span>
                                Pricing & Stocks
                            </h3>
                            <button type="button" className="text-gray-500 hover:text-gray-700">
                                <IoIosArrowDown />
                            </button>
                        </div>

                        {/* Product Type Selection */}
                        <div className="flex items-center gap-6 mt-6 text-lg font-exo font-medium">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="single"
                                    checked={productType === "single"}
                                    onChange={() => {
                                        setProductType("single");
                                        setVariants([]);
                                    }}
                                />
                                Single Product
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    value="variant"
                                    checked={productType === "variant"}
                                    onChange={() => setProductType("variant")}
                                />
                                Variant Product
                            </label>
                        </div>

                        <div className="mt-6">
                            {productType === "single" ? (
                                <SingleProductFields
                                    register={register}
                                    errors={errors}
                                    watch={watch}
                                />
                            ) : (
                                <VariantProductFields
                                    register={register}
                                    errors={errors}
                                    variantData={variantData}
                                    selectedVariant={selectedVariant}
                                    setSelectedVariant={setSelectedVariant}
                                    selectedValue={selectedValue}
                                    setSelectedValue={setSelectedValue}
                                    variants={variants}
                                    setVariants={setVariants}
                                />
                            )}
                        </div>
                    </div>

                    {/* Images Section - Only for single products */}
                    {productType === "single" && (
                        <div className="bg-white p-6 rounded shadow border border-gray-200">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <span className="text-yellow-500"><Images /></span> Images
                                </h3>
                                <button type="button" className="text-gray-500 hover:text-gray-700">
                                    <IoIosArrowDown />
                                </button>
                            </div>

                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Product Images <span className="text-red-500">*</span>
                                </label>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                                    {[0, 1, 2, 3, 4].map((index) => (
                                        <div key={index} className="border border-stone-300 rounded-lg p-3 text-center">
                                            <div className="flex flex-col items-center justify-center h-32">
                                                {images[index] ? (
                                                    <div className="relative w-full h-full">
                                                        <img
                                                            src={images[index]}
                                                            alt={`Product ${index + 1}`}
                                                            className="w-full h-full object-cover rounded"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImageRemove(index)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Image size={32} className="text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-600 mb-1">
                                                            {index === 0 ? 'Main Image' : `Image ${index + 1}`}
                                                        </p>
                                                        <CloudinaryImageInput
                                                            label="Upload"
                                                            onUpload={(url) => handleImageUpload(url, index)}
                                                            required={index === 0}
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                    <p className="text-sm font-semibold text-purple-800 mb-2">
                                        Image Upload Guidelines
                                    </p>

                                    <ul className="text-xs text-purple-700 space-y-1">
                                        <li>• Main image is required and will be used as the product thumbnail.</li>
                                        <li>• <strong>Recommended:</strong> Use <strong>WebP</strong> images for better performance and faster page loading.</li>
                                        <li>• Supported formats: JPG, PNG, WebP ( Recommended : file size: 2MB per image).</li>
                                        <li>• You can upload up to 5 images in total.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Delivery Charge Section - NEW */}
                    <div className="bg-white p-6 rounded shadow border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <span className="text-yellow-500"><FaProductHunt /></span> Delivery Charge
                            </h3>
                            <button type="button" className="text-gray-500 hover:text-gray-700">
                                <IoIosArrowDown />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            {/* Inside Dhaka Delivery Charge */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Inside Dhaka Delivery Charge
                                </label>
                                <input
                                    {...register('insideDhakaDeliveryCharge')}
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter delivery charge for inside Dhaka"
                                    className="w-full p-2 border border-stone-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                />
                                <p className="text-xs text-gray-500 mt-1">Delivery charge for orders inside Dhaka city</p>
                            </div>

                            {/* Outside Dhaka Delivery Charge */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Outside Dhaka Delivery Charge
                                </label>
                                <input
                                    {...register('outsideDhakaDeliveryCharge')}
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter delivery charge for outside Dhaka"
                                    className="w-full p-2 border border-stone-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                />
                                <p className="text-xs text-gray-500 mt-1">Delivery charge for orders outside Dhaka city</p>
                            </div>
                        </div>
                    </div>

                    {/* Custom Fields */}
                    <div className="bg-white p-6 rounded shadow border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <span className="text-yellow-500"><FileDiff /></span> Custom Field
                            </h3>
                            <button type="button" className="text-gray-500 hover:text-gray-700">
                                <IoIosArrowDown />
                            </button>
                        </div>

                        <div className="bg-stone-100 py-3 px-5 rounded flex gap-4 mt-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={warrantyEnabled}
                                    onChange={(e) => handleWarrantyChange(e.target.checked)}
                                    className="cursor-pointer"
                                />
                                <span className="text-sm font-medium">Warranty</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={expireEnabled}
                                    onChange={(e) => handleExpireChange(e.target.checked)}
                                    className="cursor-pointer"
                                />
                                <span className="text-sm font-medium">Expire</span>
                            </label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                            {/* Warranty */}
                            <div>
                                <label className="block text-sm font-medium">
                                    Warranty {warrantyEnabled && <span className="text-rose-500">*</span>}
                                </label>
                                <select
                                    {...register('warrantyId', { required: warrantyEnabled ? 'Warranty is required' : false })}
                                    disabled={!warrantyEnabled}
                                    className={`pl-3 pr-3 py-2 bg-white border ${errors.warrantyId ? "border-red-500" : "border-stone-300"} rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2 ${!warrantyEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                >
                                    <option value="">Select Warranty</option>
                                    {warrantyFilter.map((item) => (
                                        <option key={item.id} value={item.id}>{item.name}</option>
                                    ))}
                                </select>
                                {errors.warrantyId && <p className="text-red-500 text-xs mt-1">{errors.warrantyId.message}</p>}
                            </div>

                            {/* Manufacturer */}
                            <div>
                                <label className="block text-sm font-medium">
                                    Manufacturer {expireEnabled && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    {...register('manufacturer', { required: expireEnabled ? 'Manufacturer is required' : false })}
                                    type="text"
                                    placeholder="Enter Manufacturer"
                                    disabled={!expireEnabled}
                                    className={`pl-3 pr-3 py-2 bg-white border ${errors.manufacturer ? "border-red-500" : "border-stone-300"} rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2 ${!expireEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                {errors.manufacturer && <p className="text-red-500 text-xs mt-1">{errors.manufacturer.message}</p>}
                            </div>

                            {/* Manufacturer Date */}
                            <div>
                                <label className="block text-sm font-medium">
                                    Manufacturer Date {expireEnabled && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    {...register('manufacturerData', { required: expireEnabled ? 'Manufacturer date is required' : false })}
                                    type="date"
                                    disabled={!expireEnabled}
                                    className={`pl-3 pr-3 py-2 bg-white border ${errors.manufacturerData ? "border-red-500" : "border-stone-300"} rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2 ${!expireEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                {errors.manufacturerData && <p className="text-red-500 text-xs mt-1">{errors.manufacturerData.message}</p>}
                            </div>

                            {/* Expire On */}
                            <div>
                                <label className="block text-sm font-medium">
                                    Expire On {expireEnabled && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    {...register('expireOn', { required: expireEnabled ? 'Expire date is required' : false })}
                                    type="datetime-local"
                                    disabled={!expireEnabled}
                                    className={`pl-3 pr-3 py-2 bg-white border ${errors.expireOn ? "border-red-500" : "border-stone-300"} rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2 ${!expireEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                {errors.expireOn && <p className="text-red-500 text-xs mt-1">{errors.expireOn.message}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        {hasPermission('product.create') && (
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-6 py-2 rounded bg-secound text-white hover:bg-secound-hover transition ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                            >
                                {isSubmitting ? 'Creating Product...' : 'Create Product'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </ProtectedRoute>
    );
};

export default CreateProduct;