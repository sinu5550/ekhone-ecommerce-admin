"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { Plus, X, Trash2, Pipette } from "lucide-react";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";

const VariantAttributesAddModal = ({ isOpen, onClose, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const [values, setValues] = useState([""]);
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [currentColorIndex, setCurrentColorIndex] = useState(null);

    // Refs for click outside handling
    const colorPickerRef = useRef(null);
    const colorButtonsRef = useRef([]);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        reset,
        watch,
        trigger,
        setError,
        clearErrors,
    } = useForm({
        mode: "onChange",
        defaultValues: {
            variant: "",
        },
    });

    const variantValue = watch("variant");
    const isColorAttribute = variantValue?.toLowerCase().includes("color");

    // Predefined colors for quick selection
    const predefinedColors = [
        "#FF0000", // Red
        "#0000FF", // Blue
        "#00FF00", // Green
        "#FFFF00", // Yellow
        "#FFA500", // Orange
        "#800080", // Purple
        "#FFC0CB", // Pink
        "#000000", // Black
        "#FFFFFF", // White
        "#808080", // Gray
        "#A52A2A", // Brown
        "#00FFFF", // Cyan
        "#FF00FF", // Magenta
        "#008000", // Dark Green
        "#800000", // Maroon
        "#000080", // Navy
    ];

    // Handle click outside to close color picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                colorPickerRef.current &&
                !colorPickerRef.current.contains(event.target) &&
                !colorButtonsRef.current.some(ref => ref && ref.contains(event.target))
            ) {
                setShowColorPicker(false);
                setCurrentColorIndex(null);
            }
        };

        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            // Also handle touch events for mobile
            document.addEventListener('touchstart', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showColorPicker]);

    // Reset color picker refs array when values change
    useEffect(() => {
        colorButtonsRef.current = colorButtonsRef.current.slice(0, values.length);
    }, [values]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            reset({
                variant: "",
            });
            setValues([""]);
            setShowColorPicker(false);
            setCurrentColorIndex(null);
        }
    }, [isOpen, reset]);

    // Value management functions
    const addValue = () => {
        if (values.length >= 20) {
            toast.error("Maximum 20 values allowed");
            return;
        }
        setValues([...values, ""]);
    };

    const removeValue = (index) => {
        if (values.length === 1) {
            // Don't remove the last empty value, just clear it
            setValues([""]);
            return;
        }
        setValues(values.filter((_, i) => i !== index));
    };

    const updateValue = (index, newValue) => {
        const newValues = [...values];
        newValues[index] = newValue.trim();
        setValues(newValues);
    };

    const updateColorValue = (index, colorHex) => {
        const newValues = [...values];
        newValues[index] = colorHex;
        setValues(newValues);
        // Keep the color picker open for further selections
        // Don't close automatically
    };

    const openColorPicker = (index, event) => {
        event.stopPropagation(); // Prevent event bubbling
        setCurrentColorIndex(index);
        setShowColorPicker(true);
    };

    const validateValues = () => {
        const nonEmptyValues = values.filter(value => value.trim() !== "");

        // if (nonEmptyValues.length === 0) {
        //     setError("values", {
        //         type: "manual",
        //         message: "At least one value is required"
        //     });
        //     return false;
        // }

        // Check for duplicates
        const uniqueValues = new Set(nonEmptyValues.map(v => v.toLowerCase()));
        if (uniqueValues.size !== nonEmptyValues.length) {
            setError("values", {
                type: "manual",
                message: "Duplicate values are not allowed"
            });
            return false;
        }

        // Check individual value length
        for (const value of nonEmptyValues) {
            if (value.length > 50) {
                setError("values", {
                    type: "manual",
                    message: "Each value must be less than 50 characters"
                });
                return false;
            }
        }

        clearErrors("values");
        return true;
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // Validate form before submission
            const isFormValid = await trigger();
            if (!isFormValid) {
                toast.error("Please fix form errors before submitting");
                return;
            }

            // Validate values
            if (!validateValues()) {
                return;
            }

            // Prepare data for submission
            const nonEmptyValues = values.filter(value => value.trim() !== "");
            const formattedData = {
                variant: data.variant.trim(),
                values: nonEmptyValues
            };

            await apiClient("/api/variant-attributes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });

            toast.success("Variant attribute created successfully!");
            reset();
            setValues([""]);
            onSuccess();
        } catch (error) {
            console.error("Error creating variant attribute:", error);
            toast.error(error.message || "Failed to create variant attribute");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        setValues([""]);
        setShowColorPicker(false);
        setCurrentColorIndex(null);
        onClose();
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add Variant Attribute"
            size="lg"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Variant Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Variant Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        {...register("variant", {
                            required: "Variant name is required",
                            minLength: {
                                value: 2,
                                message: "Minimum 2 characters required"
                            },
                            maxLength: {
                                value: 50,
                                message: "Maximum 50 characters allowed"
                            },
                            pattern: {
                                value: /^[a-zA-Z\s]+$/,
                                message: "Only letters and spaces allowed"
                            }
                        })}
                        className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.variant ? "border-red-300" : "border-gray-300"
                            }`}
                        placeholder="Enter variant name (e.g., Size, Color, Material)"
                        disabled={loading}
                    />
                    {errors.variant && (
                        <p className="text-sm text-red-600 mt-2">
                            {errors.variant.message}
                        </p>
                    )}
                    {isColorAttribute && (
                        <p className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                            <Pipette size={14} />
                            Color attribute detected. You can use the color picker to select colors.
                        </p>
                    )}
                </div>

                {/* Values Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                            Values <span className="text-rose-500">*</span>
                        </label>
                        <button
                            type="button"
                            onClick={addValue}
                            disabled={values.length >= 20 || loading}
                            className="flex items-center gap-1 px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Plus size={14} />
                            Add Value
                        </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                        {values.map((value, index) => (
                            <div key={index} className="flex items-center gap-2">
                                {isColorAttribute ? (
                                    // Color picker input for color attributes
                                    <div className="flex-1 flex items-center gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={value}
                                                onChange={(e) => updateValue(index, e.target.value)}
                                                onBlur={() => validateValues()}
                                                className={`w-full p-2.5 pl-10 rounded border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.values ? "border-red-300" : "border-gray-300"
                                                    }`}
                                                placeholder={`Color ${index + 1} (e.g., #FF0000 for Red)`}
                                                disabled={loading}
                                                maxLength={50}
                                            />
                                            {value && /^#[0-9A-F]{6}$/i.test(value) && (
                                                <div
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded border border-gray-300"
                                                    style={{ backgroundColor: value }}
                                                />
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            ref={el => colorButtonsRef.current[index] = el}
                                            onClick={(e) => openColorPicker(index, e)}
                                            className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                            title="Pick color"
                                        >
                                            <Pipette size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    // Regular text input for non-color attributes
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => updateValue(index, e.target.value)}
                                        onBlur={() => validateValues()}
                                        className={`flex-1 p-2.5 rounded border focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary ${errors.values ? "border-red-300" : "border-gray-300"
                                            }`}
                                        placeholder={`Value ${index + 1} (e.g., ${getExampleValue(variantValue, index)})`}
                                        disabled={loading}
                                        maxLength={50}
                                    />
                                )}
                                <button
                                    type="button"
                                    onClick={() => removeValue(index)}
                                    disabled={loading || (values.length === 1 && value === "")}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Color Picker Popup */}
                    {showColorPicker && currentColorIndex !== null && (
                        <div
                            ref={colorPickerRef}
                            className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg relative z-50"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-medium text-gray-700">Select Color</h4>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowColorPicker(false);
                                        setCurrentColorIndex(null);
                                    }}
                                    className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                >
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Predefined Colors Grid */}
                            <div className="grid grid-cols-8 gap-2 mb-4">
                                {predefinedColors.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateColorValue(currentColorIndex, color);
                                        }}
                                        className="w-8 h-8 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
                                        style={{ backgroundColor: color }}
                                        title={color}
                                    />
                                ))}
                            </div>

                            {/* Custom Color Input */}
                            <div className="flex items-center gap-3">
                                <label className="text-sm text-gray-600">Custom:</label>
                                <input
                                    type="color"
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        updateColorValue(currentColorIndex, e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-10 h-10 p-1 border border-gray-300 rounded cursor-pointer"
                                    value={values[currentColorIndex] && /^#[0-9A-F]{6}$/i.test(values[currentColorIndex]) ? values[currentColorIndex] : "#000000"}
                                />
                                <span className="text-xs text-gray-500">
                                    Click to open system color picker
                                </span>
                            </div>

                            {/* Optional: Hex input for manual entry */}
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={values[currentColorIndex] || ""}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        updateColorValue(currentColorIndex, e.target.value);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    placeholder="Enter hex code (e.g., #FF0000)"
                                    className="w-full p-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                    maxLength={7}
                                />
                            </div>
                        </div>
                    )}

                    {errors.values && (
                        <p className="text-sm text-red-600 mt-2">
                            {errors.values.message}
                        </p>
                    )}

                    <div className="flex justify-between items-center mt-2">
                        <p className="text-xs text-gray-500">
                            {values.filter(v => v.trim() !== "").length} value(s) added
                        </p>
                        <p className="text-xs text-gray-500">
                            {values.length}/20 slots used
                        </p>
                    </div>
                </div>

                {/* Help Text - Dynamic based on attribute type */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-sky-700 mb-1">
                        About Variant {isColorAttribute ? "Colors" : "Attributes"}
                    </h4>
                    <ul className="text-xs text-sky-600 space-y-1">
                        {isColorAttribute ? (
                            <>
                                <li>• Color attributes use hex codes (e.g., #FF0000 for Red)</li>
                                <li>• Use the color picker to select colors visually</li>
                                <li>• You can also enter hex codes manually</li>
                                <li>• Colors will be displayed as swatches in the product page</li>
                            </>
                        ) : (
                            <>
                                <li>• Variant attributes define product variations like Size, Color, etc.</li>
                                <li>• Values represent the available options (e.g., S, M, L for Size)</li>
                                <li>• You can add multiple values for each variant attribute</li>
                                <li>• Values will be used when creating product variants</li>
                            </>
                        )}
                    </ul>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={!isValid || loading || !isDirty || values.filter(v => v.trim() !== "").length === 0}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${!isValid || loading || !isDirty || values.filter(v => v.trim() !== "").length === 0
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-secound hover:bg-secound-hover text-white cursor-pointer transform hover:scale-105"
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Creating...
                            </span>
                        ) : (
                            "Create Variant Attribute"
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

// Helper function to generate example values based on variant type
const getExampleValue = (variant, index) => {
    const variantLower = variant?.toLowerCase() || "";

    if (variantLower.includes("color")) {
        const colors = ["Red", "Blue", "Green", "Black", "White"];
        return colors[index % colors.length];
    } else if (variantLower.includes("size")) {
        const sizes = ["S", "M", "L", "XL", "XXL"];
        return sizes[index % sizes.length];
    } else if (variantLower.includes("material")) {
        const materials = ["Cotton", "Polyester", "Wool", "Silk", "Leather"];
        return materials[index % materials.length];
    } else {
        const defaults = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5"];
        return defaults[index % defaults.length];
    }
};

export default VariantAttributesAddModal;