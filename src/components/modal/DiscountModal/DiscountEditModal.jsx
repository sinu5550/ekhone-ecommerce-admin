"use client";

import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { Search, X, Zap, Calendar, TrendingUp, Layers } from "lucide-react";
import { useCategories, useProducts, useSubCategories } from "@/lib/dataFetch";

const CAMPAIGN_TYPES = [

    { value: "FlashDeal", label: "Flash Deal", icon: Zap },
    { value: "SeasonalSale", label: "Seasonal Sale", icon: Calendar },
    { value: "CategorySale", label: "Category Sale", icon: Layers },
    { value: "ClearanceSale", label: "Clearance", icon: TrendingUp },
    { value: "DealsToday", label: "Deals Today", icon: TrendingUp },
    { value: "SpecialOffer", label: "Special Offer", icon: TrendingUp },
];

const DiscountEditModal = ({ isOpen, onClose, discount, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const [productSearch, setProductSearch] = useState("");
    const [categorySearch, setCategorySearch] = useState("");
    const [subCategorySearch, setSubCategorySearch] = useState("");

    const { data: productsData = [], isLoading: productsLoading } = useProducts();
    const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories();
    const { data: subCategoriesData = [], isLoading: subCategoriesLoading } = useSubCategories();

    const products = productsData?.products || [];
    const subCategories = subCategoriesData || [];

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isValid },
        trigger,
        clearErrors
    } = useForm({
        mode: "onChange",
        defaultValues: {
            campaignCode: "",
            name: "",
            description: "",
            campaignType: "FlashDeal",
            discountType: "Percentage",
            discountValue: "",
            maxDiscountAmount: "",
            minOrderAmount: "",
            appliesToAll: false,
            stockLimit: "",
            perCustomerLimit: "",
            startAt: "",
            endAt: "",
            priority: "0",
            combinableWithCoupon: true,
            isFeatured: false,
            showCountdown: false,
            showBadge: true,
            badgeText: "",
            badgeColor: "#FF0000",
            active: true,
            products: [],
            categories: [],
            subCategories: []
        }
    });

    const appliesToAll = watch("appliesToAll");
    const discountType = watch("discountType");
    const discountValue = watch("discountValue");
    const selectedProducts = watch("products") || [];
    const selectedCategories = watch("categories") || [];
    const selectedSubCategories = watch("subCategories") || [];
    const startAt = watch("startAt");
    const campaignType = watch("campaignType");

    // Initialize form with discount data when modal opens or discount changes
    useEffect(() => {
        if (isOpen && discount) {
            const formatDateForInput = (dateString) => {
                if (!dateString) return "";
                const date = new Date(dateString);
                return date.toISOString().slice(0, 16);
            };

            reset({
                campaignCode: discount.campaignCode || "",
                name: discount.name || "",
                description: discount.description || "",
                campaignType: discount.campaignType || "FlashDeal",
                discountType: discount.discountType || "Percentage",
                discountValue: discount.discountValue?.toString() || "",
                maxDiscountAmount: discount.maxDiscountAmount?.toString() || "",
                minOrderAmount: discount.minOrderAmount?.toString() || "",
                appliesToAll: discount.appliesToAll || false,
                stockLimit: discount.stockLimit?.toString() || "",
                perCustomerLimit: discount.perCustomerLimit?.toString() || "",
                startAt: formatDateForInput(discount.startAt),
                endAt: formatDateForInput(discount.endAt),
                priority: discount.priority?.toString() || "0",
                combinableWithCoupon: discount.combinableWithCoupon ?? true,
                isFeatured: discount.isFeatured || false,
                showCountdown: discount.showCountdown || false,
                showBadge: discount.showBadge ?? true,
                badgeText: discount.badgeText || "",
                badgeColor: discount.badgeColor || "#FF0000",
                active: discount.active ?? true,
                products: discount.discountProducts?.map(p => p.productId.toString()) || [],
                categories: discount.discountCategories?.map(c => c.categoryId.toString()) || [],
                subCategories: discount.discountSubCategories?.map(sc => sc.subCategoryId.toString()) || []
            });

            setProductSearch("");
            setCategorySearch("");
            setSubCategorySearch("");
            clearErrors();
        }
    }, [isOpen, discount, reset, clearErrors]);

    const filteredProducts = useMemo(() => {
        if (!productSearch.trim()) return products;
        const term = productSearch.toLowerCase();
        return products.filter(p =>
            p.productName?.toLowerCase().includes(term) ||
            p.sku?.toLowerCase().includes(term)
        );
    }, [products, productSearch]);

    const filteredCategories = useMemo(() => {
        if (!categorySearch.trim()) return categoriesData;
        const term = categorySearch.toLowerCase();
        return categoriesData.filter(c =>
            c.name?.toLowerCase().includes(term)
        );
    }, [categoriesData, categorySearch]);

    const filteredSubCategories = useMemo(() => {
        if (!subCategorySearch.trim()) return subCategories;
        const term = subCategorySearch.toLowerCase();
        return subCategories.filter(sc =>
            sc.name?.toLowerCase().includes(term)
        );
    }, [subCategories, subCategorySearch]);

    const discountPreview = useMemo(() => {
        if (!discountValue) return null;
        const val = parseFloat(discountValue);
        if (isNaN(val) || val <= 0) return null;
        return discountType === "Percentage" ? `${val}% OFF` : `৳${val} OFF`;
    }, [discountValue, discountType]);

    const validateForm = async (data) => {
        // Basic validation
        if (!data.campaignCode || !data.name || !data.discountValue) {
            return "Please fill all required fields";
        }

        // Date validation
        if (data.startAt && data.endAt && new Date(data.startAt) >= new Date(data.endAt)) {
            return "Start date must be before end date";
        }

        // Discount validation
        const discountVal = parseFloat(data.discountValue);
        if (discountVal <= 0) {
            return "Discount value must be greater than 0";
        }

        if (data.discountType === "Percentage" && discountVal > 100) {
            return "Percentage discount cannot exceed 100%";
        }

        // Products/Categories validation
        if (!data.appliesToAll &&
            data.products.length === 0 &&
            data.categories.length === 0 &&
            data.subCategories.length === 0) {
            return "Please select at least one product, category, or sub-category";
        }

        return null;
    };

    const onSubmit = async (formData) => {
        try {
            setLoading(true);

            // Validate form
            const validationError = await validateForm(formData);
            if (validationError) {
                toast.error(validationError);
                return;
            }

            // Prepare data for API
            const payload = {
                campaignCode: formData.campaignCode.trim().toUpperCase(),
                name: formData.name.trim(),
                description: formData.description?.trim() || null,
                campaignType: formData.campaignType,
                discountType: formData.discountType,
                discountValue: parseFloat(formData.discountValue),
                maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
                minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
                appliesToAll: formData.appliesToAll,
                stockLimit: formData.stockLimit ? parseInt(formData.stockLimit) : null,
                perCustomerLimit: formData.perCustomerLimit ? parseInt(formData.perCustomerLimit) : null,
                startAt: formData.startAt || null,
                endAt: formData.endAt || null,
                priority: parseInt(formData.priority) || 0,
                combinableWithCoupon: formData.combinableWithCoupon,
                isFeatured: formData.isFeatured,
                showCountdown: formData.showCountdown,
                showBadge: formData.showBadge,
                badgeText: formData.badgeText?.trim() || null,
                badgeColor: formData.badgeColor,
                active: formData.active,
                products: formData.appliesToAll ? [] : formData.products.map(id => ({
                    productId: parseInt(id)
                })),
                categories: formData.appliesToAll ? [] : formData.categories.map(id => ({
                    categoryId: parseInt(id)
                })),
                subCategories: formData.appliesToAll ? [] : formData.subCategories.map(id => ({
                    subCategoryId: parseInt(id)
                }))
            };

            // API call for update
            const response = await apiClient(`/api/discount-campaign/${discount.id}`, {
                method: "PATCH",
                body: JSON.stringify(payload)
            });

            if (response && response.success !== false) {
                toast.success("Campaign updated successfully!");
                if (onSuccess) onSuccess();
            } else {
                throw new Error(response?.message || "Failed to update campaign");
            }
        } catch (error) {
            console.error("Update campaign error:", error);

            if (error.message?.includes("already exists")) {
                toast.error("Campaign code already exists. Please use a different code.");
            } else {
                toast.error(error.message || "Failed to update campaign. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleProduct = (productId) => {
        const currentProducts = [...selectedProducts];
        const productIdStr = productId.toString();

        if (currentProducts.includes(productIdStr)) {
            setValue("products", currentProducts.filter(id => id !== productIdStr), {
                shouldValidate: true,
                shouldDirty: true
            });
        } else {
            setValue("products", [...currentProducts, productIdStr], {
                shouldValidate: true,
                shouldDirty: true
            });
        }
    };

    const toggleCategory = (categoryId) => {
        const currentCategories = [...selectedCategories];
        const categoryIdStr = categoryId.toString();

        if (currentCategories.includes(categoryIdStr)) {
            setValue("categories", currentCategories.filter(id => id !== categoryIdStr), {
                shouldValidate: true,
                shouldDirty: true
            });
        } else {
            setValue("categories", [...currentCategories, categoryIdStr], {
                shouldValidate: true,
                shouldDirty: true
            });
        }
    };

    const toggleSubCategory = (subCategoryId) => {
        const currentSubCategories = [...selectedSubCategories];
        const subCategoryIdStr = subCategoryId.toString();

        if (currentSubCategories.includes(subCategoryIdStr)) {
            setValue("subCategories", currentSubCategories.filter(id => id !== subCategoryIdStr), {
                shouldValidate: true,
                shouldDirty: true
            });
        } else {
            setValue("subCategories", [...currentSubCategories, subCategoryIdStr], {
                shouldValidate: true,
                shouldDirty: true
            });
        }
    };

    const selectAllProducts = () => {
        setValue("products", filteredProducts.map(p => p.id.toString()), {
            shouldValidate: true,
            shouldDirty: true
        });
    };

    const clearAllProducts = () => {
        setValue("products", [], {
            shouldValidate: true,
            shouldDirty: true
        });
    };

    const selectAllCategories = () => {
        setValue("categories", filteredCategories.map(c => c.id.toString()), {
            shouldValidate: true,
            shouldDirty: true
        });
    };

    const clearAllCategories = () => {
        setValue("categories", [], {
            shouldValidate: true,
            shouldDirty: true
        });
    };

    const selectAllSubCategories = () => {
        setValue("subCategories", filteredSubCategories.map(sc => sc.id.toString()), {
            shouldValidate: true,
            shouldDirty: true
        });
    };

    const clearAllSubCategories = () => {
        setValue("subCategories", [], {
            shouldValidate: true,
            shouldDirty: true
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    if (!discount) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Edit Discount Campaign"
            size="4xl"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Discount Preview */}
                {discountPreview && (
                    <div className="bg-rose-50 border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold text-red-600">{discountPreview}</span>
                            <span className="font-mono font-bold text-sm bg-secound text-white px-2 py-1 rounded">
                                {campaignType}
                            </span>
                        </div>
                    </div>
                )}

                {/* Campaign Type */}
                <div>
                    <label className="block text-sm font-medium mb-3 text-gray-700">
                        Campaign Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                        {CAMPAIGN_TYPES.map((type) => {
                            const IconComponent = type.icon;
                            const isSelected = campaignType === type.value;

                            return (
                                <label
                                    key={type.value}
                                    className={`flex flex-col items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                        ? "border-amber-500 bg-amber-50 text-amber-700"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        {...register("campaignType", { required: true })}
                                        value={type.value}
                                        className="sr-only"
                                    />
                                    <IconComponent size={20} className="mb-1" />
                                    <span className="text-xs text-center font-medium">{type.label}</span>
                                </label>
                            );
                        })}
                    </div>
                    {errors.campaignType && (
                        <p className="text-sm text-red-600 mt-1">Please select a campaign type</p>
                    )}
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Campaign Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("name", {
                                required: "Campaign name is required",
                                minLength: { value: 3, message: "Name must be at least 3 characters" }
                            })}
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                            placeholder="Summer Sale 2024"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Campaign Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("campaignCode", {
                                required: "Campaign code is required",
                                pattern: {
                                    value: /^[A-Z0-9]+$/,
                                    message: "Only uppercase letters and numbers allowed"
                                }
                            })}
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300 uppercase font-mono"
                            placeholder="SUMMER2024"
                            style={{ textTransform: 'uppercase' }}
                        />
                        {errors.campaignCode && (
                            <p className="text-sm text-red-600 mt-1">{errors.campaignCode.message}</p>
                        )}
                    </div>
                </div>

                {/* Discount Configuration */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Discount Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register("discountType", { required: true })}
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                        >

                            <option value="Percentage">Percentage (%)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Discount Value <span className="text-red-500">*</span>
                        </label>
                        <input
                            {...register("discountValue", {
                                required: "Discount value is required",
                                min: { value: 0.01, message: "Discount must be greater than 0" },
                                validate: (value) => {
                                    const numValue = parseFloat(value);
                                    if (discountType === "Percentage" && numValue > 100) {
                                        return "Percentage cannot exceed 100%";
                                    }
                                    return true;
                                }
                            })}
                            type="number"
                            step="0.01"
                            min="0.01"
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                            placeholder={discountType === "Percentage" ? "10" : "100"}
                        />
                        {errors.discountValue && (
                            <p className="text-sm text-red-600 mt-1">{errors.discountValue.message}</p>
                        )}
                    </div>
                    {/* 
                    {discountType === "Percentage" && (
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                                Max Discount Amount
                            </label>
                            <input
                                {...register("maxDiscountAmount", {
                                    min: { value: 0, message: "Must be positive" }
                                })}
                                type="number"
                                step="0.01"
                                min="0"
                                className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                                placeholder="Optional"
                            />
                            {errors.maxDiscountAmount && (
                                <p className="text-sm text-red-600 mt-1">{errors.maxDiscountAmount.message}</p>
                            )}
                        </div>
                    )} */}


                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Priority
                        </label>
                        <input
                            {...register("priority", {
                                min: { value: 0, message: "Must be 0 or greater" }
                            })}
                            type="number"
                            min="0"
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                        />
                    </div>
                </div>

                {/* Additional Configuration */}
                {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Minimum Order Amount
                        </label>
                        <input
                            {...register("minOrderAmount", {
                                min: { value: 0, message: "Must be positive" }
                            })}
                            type="number"
                            step="0.01"
                            min="0"
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Stock Limit
                        </label>
                        <input
                            {...register("stockLimit", {
                                min: { value: 1, message: "Must be at least 1" }
                            })}
                            type="number"
                            min="1"
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Per Customer Limit
                        </label>
                        <input
                            {...register("perCustomerLimit", {
                                min: { value: 1, message: "Must be at least 1" }
                            })}
                            type="number"
                            min="1"
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                        />
                    </div>
                </div> */}

                {/* Date & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            Start Date & Time
                        </label>
                        <input
                            {...register("startAt")}
                            type="datetime-local"
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                            End Date & Time
                        </label>
                        <input
                            {...register("endAt", {
                                validate: (value) => {
                                    if (value && startAt && new Date(value) <= new Date(startAt)) {
                                        return "End date must be after start date";
                                    }
                                    return true;
                                }
                            })}
                            type="datetime-local"
                            className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300"
                        />
                        {errors.endAt && (
                            <p className="text-sm text-red-600 mt-1">{errors.endAt.message}</p>
                        )}
                    </div>

                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                        Description
                    </label>
                    <textarea
                        {...register("description")}
                        rows={3}
                        className="w-full p-3 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent border-gray-300 resize-none"
                        placeholder="Describe your campaign..."
                    />
                </div>

                {/* Apply to All Products */}
                <div className="flex items-center gap-3 p-4 bg-sky-50 border-2 border-sky-200 rounded-lg">
                    <input
                        type="checkbox"
                        {...register("appliesToAll")}
                        className="h-4 w-4 text-sky-600 focus:ring-primary border-gray-300 rounded"
                    />
                    <label className="text-sm font-medium text-gray-700">
                        Apply discount to all products
                    </label>
                </div>

                {/* Product, Category, and Sub-Category Selection */}
                {!appliesToAll && (
                    <div className="space-y-4">
                        {/* Product Selection */}
                        <div className="border-2 border-gray-200 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                                <label className="font-medium text-gray-700">
                                    Selected Products ({selectedProducts.length})
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllProducts}
                                        className="text-xs px-3 py-1.5 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAllProducts}
                                        className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Search products by name or SKU..."
                                />
                                {productSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setProductSearch("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg">
                                {productsLoading ? (
                                    <div className="p-4 text-center text-gray-500">Loading products...</div>
                                ) : filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <label
                                            key={product.id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id.toString())}
                                                onChange={() => toggleProduct(product.id)}
                                                className="h-4 w-4 text-sky-600 focus:ring-primary border-gray-300 rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {product.productName}
                                                </p>
                                                <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">No products found</div>
                                )}
                            </div>
                        </div>

                        {/* Category Selection */}
                        {/* <div className="border-2 border-gray-200 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                                <label className="font-medium text-gray-700">
                                    Selected Categories ({selectedCategories.length})
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllCategories}
                                        className="text-xs px-3 py-1.5 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAllCategories}
                                        className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Search categories..."
                                />
                                {categorySearch && (
                                    <button
                                        type="button"
                                        onClick={() => setCategorySearch("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg">
                                {categoriesLoading ? (
                                    <div className="p-4 text-center text-gray-500">Loading categories...</div>
                                ) : filteredCategories.length > 0 ? (
                                    filteredCategories.map((category) => (
                                        <label
                                            key={category.id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedCategories.includes(category.id.toString())}
                                                onChange={() => toggleCategory(category.id)}
                                                className="h-4 w-4 text-sky-600 focus:ring-primary border-gray-300 rounded"
                                            />
                                            <span className="text-sm text-gray-900">{category.name}</span>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">No categories found</div>
                                )}
                            </div>
                        </div> */}

                        {/* Sub-Category Selection */}
                        {/* <div className="border-2 border-gray-200 rounded-lg p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                                <label className="font-medium text-gray-700">
                                    Selected Sub-Categories ({selectedSubCategories.length})
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllSubCategories}
                                        className="text-xs px-3 py-1.5 bg-sky-500 text-white rounded hover:bg-sky-600 transition-colors"
                                    >
                                        Select All
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAllSubCategories}
                                        className="text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>

                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    value={subCategorySearch}
                                    onChange={(e) => setSubCategorySearch(e.target.value)}
                                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    placeholder="Search sub-categories..."
                                />
                                {subCategorySearch && (
                                    <button
                                        type="button"
                                        onClick={() => setSubCategorySearch("")}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <X size={18} />
                                    </button>
                                )}
                            </div>

                            <div className="max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg">
                                {subCategoriesLoading ? (
                                    <div className="p-4 text-center text-gray-500">Loading sub-categories...</div>
                                ) : filteredSubCategories.length > 0 ? (
                                    filteredSubCategories.map((subCategory) => (
                                        <label
                                            key={subCategory.id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedSubCategories.includes(subCategory.id.toString())}
                                                onChange={() => toggleSubCategory(subCategory.id)}
                                                className="h-4 w-4 text-sky-600 focus:ring-primary border-gray-300 rounded"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm text-gray-900">{subCategory.name}</span>
                                                {subCategory.category && (
                                                    <p className="text-xs text-gray-500">
                                                        Category: {subCategory.category.name}
                                                    </p>
                                                )}
                                            </div>
                                        </label>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500">No sub-categories found</div>
                                )}
                            </div>
                        </div> */}
                    </div>
                )}

                {/* Additional Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                            type="checkbox"
                            {...register("active")}
                            className="h-4 w-4 text-sky-600 focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Activate</span>
                    </label>
                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                            type="checkbox"
                            {...register("isFeatured")}
                            className="h-4 w-4 text-sky-600 focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Featured Campaign</span>
                    </label>

                    <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                            type="checkbox"
                            {...register("showCountdown")}
                            className="h-4 w-4 text-sky-600 focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Countdown Timer</span>
                    </label>

                    {/* <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                            type="checkbox"
                            {...register("combinableWithCoupon")}
                            className="h-4 w-4 text-sky-600 focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Combinable with Coupons</span>
                    </label> */}

                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="px-6 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!isValid || loading}
                        className={`px-6 py-3 rounded  font-medium transition-colors ${!isValid || loading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-secound hover:bg-secound-hover text-white cursor-pointer"
                            }`}
                    >
                        {loading ? "Updating Campaign..." : "Update Campaign"}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default DiscountEditModal;