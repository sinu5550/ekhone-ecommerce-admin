"use client";

import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import {
    User,
    Briefcase,
    Building2,
    Mail,
    Phone,
    Linkedin,
    Twitter,
    Facebook,
    Instagram,
    Globe,
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
    Users,
    Star,
    MapPin,
    Github
} from "lucide-react";
import { useCreateTeamMember, useDeleteTeamMember, useTeamMembers, useUpdateTeamMember } from "@/hooks/useTeamMember";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import Image from "next/image";

const OurMember = () => {
    // Form State
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        image: '',
        department: '',
        description: '',
        socialLinks: {
            linkedin: '',
            twitter: '',
            facebook: '',
            instagram: '',
            github: '',
            website: ''
        }
    });

    const [editingId, setEditingId] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Hooks
    const { teamMembers, isLoading, mutate } = useTeamMembers();
    const { createTeamMember } = useCreateTeamMember();
    const { updateTeamMember } = useUpdateTeamMember();
    const { deleteTeamMember } = useDeleteTeamMember();


    // Load existing data into form when editing
    const handleEdit = (item) => {
        setFormData({
            name: item.name || '',
            role: item.role || '',
            image: item.image || '',
            department: item.department || '',
            description: item.description || '',
            socialLinks: item.socialLinks || {
                linkedin: '',
                twitter: '',
                facebook: '',
                instagram: '',
                github: '',
                website: ''
            }
        });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setFormData({
            name: '',
            role: '',
            image: '',
            department: '',
            description: '',
            socialLinks: {
                linkedin: '',
                twitter: '',
                facebook: '',
                instagram: '',
                github: '',
                website: ''
            }
        });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            name: '',
            role: '',
            image: '',
            department: '',
            description: '',
            socialLinks: {
                linkedin: '',
                twitter: '',
                facebook: '',
                instagram: '',
                github: '',
                website: ''
            }
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

    const handleSocialLinkChange = (platform, value) => {
        setFormData(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: value
            }
        }));
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

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }
        if (!formData.role.trim()) {
            newErrors.role = "Role/Position is required";
        }
        if (!formData.department.trim()) {
            newErrors.department = "Department is required";
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
                await updateTeamMember(editingId, formData);
                toast.success("Team member updated successfully");
            } else {
                // Create new item
                await createTeamMember(formData);
                toast.success("Team member added successfully");
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

    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: `Delete "${name}"?`,
            text: "This action cannot be undone. All associated data will be removed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            try {
                await deleteTeamMember(id);
                toast.success("Team member deleted successfully");
                mutate(); // Refresh data
            } catch (err) {
                console.error("Delete failed:", err);
                toast.error(err.message || "Delete failed. Please try again.");
            }
        }
    };

    // Helper function to get social icon
    const getSocialIcon = (platform) => {
        switch (platform) {
            case 'linkedin': return <Linkedin className="h-4 w-4" />;
            case 'twitter': return <Twitter className="h-4 w-4" />;
            case 'facebook': return <Facebook className="h-4 w-4" />;
            case 'instagram': return <Instagram className="h-4 w-4" />;
            case 'github': return <Github className="h-4 w-4" />;
            case 'website': return <Globe className="h-4 w-4" />;
            default: return null;
        }
    };

    if (isLoading) return <LoadingSpinner />

    const members = teamMembers || [];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-stone-300 overflow-hidden">
                    {/* Header */}
                    <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent font-philosopher">
                                    Team Members Management
                                </h1>
                                <p className="text-gray-500 mt-1">Manage your organization's team members</p>
                            </div>
                            <button
                                onClick={handleAddNew}
                                className="flex items-center gap-2 px-4 py-2 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 shadow-sm"
                            >
                                <Plus className="h-4 w-4" />
                                Add New Member
                            </button>
                        </div>
                    </div>

                    <div className="p-6">
                        {members.length === 0 ? (
                            <div className="text-center py-12">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <p className="mt-4 text-gray-500">No team members added yet.</p>
                                <button
                                    onClick={handleAddNew}
                                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Your First Team Member
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {members.map((member) => (
                                    <div
                                        key={member.id}
                                        className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                                    >
                                        {/* Image Section */}
                                        <div className="relative h-64 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                                            {member.image ? (
                                                <Image
                                                    src={member.image}
                                                    alt={member.name}
                                                    width={400}
                                                    height={600}
                                                    className="w-full h-full transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <User className="h-16 w-16 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <button
                                                    onClick={() => handleEdit(member)}
                                                    className="bg-white text-green-600 hover:bg-green-600 hover:text-white p-2 rounded-full shadow-md transition-all duration-200"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(member.id, member.name)}
                                                    className="bg-white text-red-600 hover:bg-red-600 hover:text-white p-2 rounded-full shadow-md transition-all duration-200"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="p-5">
                                            <div className="mb-3">
                                                <h3 className="text-xl font-semibold text-gray-800 mb-1">
                                                    {member.name}
                                                </h3>
                                                <p className="text-stone-600 font-medium text-sm">
                                                    {member.role}
                                                </p>
                                            </div>

                                            <div className="mb-3 flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-gray-400" />
                                                <p className="text-gray-600 text-sm">
                                                    {member.department}
                                                </p>
                                            </div>
                                            {/* Social Links */}
                                            {member.socialLinks && Object.values(member.socialLinks).some(link => link) && (
                                                <div className="pt-3 border-t border-gray-200">
                                                    <div className="flex flex-wrap gap-2">
                                                        {Object.entries(member.socialLinks).map(([platform, url]) => (
                                                            url && (
                                                                <a
                                                                    key={platform}
                                                                    href={url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-gray-500 hover:text-primary transition-colors duration-200"
                                                                    title={`${platform} profile`}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {getSocialIcon(platform)}
                                                                </a>
                                                            )
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Timestamps */}
                                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{new Date(member.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{new Date(member.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
                    <div className="bg-white rounded max-w-3xl w-full my-8 overflow-y-auto max-h-[90vh]">
                        <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div className="flex items-center gap-2">
                                {editingId ? (
                                    <>
                                        <Edit className="h-5 w-5 text-primary" />
                                        <h3 className="text-xl font-semibold text-gray-800">Edit Team Member</h3>
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-5 w-5 text-primary" />
                                        <h3 className="text-xl font-semibold text-gray-800">Add New Team Member</h3>
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
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded border ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-1 focus:border-transparent transition-all duration-200`}
                                        placeholder="Enter full name"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Role/Position <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <Briefcase className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded border ${errors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-1 focus:border-transparent transition-all duration-200`}
                                        placeholder="e.g., CEO, Software Engineer, Marketing Manager"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {errors.role && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.role}
                                    </p>
                                )}
                            </div>

                            {/* Department */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Department <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                        <Building2 className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded border ${errors.department ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-1 focus:border-transparent transition-all duration-200`}
                                        placeholder="e.g., Engineering, Sales, Human Resources"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {errors.department && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.department}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description/Bio <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="4"
                                    className={`w-full px-4 py-2.5 rounded border ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-1 focus:border-transparent transition-all duration-200`}
                                    placeholder="Write a brief description about the team member..."
                                    disabled={isSubmitting}
                                />
                                {errors.description && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            {/* Image */}
                            <div>
                                <CloudinaryImageInput
                                    label="Profile Image"
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
                                    Recommended: 400x400px square image for profile
                                </p>
                            </div>

                            {/* Image Preview */}
                            {formData.image && !errors.image && (
                                <div className="p-4 bg-gray-50 rounded border border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" />
                                        Image Preview
                                    </label>
                                    <div className="relative group inline-block">
                                        <Image
                                            src={formData.image}
                                            alt="Preview"
                                            width={500}
                                            height={400}
                                            className="w-32 h-32 rounded-full  shadow-md border-2 border-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={clearImage}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                                            title="Remove image"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Social Links Section */}
                            <div className="space-y-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Social Media Links (Optional)
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2">
                                        <Linkedin className="h-5 w-5 text-blue-600" />
                                        <input
                                            type="url"
                                            placeholder="LinkedIn URL"
                                            value={formData.socialLinks.linkedin}
                                            onChange={(e) => handleSocialLinkChange('linkedin', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded border border-stone-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Twitter className="h-5 w-5 text-blue-400" />
                                        <input
                                            type="url"
                                            placeholder="Twitter URL"
                                            value={formData.socialLinks.twitter}
                                            onChange={(e) => handleSocialLinkChange('twitter', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded border border-stone-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Facebook className="h-5 w-5 text-blue-700" />
                                        <input
                                            type="url"
                                            placeholder="Facebook URL"
                                            value={formData.socialLinks.facebook}
                                            onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded border border-stone-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Instagram className="h-5 w-5 text-pink-600" />
                                        <input
                                            type="url"
                                            placeholder="Instagram URL"
                                            value={formData.socialLinks.instagram}
                                            onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded border border-stone-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Github className="h-5 w-5 text-gray-800" />
                                        <input
                                            type="url"
                                            placeholder="GitHub URL"
                                            value={formData.socialLinks.github}
                                            onChange={(e) => handleSocialLinkChange('github', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded border border-stone-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Globe className="h-5 w-5 text-green-600" />
                                        <input
                                            type="url"
                                            placeholder="Personal Website URL"
                                            value={formData.socialLinks.website}
                                            onChange={(e) => handleSocialLinkChange('website', e.target.value)}
                                            className="flex-1 px-3 py-2 rounded border border-stone-300 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Form Actions */}
                            <div className="flex gap-3 pt-4 sticky bottom-0 bg-white py-4 border-t border-gray-100 mt-6">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {editingId ? "Updating..." : "Adding..."}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4" />
                                            {editingId ? "Update Member" : "Add Member"}
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

export default OurMember;