"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import {
    Users,
    Loader2,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    FileText,
    Award,
    BarChart3,
    Save,
    Plus,
    Trash2
} from "lucide-react";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import { useClientStatus, useUpdateClientStatus } from "@/hooks/useOurClientStatus";

const OurClientStatus = () => {
    // Client Status Form State
    const [clientData, setClientData] = useState({
        title: '',
        description: ''
    });

    // Stats State (editable)
    const [stats, setStats] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Hooks
    const { clientStatus, isLoading, mutate } = useClientStatus();
    const { updateClientStatus } = useUpdateClientStatus();

    console.log("Client Status Data:", clientStatus);

    // Load existing data into form
    useEffect(() => {
        if (clientStatus && clientStatus.id) {
            setClientData({
                title: clientStatus.title || '',
                description: clientStatus.description || ''
            });
            // ✅ FIXED: Use 'ourClientStat' (singular) to match schema and backend response
            setStats(clientStatus.ourClientStat || []);
        }
    }, [clientStatus]);

    const handleClientChange = (e) => {
        const { name, value } = e.target;
        setClientData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Stat management functions
    const handleStatChange = (index, field, value) => {
        const updatedStats = [...stats];
        updatedStats[index] = {
            ...updatedStats[index],
            [field]: field === 'value' ? parseInt(value) || 0 : value
        };
        setStats(updatedStats);

        // Clear error for this specific field
        const errorKey = `stat_${index}_${field}`;
        if (errors[errorKey]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        }
    };

    const handleAddStat = () => {
        setStats([
            ...stats,
            {
                id: `temp-${Date.now()}`, // Temporary ID for React key
                label: '',
                value: 0
            }
        ]);
    };

    const handleRemoveStat = (index) => {
        const updatedStats = stats.filter((_, i) => i !== index);
        setStats(updatedStats);

        // Clear errors for removed stat
        const newErrors = { ...errors };
        Object.keys(newErrors).forEach(key => {
            if (key.startsWith(`stat_${index}_`)) {
                delete newErrors[key];
            }
        });
        setErrors(newErrors);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!clientData.title.trim()) {
            newErrors.title = "Title is required";
        }
        if (!clientData.description.trim()) {
            newErrors.description = "Description is required";
        }

        // Validate stats
        stats.forEach((stat, index) => {
            if (!stat.label || !stat.label.trim()) {
                newErrors[`stat_${index}_label`] = "Stat label is required";
            }
            if (!stat.value || stat.value <= 0) {
                newErrors[`stat_${index}_value`] = "Stat value must be greater than 0";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors before submitting");
            return;
        }

        if (!clientStatus?.id) {
            toast.error("No client status record found to update");
            return;
        }

        setIsSubmitting(true);

        try {
            // ✅ FIXED: Use 'ourClientStat' (singular) to match backend expectation
            const updateData = {
                title: clientData.title,
                description: clientData.description,
                ourClientStat: stats.map(stat => ({
                    label: stat.label.trim(),
                    value: parseInt(stat.value)
                }))
            };

            console.log("Sending update data:", updateData); // Debug log

            await updateClientStatus(clientStatus.id, updateData);
            toast.success("Client status information updated successfully");
            mutate(); // Refresh data
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Update error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 ">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-philosopher">
                                    Client Status Management
                                </h1>
                                <p className="text-gray-500 mt-1">Manage your client status information and statistics</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Status: Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <form onSubmit={handleSubmit}>
                            {/* Client Status Content Section */}
                            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800">Client Status Content</h2>
                                        <p className="text-sm text-gray-500 mt-1">Update your client status information</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-5">
                                        {/* Title Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Title <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="title"
                                                value={clientData.title}
                                                onChange={handleClientChange}
                                                className={`w-full px-4 py-2.5 rounded border ${errors.title
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-gray-300 focus:ring-primary'
                                                    } focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                                                placeholder="e.g., Our Client Success Stories"
                                                disabled={isSubmitting}
                                            />
                                            {errors.title && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.title}
                                                </p>
                                            )}
                                        </div>

                                        {/* Description Field */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="description"
                                                value={clientData.description}
                                                onChange={handleClientChange}
                                                rows="6"
                                                className={`w-full px-4 py-2.5 rounded border ${errors.description
                                                    ? 'border-red-500 focus:ring-red-500'
                                                    : 'border-gray-300 focus:ring-primary'
                                                    } focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                                                placeholder="Describe your client success metrics and achievements..."
                                                disabled={isSubmitting}
                                            />
                                            {errors.description && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics Section */}
                            <div className="border-t border-gray-200">
                                <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                            <div>
                                                <h2 className="text-xl font-semibold text-gray-800">Client Statistics</h2>
                                                <p className="text-sm text-gray-500 mt-1">Manage key metrics and achievements</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddStat}
                                            className="flex items-center gap-2 px-4 py-2 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 text-sm font-medium shadow-sm"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Statistic
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {stats.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-4 text-gray-500 font-medium">No statistics added yet</p>
                                            <p className="text-sm text-gray-400 mt-1">Click "Add Statistic" to create your first metric.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {stats.map((stat, index) => (
                                                <div
                                                    key={stat.id || index}
                                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h3 className="text-sm font-medium text-gray-700 bg-white px-3 py-1 rounded-full border border-gray-300">
                                                            Statistic #{index + 1}
                                                        </h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveStat(index)}
                                                            className="text-red-500 hover:text-red-700 transition-colors p-1 hover:bg-red-50 rounded-full"
                                                            disabled={isSubmitting}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div className="space-y-4">
                                                        {/* Label Input */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Label <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                                <input
                                                                    type="text"
                                                                    value={stat.label || ''}
                                                                    onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                                                                    className={`w-full pl-10 pr-4 py-2 rounded border ${errors[`stat_${index}_label`]
                                                                        ? 'border-red-500 focus:ring-red-500'
                                                                        : 'border-gray-300 focus:ring-primary'
                                                                        } focus:outline-none focus:ring-2 focus:border-transparent`}
                                                                    placeholder="e.g., Happy Clients"
                                                                    disabled={isSubmitting}
                                                                />
                                                            </div>
                                                            {errors[`stat_${index}_label`] && (
                                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {errors[`stat_${index}_label`]}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Value Input */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Value <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                                <input
                                                                    type="number"
                                                                    value={stat.value || ''}
                                                                    onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                                                                    className={`w-full pl-10 pr-4 py-2 rounded border ${errors[`stat_${index}_value`]
                                                                        ? 'border-red-500 focus:ring-red-500'
                                                                        : 'border-gray-300 focus:ring-primary'
                                                                        } focus:outline-none focus:ring-2 focus:border-transparent`}
                                                                    placeholder="e.g., 500"
                                                                    min="0"
                                                                    disabled={isSubmitting}
                                                                />
                                                            </div>
                                                            {errors[`stat_${index}_value`] && (
                                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                                    <AlertCircle className="h-3 w-3" />
                                                                    {errors[`stat_${index}_value`]}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex items-center gap-2 px-6 py-2.5 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4" />
                                                Update All Information
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default OurClientStatus;