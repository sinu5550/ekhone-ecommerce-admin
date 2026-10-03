// pages/testimonials/index.js or app/testimonials/page.js
"use client";

import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import {
  useTestimonials,
  useCreateTestimonial,
  useUpdateTestimonial,
  useDeleteTestimonial,
} from "@/hooks/useTestimonials";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { usePermission } from "@/context/PermissionProvider";


const Testimonials = () => {
  const [name, setName] = useState("");
  const [image, setImage] = useState("");
  const [rating, setRating] = useState(5);
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { hasPermission } = usePermission();
  const { data: testimonials, isLoading, mutate } = useTestimonials();
  const { createTestimonial } = useCreateTestimonial();
  const { updateTestimonial } = useUpdateTestimonial();
  const { deleteTestimonial } = useDeleteTestimonial();

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    } else if (name.trim().length > 100) {
      newErrors.name = "Name must be less than 100 characters";
    }

    if (!rating) {
      newErrors.rating = "Rating is required";
    } else if (rating < 1 || rating > 5) {
      newErrors.rating = "Rating must be between 1 and 5";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    } else if (description.trim().length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, rating, description]);

  const handleImageUpload = useCallback(
    (url) => {
      setImage(url);
      if (errors.image) {
        setErrors((prev) => ({ ...prev, image: null }));
      }
      toast.success("Image uploaded successfully");
    },
    [errors.image]
  );

  const resetForm = useCallback(() => {
    setName("");
    setImage("");
    setRating(5);
    setDescription("");
    setEditingId(null);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      const testimonialData = {
        name: name.trim(),
        image: image.trim() || null,
        rating: Number(rating),
        description: description.trim(),
      };

      if (editingId) {
        await updateTestimonial(editingId, testimonialData);
        toast.success("Testimonial updated successfully");
      } else {
        await createTestimonial(testimonialData);
        toast.success("Testimonial created successfully");
      }

      resetForm();
      await mutate();
    } catch (error) {
      console.error("Testimonial operation failed:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = useCallback(
    (testimonial) => {
      setName(testimonial.name);
      setImage(testimonial.image || "");
      setRating(testimonial.rating);
      setDescription(testimonial.description);
      setEditingId(testimonial.id);
      setErrors({});

      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    []
  );

  const handleDelete = useCallback(
    async (id, name) => {
      const result = await Swal.fire({
        title: "Delete Testimonial",
        text: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "Cancel",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        const loadingToast = toast.loading("Deleting testimonial...");

        try {
          await deleteTestimonial(id);
          toast.dismiss(loadingToast);
          toast.success("Testimonial deleted successfully");
          await mutate();
        } catch (err) {
          toast.dismiss(loadingToast);
          console.error("Delete failed:", err);
          toast.error(err.message || "Delete failed. Please try again.");
        }
      }
    },
    [deleteTestimonial, mutate]
  );

  const renderStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="p-4">
          <div className="gap-4 bg-white p-4 rounded-lg shadow mb-8 border border-stone-200">
            <h1 className="text-3xl font-bold text-gray-800 font-philosopher">
              Manage Testimonials
            </h1>
            <p className="text-gray-600 mt-2">
              Create, edit, and manage client testimonials
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="lg:sticky lg:top-8 h-fit max-h-screen overflow-y-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingId ? "Edit Testimonial" : "Add New Testimonial"}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-4 py-2 rounded border ${
                        errors.name ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                      placeholder="Enter client name"
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {name.length}/100 characters
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className={`w-full ${
                          errors.rating ? "border-red-500" : ""
                        }`}
                        disabled={isSubmitting}
                      />
                      <span className="text-2xl min-w-[120px]">
                        {renderStars(rating)}
                      </span>
                      <span className="text-lg font-semibold min-w-[40px]">
                        {rating}/5
                      </span>
                    </div>
                    {errors.rating && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.rating}
                      </p>
                    )}
                  </div>

                  <div>
                    <CloudinaryImageInput
                      label="Profile Image (Optional)"
                      value={image}
                      onUpload={handleImageUpload}
                      onError={(error) =>
                        setErrors({ ...errors, image: error })
                      }
                      disabled={isSubmitting}
                    />
                    {errors.image && (
                      <p className="mt-1 text-sm text-red-600">{errors.image}</p>
                    )}
                    {image && !errors.image && (
                      <div className="mt-2">
                        <img
                          src={image}
                          alt="Profile Preview"
                          className="h-24 w-24 object-cover rounded-full border border-gray-200"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Testimonial Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className={`w-full px-4 py-2 rounded border ${
                        errors.description ? "border-red-500" : "border-gray-300"
                      } focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors`}
                      placeholder="Write the testimonial description..."
                      disabled={isSubmitting}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.description}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {description.length}/500 characters
                    </p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    {hasPermission("cms.create") && (
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-secound text-white px-6 py-2.5 rounded hover:bg-secound-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        {isSubmitting ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            {editingId ? "Updating..." : "Creating..."}
                          </span>
                        ) : editingId ? (
                          "Update Testimonial"
                        ) : (
                          "Add Testimonial"
                        )}
                      </button>
                    )}
                    {editingId && (
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-xl font-semibold text-gray-900">
                    All Testimonials
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {testimonials?.length || 0} testimonial
                    {testimonials?.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {testimonials?.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2 2 0 00-2-2h-2"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No testimonials
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by adding your first testimonial.
                      </p>
                    </div>
                  ) : (
                    testimonials?.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="p-6 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-4">
                              {testimonial.image && (
                                <img
                                  src={testimonial.image}
                                  alt={testimonial.name}
                                  className="h-16 w-16 object-cover rounded-full border-2 border-gray-200"
                                />
                              )}
                              <div>
                                <h3 className="font-semibold text-xl text-gray-900">
                                  {testimonial.name}
                                </h3>
                                <div className="text-2xl">
                                  {renderStars(testimonial.rating)}
                                </div>
                              </div>
                            </div>

                            <p className="text-gray-600 text-sm leading-relaxed">
                              "{testimonial.description}"
                            </p>

                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>
                                Rating: {testimonial.rating}/5
                              </span>
                              <span>
                                Created:{" "}
                                {new Date(
                                  testimonial.createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-shrink-0">
                            {hasPermission("cms.update") && (
                              <button
                                onClick={() => handleEdit(testimonial)}
                                className="px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded hover:bg-green-100 transition-colors"
                              >
                                Edit
                              </button>
                            )}
                            {hasPermission("cms.delete") && (
                              <button
                                onClick={() =>
                                  handleDelete(testimonial.id, testimonial.name)
                                }
                                className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded hover:bg-red-100 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Testimonials;