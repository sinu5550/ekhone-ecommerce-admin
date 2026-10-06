"use client";

import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import { Trash2, Plus, X, Pipette } from "lucide-react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { toast } from "react-hot-toast";

/**
 * Enhanced VariantProductFields Component with Combination-Based Model
 * Supports hierarchical attributes and dynamic SKU generation
 * 
 * @param {Array} variants - Current variants array
 * @param {Function} setVariants - Function to update variants
 * @param {Array} variantData - Available variant attributes from API
 */
const VariantProductFields = ({ variants, setVariants, variantData, register, errors, watch }) => {
    // State for attribute combination builder
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [currentAttribute, setCurrentAttribute] = useState("");
    const [attributeValues, setAttributeValues] = useState({});
    const [generatedVariants, setGeneratedVariants] = useState([]);

    // ─────────────────────────────────────────────────────────────
    // Helper functions for color detection and display
    // ─────────────────────────────────────────────────────────────
    const isHexColor = (value) => {
        return typeof value === 'string' && /^#[0-9A-F]{6}$/i.test(value);
    };

    const getContrastColor = (hexColor) => {
        // Remove the # if present
        const hex = hexColor.replace('#', '');

        // Convert to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    };

    // ─────────────────────────────────────────────────────────────
    // Get unique attribute types from variantData
    // ─────────────────────────────────────────────────────────────
    const attributeTypes = useMemo(() => {
        return [...new Set(variantData.map(v => v.variant))];
    }, [variantData]);

    // ─────────────────────────────────────────────────────────────
    // Get available attributes (those not already selected)
    // ─────────────────────────────────────────────────────────────
    const availableAttributes = useMemo(() => {
        return attributeTypes.filter(attr => !selectedAttributes.includes(attr));
    }, [attributeTypes, selectedAttributes]);

    // ─────────────────────────────────────────────────────────────
    // Get values for selected attribute
    // ─────────────────────────────────────────────────────────────
    const getAttributeValues = useCallback((attribute) => {
        const attr = variantData.find(v => v.variant === attribute);
        return attr?.values || attr?.options || [];
    }, [variantData]);

    // ─────────────────────────────────────────────────────────────
    // Check if an attribute is a color attribute
    // ─────────────────────────────────────────────────────────────
    const isColorAttribute = useCallback((attribute) => {
        return attribute?.toLowerCase().includes('color');
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Add new attribute to combination
    // ─────────────────────────────────────────────────────────────
    const handleAddAttribute = useCallback(() => {
        if (!currentAttribute) {
            toast.error("Please select an attribute");
            return;
        }

        if (selectedAttributes.includes(currentAttribute)) {
            toast.error("Attribute already selected");
            return;
        }

        setSelectedAttributes(prev => [...prev, currentAttribute]);
        setAttributeValues(prev => ({
            ...prev,
            [currentAttribute]: []
        }));
        setCurrentAttribute("");
    }, [currentAttribute, selectedAttributes]);

    // ─────────────────────────────────────────────────────────────
    // Remove attribute from combination
    // ─────────────────────────────────────────────────────────────
    const handleRemoveAttribute = useCallback((attribute) => {
        setSelectedAttributes(prev => prev.filter(attr => attr !== attribute));
        setAttributeValues(prev => {
            const newValues = { ...prev };
            delete newValues[attribute];
            return newValues;
        });
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Toggle value for an attribute
    // ─────────────────────────────────────────────────────────────
    const handleToggleValue = useCallback((attribute, value) => {
        setAttributeValues(prev => {
            const currentValues = prev[attribute] || [];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];

            return {
                ...prev,
                [attribute]: newValues
            };
        });
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Generate all possible combinations from selected attributes/values
    // ─────────────────────────────────────────────────────────────
    const generateCombinations = useCallback(() => {
        // Check if all attributes have at least one value
        const missingValues = selectedAttributes.filter(
            attr => !attributeValues[attr] || attributeValues[attr].length === 0
        );

        if (missingValues.length > 0) {
            toast.error(`Please select values for: ${missingValues.join(', ')}`);
            return [];
        }

        // Get arrays of values for each attribute
        const attributeArrays = selectedAttributes.map(attr => ({
            name: attr,
            values: attributeValues[attr]
        }));

        // Generate combinations recursively
        const generate = (index, current) => {
            if (index === attributeArrays.length) {
                return [current];
            }

            const attr = attributeArrays[index];
            const combinations = [];

            for (const value of attr.values) {
                const newCombination = {
                    ...current,
                    [attr.name]: value
                };
                combinations.push(...generate(index + 1, newCombination));
            }

            return combinations;
        };

        return generate(0, {});
    }, [selectedAttributes, attributeValues]);

    // ─────────────────────────────────────────────────────────────
    // Preview generated combinations
    // ─────────────────────────────────────────────────────────────
    const handlePreviewCombinations = useCallback(() => {
        const combinations = generateCombinations();
        setGeneratedVariants(combinations);

        if (combinations.length > 0) {
            toast.success(`Generated ${combinations.length} variant combinations`);
        }
    }, [generateCombinations]);

    // ─────────────────────────────────────────────────────────────
    // Apply generated combinations to variants
    // ─────────────────────────────────────────────────────────────
    const handleApplyCombinations = useCallback(() => {
        const combinations = generateCombinations();

        if (combinations.length === 0) return;

        // Check for duplicates with existing variants
        const newVariants = combinations.map(combo => {
            // Create SKU from combination
            const skuBase = Object.entries(combo)
                .map(([key, value]) => {
                    // For color values, use color code without #
                    const val = isHexColor(value) ? value.replace('#', '') : value.substring(0, 2);
                    return `${key.substring(0, 2)}-${val}`;
                })
                .join('_');

            return {
                attributes: combo,
                sku: `SKU-${skuBase}-${Date.now().toString().slice(-4)}`,
                price: "",
                costPrice: "",
                quantity: "",
                image: "",
                isDefault: variants.length === 0 && combinations.indexOf(combo) === 0
            };
        });

        // Merge with existing variants, avoiding duplicates
        const existingKeys = new Set(
            variants.map(v => JSON.stringify(v.attributes))
        );

        const uniqueNewVariants = newVariants.filter(
            v => !existingKeys.has(JSON.stringify(v.attributes))
        );

        setVariants(prev => [...prev, ...uniqueNewVariants]);
        setGeneratedVariants([]);

        toast.success(`Added ${uniqueNewVariants.length} new variants`);
    }, [variants, setVariants, generateCombinations]);

    // ─────────────────────────────────────────────────────────────
    // Get display text for variant attributes with color visualization
    // ─────────────────────────────────────────────────────────────
    const renderVariantDisplay = useCallback((attributes) => {
        return Object.entries(attributes || {}).map(([key, value], idx, arr) => {
            const isColor = isColorAttribute(key) && isHexColor(value);

            return (
                <span key={key} className="inline-flex items-center gap-1">
                    {isColor ? (
                        <>
                            <span className="text-gray-600">{key}:</span>
                            <span
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border border-gray-200 shadow-sm"
                                style={{
                                    backgroundColor: value,
                                    color: getContrastColor(value)
                                }}
                            >
                                <span
                                    className="w-3 h-3 rounded-full border border-current opacity-50"
                                    style={{ backgroundColor: value, filter: 'brightness(0.8)' }}
                                />
                                {value}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-gray-600">{key}:</span>
                            <span className="font-medium text-gray-900">{value}</span>
                        </>
                    )}
                    {idx < arr.length - 1 && <span className="text-gray-400 mx-1">|</span>}
                </span>
            );
        });
    }, []);

    // ─────────────────────────────────────────────────────────────
    // Calculate total stock
    // ─────────────────────────────────────────────────────────────
    const totalStock = useMemo(() => {
        return variants.reduce((sum, v) => sum + (parseInt(v.quantity) || 0), 0);
    }, [variants]);

    // ─────────────────────────────────────────────────────────────
    // Check if a specific combination is valid (all attributes selected)
    // ─────────────────────────────────────────────────────────────
    const isValidCombination = useCallback((combination) => {
        return selectedAttributes.every(attr => combination[attr]);
    }, [selectedAttributes]);

    const taxType = watch ? watch("taxType") : "";
    const isTaxInclusive = taxType === "exclusive";
    const discountType = watch ? watch("discountType") : "";

    return (
        <div className="space-y-6">
            {/* Global Pricing & Discount Settings for Variant Product */}
            {register && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-3">
                        Tax & Discount Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <label className="block text-sm font-medium">Tax Type</label>
                            <select
                                {...register("taxType")}
                                className="select select-bordered pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                            >
                                <option value="">Select</option>
                                <option value="inclusive">Inclusive</option>
                                <option value="exclusive">Exclusive</option>
                            </select>
                            {errors?.taxType && (
                                <p className="text-red-500 text-xs mt-1">{errors.taxType.message}</p>
                            )}
                        </div>

                        {/* Tax field - conditionally rendered */}
                        {isTaxInclusive && (
                            <div>
                                <label className="block text-sm font-medium">Tax (%) <span className="text-rose-500">*</span></label>
                                <input
                                    {...register("tax", {
                                        required: "Tax is required",
                                        valueAsNumber: true
                                    })}
                                    type="number"
                                    step="0.01"
                                    placeholder="Enter Tax (%)"
                                    className="pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                                />
                                {errors?.tax && (
                                    <p className="text-red-500 text-xs mt-1">{errors.tax.message}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium">Discount Type</label>
                            <select
                                {...register("discountType")}
                                className="select select-bordered pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                            >
                                <option value="">No Discount</option>
                                <option value="Percentage">Percentage (%)</option>
                                <option value="Fixed">Fixed Price (৳)</option>
                            </select>
                            {errors?.discountType && (
                                <p className="text-red-500 text-xs mt-1">{errors.discountType.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium">
                                {discountType === "Percentage"
                                    ? "Discount Value (%)"
                                    : discountType === "Fixed"
                                    ? "Discount Amount (৳)"
                                    : "Discount Value"}
                            </label>
                            <input
                                {...register("discountValue", {
                                    valueAsNumber: true,
                                    min: {
                                        value: 0,
                                        message: "Discount cannot be negative"
                                    },
                                    validate: (value) => {
                                        if (value < 0) return "Discount cannot be negative";
                                        if (discountType === "Percentage" && value > 100) {
                                            return "Discount percentage cannot exceed 100%";
                                        }
                                        return true;
                                    }
                                })}
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder={
                                    discountType === "Percentage"
                                        ? "e.g. 10 (for 10%)"
                                        : discountType === "Fixed"
                                        ? "e.g. 150 (for ৳150)"
                                        : "Enter Discount Value"
                                }
                                className="pl-3 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition mt-2"
                            />
                            {errors?.discountValue && (
                                <p className="text-red-500 text-xs mt-1">{errors.discountValue.message}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Attribute Combination Builder */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Build Variant Combinations
                </h3>

                {/* Attribute Selector */}
                <div className="flex gap-4 items-end">
                    <div className="flex-1">
                        <label className="block text-sm font-medium mb-2">
                            Select Attribute
                        </label>
                        <select
                            value={currentAttribute}
                            onChange={(e) => setCurrentAttribute(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                        >
                            <option value="">Choose Attribute</option>
                            {availableAttributes.map(attr => (
                                <option key={attr} value={attr}>
                                    {attr} {isColorAttribute(attr) && '🎨'}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddAttribute}
                        disabled={!currentAttribute}
                        className="h-10 px-4 bg-primary text-white rounded disabled:bg-gray-300 hover:bg-primary-hover transition flex items-center gap-2 cursor-pointer"
                    >
                        <Plus size={18} />
                        Add
                    </button>
                </div>

                {/* Selected Attributes with Value Pickers */}
                {selectedAttributes.length > 0 && (
                    <div className="space-y-4 mt-4">
                        {selectedAttributes.map(attribute => (
                            <div key={attribute} className="border border-stone-300 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-700 flex items-center gap-2">
                                        {attribute}
                                        {isColorAttribute(attribute) && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                                <Pipette size={12} />
                                                Color
                                            </span>
                                        )}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveAttribute(attribute)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Value Tiles */}
                                <div className="flex flex-wrap gap-5">
                                    {getAttributeValues(attribute).map(value => {
                                        const isSelected = attributeValues[attribute]?.includes(value);
                                        const isColor = isColorAttribute(attribute) && isHexColor(value);

                                        return (
                                            <button
                                                key={value}
                                                type="button"
                                                onClick={() => handleToggleValue(attribute, value)}
                                                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${isSelected
                                                    ? isColor
                                                        ? 'ring-2 ring-primary ring-offset-2'
                                                        : 'bg-primary text-black'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                style={isSelected && isColor ? {
                                                    backgroundColor: value,
                                                    color: getContrastColor(value)
                                                } : {}}
                                            >
                                                {isColor && isHexColor(value) ? (
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className="w-4 h-4 rounded-full border border-gray-300"
                                                            style={{ backgroundColor: value }}
                                                        />
                                                        {value}
                                                    </span>
                                                ) : (
                                                    value
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Action Buttons */}
                        <div className="flex gap-4 mt-4">
                            <button
                                type="button"
                                onClick={handlePreviewCombinations}
                                className="px-6 py-2 bg-stone-200 text-black rounded hover:bg-stone-300 transition"
                            >
                                Preview Combinations
                            </button>
                            <button
                                type="button"
                                onClick={handleApplyCombinations}
                                className="px-6 py-2 bg-primary text-white rounded hover:bg-primary-hover transition cursor-pointer"
                            >
                                Apply Combinations
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Preview Generated Combinations */}
            {generatedVariants.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-3">
                        Preview: {generatedVariants.length} Combinations
                    </h4>
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {generatedVariants.map((combo, idx) => (
                            <div key={idx} className="text-sm text-gray-700 py-2 px-3 border-b border-blue-100 last:border-0 bg-white rounded">
                                <div className="flex flex-wrap items-center gap-2">
                                    {Object.entries(combo).map(([key, value], i, arr) => {
                                        const isColor = isColorAttribute(key) && isHexColor(value);
                                        return (
                                            <span key={key} className="inline-flex items-center gap-1">
                                                <span className="font-medium text-gray-500">{key}:</span>
                                                {isColor ? (
                                                    <span
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                                                        style={{
                                                            backgroundColor: value,
                                                            color: getContrastColor(value)
                                                        }}
                                                    >
                                                        {value}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-900">{value}</span>
                                                )}
                                                {i < arr.length - 1 && <span className="text-gray-300 mx-1">→</span>}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Box - Show when no variants */}
            {variants.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-teal-700">
                        <strong>Tip:</strong> Build combinations by selecting attributes and their values,
                        then click "Apply Combinations" to generate all possible variants automatically.
                        Each combination becomes a unique SKU with its own price, stock, and image.
                    </p>
                </div>
            )}

            {/* Variants List */}
            {variants.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-2 space-y-4 border border-orange-200">
                    <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">
                            Product Variants ({variants.length})
                        </h4>
                        <div className="text-sm text-gray-600">
                            <span className="font-medium">Total Stock:</span> {totalStock} units
                        </div>
                    </div>

                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-3 text-xs font-bold text-gray-700 bg-white/50 p-3 shadow border border-amber-100 rounded">
                        <div className="col-span-3">Variant Combination</div>
                        <div className="col-span-2">SKU *</div>
                        <div className="col-span-2">Selling Price *</div>
                        <div className="col-span-2">Unit Cost (৳)</div>
                        <div className="col-span-1">Stock *</div>
                        <div className="col-span-1">Image *</div>
                        <div className="col-span-1 text-center">Action</div>
                    </div>

                    {/* Variant Rows */}
                    {variants.map((variant, index) => (
                        <div
                            key={variant.id || index}
                            className="grid grid-cols-12 gap-3 items-center bg-white rounded-lg px-4 py-2 border border-amber-100 shadow-sm hover:shadow-md transition"
                        >
                            {/* Variant Display with Default Indicator */}
                            <div className="col-span-3">
                                <div className="text-sm text-gray-700 space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {renderVariantDisplay(variant.attributes)}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                    {variant.isDefault && (
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                                            Default
                                        </span>
                                    )}
                                    {variant.id && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                            ID: {variant.id}
                                        </span>
                                    )}
                                </div>
                                {!variant.isDefault && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setVariants(prev =>
                                                prev.map((v, i) => ({
                                                    ...v,
                                                    isDefault: i === index
                                                }))
                                            );
                                        }}
                                        className="text-xs text-secound hover:underline mt-1 cursor-pointer"
                                    >
                                        Set as Default
                                    </button>
                                )}
                            </div>

                            {/* SKU */}
                            <div className="col-span-2">
                                <input
                                    type="text"
                                    value={variant.sku}
                                    onChange={(e) => {
                                        setVariants(prev =>
                                            prev.map((v, i) => i === index ? { ...v, sku: e.target.value } : v)
                                        );
                                    }}
                                    placeholder="SKU-001"
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition text-xs ${!variant.sku
                                        ? 'border-red-300'
                                        : 'border-gray-300'
                                        }`}
                                    required
                                />
                            </div>

                            {/* Price */}
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={variant.price}
                                    onChange={(e) => {
                                        setVariants(prev =>
                                            prev.map((v, i) => i === index ? { ...v, price: e.target.value } : v)
                                        );
                                    }}
                                    placeholder="0.00"
                                    className={`w-full p-2 border rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition text-xs ${!variant.price || parseFloat(variant.price) <= 0
                                        ? 'border-red-300'
                                        : 'border-gray-300'
                                        }`}
                                    required
                                />
                            </div>

                            {/* Unit Cost (Buying Price) */}
                            <div className="col-span-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={variant.costPrice || ''}
                                    onChange={(e) => {
                                        setVariants(prev =>
                                            prev.map((v, i) => i === index ? { ...v, costPrice: e.target.value } : v)
                                        );
                                    }}
                                    placeholder="Cost price"
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition text-xs"
                                />
                            </div>

                            {/* Quantity */}
                            <div className="col-span-1">
                                <input
                                    type="number"
                                    min="0"
                                    value={variant.quantity}
                                    onChange={(e) => {
                                        setVariants(prev =>
                                            prev.map((v, i) => i === index ? { ...v, quantity: e.target.value } : v)
                                        );
                                    }}
                                    placeholder="0"
                                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition text-xs"
                                    required
                                />
                            </div>

                            {/* Image Upload */}
                            <div className="col-span-1">
                                {variant.image ? (
                                    <div className="relative">
                                        <img
                                            src={variant.image}
                                            alt={`Variant ${index + 1}`}
                                            className="w-16 h-16 object-cover rounded border border-gray-300"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setVariants(prev =>
                                                    prev.map((v, i) => i === index ? { ...v, image: "" } : v)
                                                );
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ) : (
                                    <CloudinaryImageInput
                                        onUpload={(url) => {
                                            setVariants(prev =>
                                                prev.map((v, i) => i === index ? { ...v, image: url } : v)
                                            );
                                        }}
                                        required
                                    />
                                )}
                            </div>

                            {/* Remove Button */}
                            <div className="col-spa flex justify-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (variants.length === 1) {
                                            toast.error("At least one variant is required");
                                            return;
                                        }

                                        const updatedVariants = variants.filter((_, i) => i !== index);

                                        // If removed variant was default, make first one default
                                        if (variant.isDefault && updatedVariants.length > 0) {
                                            updatedVariants[0].isDefault = true;
                                        }

                                        setVariants(updatedVariants);
                                        toast.success("Variant removed");
                                    }}
                                    className="w-8 h-8 bg-red-50 text-red-600 rounded hover:bg-red-100 flex items-center justify-center transition"
                                    title="Remove variant"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Summary */}
                    <div className="mt-4 p-3 bg-white/70 rounded border border-orange-200">
                        <p className="text-sm text-gray-700">
                            <strong>Total Variants:</strong> {variants.length} |
                            <strong className="ml-3">Total Stock:</strong> {totalStock} units
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariantProductFields;