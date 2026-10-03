"use client";

import {
  useCreateTopPick,
  useDeleteTopPick,
  useTopPicks,
  useUpdateTopPick,
} from "@/hooks/useTopPick";
import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import CloudinaryImageInput from "../ui/CloudinaryImageInput";
import Image from "next/image";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import { Pencil, Trash2 } from "lucide-react";
import { usePermission } from "@/context/PermissionProvider";

const TopPickSeason = () => {
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    image: "",
    link: "",
  });

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  const { topPicks, isLoading, error, mutate } = useTopPicks();
  const { createTopPick } = useCreateTopPick();
  const { updateTopPick } = useUpdateTopPick();
  const { deleteTopPick } = useDeleteTopPick();
  const { hasPermission } = usePermission();

  const clearErrors = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleImageUpload = useCallback((url) => {
    setFormData((prev) => ({
      ...prev,
      image: url,
    }));
    clearErrors("image");
  }, [clearErrors]);

  const handleImageError = useCallback((error) => {
    setErrors((prev) => ({
      ...prev,
      image: { message: error },
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.image.trim()) {
      toast.error("Image is required");
      return;
    }

    try {
      if (editingId) {
        // Update existing top pick
        await updateTopPick(editingId, formData);
        toast.success("Top pick updated successfully");
        setEditingId(null);
      } else {
        // Create new top pick
        await createTopPick(formData);
        toast.success("Top pick created successfully");
      }

      // Clear form
      setFormData({
        title: "",
        category: "",
        image: "",
        link: "",
      });
      setErrors({});

      // Refresh data
      mutate();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
      console.error("Submit error:", error);
    }
  };

  const handleEdit = (topPick) => {
    setFormData({
      title: topPick.title,
      category: topPick.category || "",
      image: topPick.image,
      link: topPick.link || "",
    });
    setEditingId(topPick.id);
    setErrors({});
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Top Pick?",
      text: "This item will be removed from the seasonal picks.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteTopPick(id);
        toast.success("Top pick deleted successfully");
        mutate();
      } catch (err) {
        console.error("Delete failed:", err);
        toast.error(err.message || "Delete failed. Please try again.");
      }
    }
  };

  if (isLoading)
    return <LoadingSpinner />

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-6 border border-stone-200">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg border border-stone-300">
        <h1 className="text-3xl font-bold mb-2 font-philosopher">
          Top Pick of the Season
        </h1>
        <p className="text-gray-600">Manage featured seasonal items</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="bg-white p-6 rounded-lg shadow border border-stone-200">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Top Pick" : "Create New Top Pick"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Sunset Over Hills"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Nature, Urban, Fashion, etc."
                />
              </div>

              {/* Cloudinary Upload */}
              <div>
                <CloudinaryImageInput
                  label="Top Pick Image"
                  onUpload={handleImageUpload}
                  onError={handleImageError}
                  required
                />
                {errors.image && (
                  <p className="text-sm text-red-600 mt-1">{errors.image.message}</p>
                )}
                {formData.image && !errors.image && (
                  <p className="text-sm text-green-600 mt-1 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Image uploaded successfully
                  </p>
                )}
                <p className="text-[10px] text-gray-500 mt-1">Recommended: square image (800x800px) for best display</p>
              </div>

              {/* Link */}
              <div>
                <label className="block text-sm font-medium mb-1">Link</label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter link here..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {hasPermission('cms.create') && (
                <button
                  type="submit"
                  className="bg-secound text-white px-6 py-2 rounded hover:bg-secound-hover cursor-pointer"
                >
                  {editingId ? "Update Top Pick" : "Create Top Pick"}
                </button>
              )}
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      title: "",
                      category: "",
                      image: "",
                      link: "",
                    });
                    setErrors({});
                  }}
                  className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* Preview */}
          {formData.image && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-3">Preview</h3>
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <div className="relative h-64">
                  <Image
                    src={formData.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    width={400}
                    height={400}
                  />
                  {(formData.title || formData.category) && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      {formData.title && (
                        <h4 className="text-white font-bold text-lg">
                          {formData.title}
                        </h4>
                      )}
                      {formData.category && (
                        <p className="text-white/90 text-sm">
                          {formData.category}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white border-t">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      <span className="font-bold text-gray-600">
                        {formData.category || "None"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Link:</span>{" "}
                      <span className={`font-bold ${formData.link ? "text-green-600" : "text-gray-400"}`}>
                        {formData.link ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Top Picks List */}
        <div className="bg-white p-6 rounded-lg shadow border border-stone-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              All Top Picks ({topPicks.length})
            </h2>
            <span className="text-sm text-gray-500">Grid View</span>
          </div>

          {topPicks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">⭐</div>
              <p>No top picks yet.</p>
              <p className="text-sm mt-1">Create your first seasonal pick!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[600px] overflow-y-auto pr-2">
              {topPicks.map((pick, index) => (
                <div
                  key={pick.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-48">
                    <Image
                      src={pick.image}
                      alt={pick.title}
                      className="w-full h-full object-cover"
                      width={400}
                      height={400}
                    />

                    {/* Order Badge */}
                    <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      #{index + 1}
                    </div>

                    {/* Quick Actions */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      {hasPermission('cms.update') && (
                        <button
                          onClick={() => handleEdit(pick)}
                          className="bg-white hover:bg-green-100 text-green-500 p-1.5 rounded transition-colors hover:scale-105 transform"
                          title="Edit"
                          aria-label="Edit pick"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {hasPermission('cms.delete') && (
                        <button
                          onClick={() => handleDelete(pick.id)}
                          className="bg-white/90 hover:bg-red-50 text-red-600 p-1.5 rounded transition-colors hover:scale-105 transform"
                          title="Delete"
                          aria-label="Delete pick"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-bold text-sm line-clamp-1">
                          {pick.title}
                        </h3>
                        {pick.category && (
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded mt-1">
                            {pick.category}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Link */}
                    {pick.link && (
                      <div className="mt-2">
                        <a
                          href={pick.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-800 text-xs flex items-center gap-1"
                        >
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                          View Link
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white p-4 rounded-lg shadow border border-stone-200">
        <h3 className="font-semibold mb-2">Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold text-teal-600">
              {topPicks.length}
            </div>
            <div className="text-sm text-gray-600">Total Picks</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-2xl font-bold text-green-600">
              {[...new Set(topPicks.map((pick) => pick.category))].filter(Boolean).length}
            </div>
            <div className="text-sm text-gray-600">Unique Categories</div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-2xl font-bold text-purple-600">
              {topPicks.filter((pick) => pick.link).length}
            </div>
            <div className="text-sm text-gray-600">With Links</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-2xl font-bold text-yellow-600">
              {topPicks.filter((pick) => !pick.category).length}
            </div>
            <div className="text-sm text-gray-600">No Category</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopPickSeason;