"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { divisions, districts, upazilas } from "@/lib/data";

const CustomerAddModal = ({ isOpen, onClose, onSuccess, zIndex = "z-50" }) => {


    const [loading, setLoading] = useState(false);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [filteredUpazilas, setFilteredUpazilas] = useState([]);
    const [addressType, setAddressType] = useState("Home");

    const defaultValues = {
        fullName: "",
        email: "",
        phone: "",
        status: true,
        // Address fields
        address: "",
        upazila: "",
        postalCode: "",
        district: "",
        division: "",
        city: "",
        country: "Bangladesh",
        type: "Home",
        isDefault: true
    };

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isDirty },
        reset,
        trigger,
        watch,
        setValue,
    } = useForm({
        mode: "onChange",
        defaultValues,
    });

    // Watch for changes in division, district, and upazila
    const selectedDivision = watch("division");
    const selectedDistrict = watch("district");
    const selectedUpazila = watch("upazila");
    const isDefault = watch("isDefault");
    const phone = watch("phone");

    // Filter districts based on selected division
    useEffect(() => {
        if (selectedDivision) {
            const divisionData = divisions.find((div) => div.name === selectedDivision);
            if (divisionData) {
                const districtList = districts.filter(
                    (dist) => dist.division_id === divisionData.id
                );
                setFilteredDistricts(districtList);
                setValue("city", selectedDivision);
            }
            // Reset dependent fields
            setValue("district", "");
            setValue("upazila", "");
            setFilteredUpazilas([]);
        } else {
            setFilteredDistricts([]);
            setFilteredUpazilas([]);
        }
    }, [selectedDivision, setValue]);

    // Filter upazilas based on selected district
    useEffect(() => {
        if (selectedDistrict) {
            const districtData = districts.find((dist) => dist.name === selectedDistrict);
            if (districtData) {
                const upazilaList = upazilas.filter(
                    (upazila) => upazila.district_id === districtData.id
                );
                setFilteredUpazilas(upazilaList);
            }
            setValue("upazila", "");
        } else {
            setFilteredUpazilas([]);
        }
    }, [selectedDistrict, setValue]);

    // Reset form when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            reset(defaultValues);
            setFilteredDistricts([]);
            setFilteredUpazilas([]);
            setAddressType("Home");
        }
    }, [isOpen, reset]);

    const handleClose = useCallback(() => {
        reset(defaultValues);
        onClose();
    }, [reset, onClose]);



    const validateBangladeshiPhone = (phone) => {
        // Remove any non-digit characters
        const cleaned = phone.replace(/\D/g, '');

        // Check if it's a valid Bangladeshi phone number
        const regex = /^(?:\+?88)?01[3-9]\d{8}$/;
        return regex.test('88' + cleaned) || regex.test(cleaned);
    };


    
    const onSubmit = async (data) => {
        try {
            setLoading(true);

            // Validate form before submission
            const isValid = await trigger();
            if (!isValid) {
                toast.error("Please fix form errors before submitting");
                return;
            }

            // Validate Bangladeshi phone number
            if (!validateBangladeshiPhone(data.phone)) {
                toast.error("Please enter a valid Bangladeshi phone number (e.g., 01XXXXXXXXX)");
                return;
            }

            // Format phone number (remove any formatting)
            const formattedPhone = data.phone.replace(/\D/g, '');

            // Format data for API
            const formattedData = {
                fullName: data.fullName.trim(),
                email: data.email.trim() || null,
                phone: formattedPhone,
                status: Boolean(data.status),
                address: data.address.trim(),
                upazila: data.upazila.trim(),
                postalCode: data.postalCode.trim(),
                district: data.district.trim(),
                division: data.division.trim(),
                city: data.city.trim() || data.division.trim(),
                country: data.country.trim(),
                type: data.type,
                isDefault: Boolean(data.isDefault)
            };

            const response = await apiClient("/api/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });

            if (response.success) {
                reset(defaultValues);
                onSuccess(response.data);
            } else {
                throw new Error(response.message || "Failed to add customer");
            }
        } catch (error) {
            console.error("Error adding customer:", error);
            toast.error(error.message || "Failed to add customer");
        } finally {
            setLoading(false);
        }
    };

    // Reusable input field classes
    const inputBaseClasses = "w-full px-3 py-2.5 rounded border focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-colors";
    const inputNormalClasses = "border-gray-300 hover:border-gray-400";
    const inputErrorClasses = "border-red-300 bg-red-50";
    const inputDisabledClasses = "bg-gray-100 cursor-not-allowed";

    const getInputClasses = (hasError, isDisabled = loading) => {
        return `${inputBaseClasses} ${hasError ? inputErrorClasses : inputNormalClasses} ${isDisabled ? inputDisabledClasses : ""}`;
    };

    // Address type options
    const addressTypes = [
        { value: "Home", label: "Home" },
        { value: "Office", label: "Office" },
        { value: "Other", label: "Other" }
    ];

    // Form field configuration
    const formFields = {
        personalInfo: [
            {
                name: "fullName",
                label: "Full Name",
                type: "text",
                required: true,
                validation: {
                    required: "Full name is required",
                    minLength: { value: 2, message: "Full name must be at least 2 characters" },
                    pattern: { value: /^[A-Za-z\s.]+$/, message: "Full name can only contain letters and spaces" }
                }
            },
            {
                name: "email",
                label: "Email (Optional)",
                type: "email",
                required: false,
                validation: {
                    pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Invalid email address"
                    }
                }
            },
            {
                name: "phone",
                label: "Phone",
                type: "tel",
                required: true,
                validation: {
                    required: "Phone number is required"
                }
            }
        ]
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Add New Customer"
            size="5xl"
            zIndex={zIndex}
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formFields.personalInfo.map((field) => (
                            <div key={field.name} className={field.name === "phone" ? "md:col-span-1" : ""}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <input
                                    type={field.type}
                                    {...register(field.name, field.validation)}
                                    className={getInputClasses(!!errors[field.name])}
                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                    disabled={loading}
                                    maxLength={field.name === "phone" ? 11 : undefined}
                                />
                                {errors[field.name] && (
                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                        {errors[field.name].message}
                                    </p>
                                )}
                                {field.name === "phone" && phone && !errors.phone && (
                                    <p className="text-xs text-green-600 mt-1">
                                        ✓ Valid Bangladeshi phone number format
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Address Information Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">Address Information</h3>

                    {/* Address */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            {...register("address", {
                                required: "Address is required",
                                minLength: {
                                    value: 10,
                                    message: "Address must be at least 10 characters"
                                }
                            })}
                            rows={3}
                            className={getInputClasses(!!errors.address)}
                            placeholder="Enter full street address (House/Road/Area/Thana)"
                            disabled={loading}
                        />
                        {errors.address && (
                            <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                {errors.address.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Country */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Country <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("country", { required: "Country is required" })}
                                className={`w-full px-3 py-2.5 rounded border border-gray-300 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent ${loading ? "cursor-not-allowed" : ""}`}
                                value="Bangladesh"
                                readOnly
                                disabled={loading}
                            />
                        </div>

                        {/* Division */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Division <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("division", { required: "Division is required" })}
                                className={getInputClasses(!!errors.division)}
                                disabled={loading}
                            >
                                <option value="">Select Division</option>
                                {divisions?.map((division) => (
                                    <option key={division.id} value={division.name}>
                                        {division.name}
                                    </option>
                                ))}
                            </select>
                            {errors.division && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.division.message}
                                </p>
                            )}
                        </div>

                        {/* City */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("city", {
                                    required: "City is required",
                                    validate: (value) => selectedDivision ? true : "Select division first"
                                })}
                                className={getInputClasses(!!errors.city)}
                                placeholder="Enter city name"
                                disabled={loading || !selectedDivision}
                            />
                            {errors.city && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.city.message}
                                </p>
                            )}
                        </div>

                        {/* District */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                District <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("district", { required: "District is required" })}
                                className={getInputClasses(!!errors.district, loading || !selectedDivision)}
                                disabled={loading || !selectedDivision}
                            >
                                <option value="">
                                    {selectedDivision ? "Select District" : "Select Division First"}
                                </option>
                                {filteredDistricts.map((district) => (
                                    <option key={district.id} value={district.name}>
                                        {district.name}
                                    </option>
                                ))}
                            </select>
                            {errors.district && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.district.message}
                                </p>
                            )}
                        </div>

                        {/* Upazila */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Upazila <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("upazila", { required: "Upazila is required" })}
                                className={getInputClasses(!!errors.upazila, loading || !selectedDistrict)}
                                disabled={loading || !selectedDistrict}
                            >
                                <option value="">
                                    {selectedDistrict ? "Select Upazila" : "Select District First"}
                                </option>
                                {filteredUpazilas.map((upazila) => (
                                    <option key={upazila.id} value={upazila.name}>
                                        {upazila.name}
                                    </option>
                                ))}
                            </select>
                            {errors.upazila && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.upazila.message}
                                </p>
                            )}
                        </div>

                        {/* Postal Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postal Code
                            </label>
                            <input
                                {...register("postalCode", {
                                    pattern: {
                                        value: /^\d{4}$/,
                                        message: "Postal code must be 4 digits"
                                    }
                                })}
                                className={getInputClasses(!!errors.postalCode)}
                                placeholder="Enter 4-digit postal code"
                                disabled={loading}
                                maxLength={4}
                            />
                            {errors.postalCode && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.postalCode.message}
                                </p>
                            )}
                        </div>

                        {/* Address Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("type", { required: "Address type is required" })}
                                className={getInputClasses(!!errors.type)}
                                disabled={loading}
                                onChange={(e) => setAddressType(e.target.value)}
                            >
                                {addressTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                            {errors.type && (
                                <p className="text-sm text-red-600 mt-1">
                                    {errors.type.message}
                                </p>
                            )}
                        </div>

                        {/* Set as Default Address */}
                        <div className="lg:col-span-2 mt-7">
                            <div className={`flex items-center gap-3 px-4 py-3 rounded border transition-colors ${loading ? "bg-gray-100 border-gray-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}>
                                <input
                                    type="checkbox"
                                    {...register("isDefault")}
                                    className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-primary focus:ring-2 disabled:opacity-50"
                                    disabled={loading}
                                    id="isDefault"
                                />
                                <label
                                    htmlFor="isDefault"
                                    className={`text-sm font-medium ${loading ? "text-gray-500" : "text-gray-700"} cursor-pointer`}
                                >
                                    Set as default shipping address
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Status */}
                <div>
                    <div className={`flex items-center gap-3 p-4 rounded border transition-colors ${loading ? "bg-gray-100 border-gray-200" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}`}>
                        <input
                            type="checkbox"
                            {...register("status")}
                            className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-primary focus:ring-2 disabled:opacity-50"
                            disabled={loading}
                            id="status"
                        />
                        <label
                            htmlFor="status"
                            className={`text-sm font-medium ${loading ? "text-gray-500" : "text-gray-700"} cursor-pointer`}
                        >
                            Activate customer account immediately
                        </label>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-6 py-2.5 border border-gray-300 rounded bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-sm"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={!isValid || loading || !isDirty}
                        className={`px-8 py-2.5 rounded font-medium transition-all duration-200 ${!isValid || loading || !isDirty
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-secound hover:bg-secound-hover text-white cursor-pointer"
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Adding Customer...
                            </span>
                        ) : (
                            "Add Customer"
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default CustomerAddModal;