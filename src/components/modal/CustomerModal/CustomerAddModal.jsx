"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { divisions, districts, upazilas } from "@/lib/data";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Home,
    Briefcase,
    Building2,
    CheckCircle2,
    AlertCircle,
    UserPlus,
    Loader2,
    Check,
    X
} from "lucide-react";

const addressTypeOptions = [
    { value: "Home", label: "Home", icon: Home },
    { value: "Office", label: "Office", icon: Briefcase },
    { value: "Other", label: "Other", icon: Building2 }
];

const CustomerAddModal = ({ isOpen, onClose, onSuccess, zIndex = "z-[99999]" }) => {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [filteredDistricts, setFilteredDistricts] = useState([]);
    const [filteredUpazilas, setFilteredUpazilas] = useState([]);

    useEffect(() => {
        setMounted(true);
    }, []);

    const defaultValues = {
        fullName: "",
        email: "",
        phone: "",
        status: true,
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
        formState: { errors },
        reset,
        trigger,
        watch,
        setValue,
    } = useForm({
        mode: "onChange",
        defaultValues,
    });

    const selectedDivision = watch("division");
    const selectedDistrict = watch("district");
    const selectedUpazila = watch("upazila");
    const selectedType = watch("type") || "Home";
    const isDefault = watch("isDefault");
    const status = watch("status");
    const phone = watch("phone");

    // Filter districts based on selected division
    useEffect(() => {
        if (selectedDivision) {
            const divisionData = divisions?.find((div) => div.name === selectedDivision);
            if (divisionData) {
                const districtList = districts.filter(
                    (dist) => dist.division_id === divisionData.id
                );
                setFilteredDistricts(districtList);
                setValue("city", selectedDivision);
            }
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
        }
    }, [isOpen, reset]);

    const handleClose = useCallback(() => {
        reset(defaultValues);
        onClose();
    }, [reset, onClose]);

    // Handle Escape key and body scroll lock
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !loading) {
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, loading, handleClose]);

    const validateBangladeshiPhone = (phoneNum) => {
        if (!phoneNum) return false;
        const cleaned = String(phoneNum).replace(/\D/g, "");
        const regex = /^(?:\+?88)?01[3-9]\d{8}$/;
        return regex.test("88" + cleaned) || regex.test(cleaned);
    };

    const isPhoneValid = phone ? validateBangladeshiPhone(phone) : false;

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const isValid = await trigger();
            if (!isValid) {
                toast.error("Please fix form errors before submitting");
                return;
            }

            if (!validateBangladeshiPhone(data.phone)) {
                toast.error("Please enter a valid Bangladeshi phone number (e.g., 01XXXXXXXXX)");
                return;
            }

            const formattedPhone = data.phone.replace(/\D/g, "");

            const formattedData = {
                fullName: data.fullName.trim(),
                email: data.email?.trim() || null,
                phone: formattedPhone,
                status: Boolean(data.status),
                address: data.address.trim(),
                upazila: data.upazila.trim(),
                postalCode: data.postalCode?.trim() || "",
                district: data.district.trim(),
                division: data.division.trim(),
                city: data.city?.trim() || data.division.trim(),
                country: data.country?.trim() || "Bangladesh",
                type: data.type || "Home",
                isDefault: Boolean(data.isDefault)
            };

            const response = await apiClient("/api/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });

            if (response.success) {
                reset(defaultValues);
                onSuccess?.(response.data);
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

    if (!mounted || typeof document === "undefined") return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed inset-0 ${zIndex} overflow-y-auto flex items-center justify-center p-3 sm:p-4 md:p-6`}>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={loading ? undefined : handleClose}
                    />

                    {/* Modal Window with Fixed Header & Fixed Footer */}
                    <motion.div
                        className="relative w-full max-w-5xl bg-white text-slate-800 rounded-md shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 z-10"
                        initial={{ scale: 0.96, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 8 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Fixed Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-md bg-secound/10 border border-secound/20 flex items-center justify-center text-secound shadow-xs shrink-0">
                                    <UserPlus size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900 font-sans">Add New Customer</h2>
                                    <p className="text-xs text-gray-500 font-sans">
                                        Create a customer profile and default shipping address
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleClose}
                                className="p-1.5 text-gray-500 hover:text-gray-800 transition cursor-pointer rounded-md hover:bg-gray-100"
                                disabled={loading}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <form
                            id="customer-add-form"
                            onSubmit={handleSubmit(onSubmit)}
                            className="flex flex-col flex-1 overflow-hidden"
                        >
                            <div className="flex-1 overflow-y-auto p-6 space-y-5">
                                {/* Section 1: Customer Profile */}
                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-md p-5 shadow-xs">
                                    <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-200/70">
                                        <div className="w-7 h-7 rounded-md bg-secound/10 text-secound flex items-center justify-center text-xs font-semibold">
                                            <User size={15} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                                Customer Profile
                                            </h3>
                                            <p className="text-[11px] text-gray-500">Contact information and basic details</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Full Name */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Full Name <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    {...register("fullName", {
                                                        required: "Full name is required",
                                                        minLength: { value: 2, message: "Full name must be at least 2 characters" },
                                                        pattern: { value: /^[A-Za-z\s.]+$/, message: "Full name can only contain letters and spaces" }
                                                    })}
                                                    placeholder="e.g. Ahmed Siyan"
                                                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 bg-white text-gray-800 placeholder:text-gray-400 placeholder:opacity-100 ${errors.fullName
                                                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                            : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                        }`}
                                                    disabled={loading}
                                                />
                                            </div>
                                            {errors.fullName && (
                                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} /> {errors.fullName.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Phone Number */}
                                        <div>
                                            <div className="flex items-center justify-between mb-1.5">
                                                <label className="block text-xs font-semibold text-gray-700">
                                                    Phone Number <span className="text-red-500">*</span>
                                                </label>
                                                {isPhoneValid && (
                                                    <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle2 size={12} /> Valid BD
                                                    </span>
                                                )}
                                            </div>
                                            <div className="relative">
                                                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold text-gray-600 pr-2 border-r border-gray-200 pointer-events-none">
                                                    <span>🇧🇩</span>
                                                    <span>+88</span>
                                                </div>
                                                <input
                                                    type="tel"
                                                    {...register("phone", {
                                                        required: "Phone number is required"
                                                    })}
                                                    placeholder="01XXXXXXXXX"
                                                    maxLength={11}
                                                    className={`w-full pl-[86px] pr-3.5 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 bg-white text-gray-800 placeholder:text-gray-400 placeholder:opacity-100 font-mono ${errors.phone
                                                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                            : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                        }`}
                                                    disabled={loading}
                                                />
                                            </div>
                                            {errors.phone && (
                                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} /> {errors.phone.message}
                                                </p>
                                            )}
                                        </div>

                                        {/* Email Address */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                                            </label>
                                            <div className="relative">
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="email"
                                                    {...register("email", {
                                                        pattern: {
                                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                            message: "Invalid email address"
                                                        }
                                                    })}
                                                    placeholder="customer@example.com"
                                                    className={`w-full pl-10 pr-3.5 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 bg-white text-gray-800 placeholder:text-gray-400 placeholder:opacity-100 ${errors.email
                                                            ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                            : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                        }`}
                                                    disabled={loading}
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                    <AlertCircle size={12} /> {errors.email.message}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Shipping & Delivery Address */}
                                <div className="bg-slate-50/80 border border-slate-200/80 rounded-md p-5 shadow-xs space-y-4">
                                    <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 flex-wrap gap-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-md bg-secound/10 text-secound flex items-center justify-center text-xs font-semibold">
                                                <MapPin size={15} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                                    Shipping & Delivery Address
                                                </h3>
                                                <p className="text-[11px] text-gray-500">Destination address for parcel delivery</p>
                                            </div>
                                        </div>

                                        {/* Address Type Quick Chips */}
                                        <div className="flex items-center gap-1.5 bg-white p-1 rounded-md border border-gray-200 shadow-2xs">
                                            <span className="text-[11px] font-semibold text-gray-400 px-2">Type:</span>
                                            {addressTypeOptions.map((opt) => {
                                                const Icon = opt.icon;
                                                const isSelected = selectedType === opt.value;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        onClick={() => setValue("type", opt.value)}
                                                        className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${isSelected
                                                                ? "bg-secound text-white shadow-xs"
                                                                : "text-gray-600 hover:bg-gray-100"
                                                            }`}
                                                    >
                                                        <Icon size={13} />
                                                        <span>{opt.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Street Address */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Street Address (House, Road, Area, Landmark) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <textarea
                                                {...register("address", {
                                                    required: "Street address is required",
                                                    minLength: {
                                                        value: 5,
                                                        message: "Address must be at least 5 characters"
                                                    }
                                                })}
                                                rows={2}
                                                placeholder="e.g. House #14, Road #3, Block B, Aftabnagar, Dhaka"
                                                className={`w-full p-3 rounded-md border text-sm transition focus:outline-none focus:ring-2 bg-white text-gray-800 placeholder:text-gray-400 placeholder:opacity-100 ${errors.address
                                                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                        : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                    }`}
                                                disabled={loading}
                                            />
                                        </div>
                                        {errors.address && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                <AlertCircle size={12} /> {errors.address.message}
                                            </p>
                                        )}
                                    </div>

                                    {/* Regional Selectors */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                                        {/* Division */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Division <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                {...register("division", { required: "Division is required" })}
                                                className={`w-full px-3 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 bg-white text-gray-800 ${errors.division
                                                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                        : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                    }`}
                                                disabled={loading}
                                            >
                                                <option value="">Select Division</option>
                                                {divisions?.map((d) => (
                                                    <option key={d.id} value={d.name}>
                                                        {d.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.division && (
                                                <p className="text-xs text-red-600 mt-1">{errors.division.message}</p>
                                            )}
                                        </div>

                                        {/* District */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                District <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                {...register("district", { required: "District is required" })}
                                                disabled={loading || !selectedDivision}
                                                className={`w-full px-3 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 text-gray-800 ${!selectedDivision ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"
                                                    } ${errors.district
                                                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                        : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                    }`}
                                            >
                                                <option value="">
                                                    {selectedDivision ? "Select District" : "Select Division first"}
                                                </option>
                                                {filteredDistricts.map((dist) => (
                                                    <option key={dist.id} value={dist.name}>
                                                        {dist.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.district && (
                                                <p className="text-xs text-red-600 mt-1">{errors.district.message}</p>
                                            )}
                                        </div>

                                        {/* Upazila / Area */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Upazila / Thana <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                {...register("upazila", { required: "Upazila is required" })}
                                                disabled={loading || !selectedDistrict}
                                                className={`w-full px-3 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 text-gray-800 ${!selectedDistrict ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"
                                                    } ${errors.upazila
                                                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                        : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                    }`}
                                            >
                                                <option value="">
                                                    {selectedDistrict ? "Select Upazila" : "Select District first"}
                                                </option>
                                                {filteredUpazilas.map((u) => (
                                                    <option key={u.id} value={u.name}>
                                                        {u.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.upazila && (
                                                <p className="text-xs text-red-600 mt-1">{errors.upazila.message}</p>
                                            )}
                                        </div>

                                        {/* City / Area Name */}
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                City / Zone <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                {...register("city", { required: "City is required" })}
                                                placeholder="e.g. Dhaka"
                                                className={`w-full px-3 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 bg-white text-gray-800 placeholder:text-gray-400 placeholder:opacity-100 ${errors.city
                                                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                        : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                    }`}
                                                disabled={loading}
                                            />
                                            {errors.city && (
                                                <p className="text-xs text-red-600 mt-1">{errors.city.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Postal Code & Country */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Postal Code <span className="text-gray-400 font-normal">(Optional)</span>
                                            </label>
                                            <input
                                                type="text"
                                                {...register("postalCode", {
                                                    pattern: {
                                                        value: /^\d{4}$/,
                                                        message: "Postal code must be 4 digits"
                                                    }
                                                })}
                                                maxLength={4}
                                                placeholder="e.g. 1219"
                                                className="w-full px-3.5 py-2.5 rounded-md border border-gray-300 text-sm font-mono transition focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800 placeholder:text-gray-400 placeholder:opacity-100 hover:border-gray-400"
                                                disabled={loading}
                                            />
                                            {errors.postalCode && (
                                                <p className="text-xs text-red-600 mt-1">{errors.postalCode.message}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                Country
                                            </label>
                                            <input
                                                value="Bangladesh"
                                                readOnly
                                                disabled
                                                className="w-full px-3.5 py-2.5 rounded-md border border-gray-200 bg-gray-100 text-gray-600 text-sm font-medium cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 3: Settings & Preferences */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    {/* Default Shipping Address Toggle Card */}
                                    <label
                                        htmlFor="isDefault"
                                        className={`flex items-start gap-3 p-3.5 rounded-md border transition-all cursor-pointer ${isDefault
                                                ? "bg-emerald-50/60 border-emerald-300/80 shadow-xs"
                                                : "bg-white border-gray-200 hover:bg-gray-50"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            {...register("isDefault")}
                                            id="isDefault"
                                            disabled={loading}
                                            className="mt-0.5 h-4.5 w-4.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                        />
                                        <div className="select-none">
                                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                                Default Shipping Address
                                            </span>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Pre-select this address for all future orders
                                            </p>
                                        </div>
                                    </label>

                                    {/* Active Customer Toggle Card */}
                                    <label
                                        htmlFor="status"
                                        className={`flex items-start gap-3 p-3.5 rounded-md border transition-all cursor-pointer ${status
                                                ? "bg-sky-50/60 border-sky-300/80 shadow-xs"
                                                : "bg-white border-gray-200 hover:bg-gray-50"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            {...register("status")}
                                            id="status"
                                            disabled={loading}
                                            className="mt-0.5 h-4.5 w-4.5 rounded text-secound focus:ring-secound cursor-pointer"
                                        />
                                        <div className="select-none">
                                            <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                                Active Customer Account
                                            </span>
                                            <p className="text-[11px] text-gray-500 mt-0.5">
                                                Account is active and eligible to place orders immediately
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Fixed Action Button Footer */}
                            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    disabled={loading}
                                    className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 font-medium text-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-7 py-2.5 rounded-md bg-secound hover:bg-secound-hover text-white font-medium text-sm transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={16} />
                                            <span>Saving Customer...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Check size={16} />
                                            <span>Save Customer</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default CustomerAddModal;