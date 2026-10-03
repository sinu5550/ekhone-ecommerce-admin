"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { useCategories, useProducts } from "@/lib/dataFetch";
import { Search, X, AlertCircle } from "lucide-react";

const CouponAddModal = ({ isOpen, onClose, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [categorySearch, setCategorySearch] = useState("");

    // Use your custom data fetching hooks
    const { data, isLoading: productsLoading } = useProducts();
    const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories();
    const productsData = data?.products || [];

    const { register, handleSubmit, reset, watch, setValue, formState: { errors, isValid, isDirty }, trigger } = useForm({
        mode: "onChange",
        defaultValues: {
            name: "",
            code: "",
            description: "",
            discountType: "Percentage",
            discountValue: "",
            maxDiscountAmount: "",
            minOrderAmount: "",
            usageLimit: "",
            perUserLimit: "",
            appliesToAll: true,
            products: [],
            categories: [],
            active: true,
            combinable: false,
            startAt: "",
            endAt: "",
        }
    });

    const descriptionValue = watch("description");
    const appliesToAll = watch("appliesToAll");
    const discountType = watch("discountType");
    const discountValue = watch("discountValue");
    const selectedProducts = watch("products") || [];
    const selectedCategories = watch("categories") || [];
    const startAt = watch("startAt");
    const endAt = watch("endAt");

    // Filter products based on search
    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return productsData;

        const searchTerm = productSearch.toLowerCase().trim();
        return productsData.filter(product =>
            product.productName?.toLowerCase().includes(searchTerm) ||
            product.sku?.toLowerCase().includes(searchTerm) ||
            product.description?.toLowerCase().includes(searchTerm)
        );
    }, [productsData, productSearch]);

    // Filter categories based on search
    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return categoriesData;

        const searchTerm = categorySearch.toLowerCase().trim();
        return categoriesData.filter(category =>
            category.name?.toLowerCase().includes(searchTerm) ||
            category.description?.toLowerCase().includes(searchTerm)
        );
    }, [categoriesData, categorySearch]);

    // Calculate preview discount
    const previewDiscount = useMemo(() => {
        if (!discountValue) return null;

        const value = parseFloat(discountValue);
        if (isNaN(value) || value <= 0) return null;

        if (discountType === "Percentage") {
            return `${value}% off`;
        } else {
            return `৳${value.toFixed(2)} off`;
        }
    }, [discountValue, discountType]);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            reset({
                name: "",
                code: "",
                description: "",
                discountType: "Fixed",
                discountValue: "",
                maxDiscountAmount: "",
                minOrderAmount: "",
                usageLimit: "",
                perUserLimit: "",
                appliesToAll: true,
                products: [],
                categories: [],
                active: true,
                combinable: false,
                startAt: "",
                endAt: "",
            });
            setProductSearch("");
            setCategorySearch("");
        }
    }, [isOpen, reset]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const valid = await trigger();
            if (!valid) {
                toast.error("Please fix form errors before submitting");
                return;
            }

            // Additional validation
            if (data.startAt && data.endAt && new Date(data.startAt) >= new Date(data.endAt)) {
                toast.error("Start date must be before end date");
                return;
            }

            if (data.discountType === "Percentage" && parseFloat(data.discountValue) > 100) {
                toast.error("Percentage discount cannot exceed 100%");
                return;
            }

            if (!data.appliesToAll && data.products.length === 0 && data.categories.length === 0) {
                toast.error("Please select at least one product or category, or choose 'Apply to all products'");
                return;
            }

            // Format numeric values and prepare request data
            const formattedData = {
                name: data.name.trim(),
                code: data.code.trim().toUpperCase(), // Ensure uppercase
                description: data.description?.trim() || null,
                discountType: data.discountType, // Now correctly "Fixed" or "Percentage"
                discountValue: parseFloat(data.discountValue),
                maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null,
                minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : null,
                usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
                perUserLimit: data.perUserLimit ? parseInt(data.perUserLimit) : null,
                appliesToAll: Boolean(data.appliesToAll),
                combinable: Boolean(data.combinable),
                active: Boolean(data.active),
                startAt: data.startAt || null,
                endAt: data.endAt || null,
                // Only send products/categories if appliesToAll is false
                products: data.appliesToAll ? [] : data.products.map(id => parseInt(id)),
                categories: data.appliesToAll ? [] : data.categories.map(id => parseInt(id))
            };

            console.log("Coupon data being sent:", formattedData);

            const response = await apiClient("/api/coupon", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });

            console.log("API response:", response);

            if (response) {
                toast.success("Coupon added successfully!");
                reset();
                onSuccess();
            } else {
                throw new Error(response.message || "Failed to add coupon");
            }
        } catch (error) {
            console.error("Error adding coupon:", error);
            toast.error(error.message || "Failed to add coupon");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        setProductSearch("");
        setCategorySearch("");
        onClose();
    };

    const toggleProduct = (productId) => {
        const currentProducts = selectedProducts;
        const newProducts = currentProducts.includes(productId.toString())
            ? currentProducts.filter(id => id !== productId.toString())
            : [...currentProducts, productId.toString()];

        setValue("products", newProducts, { shouldDirty: true, shouldValidate: true });
    };

    const toggleCategory = (categoryId) => {
        const currentCategories = selectedCategories;
        const newCategories = currentCategories.includes(categoryId.toString())
            ? currentCategories.filter(id => id !== categoryId.toString())
            : [...currentCategories, categoryId.toString()];

        setValue("categories", newCategories, { shouldDirty: true, shouldValidate: true });
    };

    const selectAllProducts = () => {
        const allProductIds = filteredProducts.map(product => product.id.toString());
        setValue("products", allProductIds, { shouldDirty: true, shouldValidate: true });
    };

    const clearAllProducts = () => {
        setValue("products", [], { shouldDirty: true, shouldValidate: true });
    };

    const selectAllCategories = () => {
        const allCategoryIds = filteredCategories.map(category => category.id.toString());
        setValue("categories", allCategoryIds, { shouldDirty: true, shouldValidate: true });
    };

    const clearAllCategories = () => {
        setValue("categories", [], { shouldDirty: true, shouldValidate: true });
    };

    const clearProductSearch = () => {
        setProductSearch("");
    };

    const clearCategorySearch = () => {
        setCategorySearch("");
    };

    const loadingData = productsLoading || categoriesLoading;

    return (
        <BaseModal isOpen={isOpen} onClose={handleClose} title="Add Coupon" size="4xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Preview Section */}
                {previewDiscount && (
                    <div className="bg-gradient-to-r from-purple-50 to-sky-50 border border-purple-200 rounded p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Discount Preview</p>
                                <p className="text-2xl font-bold text-purple-600">{previewDiscount}</p>
                            </div>
                            {watch("code") && (
                                <div className="bg-white px-4 py-2 rounded border border-purple-300">
                                    <p className="text-xs text-gray-500">Code</p>
                                    <p className="text-lg font-mono font-semibold text-purple-700">
                                        {watch("code").toUpperCase()}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Coupon Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                            {...register("name", {
                                required: "Coupon name is required",
                                minLength: { value: 3, message: "Name must be at least 3 characters" },
                                maxLength: { value: 100, message: "Name must not exceed 100 characters" }
                            })}
                            className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.name ? "border-red-300" : "border-gray-300"}`}
                            placeholder="e.g., Summer Sale 2024"
                            disabled={loading}
                        />
                        {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                    </div>

                    {/* Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Coupon Code <span className="text-rose-500">*</span>
                        </label>
                        <input
                            {...register("code", {
                                required: "Coupon code is required",
                                pattern: {
                                    value: /^[A-Z0-9-_]+$/i,
                                    message: "Only letters, numbers, hyphens, underscores allowed"
                                },
                                minLength: { value: 2, message: "Code must be at least 2 characters" },
                                maxLength: { value: 20, message: "Code must not exceed 20 characters" }
                            })}
                            className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase ${errors.code ? "border-red-300" : "border-gray-300"}`}
                            placeholder="e.g., SUMMER2026"
                            disabled={loading}
                            style={{ textTransform: 'uppercase' }}
                        />
                        {errors.code && <p className="text-sm text-red-600 mt-1">{errors.code.message}</p>}
                    </div>

                    {/* Discount Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount Type <span className="text-rose-500">*</span>
                        </label>
                        <select
                            {...register("discountType", { required: true })}
                            className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={loading}
                        >
                            <option value="Fixed">Fixed Amount (৳)</option>
                            <option value="Percentage">Percentage (%)</option>
                        </select>
                    </div>

                    {/* Discount Value */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Discount Value <span className="text-rose-500">*</span>
                        </label>
                        <input
                            {...register("discountValue", {
                                required: "Discount value is required",
                                min: { value: 0.01, message: "Discount must be greater than 0" },
                                validate: (value) => {
                                    const numValue = parseFloat(value);
                                    if (isNaN(numValue)) return "Please enter a valid number";
                                    if (discountType === "Percentage" && numValue > 100) {
                                        return "Percentage cannot exceed 100%";
                                    }
                                    return true;
                                }
                            })}
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={discountType === "Percentage" ? "100" : undefined}
                            className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.discountValue ? "border-red-300" : "border-gray-300"}`}
                            disabled={loading}
                            placeholder={discountType === "Percentage" ? "e.g., 10 for 10%" : "e.g., 100 for ৳100"}
                        />
                        {errors.discountValue && <p className="text-sm text-red-600 mt-1">{errors.discountValue.message}</p>}
                    </div>

                    {/* Max Discount Amount (for Percentage) */}
                    {discountType === "Percentage" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Discount Amount (৳)
                                <span className="text-gray-400 text-xs font-normal ml-1">(Optional)</span>
                            </label>
                            <input
                                {...register("maxDiscountAmount", {
                                    min: { value: 0.01, message: "Must be greater than 0" },
                                    validate: (value) => {
                                        if (!value) return true;
                                        const numValue = parseFloat(value);
                                        return !isNaN(numValue) || "Please enter a valid number";
                                    }
                                })}
                                type="number"
                                step="0.01"
                                min="0.01"
                                className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.maxDiscountAmount ? "border-red-300" : "border-gray-300"}`}
                                disabled={loading}
                                placeholder="e.g., 500"
                            />
                            {errors.maxDiscountAmount && <p className="text-sm text-red-600 mt-1">{errors.maxDiscountAmount.message}</p>}
                            <p className="text-xs text-gray-500 mt-1">Cap the maximum discount amount</p>
                        </div>
                    )}

                    {/* Max Discount Amount (for percentage) */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Max Discount Amount (৳)
                        </label>
                        <input
                            {...register("maxDiscountAmount", {
                                min: { value: 0.01, message: "Must be greater than 0" }
                            })}
                            type="number"
                            step="0.01"
                            min="0.01"
                            className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.maxDiscountAmount ? "border-red-300" : "border-gray-300"}`}
                            disabled={loading}
                            placeholder="e.g., 500"
                        />
                        {errors.maxDiscountAmount && <p className="text-sm text-red-600 mt-1">{errors.maxDiscountAmount.message}</p>}
                    </div>


                    {/* Min Order Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Min Order Amount (৳)
                            <span className="text-gray-400 text-xs font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                            {...register("minOrderAmount", {
                                min: { value: 0, message: "Cannot be negative" },
                                validate: (value) => {
                                    if (!value) return true;
                                    const numValue = parseFloat(value);
                                    return !isNaN(numValue) || "Please enter a valid number";
                                }
                            })}
                            type="number"
                            step="0.01"
                            min="0"
                            className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.minOrderAmount ? "border-red-300" : "border-gray-300"}`}
                            disabled={loading}
                            placeholder="e.g., 999"
                        />
                        {errors.minOrderAmount && <p className="text-sm text-red-600 mt-1">{errors.minOrderAmount.message}</p>}
                    </div>

                    {/* Usage Limits */}
                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total Usage Limit
                            <span className="text-gray-400 text-xs font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                            {...register("usageLimit", {
                                min: { value: 1, message: "Must be at least 1" },
                                validate: (value) => {
                                    if (!value) return true;
                                    const numValue = parseInt(value);
                                    return (!isNaN(numValue) && Number.isInteger(numValue)) || "Must be a whole number";
                                }
                            })}
                            type="number"
                            min="1"
                            step="1"
                            className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.usageLimit ? "border-red-300" : "border-gray-300"}`}
                            disabled={loading}
                            placeholder="Unlimited if empty"
                        />
                        {errors.usageLimit && <p className="text-sm text-red-600 mt-1">{errors.usageLimit.message}</p>}
                    </div> */}
                    {/* 
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Per User Limit
                            <span className="text-gray-400 text-xs font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                            {...register("perUserLimit", {
                                min: { value: 1, message: "Must be at least 1" },
                                validate: (value) => {
                                    if (!value) return true;
                                    const numValue = parseInt(value);
                                    return (!isNaN(numValue) && Number.isInteger(numValue)) || "Must be a whole number";
                                }
                            })}
                            type="number"
                            min="1"
                            step="1"
                            className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.perUserLimit ? "border-red-300" : "border-gray-300"}`}
                            disabled={loading}
                            placeholder="e.g., 1"
                        />
                        {errors.perUserLimit && <p className="text-sm text-red-600 mt-1">{errors.perUserLimit.message}</p>}
                    </div> */}

                    {/* Start & End Date */}
                    {/* <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date
                            <span className="text-gray-400 text-xs font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                            {...register("startAt")}
                            type="datetime-local"
                            className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                            <span className="text-gray-400 text-xs font-normal ml-1">(Optional)</span>
                        </label>
                        <input
                            {...register("endAt", {
                                validate: (value) => {
                                    if (!value || !startAt) return true;
                                    return new Date(value) > new Date(startAt) || "End date must be after start date";
                                }
                            })}
                            type="datetime-local"
                            className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.endAt ? "border-red-300" : "border-gray-300"}`}
                            disabled={loading}
                        />
                        {errors.endAt && <p className="text-sm text-red-600 mt-1">{errors.endAt.message}</p>}
                    </div> */}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description <span className="text-gray-400 text-xs font-normal ml-1">(Optional)</span>
                    </label>
                    <textarea
                        {...register("description", {
                            maxLength: { value: 500, message: "Max 500 characters" }
                        })}
                        rows={3}
                        className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? "border-red-300" : "border-gray-300"}`}
                        placeholder="Enter coupon description (optional)"
                        disabled={loading}
                    />
                    {errors.description && <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>}
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                        <span>{descriptionValue?.length || 0}/500</span>
                        {descriptionValue?.length > 450 && <span className="text-amber-600">Approaching limit</span>}
                    </div>
                </div>

                {/* Applies To All Toggle */}
                <div className="flex items-start gap-3 p-4 rounded border-2 bg-gradient-to-r from-sky-50 to-purple-50 border-sky-200">
                    <input
                        type="checkbox"
                        {...register("appliesToAll")}
                        className="h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 mt-0.5"
                        disabled={loading}
                    />
                    <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-800 cursor-pointer">
                            Apply coupon to all products
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                            When checked, this coupon will be valid for all products in your store
                        </p>
                    </div>
                </div>

                {/* Product Selection (only show if not applies to all) */}
                {!appliesToAll && (
                    <div className="border-2 border-gray-200 rounded p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-semibold text-gray-800">
                                Select Products
                                <span className="text-gray-500 font-normal ml-2">
                                    ({selectedProducts.length} selected)
                                </span>
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllProducts}
                                    className="text-xs px-3 py-1.5 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
                                    disabled={loadingData}
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={clearAllProducts}
                                    className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    disabled={selectedProducts.length === 0}
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Product Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                placeholder="Search products by name or SKU..."
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                            />
                            {productSearch && (
                                <button
                                    type="button"
                                    onClick={clearProductSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {loadingData ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                Loading products...
                            </div>
                        ) : filteredProducts.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto bg-white rounded border border-gray-200 p-2">
                                {filteredProducts.map((product) => (
                                    <label
                                        key={product.id}
                                        className="flex items-start gap-3 p-3 hover:bg-sky-50 rounded border border-transparent hover:border-sky-200 cursor-pointer transition-all"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(product.id.toString())}
                                            onChange={() => toggleProduct(product.id)}
                                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {product.productName}
                                                </span>
                                                {product.sku && (
                                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                                        {product.sku}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 bg-white rounded border border-gray-200">
                                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="font-medium">
                                    {productSearch ? "No products found" : "No products available"}
                                </p>
                                <p className="text-xs mt-1">
                                    {productSearch ? "Try adjusting your search" : "Add products to your store first"}
                                </p>
                            </div>
                        )}

                        {productSearch && (
                            <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                <span>Showing {filteredProducts.length} of {productsData.length} products</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Category Selection (only show if not applies to all) */}
                {!appliesToAll && (
                    <div className="border-2 border-gray-200 rounded p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <label className="block text-sm font-semibold text-gray-800">
                                Select Categories
                                <span className="text-gray-500 font-normal ml-2">
                                    ({selectedCategories.length} selected)
                                </span>
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={selectAllCategories}
                                    className="text-xs px-3 py-1.5 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
                                    disabled={loadingData}
                                >
                                    Select All
                                </button>
                                <button
                                    type="button"
                                    onClick={clearAllCategories}
                                    className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    disabled={selectedCategories.length === 0}
                                >
                                    Clear All
                                </button>
                            </div>
                        </div>

                        {/* Category Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={categorySearch}
                                onChange={(e) => setCategorySearch(e.target.value)}
                                placeholder="Search categories..."
                                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                            />
                            {categorySearch && (
                                <button
                                    type="button"
                                    onClick={clearCategorySearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={18} />
                                </button>
                            )}
                        </div>

                        {loadingData ? (
                            <div className="text-center py-8 text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                Loading categories...
                            </div>
                        ) : filteredCategories.length > 0 ? (
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto bg-white rounded border border-gray-200 p-2">
                                {filteredCategories.map((category) => (
                                    <label
                                        key={category.id}
                                        className="flex items-start gap-3 p-3 hover:bg-sky-50 rounded border border-transparent hover:border-sky-200 cursor-pointer transition-all"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.includes(category.id.toString())}
                                            onChange={() => toggleCategory(category.id)}
                                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary mt-1"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <span className="text-sm font-medium text-gray-900">
                                                {category.name}
                                            </span>
                                            {category.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {category.description}
                                                </p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 bg-white rounded border border-gray-200">
                                <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                                <p className="font-medium">
                                    {categorySearch ? "No categories found" : "No categories available"}
                                </p>
                                <p className="text-xs mt-1">
                                    {categorySearch ? "Try adjusting your search" : "Add categories to your store first"}
                                </p>
                            </div>
                        )}

                        {categorySearch && (
                            <div className="text-xs text-gray-500 mt-2 flex justify-between">
                                <span>Showing {filteredCategories.length} of {categoriesData.length} categories</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Additional Options */}
                <div className="grid grid-cols-1  gap-4">
                    {/* Active Toggle */}
                    <div className="flex items-start gap-3 p-3 rounded border bg-gray-50 border-gray-200">
                        <input
                            type="checkbox"
                            {...register("active")}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 mt-0.5"
                            disabled={loading}
                        />
                        <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700 cursor-pointer">
                                Activate coupon immediately
                            </label>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Coupon will be available for use right away
                            </p>
                        </div>
                    </div>

                    {/* Combinable Toggle */}
                    {/* <div className="flex items-start gap-3 p-3 rounded border bg-gray-50 border-gray-200">
                        <input
                            type="checkbox"
                            {...register("combinable")}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 mt-0.5"
                            disabled={loading}
                        />
                        <div className="flex-1">
                            <label className="text-sm font-medium text-gray-700 cursor-pointer">
                                Allow combining with other coupons
                            </label>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Can be used together with other coupons
                            </p>
                        </div>
                    </div> */}
                </div>

                {/* Validation Warning */}
                {!appliesToAll && selectedProducts.length === 0 && selectedCategories.length === 0 && isDirty && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded">
                        <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-amber-800">Selection Required</p>
                            <p className="text-xs text-amber-700 mt-1">
                                Please select at least one product or category, or enable "Apply to all products"
                            </p>
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-6 py-2.5 border border-gray-300 rounded bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={!isValid || loading || !isDirty || (!appliesToAll && selectedProducts.length === 0 && selectedCategories.length === 0)}
                        className={`px-6 py-2.5 rounded font-medium transition-all duration-200 ${!isValid || loading || !isDirty || (!appliesToAll && selectedProducts.length === 0 && selectedCategories.length === 0)
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-secound hover:bg-secound-hover text-white cursor-pointer transform hover:scale-105 shadow-md hover:shadow-lg"
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Adding Coupon...
                            </span>
                        ) : (
                            "Add Coupon"
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default CouponAddModal;