"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";

const WarrantyEditModal = ({ isOpen, onClose, warranty, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        reset,
        watch,
        trigger,
        setValue,
    } = useForm({
        mode: "onChange",
        defaultValues: {
            status: true,
            description: "",
            name: "",
            duration: "",
            period: ""
        },
    });

    const descriptionValue = watch("description");
    const periodValue = watch("period");

    // Pre-fill form when warranty data changes or modal opens
    useEffect(() => {
        if (warranty && isOpen) {
            reset({
                name: warranty.name || "",
                duration: warranty.duration?.toString() || "",
                period: warranty.period || "",
                description: warranty.description || "",
                status: warranty.status !== undefined ? warranty.status : true,
            });
        }
    }, [warranty, isOpen, reset]);

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // Validate form before submission
            const isValid = await trigger();
            if (!isValid) {
                toast.error("Please fix form errors before submitting");
                return;
            }

            // Format data - ensure period is lowercase for consistency
            const formattedData = {
                ...data,
                period: data.period.toLowerCase(),
                duration: parseInt(data.duration),
                status: Boolean(data.status)
            };

            await apiClient(`/api/warranty/${warranty.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });

            toast.success("Warranty updated successfully!");
            onSuccess();
        } catch (error) {
            console.error("Error updating warranty:", error);
            toast.error(error.message || "Failed to update warranty");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    // Quick status toggle handler
    const handleQuickStatusToggle = (newStatus) => {
        setValue("status", newStatus, { shouldDirty: true });
    };

    if (!warranty) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Edit Warranty"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Warranty ID Display */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Warranty ID:</span> {warranty.id}
                    </p>
                </div>

                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Warranty Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        {...register("name", {
                            required: "Warranty name is required",
                            minLength: {
                                value: 2,
                                message: "Minimum 2 characters required"
                            },
                            maxLength: {
                                value: 50,
                                message: "Maximum 50 characters allowed"
                            },
                            pattern: {
                                value: /^[a-zA-Z0-9\s\-_]+$/,
                                message: "Only letters, numbers, spaces, hyphens and underscores allowed"
                            }
                        })}
                        className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.name ? "border-red-300" : "border-gray-300"
                            }`}
                        placeholder="Enter warranty name"
                        disabled={loading}
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/* Duration & Period Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Duration */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Duration <span className="text-rose-500">*</span>
                        </label>
                        <input
                            {...register("duration", {
                                required: "Duration is required",
                                min: {
                                    value: 1,
                                    message: "Duration must be at least 1"
                                },
                                max: {
                                    value: 100,
                                    message: "Duration cannot exceed 100"
                                },
                                pattern: {
                                    value: /^[1-9]\d*$/,
                                    message: "Only positive numbers allowed"
                                },
                                valueAsNumber: true
                            })}
                            type="number"
                            min="1"
                            max="100"
                            className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.duration ? "border-red-300" : "border-gray-300"
                                }`}
                            placeholder="e.g., 12"
                            disabled={loading}
                        />
                        {errors.duration && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.duration.message}
                            </p>
                        )}
                    </div>

                    {/* Period Dropdown */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Period <span className="text-rose-500">*</span>
                        </label>
                        <select
                            {...register("period", {
                                required: "Please select a period",
                            })}
                            className={`w-full p-2.5 rounded border bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${errors.period ? "border-red-300" : "border-gray-300"
                                }`}
                            disabled={loading}
                        >
                            <option value="">Select Period</option>
                            <option value="day">Day</option>
                            <option value="month">Month</option>
                            <option value="year">Year</option>
                        </select>
                        {errors.period && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.period.message}
                            </p>
                        )}
                        {periodValue && (
                            <p className="text-xs text-gray-500 mt-1">
                                Selected: {periodValue.charAt(0).toUpperCase() + periodValue.slice(1)}
                            </p>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                        <span className="text-gray-400 text-xs font-normal ml-1">
                            (Optional)
                        </span>
                    </label>
                    <textarea
                        {...register("description", {
                            maxLength: {
                                value: 500,
                                message: "Description cannot exceed 500 characters"
                            },
                        })}
                        rows={3}
                        className={`w-full p-2.5 rounded border focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none ${errors.description ? "border-red-300" : "border-gray-300"
                            }`}
                        placeholder="Enter warranty description (optional)"
                        disabled={loading}
                    />
                    {errors.description && (
                        <p className="text-sm text-red-600 mt-1">
                            {errors.description.message}
                        </p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500">
                            {descriptionValue?.length || 0}/500 characters
                        </p>
                        {descriptionValue?.length > 450 && (
                            <p className="text-xs text-amber-600">
                                Approaching character limit
                            </p>
                        )}
                    </div>
                </div>

                {/* Status with Quick Toggle */}
                <div className={`flex items-center justify-between p-3 rounded border ${loading ? "bg-gray-100" : "bg-gray-50"
                    } border-gray-200`}>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            {...register("status")}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2 disabled:opacity-50"
                            disabled={loading}
                        />
                        <label className={`text-sm font-medium ${loading ? "text-gray-500" : "text-gray-700"}`}>
                            Warranty Status
                        </label>
                    </div>

                    {/* Quick Status Toggle Buttons */}
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleQuickStatusToggle(false)}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${!watch("status")
                                ? "bg-red-100 text-red-700 border-red-300"
                                : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-red-50"
                                }`}
                            disabled={loading}
                        >
                            Inactive
                        </button>
                        <button
                            type="button"
                            onClick={() => handleQuickStatusToggle(true)}
                            className={`px-3 py-1 text-xs rounded border transition-colors ${watch("status")
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-gray-100 text-gray-600 border-gray-300 hover:bg-green-50"
                                }`}
                            disabled={loading}
                        >
                            Active
                        </button>
                    </div>
                </div>

                {/* Current Status Display */}
                <div className={`p-3 rounded-lg border ${warranty.status
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                    }`}>
                    <p className="text-sm font-medium">
                        Current Status:{" "}
                        <span className={
                            warranty.status ? "text-green-700" : "text-red-700"
                        }>
                            {warranty.status ? "Active" : "Inactive"}
                        </span>
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        This shows the current status before your changes
                    </p>
                </div>

                {/* Form Help Text */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-xs text-teal-700">
                        <strong>Note:</strong> Changes will be applied immediately.
                        Warranty duration and period will be combined (e.g., "12 Months").
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
                        disabled={!isValid || loading || !isDirty}
                        className={`px-6 py-2.5 rounded font-medium transition-all duration-200 ${!isValid || loading || !isDirty
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-secound hover:bg-secound-hover text-white cursor-pointer transform hover:scale-105"
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating...
                            </span>
                        ) : (
                            "Update Warranty"
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default WarrantyEditModal;