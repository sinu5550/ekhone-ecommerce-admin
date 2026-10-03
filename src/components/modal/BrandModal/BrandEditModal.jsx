"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import toast from "react-hot-toast";
import Image from "next/image";

const BrandEditModal = ({ isOpen, onClose, brand, onSuccess }) => {

    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [isImageDirty, setIsImageDirty] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        reset,
        setError,
        clearErrors,
        watch
    } = useForm({
        mode: "onChange",
        defaultValues: {
            name: ""
        }
    });

    // Reset form whenever brand changes
    useEffect(() => {
        if (brand) {
            reset({
                name: brand?.name || "",
            });
            setImageUrl(brand?.image || "");
            setIsImageDirty(false);
        }
    }, [brand, reset]);

    const handleImageUpload = (url) => {
        setImageUrl(url);
        setIsImageDirty(url !== brand?.image);
        clearErrors("image");
    };

    const handleImageError = (error) => {
        setError("image", { type: "manual", message: error });
    };

    // Check if there are any changes (form fields OR image)
    const hasChanges = isDirty || isImageDirty;

    const onSubmit = async (data) => {
        if (!brand) return;

        try {
            setLoading(true);
            const payload = {
                ...data,
                image: imageUrl
            };

            await apiClient(`/api/brands/${brand.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            toast.success("Brand updated successfully!");
            onSuccess();
        } catch (error) {
            console.error("Error updating brand:", error);
            toast.error(error.message || "Failed to update brand. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        setImageUrl("");
        setIsImageDirty(false);
        onClose();
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Update Brand"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        {...register("name", {
                            required: "Name is required",
                            minLength: { value: 2, message: "Minimum 2 characters" },
                            maxLength: { value: 50, message: "Maximum 50 characters" },
                        })}
                        className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Brand Name"
                    />
                    {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                {/* Cloudinary Upload */}
                <div>
                    <CloudinaryImageInput
                        label="Brand Image/Icon"
                        initialImage={brand?.image}
                        onUpload={handleImageUpload}
                        onError={handleImageError}
                    />
                    {!imageUrl && errors.image && (
                        <p className="text-sm text-red-600 mt-1">{errors.image.message}</p>
                    )}
                    {imageUrl && (
                        <p className="text-sm text-green-600 mt-1 flex items-center">
                            <Image src={imageUrl} alt="Uploaded" width={60} height={60} className="mr-2 rounded cursor-zoom-in" />
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            {brand?.image === imageUrl ? "Current image" : "New image uploaded successfully"}
                        </p>
                    )}
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
                        disabled={!isValid || loading || !imageUrl || !hasChanges}
                        className={`px-6 py-2.5 rounded font-medium transition-all duration-200 ${!isValid || loading || !imageUrl || !hasChanges
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-secound hover:bg-secound-hover text-white cursor-pointer"
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating...
                            </span>
                        ) : (
                            "Update Brand"
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default BrandEditModal;