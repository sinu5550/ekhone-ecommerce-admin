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
import { useAboutUs, useUpdateAboutUs } from "@/hooks/useAbout";



const AboutInfo = () => {
    // About Us Form State
    const [aboutData, setAboutData] = useState({
        title: '',
        sub_title: '',
        description: ''
    });

    // Stats State (editable)
    const [stats, setStats] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Hooks
    const { aboutUs, isLoading, error, mutate } = useAboutUs();
    const { updateAboutUs } = useUpdateAboutUs();


    // Load existing data into form
    useEffect(() => {
        if (aboutUs && aboutUs.id) {
            setAboutData({
                title: aboutUs.title || '',
                sub_title: aboutUs.sub_title || '',
                description: aboutUs.description || ''
            });
            setStats(aboutUs.aboutStats || []);
        }
    }, [aboutUs]);

    const handleAboutChange = (e) => {
        const { name, value } = e.target;
        setAboutData(prev => ({
            ...prev,
            [name]: value
        }));
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
    };

    const handleAddStat = () => {
        setStats([
            ...stats,
            {
                id: Date.now(),
                label: '',
                value: 0
            }
        ]);
    };

    const handleRemoveStat = (index) => {
        const updatedStats = stats.filter((_, i) => i !== index);
        setStats(updatedStats);
    };

    const validateAboutForm = () => {
        const newErrors = {};

        if (!aboutData.title.trim()) {
            newErrors.title = "Title is required";
        }
        if (!aboutData.sub_title.trim()) {
            newErrors.sub_title = "Subtitle is required";
        }
        if (!aboutData.description.trim()) {
            newErrors.description = "Description is required";
        }

        // Validate stats
        stats.forEach((stat, index) => {
            if (!stat.label.trim()) {
                newErrors[`stat_${index}_label`] = "Stat label is required";
            }
            if (!stat.value || stat.value <= 0) {
                newErrors[`stat_${index}_value`] = "Stat value must be greater than 0";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleAboutSubmit = async (e) => {
        e.preventDefault();

        if (!validateAboutForm()) {
            toast.error("Please fix the errors before submitting");
            return;
        }

        if (!aboutUs?.id) {
            toast.error("No about us record found to update");
            return;
        }

        setIsSubmitting(true);

        try {
            // Prepare data for update
            const updateData = {
                title: aboutData.title,
                sub_title: aboutData.sub_title,
                description: aboutData.description,
                aboutStats: stats.map(stat => ({
                    label: stat.label,
                    value: parseInt(stat.value)
                }))
            };

            await updateAboutUs(aboutUs.id, updateData);
            toast.success("About Us information updated successfully");
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
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="mb-4 space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-philosopher">
                                    About Us Management
                                </h1>
                                <p className="text-gray-500 mt-1">Manage your company's about page content and statistics</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>Status: Active</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <form onSubmit={handleAboutSubmit}>
                            {/* About Us Content Section */}
                            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-800">About Us Content</h2>
                                        <p className="text-sm text-gray-500 mt-1">Update your company information</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Title <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="title"
                                                    value={aboutData.title}
                                                    onChange={handleAboutChange}
                                                    className={`w-full px-4 py-2.5 rounded border ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                                                    placeholder="e.g., About Our Company"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            {errors.title && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.title}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Subtitle <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="sub_title"
                                                    value={aboutData.sub_title}
                                                    onChange={handleAboutChange}
                                                    className={`w-full px-4 py-2.5 rounded border ${errors.sub_title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                                                    placeholder="e.g., Your Trusted Partner Since 2020"
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                            {errors.sub_title && (
                                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.sub_title}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Description <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="description"
                                                value={aboutData.description}
                                                onChange={handleAboutChange}
                                                rows="6"
                                                className={`w-full px-4 py-2.5 rounded border ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                                                placeholder="Tell your company's story, mission, and values..."
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

                            {/* Statistics Section - Editable */}
                            <div className="border-t border-gray-200">
                                <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-5 w-5 text-primary" />
                                            <div>
                                                <h2 className="text-xl font-semibold text-gray-800">Company Statistics</h2>
                                                <p className="text-sm text-gray-500 mt-1">Manage key metrics and achievements</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddStat}
                                            className="flex items-center gap-2 px-4 py-2 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 text-sm font-medium"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Add Statistic
                                        </button>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {stats.length === 0 ? (
                                        <div className="text-center py-12">
                                            <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                                            <p className="mt-4 text-gray-500">No statistics added yet. Click "Add Statistic" to create your first metric.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            {stats.map((stat, index) => (
                                                <div
                                                    key={stat.id || index}
                                                    className="bg-gray-50 rounded p-4 border border-gray-200">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <h3 className="text-sm font-medium text-gray-700 bg-white px-2 py-0.5 rounded border border-stone-300">Statistic #{index + 1}</h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveStat(index)}
                                                            className="text-red-500 hover:text-red-700 transition-colors"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                    <div>
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Label <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                                <input
                                                                    type="text"
                                                                    value={stat.label}
                                                                    onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                                                                    className={`w-full pl-10 pr-4 py-2 rounded border ${errors[`stat_${index}_label`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                                                                    placeholder="e.g., Happy Clients, Projects Completed"
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
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 my-2">
                                                                Value <span className="text-red-500">*</span>
                                                            </label>
                                                            <div className="relative">
                                                                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                                <input
                                                                    type="number"
                                                                    value={stat.value}
                                                                    onChange={(e) => handleStatChange(index, 'value', e.target.value)}
                                                                    className={`w-full pl-10 pr-4 py-2 rounded border ${errors[`stat_${index}_value`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent`}
                                                                    placeholder="e.g., 500, 1000"
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
                                        className="flex items-center gap-2 px-6 py-2.5 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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

export default AboutInfo;