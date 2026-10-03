"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";

const UnitAddModal = ({ isOpen, onClose, onSuccess }) => {

    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        reset
    } = useForm({
        mode: "onChange"
    });


    const onSubmit = async (data) => {
        try {
            setLoading(true);
            await apiClient("/api/unit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
            toast.success("Unit added successfully!");
            reset();
            onSuccess();
        } catch (error) {
            console.error("Error adding Brand:", error);
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
            title="Add Unit"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                {/*Brand  Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        {...register("name", {
                            required: "Brand name is required",
                            minLength: { value: 2, message: "Minimum 2 characters" },
                            maxLength: { value: 50, message: "Maximum 50 characters" },
                        })}
                        className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Brand Name"
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600 mt-1">
                            {errors.name.message}
                        </p>
                    )}
                </div>

                {/*Brand short Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                     Unit   Short Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                        {...register("shortName", {
                            required: "unit short name is required",
                            minLength: { value: 1, message: "Minimum 1 characters" },
                            maxLength: { value: 20, message: "Maximum 20 characters" },
                        })}
                        className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Unit short name"
                    />
                    {errors.shortName && (
                        <p className="text-sm text-red-600 mt-1">
                            {errors.shortName.message}
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
                        disabled={!isValid || loading || !isDirty}
                        className={`px-6 py-2.5 rounded font-medium transition-all duration-200 ${!isValid || loading || !isDirty
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


export default UnitAddModal;