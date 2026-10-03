"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";

const CollectionEditModal = ({ isOpen, onClose, collection, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid },
        reset,
    } = useForm({
        mode: "onChange"
    });

    useEffect(() => {
        if (collection && isOpen) {
            reset({
                name: collection.name || "",
                slug: collection.slug || "",
                priority: collection.priority || 1,
                status: collection.status !== undefined ? String(collection.status) : "true"
            });
        }
    }, [collection, isOpen, reset]);

    const onSubmit = async (data) => {
        if (!collection?.id) return;

        try {
            setLoading(true);

            const payload = {
                name: data.name.trim(),
                slug: data.slug.trim(),
                priority: data.priority ? parseInt(data.priority) : 1,
                status: data.status === true || data.status === "true",
            };

            await apiClient(`/api/collections/${collection.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            toast.success("Collection updated successfully!");
            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error("Error updating Collection:", error);
            toast.error(error.message || "Failed to update collection");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Collection"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Collection Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Collection Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        {...register("name", {
                            required: "Collection name is required",
                            minLength: { value: 2, message: "Minimum 2 characters" },
                            maxLength: { value: 100, message: "Maximum 100 characters" },
                        })}
                        className={`w-full p-2.5 rounded border ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                        placeholder="Collection Name"
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
                    )}
                </div>

                {/* Slug */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Slug <span className="text-rose-500">*</span>
                    </label>
                    <input
                        {...register("slug", {
                            required: "Slug is required",
                            pattern: {
                                value: /^[a-z0-9-]+$/,
                                message: "Slug can only contain lowercase letters, numbers, and hyphens"
                            }
                        })}
                        className={`w-full p-2.5 rounded border ${errors.slug ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent`}
                        placeholder="collection-slug"
                    />
                    {errors.slug && (
                        <p className="text-sm text-red-600 mt-1">{errors.slug.message}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Priority Order
                        </label>
                        <input
                            type="number"
                            min="1"
                            {...register("priority", {
                                min: { value: 1, message: "Minimum value is 1" }
                            })}
                            className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="1"
                        />
                        <p className="text-xs text-gray-500 mt-1">Lower numbers display first (e.g. 1, 2, 3)</p>
                    </div>

                    {/* Status (Publish / Unpublish) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Status
                        </label>
                        <select
                            {...register("status")}
                            className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                        >
                            <option value="true">Published</option>
                            <option value="false">Unpublished</option>
                        </select>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 border border-gray-300 rounded bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={!isValid || loading}
                        className={`px-6 py-2.5 rounded font-medium transition-all duration-200 ${
                            !isValid || loading
                                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                : "bg-secound hover:bg-secound-hover text-white cursor-pointer"
                        }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saving...
                            </span>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default CollectionEditModal;
