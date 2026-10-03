"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useContact, useCreateContact, useUpdateContact, useDeleteContact } from "@/hooks/useContact";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { usePermission } from "@/context/PermissionProvider";

const ContactPage = () => {
  // Form state matching your ContactUs schema
  const [formData, setFormData] = useState({
    title: '',
    image: '',
    address: '',
    google_map: '',
    phone_number: '',
    telephone: '',
    primary_email: '',
    secondary_email: '',
    description: '',
    facebook: '',
    linkedIn: '',
    youtube: '',
    instagram: '',
    twitter: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const { contactData, isLoading, mutate } = useContact();
  const { createContact } = useCreateContact();
  const { updateContact } = useUpdateContact();
  const { deleteContact } = useDeleteContact();
  const { hasPermission } = usePermission();

  // Load existing data into form
  useEffect(() => {
    if (contactData && contactData.id) {
      setFormData({
        title: contactData.title || '',
        image: contactData.image || '',
        address: contactData.address || '',
        google_map: contactData.google_map || '',
        phone_number: contactData.phone_number || '',
        telephone: contactData.telephone || '',
        primary_email: contactData.primary_email || '',
        secondary_email: contactData.secondary_email || '',
        description: contactData.description || '',
        facebook: contactData.facebook || '',
        linkedIn: contactData.linkedIn || '',
        youtube: contactData.youtube || '',
        instagram: contactData.instagram || '',
        twitter: contactData.twitter || ''
      });
    }
  }, [contactData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field if exists
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
    // Clear image error if exists
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    }
    if (!formData.primary_email.trim()) {
      newErrors.primary_email = "Primary email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_email)) {
      newErrors.primary_email = "Invalid email format";
    }
    if (formData.secondary_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.secondary_email)) {
      newErrors.secondary_email = "Invalid email format";
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
      if (contactData?.id) {
        // Update existing contact data
        await updateContact(contactData.id, formData);
        toast.success("Contact information updated successfully");
      } else {
        // Create new contact data
        await createContact(formData);
        toast.success("Contact information created successfully");
      }

      mutate(); // Refresh data
    } catch (error) {
      toast.error(error.message || "Something went wrong");
      console.error("Submit error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!contactData?.id) {
      toast.error("No contact data to delete");
      return;
    }

    const result = await Swal.fire({
      title: "Delete Contact Information?",
      text: "This action cannot be undone. All contact details will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setIsSubmitting(true);
      try {
        await deleteContact(contactData.id);
        toast.success("Contact information deleted successfully");
        mutate(); // Refresh data
        setFormData({
          title: '',
          image: '',
          address: '',
          google_map: '',
          phone_number: '',
          telephone: '',
          primary_email: '',
          secondary_email: '',
          description: '',
          facebook: '',
          linkedIn: '',
          youtube: '',
          instagram: '',
          twitter: ''
        });
      } catch (err) {
        console.error("Delete failed:", err);
        toast.error(err.message || "Delete failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

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

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded shadow-sm border border-gray-100 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Contact Information
                </h1>
                <p className="text-gray-500 mt-1">Manage your company's contact details and social media links</p>
              </div>
              {contactData?.id && (
                <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                  Status: Active
                </div>
              )}
            </div>
          </div>

          {/* Main Form */}
          <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-800">
                {contactData?.id ? "Edit Contact Information" : "Create Contact Information"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {contactData?.id
                  ? "Update your existing contact details"
                  : "Fill in the details to create contact information for your company"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Information Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded border ${errors.title ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                      placeholder="e.g., Contact Us, Get in Touch"
                      disabled={isSubmitting}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                    )}
                  </div>

                  {/* Image Upload with Cloudinary */}
                  <div>
                    <CloudinaryImageInput
                      label="Contact Page Image"
                      value={formData.image}
                      onUpload={handleImageUpload}
                      onError={handleImageError}
                    />
                    {errors.image && (
                      <p className="text-sm text-red-600 mt-1">{errors.image.message}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">Recommended: 1920x1080px (16:9 ratio) for header image</p>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Brief description about how to contact your company..."
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-800">Contact Details</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      rows="2"
                      className={`w-full px-4 py-2.5 rounded border ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                      placeholder="Complete physical address"
                      disabled={isSubmitting}
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                    )}
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Google Maps Link
                    </label>
                    <input
                      type="text"
                      name="google_map"
                      value={formData.google_map}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Enter embed scr url"
                      disabled={isSubmitting}
                    />
                    <details className="text-xs text-gray-400 mt-1">
                      <summary className="cursor-pointer hover:text-gray-600">How to get Google Maps embed link?</summary>
                      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                        <ol className="list-decimal list-inside space-y-1">
                          <li>Go to Google Maps and search for your location</li>
                          <li>Click on the "Share" button</li>
                          <li>Select the "Embed a map" tab</li>
                          <li>Copy the <code className="bg-gray-200 px-1 rounded">src</code> URL from the iframe code</li>
                          <li>Paste it here</li>
                        </ol>
                      </div>
                    </details>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded border ${errors.phone_number ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                      placeholder="+1 (555) 123-4567"
                      disabled={isSubmitting}
                    />
                    {errors.phone_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telephone (Landline)
                    </label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="+1 (555) 987-6543"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="primary_email"
                      value={formData.primary_email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded border ${errors.primary_email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                      placeholder="primary@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.primary_email && (
                      <p className="mt-1 text-sm text-red-600">{errors.primary_email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Email
                    </label>
                    <input
                      type="email"
                      name="secondary_email"
                      value={formData.secondary_email}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 rounded border ${errors.secondary_email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-primary'} focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200`}
                      placeholder="secondary@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.secondary_email && (
                      <p className="mt-1 text-sm text-red-600">{errors.secondary_email}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Media Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-800">Social Media Links</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-blue-600">Facebook</span>
                    </label>
                    <input
                      type="url"
                      name="facebook"
                      value={formData.facebook}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Enter facebook url"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-blue-700">LinkedIn</span>
                    </label>
                    <input
                      type="url"
                      name="linkedIn"
                      value={formData.linkedIn}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Enter linkedin url"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-red-600">YouTube</span>
                    </label>
                    <input
                      type="url"
                      name="youtube"
                      value={formData.youtube}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Enter youtube url..."
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-pink-600">Instagram</span>
                    </label>
                    <input
                      type="url"
                      name="instagram"
                      value={formData.instagram}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Enter instagram url..."
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="text-gray-800">Twitter/X</span>
                    </label>
                    <input
                      type="url"
                      name="twitter"
                      value={formData.twitter}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                      placeholder="Enter twitter url..."
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-wrap gap-3 pt-6 border-t border-gray-200">
                {hasPermission('cms.create') && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-secound text-white rounded hover:bg-secound-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {contactData?.id ? "Updating..." : "Creating..."}
                      </span>
                    ) : (
                      contactData?.id ? "Update Contact Information" : "Create Contact Information"
                    )}
                  </button>
                )}
                {hasPermission('cms.delete') && (
                  <div>
                    {contactData?.id && (
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-red-50 text-red-600 rounded hover:bg-red-600 hover:text-white transition-all duration-200 border border-red-200"
                      >
                        Delete Contact
                      </button>
                    )}
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ContactPage;