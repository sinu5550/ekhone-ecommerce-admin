"use client";

import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { useCategories } from "@/lib/dataFetch";

const SubCategoryAddModal = ({ isOpen, onClose, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories();

    const activeCategories = useMemo(() => {
        return categoriesData.filter(category => Boolean(category.status) && Boolean(category.mainCategory?.status));
    }, [categoriesData]);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        reset,
        setError,
    } = useForm({
        mode: "onChange",
        defaultValues: {
            priority: 1,
            categoryId: "",
            name: "",
            status: true,
        }
    });


    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const payload = {
                ...data,
                priority: data.priority !== "" && data.priority !== undefined ? parseInt(data.priority) : 1,
                categoryId: parseInt(data.categoryId),
            };

            await apiClient("/api/sub-categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            toast.success("Sub Category added successfully!");
            reset();
            onSuccess();
        } catch (error) {
            console.error("Error adding category:", error);

            if (error.message?.includes("duplicate") || error.message?.includes("unique")) {
                setError("name", {
                    type: "manual",
                    message: "Sub Category with this name or code already exists."
                });
                toast.error("Sub Category already exists");
            } else {
                toast.error(error.message || "Failed to create sub category. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add Sub Category"
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
                        placeholder="Category Name"
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
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
                        <p className="text-sm text-red-600 mt-1">{errors.priority.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                        Lower number appears first (1 is shown first)
                    </p>
                </div>

                {/*  Category Dropdown */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                        {...register("categoryId", {
                            required: "Category is required",
                            validate: value => value !== "" || "Please select a Category"
                        })}
                        className="w-full p-2.5 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={categoriesLoading}
                    >
                        <option value="">Select Category</option>
                        {activeCategories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name} ({category.code})
                            </option>
                        ))}
                    </select>
                    {errors.categoryId && (
                        <p className="text-sm text-red-600 mt-1">{errors.categoryId.message}</p>
                    )}
                    {categoriesLoading && (
                        <p className="text-sm text-gray-500 mt-1">Loading categories...</p>
                    )}
                    {activeCategories.length === 0 && !categoriesLoading && (
                        <p className="text-sm text-amber-600 mt-1">
                            No active categories available. Please create or activate a category first.
                        </p>
                    )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded">
                    <input
                        type="checkbox"
                        {...register("status")}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                        Active Sub Category
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
                        disabled={!isValid || loading || !isDirty || categoriesLoading || categoriesData.length === 0}
                        className={`px-6 py-2.5 rounded font-medium transition-all duration-200 ${!isValid || loading || !isDirty || categoriesLoading || categoriesData.length === 0
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

export default SubCategoryAddModal;