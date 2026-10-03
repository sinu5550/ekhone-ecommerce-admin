"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import toast from "react-hot-toast";


const MainCategoryAddModal = ({ isOpen, onClose, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        reset,
        setError,
        clearErrors,
        watch,
    } = useForm({
        mode: "onChange",
        defaultValues: {
            priority: 1,
            status: true,
            description: "",
        },
    });


    const descriptionValue = watch("description");

    const handleImageUpload = useCallback((url) => {
        setImageUrl(url);
        clearErrors("image");
    }, [clearErrors]);

    const handleImageError = useCallback((error) => {
        setError("image", { type: "manual", message: error });
    }, [setError]);

    const onSubmit = async (data) => {
        if (!imageUrl) {
            toast.error("Please upload an image before submitting.");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                ...data,
                priority: data.priority !== "" && data.priority !== undefined ? parseInt(data.priority) : 1,
                image: imageUrl,
            };

            await apiClient("/api/main-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            toast.success("Main category added successfully!");
            reset();
            setImageUrl("");
            onSuccess();
        } catch (error) {
            console.error("Error adding main category:", error);

            if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
                setError("name", {
                    type: "manual",
                    message: "Category with this name or code already exists."
                });
                toast.error("Category already exists");
            } else {
                toast.error(error.message || "Failed to create main category. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        setImageUrl("");
        onClose();
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add Main Category"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">


                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        {...register("name", {
                            required: "Name is required",
                            minLength: { value: 2, message: "Minimum 2 characters" },
                            maxLength: { value: 50, message: "Maximum 50 characters" },
                        })}
                        className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Main Category Name"
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/* Priority */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority / Sort Order <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="number"
                        min="1"
                        {...register("priority", {
                            required: "Priority is required",
                            min: { value: 1, message: "Minimum priority is 1" },
                            valueAsNumber: true,
                        })}
                        className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="e.g., 1 (1 displays first)"
                    />
                    {errors.priority && (
                        <p className="text-sm text-red-600 mt-1">
                            {errors.priority.message}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        Lower number appears first (1 is shown first)
                    </p>
                </div>

                {/* Cloudinary Upload */}
                <div>
                    <CloudinaryImageInput
                        label="Icon"
                        onUpload={handleImageUpload}
                        onError={handleImageError}
                        required
                    />
                    {!imageUrl && errors.image && (
                        <p className="text-sm text-red-600 mt-1">{errors.image.message}</p>
                    )}
                    {imageUrl && (
                        <p className="text-sm text-green-600 mt-1 flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            Image uploaded successfully
                        </p>
                    )}
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        {...register("description", {
                            maxLength: { value: 200, message: "Description cannot exceed 200 characters" },
                        })}
                        rows={3}
                        className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Optional description for the category"
                    />
                    {errors.description && (
                        <p className="text-sm text-red-600 mt-1">
                            {errors.description.message}
                        </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        {descriptionValue?.length || 0}/200 characters
                    </p>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <input
                        type="checkbox"
                        {...register("status")}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                        Active Main Category
                    </label>
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
                        disabled={!isValid || loading || !imageUrl || !isDirty}
                        className={`px-6 py-2.5 rounded font-medium transition-all duration-200 ${!isValid || loading || !imageUrl || !isDirty
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-secound hover:bg-secound-hover text-white cursor-pointer"
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Adding...
                            </span>
                        ) : (
                            "Add Category"
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default MainCategoryAddModal;