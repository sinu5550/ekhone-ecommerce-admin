'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Images, FileDiff, Loader2 } from 'lucide-react';
import { FaProductHunt } from 'react-icons/fa';
import { IoIosArrowDown } from 'react-icons/io';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/apiClient';
import {
    useBrands,
    useCollections,
    useMainCategories,
    useUnits,
    useVariantAttributes,
    useWarranties
} from '@/lib/dataFetch';
import CloudinaryImageInput from '@/components/ui/CloudinaryImageInput';
import SingleProductFields from '@/components/product/ProductVariant/SingleProductFields';
import TinyEditor from '@/components/TinyEditor/Editor';
import VariantProductFields from "@/components/product/ProductVariant/VariantProductFields";
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check } from 'lucide-react';


const ProductEditDrawer = ({ isOpen, onClose, product, onSuccess }) => {

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [productType, setProductType] = useState('single');
    const [isSlugEdited, setIsSlugEdited] = useState(false);
    const [images, setImages] = useState([]);
    const [selectedCollections, setSelectedCollections] = useState([]);
    const [warrantyEnabled, setWarrantyEnabled] = useState(false);
    const [expireEnabled, setExpireEnabled] = useState(false);
    const [variants, setVariants] = useState([]);

    const { data: variantData = [], isLoading: isLoadingVariants } = useVariantAttributes();
    const { data: warrantyData = [], isLoading: isLoadingWarranties } = useWarranties();
    const { data: categoryData = [], isLoading: isLoadingCategories } = useMainCategories();
    const { data: brandData = [], isLoading: isLoadingBrands } = useBrands();
    const { data: unitData = [], isLoading: isLoadingUnits } = useUnits();
    const { data: collectionsData = [], isLoading: isLoadingCollections } = useCollections();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        clearErrors,
        setError,
        watch,
        setValue,
    } = useForm({
        mode: 'onChange'
    });

    const watchedMainCategory = watch('mainCategory');
    const watchedCategory = watch('category');
    const watchedProductName = watch('productName');

    useEffect(() => {
        if (product && isOpen) {
            const mainCategoryId = product.subCategory?.category?.mainCategory?.id?.toString() || '';
            const categoryId = product.subCategory?.category?.id?.toString() || '';

            reset({
                store: product.store || '',
                warehouse: product.warehouse || '',
                sku: product.sku || '',
                productName: product.productName || '',
                slug: product.slug || '',
                sellingType: product.sellingType || 'retail',
                mainCategory: mainCategoryId,
                category: categoryId,
                subCategoryId: product.subCategoryId?.toString() || '',
                brandId: product.brandId?.toString() || '',
                unitId: product.unitId?.toString() || '',
                description: product.description || '',
                price: product.price ?? '',
                costPrice: product.costPrice ?? '',
                quantity: product.quantity ?? '',
                quantityAlert: product.quantityAlert ?? '',
                taxType: product.taxType || 'exclusive',
                tax: product.tax ?? '',
                discountType: (product.discountType && Number(product.discountValue) > 0) ? product.discountType : '',
                discountValue: (product.discountType && Number(product.discountValue) > 0) ? product.discountValue : '',
                manufacturer: product.manufacturer || '',
                warrantyId: product.warrantyId?.toString() || '',
                insideDhakaDeliveryCharge: product.insideDhakaDeliveryCharge ?? '',
                outsideDhakaDeliveryCharge: product.outsideDhakaDeliveryCharge ?? '',
                visibility: product.visibility || 'public',
            });

            if (Array.isArray(product.images)) {
                setImages(product.images.slice(0, 5));
            } else {
                setImages([]);
            }

            setWarrantyEnabled(!!product.warrantyId);
            setExpireEnabled(!!(product.manufacturer || product.manufacturerData || product.expireOn));

            if (product.manufacturerData) {
                const manufacturerDate = new Date(product.manufacturerData).toISOString().split('T')[0];
                setValue('manufacturerData', manufacturerDate);
            } else {
                setValue('manufacturerData', '');
            }

            if (product.expireOn) {
                const expireDate = new Date(product.expireOn).toISOString().slice(0, 16);
                setValue('expireOn', expireDate);
            } else {
                setValue('expireOn', '');
            }

            const isVariantProduct = product.productType === "variant" ||
                (product.productVariants && product.productVariants.length > 0);

            setProductType(isVariantProduct ? 'variable' : 'single');

            if (isVariantProduct && product.productVariants?.length > 0) {
                const loadedVariants = product.productVariants.map(v => ({
                    id: v.id,
                    attributes: v.attributes,
                    sku: v.sku,
                    price: v.price.toString(),
                    costPrice: v.costPrice != null ? v.costPrice.toString() : '',
                    quantity: v.quantity.toString(),
                    image: v.image,
                    isDefault: v.isDefault
                }));
                setVariants(loadedVariants);
            } else {
                setVariants([]);
            }

            const initialCollectionIds = Array.isArray(product.collections)
                ? product.collections.map(c => c.collectionId || c.collection?.id).filter(Boolean)
                : [];
            setSelectedCollections(initialCollectionIds);

            setIsSlugEdited(false);
        }

        if (!isOpen) {
            reset();
            setImages([]);
            setVariants([]);
            setSelectedCollections([]);
            setWarrantyEnabled(false);
            setExpireEnabled(false);
            setProductType('single');
            setIsSlugEdited(false);
        }
    }, [product, isOpen, reset, setValue]);

    // Escape key listener & prevent body scroll
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose?.();
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

    useEffect(() => {
        if (!isSlugEdited && watchedProductName) {
            const autoSlug = watchedProductName
                .toString()
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            setValue('slug', autoSlug, { shouldValidate: true });
        }
    }, [watchedProductName, isSlugEdited, setValue]);

    const mainCategories = useMemo(() => {
        return categoryData
            .filter((mainCat) => Boolean(mainCat.status) || mainCat.id.toString() === product?.subCategory?.category?.mainCategory?.id?.toString())
            .map((mainCat) => ({
                id: mainCat.id,
                name: mainCat.name + (!mainCat.status ? " (Inactive)" : ""),
                code: mainCat.code,
                status: mainCat.status
            }));
    }, [categoryData, product]);

    const availableCategories = useMemo(() => {
        if (!watchedMainCategory) return [];
        const selectedMainCategory = categoryData.find(
            (mainCat) => mainCat.id.toString() === watchedMainCategory && (Boolean(mainCat.status) || mainCat.id.toString() === product?.subCategory?.category?.mainCategory?.id?.toString())
        );
        return (selectedMainCategory?.categories || [])
            .filter((cat) => Boolean(cat.status) || cat.id.toString() === product?.subCategory?.category?.id?.toString())
            .map((cat) => ({
                ...cat,
                name: cat.name + (!cat.status ? " (Inactive)" : "")
            }));
    }, [watchedMainCategory, categoryData, product]);

    const availableSubCategories = useMemo(() => {
        if (!watchedCategory) return [];
        const selectedCategory = availableCategories.find((cat) => cat.id.toString() === watchedCategory);
        return (selectedCategory?.subCategories || [])
            .filter((subCat) => Boolean(subCat.status) || subCat.id.toString() === product?.subCategoryId?.toString())
            .map((subCat) => ({
                ...subCat,
                name: subCat.name + (!subCat.status ? " (Inactive)" : "")
            }));
    }, [watchedCategory, availableCategories, product]);

    const warrantyFilter = useMemo(() => {
        return warrantyData.filter((w) => w.status === true);
    }, [warrantyData]);

    const handleProductTypeChange = (type) => {
        if (type !== productType) {
            if (type === 'single') {
                setVariants([]);
            } else {
                if (variants.length === 0) {
                    setVariants([]);
                }
            }
            setProductType(type);
        }
    };

    const handleImageUpload = useCallback((url, index) => {
        setImages((prev) => {
            const newImages = [...prev];
            if (index < 0) return prev;
            if (index < newImages.length) {
                newImages[index] = url;
            } else {
                for (let i = newImages.length; i <= index; i++) {
                    newImages[i] = newImages[i] || '';
                }
                newImages[index] = url;
            }
            return newImages.slice(0, 5);
        });
        clearErrors('images');
    }, [clearErrors]);

    const handleImageRemove = useCallback((index) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleWarrantyChange = (checked) => {
        setWarrantyEnabled(checked);
        if (!checked) {
            setValue('warrantyId', '');
        }
    };

    const handleExpireChange = (checked) => {
        setExpireEnabled(checked);
        if (!checked) {
            setValue('manufacturer', '');
            setValue('manufacturerData', '');
            setValue('expireOn', '');
        }
    };

    const validateImagesBeforeSubmit = () => {
        if (productType === 'single') {
            if (images.length === 0 || !images[0]) {
                setError('images', { type: 'required', message: 'Please upload at least one main image.' });
                toast.error('Please upload at least one main image before submitting.');
                return false;
            }
        }
        return true;
    };

    const validateVariantsBeforeSubmit = () => {
        if (productType !== 'variable') return true;

        if (variants.length === 0) {
            toast.error('Please add at least one variant');
            return false;
        }

        for (let i = 0; i < variants.length; i++) {
            const variant = variants[i];

            if (!variant.sku || !variant.price || !variant.quantity || !variant.image) {
                toast.error(`Variant ${i + 1}: All fields are required (SKU, Price, Quantity, Image)`);
                return false;
            }

            if (!variant.attributes || Object.keys(variant.attributes).length === 0) {
                toast.error(`Variant ${i + 1}: Please select variant attributes`);
                return false;
            }
        }

        const skus = variants.map(v => v.sku.toLowerCase());
        const uniqueSkus = new Set(skus);
        if (skus.length !== uniqueSkus.size) {
            toast.error('Duplicate SKUs found. Each variant must have a unique SKU');
            return false;
        }

        const combinations = variants.map(v => JSON.stringify(v.attributes));
        const uniqueCombinations = new Set(combinations);
        if (combinations.length !== uniqueCombinations.size) {
            toast.error('Duplicate variant combinations found. Each variant must be unique');
            return false;
        }

        return true;
    };

    const onSubmit = async (data) => {
        if (!validateImagesBeforeSubmit()) return;

        if (productType === 'variable' && !validateVariantsBeforeSubmit()) {
            return;
        }

        try {
            setIsSubmitting(true);

            let payload;

            const hasValidDiscount = data.discountType && data.discountValue !== undefined && data.discountValue !== '' && !isNaN(parseInt(data.discountValue)) && parseInt(data.discountValue) > 0;
            const discountTypePayload = hasValidDiscount ? data.discountType : null;
            const discountValuePayload = hasValidDiscount ? parseInt(data.discountValue) : 0;

            if (productType === 'variable') {
                payload = {
                    store: data.store,
                    warehouse: data.warehouse,
                    productName: data.productName,
                    slug: data.slug,
                    sellingType: data.sellingType,
                    visibility: data.visibility || 'public',
                    subCategoryId: data.subCategoryId ? parseInt(data.subCategoryId) : undefined,
                    brandId: data.brandId ? parseInt(data.brandId) : undefined,
                    unitId: data.unitId ? parseInt(data.unitId) : undefined,
                    description: data.description,
                    taxType: data.taxType,
                    tax: data.tax ? parseFloat(data.tax) : undefined,
                    discountType: discountTypePayload,
                    discountValue: discountValuePayload,
                    warrantyId: warrantyEnabled && data.warrantyId ? parseInt(data.warrantyId) : undefined,
                    manufacturer: expireEnabled ? data.manufacturer : undefined,
                    manufacturerData: expireEnabled && data.manufacturerData
                        ? new Date(data.manufacturerData).toISOString()
                        : undefined,
                    expireOn: expireEnabled && data.expireOn
                        ? new Date(data.expireOn).toISOString()
                        : undefined,
                    productType: 'variant',
                    images: [],
                    quantity: 0,
                    price: variants.length > 0 ? parseFloat(variants[0].price) : 0,
                    insideDhakaDeliveryCharge: data.insideDhakaDeliveryCharge ? parseFloat(data.insideDhakaDeliveryCharge) : undefined,
                    outsideDhakaDeliveryCharge: data.outsideDhakaDeliveryCharge ? parseFloat(data.outsideDhakaDeliveryCharge) : undefined,
                    collectionIds: selectedCollections,
                    variants: variants.map(v => ({
                        id: v.id,
                        sku: v.sku,
                        price: parseFloat(v.price),
                        costPrice: v.costPrice !== undefined && v.costPrice !== '' ? parseFloat(v.costPrice) : undefined,
                        quantity: parseInt(v.quantity),
                        attributes: v.attributes,
                        image: v.image,
                        isDefault: v.isDefault || false
                    }))
                };
            } else {
                payload = {
                    ...data,
                    subCategoryId: data.subCategoryId ? parseInt(data.subCategoryId) : undefined,
                    brandId: data.brandId ? parseInt(data.brandId) : undefined,
                    unitId: data.unitId ? parseInt(data.unitId) : undefined,
                    warrantyId: warrantyEnabled && data.warrantyId ? parseInt(data.warrantyId) : undefined,
                    price: data.price ? parseFloat(data.price) : undefined,
                    costPrice: data.costPrice !== undefined && data.costPrice !== '' ? parseFloat(data.costPrice) : undefined,
                    quantity: data.quantity ? parseInt(data.quantity) : undefined,
                    tax: data.tax ? parseFloat(data.tax) : undefined,
                    discountType: discountTypePayload,
                    discountValue: discountValuePayload,
                    quantityAlert: data.quantityAlert ? parseInt(data.quantityAlert) : undefined,
                    manufacturerData: expireEnabled && data.manufacturerData
                        ? new Date(data.manufacturerData).toISOString()
                        : undefined,
                    expireOn: expireEnabled && data.expireOn
                        ? new Date(data.expireOn).toISOString()
                        : undefined,
                    images: images.filter(Boolean),
                    productType: 'single',
                    insideDhakaDeliveryCharge: data.insideDhakaDeliveryCharge ? parseFloat(data.insideDhakaDeliveryCharge) : undefined,
                    outsideDhakaDeliveryCharge: data.outsideDhakaDeliveryCharge ? parseFloat(data.outsideDhakaDeliveryCharge) : undefined,
                    collectionIds: selectedCollections,
                    mainCategory: undefined,
                    category: undefined
                };
            }

            Object.keys(payload).forEach((key) => {
                if (
                    payload[key] === undefined ||
                    payload[key] === '' ||
                    (Array.isArray(payload[key]) && payload[key].length === 0)
                ) {
                    delete payload[key];
                }
            });

            const response = await apiClient(`/api/product/${product.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response && typeof response.json === 'function') {
                const json = await response.json().catch(() => null);
                if (response.ok) {
                    toast.success('Product updated successfully!');
                    onSuccess?.();
                    onClose?.();
                } else {
                    const msg = (json && json.message) || 'Failed to update product. Please try again.';
                    toast.error(msg);
                }
            } else {
                toast.success('Product updated successfully!');
                onSuccess?.();
                onClose?.();
            }
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to update product. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && product && (
                <div className="fixed inset-0 z-[70] overflow-hidden">
                    {/* Backdrop Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={() => onClose?.()}
                    />

                    {/* Sliding Drawer Panel (Half Screen on Desktop) */}
                    <motion.div
                        className="fixed inset-y-0 right-0 w-full md:w-[65vw] lg:w-[55vw] xl:w-[50vw] bg-white shadow-2xl flex flex-col h-full border-l border-gray-200 z-[70] overflow-hidden"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                    >
                        {/* Header (Sticky at top) */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 text-primary rounded">
                                    <FaProductHunt className="text-xl" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-bold text-gray-900 font-philosopher">Edit Product</h2>
                                        {productType === 'variable' && (
                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                                                Variant Product
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 line-clamp-1 max-w-md">
                                        {product?.productName || 'Update product information'}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => onClose?.()}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors duration-200 cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form - Scrollable */}
                        <form id="product-edit-form" onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Product Information */}
                    <div className="bg-white p-6 rounded shadow border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <span className="text-yellow-500"><FaProductHunt /></span>
                                Product Information
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
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.store ? 'border-red-500' : 'border-gray-300'}`}
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
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.warehouse ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select Warehouse</option>
                                    <option value="Central Warehouse">Central Warehouse</option>
                                    <option value="East Warehouse">East Warehouse</option>
                                    <option value="West Warehouse">West Warehouse</option>
                                </select>
                                {errors.warehouse && <p className="mt-1 text-sm text-red-500">{errors.warehouse.message}</p>}
                            </div>

                            {/* SKU - Only for single products */}
                            {productType === 'single' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        SKU <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        {...register('sku', {
                                            required: 'SKU is required',
                                            minLength: { value: 3, message: 'SKU must be at least 3 characters' }
                                        })}
                                        readOnly
                                        placeholder="Enter product SKU"
                                        className={`w-full p-2 border rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed ${errors.sku ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    {errors.sku && <p className="mt-1 text-sm text-red-500">{errors.sku.message}</p>}
                                </div>
                            )}

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
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.productName ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.productName && <p className="mt-1 text-sm text-red-500">{errors.productName.message}</p>}
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
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
                                    onChange={(e) => {
                                        setIsSlugEdited(true);
                                        setValue('slug', e.target.value, { shouldValidate: true });
                                    }}
                                />
                                {errors.slug && <p className="mt-1 text-sm text-red-500">{errors.slug.message}</p>}
                            </div>

                            {/* Selling Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Selling Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register('sellingType', { required: 'Selling type is required' })}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.sellingType ? 'border-red-500' : 'border-gray-300'}`}
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
                                    className="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary border-gray-300 bg-white"
                                >
                                    <option value="public">Published</option>
                                    <option value="unpublish">Unpublished</option>
                                </select>
                            </div>

                            {/* Main Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Main Category <span className="text-red-500">*</span>
                                </label>
                                {isLoadingCategories ? (
                                    <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-sm text-gray-500">Loading...</span>
                                    </div>
                                ) : (
                                    <select
                                        {...register('mainCategory', { required: 'Main category is required' })}
                                        className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.mainCategory ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select Main Category</option>
                                        {mainCategories.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.mainCategory && <p className="mt-1 text-sm text-red-500">{errors.mainCategory.message}</p>}
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Category <span className="text-red-500">*</span>
                                </label>
                                {isLoadingCategories ? (
                                    <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-sm text-gray-500">Loading...</span>
                                    </div>
                                ) : (
                                    <select
                                        {...register('category', { required: 'Category is required' })}
                                        className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.category ? 'border-red-500' : 'border-gray-300'} ${!watchedMainCategory ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        disabled={!watchedMainCategory}
                                    >
                                        <option value="">Select Category</option>
                                        {availableCategories.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category.message}</p>}
                                {!watchedMainCategory && <p className="text-xs text-gray-500 mt-1">Please select a main category first</p>}
                            </div>

                            {/* Subcategory */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subcategory <span className="text-red-500">*</span>
                                </label>
                                {isLoadingCategories ? (
                                    <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-sm text-gray-500">Loading...</span>
                                    </div>
                                ) : (
                                    <select
                                        {...register('subCategoryId', { required: 'Subcategory is required' })}
                                        className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.subCategoryId ? 'border-red-500' : 'border-gray-300'} ${!watchedCategory ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        disabled={!watchedCategory}
                                    >
                                        <option value="">Select Sub category</option>
                                        {availableSubCategories.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.subCategoryId && <p className="mt-1 text-sm text-red-500">{errors.subCategoryId.message}</p>}
                                {!watchedCategory && <p className="text-xs text-gray-500 mt-1">Please select a category first</p>}
                            </div>

                            {/* Brand */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                                {isLoadingBrands ? (
                                    <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-sm text-gray-500">Loading...</span>
                                    </div>
                                ) : (
                                    <select
                                        {...register('brandId')}
                                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                    >
                                        <option value="">Select Brand</option>
                                        {brandData?.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Unit */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Unit <span className="text-red-500">*</span>
                                </label>
                                {isLoadingUnits ? (
                                    <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-sm text-gray-500">Loading...</span>
                                    </div>
                                ) : (
                                    <select
                                        {...register('unitId', { required: 'Unit is required' })}
                                        className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.unitId ? 'border-red-500' : 'border-gray-300'}`}
                                    >
                                        <option value="">Select unit</option>
                                        {unitData?.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.unitId && <p className="mt-1 text-sm text-red-500">{errors.unitId.message}</p>}
                            </div>
                        </div>

                        {/* Collections (Multi-select) */}
                        <div className="mt-6 p-4 bg-slate-50 rounded border border-slate-200">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2.5">
                                <label className="block text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                    <Sparkles size={16} className="text-amber-500" />
                                    Collections (Optional)
                                </label>
                                <span className="text-xs text-gray-500">Select one or multiple collections (e.g. Eid Collection, Summer Collection)</span>
                            </div>

                            {isLoadingCollections ? (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading collections...
                                </div>
                            ) : collectionsData.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No collections found. You can create collections in the Collections menu.</p>
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

                        <div className="flex items-center gap-6 mt-6 text-lg font-exo font-medium">
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    value="single"
                                    checked={productType === 'single'}
                                    onChange={() => handleProductTypeChange('single')}
                                    disabled={product?.productType === 'variant'}
                                />
                                Single Product
                            </label>
                            <label className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    value="variable"
                                    checked={productType === 'variable'}
                                    onChange={() => handleProductTypeChange('variable')}
                                    disabled={product?.productType === 'single'}
                                />
                                Variant Product
                            </label>
                        </div>

                        {product?.productType && (
                            <p className="mt-2 text-sm text-amber-600">
                                ⚠️ Product type cannot be changed after creation. Current type: <strong>{product.productType}</strong>
                            </p>
                        )}

                        <div className="mt-6">
                            {productType === 'single' ? (
                                <SingleProductFields register={register} errors={errors} watch={watch} />
                            ) : (
                                <VariantProductFields
                                    variants={variants}
                                    setVariants={setVariants}
                                    variantData={variantData}
                                    isLoadingVariants={isLoadingVariants}
                                    register={register}
                                    errors={errors}
                                    watch={watch}
                                />
                            )}
                        </div>
                    </div>

                    {/* Images - Only for single products */}
                    {productType === 'single' && (
                        <div className="bg-white p-6 rounded shadow border border-gray-200">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <span className="text-yellow-500"><Images /></span>
                                    Images
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
                                        <div key={index} className="border border-gray-300 rounded p-3 text-center">
                                            <div className="flex flex-col items-center justify-center h-32">
                                                {images[index] ? (
                                                    <div className="relative w-full h-full">
                                                        <img src={images[index]} alt={`Product ${index + 1}`} className="w-full h-full object-cover rounded" />
                                                        <button
                                                            type="button"
                                                            onClick={() => handleImageRemove(index)}
                                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Images size={32} className="text-gray-400 mb-2" />
                                                        <p className="text-sm text-gray-600 mb-1">{index === 0 ? 'Main Image' : `Image ${index + 1}`}</p>
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

                                {errors.images && <p className="mt-2 text-sm text-red-500">{errors.images.message}</p>}

                                <div className="mt-4 p-3 bg-purple-50 rounded border border-purple-200">
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

                    {/* Delivery Charge */}
                    <div className="bg-white p-6 rounded shadow border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <span className="text-yellow-500"><FaProductHunt /></span>
                                Delivery Charge
                            </h3>
                            <button type="button" className="text-gray-500 hover:text-gray-700">
                                <IoIosArrowDown />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Inside Dhaka Delivery Charge
                                </label>
                                <input
                                    {...register('insideDhakaDeliveryCharge')}
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter delivery charge for inside Dhaka"
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                                <p className="text-xs text-gray-500 mt-1">Delivery charge for orders inside Dhaka city</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Outside Dhaka Delivery Charge
                                </label>
                                <input
                                    {...register('outsideDhakaDeliveryCharge')}
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter delivery charge for outside Dhaka"
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                />
                                <p className="text-xs text-gray-500 mt-1">Delivery charge for orders outside Dhaka city</p>
                            </div>
                        </div>
                    </div>

                    {/* Custom Field */}
                    <div className="bg-white p-6 rounded shadow border border-gray-200">
                        <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium flex items-center gap-2">
                                <span className="text-yellow-500"><FileDiff /></span>
                                Custom Field
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
                                {isLoadingWarranties ? (
                                    <div className="w-full p-2 border border-gray-300 rounded bg-gray-50 flex items-center justify-center gap-2 mt-2">
                                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        <span className="text-sm text-gray-500">Loading...</span>
                                    </div>
                                ) : (
                                    <select
                                        {...register('warrantyId', {
                                            required: warrantyEnabled ? 'Warranty is required' : false
                                        })}
                                        disabled={!warrantyEnabled}
                                        className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary mt-2 ${errors.warrantyId ? 'border-red-500' : 'border-gray-300'} ${!warrantyEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="">Select Warranty</option>
                                        {warrantyFilter.map((item) => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>
                                )}
                                {errors.warrantyId && <p className="text-red-500 text-xs mt-1">{errors.warrantyId.message}</p>}
                            </div>

                            {/* Manufacturer */}
                            <div>
                                <label className="block text-sm font-medium">
                                    Manufacturer {expireEnabled && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    {...register('manufacturer', {
                                        required: expireEnabled ? 'Manufacturer is required' : false
                                    })}
                                    type="text"
                                    placeholder="Enter Manufacturer"
                                    disabled={!expireEnabled}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary mt-2 ${errors.manufacturer ? 'border-red-500' : 'border-gray-300'} ${!expireEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                {errors.manufacturer && <p className="text-red-500 text-xs mt-1">{errors.manufacturer.message}</p>}
                            </div>

                            {/* Manufacturer Date */}
                            <div>
                                <label className="block text-sm font-medium">
                                    Manufacturer Date {expireEnabled && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    {...register('manufacturerData', {
                                        required: expireEnabled ? 'Manufacturer date is required' : false
                                    })}
                                    type="date"
                                    disabled={!expireEnabled}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary mt-2 ${errors.manufacturerData ? 'border-red-500' : 'border-gray-300'} ${!expireEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                {errors.manufacturerData && <p className="text-red-500 text-xs mt-1">{errors.manufacturerData.message}</p>}
                            </div>

                            {/* Expire On */}
                            <div>
                                <label className="block text-sm font-medium">
                                    Expire On {expireEnabled && <span className="text-rose-500">*</span>}
                                </label>
                                <input
                                    {...register('expireOn', {
                                        required: expireEnabled ? 'Expire date is required' : false
                                    })}
                                    type="datetime-local"
                                    disabled={!expireEnabled}
                                    className={`w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary mt-2 ${errors.expireOn ? 'border-red-500' : 'border-gray-300'} ${!expireEnabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                />
                                {errors.expireOn && <p className="text-red-500 text-xs mt-1">{errors.expireOn.message}</p>}
                            </div>
                        </div>
                    </div>

                        </form>

                        {/* Sticky Drawer Footer */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3 shrink-0 z-20">
                            <button
                                type="button"
                                onClick={() => onClose?.()}
                                className="px-5 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 font-medium text-sm transition cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="product-edit-form"
                                disabled={isSubmitting}
                                className={`px-6 py-2 rounded bg-secound text-white hover:bg-secound-hover font-medium text-sm transition flex items-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Updating...</span>
                                    </>
                                ) : (
                                    'Update Product'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ProductEditDrawer;