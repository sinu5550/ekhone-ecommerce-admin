"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import { useMissionVision, useUpdateMissionVision, useDeleteMissionVision } from "@/hooks/useMissionVision";
import {
    Eye,
    Rocket,
    Edit,
    Trash2,
    Plus,
    X,
    Loader2,
    AlertCircle,
    Image as ImageIcon,
    Calendar,
    Clock,
    Save,
    Lightbulb,
    Star
} from "lucide-react";
import { useCreateMissionVision } from "@/hooks/useMissionVision";



const MissionVision = () => {
    // Form State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
    });

    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Hooks
    const { missionVision, isLoading, mutate } = useMissionVision();
    const { createMissionVision } = useCreateMissionVision();
    const { updateMissionVision } = useUpdateMissionVision();
    const { deleteMissionVision } = useDeleteMissionVision();

    // Load existing data into form when editing
    const handleEdit = (item) => {
        setFormData({
            title: item.title || '',
            description: item.description || '',
            image: item.image || '',
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({
            title: '',
            description: '',
            image: '',
        });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            title: '',
            description: '',
            image: '',
        });
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
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

    const handleImageUpload = useCallback((url) => {
        setFormData(prev => ({
            ...prev,
            image: url
        }));
        if (errors.image) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.image;
                return newErrors;
            });
        }
        toast.success("Image uploaded successfully");
    }, [errors]);

    const handleImageError = useCallback((errorMessage) => {
        setErrors(prev => ({
            ...prev,
            image: { message: errorMessage }
        }));
        toast.error(`Image upload failed: ${errorMessage}`);
    }, []);

    const clearImage = useCallback(() => {
        setFormData(prev => ({
            ...prev,
            image: ''
        }));
        if (errors.image) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.image;
                return newErrors;
            });
        }
        toast.success("Image removed");
    }, [errors]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) {
            newErrors.title = "Title is required";
        }
        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fix the errors before submitting");
            return;
        }

        setIsSubmitting(true);

        try {
            if (editingId) {
                // Update existing item
                await updateMissionVision(editingId, formData);
                toast.success("Mission/Vision updated successfully");
            } else {
                // Create new item
                await createMissionVision(formData);
                toast.success("Mission/Vision created successfully");
            }

            mutate(); // Refresh data
            handleCloseModal();
        } catch (error) {
            toast.error(error.message || "Something went wrong");
            console.error("Submit error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id, title) => {
        const result = await Swal.fire({
            title: `Delete "${title}"?`,
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            try {
                await deleteMissionVision(id);
                toast.success("Mission/Vision deleted successfully");
                mutate(); // Refresh data
            } catch (err) {
                console.error("Delete failed:", err);
                toast.error(err.message || "Delete failed. Please try again.");
            }
        }
    };

    if (isLoading) {
        return <div></div>;
    }


    const items = missionVision || [];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                {/* Items Grid */}
                <div className="bg-white p-4 rounded shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header */}
                    <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-philosopher">
                                    Mission & Vision Management
                                </h1>
                                <p className="text-gray-500 mt-1">Manage your company's mission, vision, and core values</p>
                            </div>
                            <button
                                onClick={handleAddNew}
                                className="flex items-center gap-2 px-4 py-2 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Add New Item
                            </button>
                        </div>
                    </div>
                   


                    <div className="p-6">
                        {items.length === 0 ? (
                            <div className="text-center py-12">
                                <Star className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-4 text-gray-500">No mission or vision items added yet.</p>
                                <button
                                    onClick={handleAddNew}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200"
                                >
                                    <Plus className="h-4 w-4" />
                                    Create Your First Item
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                {items.map((item) => {
                                    const isMission = item.title.toLowerCase().includes('mission');
                                    const isVision = item.title.toLowerCase().includes('vision');
                                    const IconComponent = isMission ? Rocket : isVision ? Eye : Lightbulb;
                                    const gradientClass = isMission
                                        ? "from-green-50 to-green-100 border-green-200"
                                        : isVision
                                            ? "from-purple-50 to-purple-100 border-purple-200"
                                            : "from-blue-50 to-blue-100 border-blue-200";
                                    const titleColor = isMission ? "text-green-700" : isVision ? "text-purple-700" : "text-blue-700";

                                    return (
                                        <div
                                            key={item.id}
                                            className={`group bg-gradient-to-br ${gradientClass} rounded-xl border p-6 hover:shadow-lg transition-all duration-300`}
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded ${isMission ? 'bg-green-500' : isVision ? 'bg-purple-500' : 'bg-blue-500'}`}>
                                                        <IconComponent className="h-5 w-5 text-white" />
                                                    </div>
                                                    <h3 className={`text-xl font-semibold ${titleColor}`}>{item.title}</h3>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    <button
                                                        onClick={() => handleEdit(item)}
                                                        className="text-green-600 hover:text-white hover:bg-green-600 p-1.5 rounded transition-all duration-200"
                                                        title="Edit"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.title)}
                                                        className="text-red-600 hover:text-white hover:bg-red-600 p-1.5 rounded transition-all duration-200"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <p className="text-gray-600 leading-relaxed mb-4">{item.description}</p>

                                            {item.image && (
                                                <div className="mt-4 rounded overflow-hidden">
                                                    <img
                                                        src={item.image}
                                                        alt={item.title}
                                                        className="w-full h-48 object-cover rounded"
                                                    />
                                                </div>
                                            )}

                                            <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-3 w-3" />
                                                    <span>Updated: {new Date(item.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded-lg max-w-2xl w-full my-8 overflow-y-auto max-h-[90vh]">
                        <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                {editingId ? (
                                    <>
                                        <Edit className="h-5 w-5 text-primary" />
                                        <h3 className="text-xl font-semibold text-gray-800">Edit Item</h3>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-5 w-5 text-primary" />
                                        <h3 className="text-xl font-semibold text-gray-800">Add New Item</h3>
                                    </>
                                )}
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        {formData.title.toLowerCase().includes('mission') ? (
                                            <Rocket className="h-5 w-5 text-gray-400" />
                                        ) : formData.title.toLowerCase().includes('vision') ? (
                                            <Eye className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <Lightbulb className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded border ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                                        placeholder="e.g., Our Mission, Our Vision, Core Values"
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
                                    Description <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows="6"
                                        className={`w-full px-4 py-2.5 rounded border ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                                        placeholder="Describe your mission, vision, or core values in detail..."
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <div>
                                <CloudinaryImageInput
                                    label="Image (Optional)"
                                    value={formData.image}
                                    onUpload={handleImageUpload}
                                    onError={handleImageError}
                                />
                                {errors.image && (
                                    <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.image.message}
                                    </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                    <ImageIcon className="h-3 w-3" />
                                    Recommended: 1920x1080px (16:9 ratio) for hero image
                                </p>
                            </div>

                            {/* Image Preview */}
                            {formData.image && !errors.image && (
                                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Image Preview
                                    </label>
                                    <div className="relative group">
                                        <img
                                            src={formData.image}
                                            alt="Preview"
                                            className="w-full h-64 object-cover rounded shadow-md"
                                        />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600"
                                            title="Remove image"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {editingId ? "Updating..." : "Creating..."}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {editingId ? "Update Item" : "Create Item"}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-all duration-200"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </ProtectedRoute>
    );
};

export default MissionVision;