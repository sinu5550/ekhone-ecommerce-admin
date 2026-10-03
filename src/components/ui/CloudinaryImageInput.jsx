"use client";

import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";
import { useState } from "react";
import toast from "react-hot-toast";


export default function CloudinaryImageInput({ label = "Upload Image", onUpload }) {

    const { uploadImage, uploading } = useCloudinaryUpload();
    const [preview, setPreview] = useState(null);
    const [error, setError] = useState("");

    const handleFileChange = async (e) => {
        const file = e.target.files[0];

        // Reset states
        setError("");
        setPreview(null);

        if (!file) return;

        // Check file size (5MB = 5 * 1024 * 1024 bytes)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            const errorMsg = "File size must be less than 5MB";
            setError(errorMsg);
            toast.error(errorMsg, {
                duration: 4000,
                position: "top-right",
                icon: "❌",
            });
            e.target.value = ""; // Clear the file input
            return;
        }

        // Check file type - ADDED WebP support here
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
        if (!allowedTypes.includes(file.type)) {
            const errorMsg = "Only JPG, PNG, and WebP files are allowed";
            setError(errorMsg);
            toast.error(errorMsg, {
                duration: 4000,
                position: "top-right",
                icon: "❌",
            });
            e.target.value = "";
            return;
        }

        setPreview(URL.createObjectURL(file));

        // Show uploading toast
        const uploadToast = toast.loading("Uploading image...", {
            position: "top-right",
        });

        try {
            const imageUrl = await uploadImage(file);

            // Update toast on success
            toast.success("Image uploaded successfully!", {
                id: uploadToast,
                duration: 3000,
                position: "top-right",
                icon: "✅",
            });

            if (imageUrl && onUpload) onUpload(imageUrl);

        } catch (error) {
            // Update toast on error
            const errorMsg = error.message || "Failed to upload image";
            setError(errorMsg);
            toast.error(errorMsg, {
                id: uploadToast,
                duration: 4000,
                position: "top-right",
                icon: "❌",
            });
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <label className="block text-xs font-medium text-gray-700">
                {label} <span className="text-rose-500">* </span> <span className="text-[10px] font-normal text-gray-600"> (📁 Max 5MB • 🖼️ JPG/PNG/WebP only)</span>
            </label>
            <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handleFileChange}
                className="w-full p-2 rounded border border-gray-300 mb-2 focus:outline-none focus:ring-1 focus:ring-primary file:mr-4 file:py-0.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-sky-100 file:text-sky-600 hover:file:bg-sky-200"
            />

            {error && (
                <p className="text-sm text-rose-500">{error}</p>
            )}

            {uploading && <p className="text-sm text-gray-500">Uploading...</p>}

            {preview && (
                <img
                    src={preview}
                    alt="preview"
                    className="w-28 h-28 rounded-md object-cover border"
                />
            )}
        </div>
    );
}