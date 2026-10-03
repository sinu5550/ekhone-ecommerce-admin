"use client";

import {
  useCreateHero,
  useDeleteHero,
  useHeros,
  useUpdateHero,
} from "@/hooks/useHero";
import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import CloudinaryImageInput from "../ui/CloudinaryImageInput";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import Image from "next/image";
import { usePermission } from "@/context/PermissionProvider";

// Define the available categories based on your cardData
const AVAILABLE_CATEGORIES = [
  "top-right-card1",
  "top-right-card2",
  "bottom-card1",
  "bottom-card2",
  "bottom-card3",
  "Featured",
  "Sale",
  "New Arrival",
  "Popular",
  "Limited Edition",
];

const HeroCardSection = () => {
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    sub_title: "",
    image: "",
    link: "",
    category: "",
  });

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [customCategory, setCustomCategory] = useState("");

  const { heros, isLoading, mutate } = useHeros();
  const { createHero } = useCreateHero();
  const { updateHero } = useUpdateHero();
  const { deleteHero } = useDeleteHero();
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

  const handleCategorySelect = (category) => {
    setFormData((prev) => ({
      ...prev,
      category,
    }));
    setCustomCategory("");
  };

  const handleCustomCategoryChange = (e) => {
    const value = e.target.value;
    setCustomCategory(value);
    setFormData((prev) => ({
      ...prev,
      category: value,
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

    if (!formData.category.trim()) {
      toast.error("Category is required");
      return;
    }

    try {
      if (editingId) {
        // Update existing hero
        await updateHero(editingId, formData);
        toast.success("Hero updated successfully");
        setEditingId(null);
      } else {
        // Create new hero
        await createHero(formData);
        toast.success("Hero created successfully");
      }

      // Clear form
      setFormData({
        title: "",
        sub_title: "",
        image: "",
        link: "",
        category: "",
      });
      setCustomCategory("");
      setErrors({});

      // Refresh data
      mutate();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
      console.error("Submit error:", error);
    }
  };

  const handleEdit = (hero) => {
    setFormData({
      title: hero.title || "",
      sub_title: hero.sub_title || "",
      image: hero.image,
      link: hero.link || "",
      category: hero.category || "",
    });
    setEditingId(hero.id);
    setErrors({});

    // If category is not in predefined list, show it in custom input
    if (!AVAILABLE_CATEGORIES.includes(hero.category)) {
      setCustomCategory(hero.category);
    } else {
      setCustomCategory("");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Hero?",
      text: "This hero will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deleteHero(id);
        toast.success("Hero deleted successfully");
        mutate();
      } catch (err) {
        console.error("Delete failed:", err);
        toast.error(err.message || "Delete failed. Please try again.");
      }
    }
  };

  if (isLoading)
    return <LoadingSpinner />;


  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-6 border border-stone-200">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow border border-stone-200">
        <h1 className="text-3xl font-bold mb-2 font-philosopher">Hero Card Management</h1>
        <p className="text-gray-600">Manage your website hero banners</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-stone-200">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Hero" : "Create New Hero"}
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
                  placeholder="Main heading text"
                  required
                />
              </div>

              {/* Sub Title */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Sub Title
                </label>
                <input
                  type="text"
                  name="sub_title"
                  value={formData.sub_title}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Supporting text or tagline"
                />
              </div>

              {/* Cloudinary Upload */}
              <div>
                <CloudinaryImageInput
                  label="Hero Image"
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
                <p className="text-[10px] text-gray-500 mt-1">Recommended: image size (1920x800px or 16:9 ratio)</p>
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
                  placeholder="Enter link"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  Card Position <span className="text-rose-500">*</span>
                </label>

                {/* Category Quick Selection */}
                <div className="mb-2">
                  <p className="text-xs text-gray-500 mb-2">Quick Select:</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_CATEGORIES.slice(0, 5).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleCategorySelect(cat)}
                        className={`px-3 py-1 text-xs rounded border ${formData.category === cat
                          ? "bg-blue-100 text-teal-800 border-blue-300"
                          : "bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200"
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {hasPermission('cms.create') && (
                <button
                  type="submit"
                  className="bg-secound text-white px-6 py-2 rounded hover:bg-secound-hover cursor-pointer"
                >
                  {editingId ? "Update Hero" : "Create Hero"}
                </button>
              )}
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      title: "",
                      sub_title: "",
                      image: "",
                      link: "",
                      category: "",
                    });
                    setCustomCategory("");
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
                    alt="Hero Preview"
                    className="w-full h-full object-cover"
                    width={20}
                    height={20}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
                    <div className="p-8 text-white max-w-2xl">
                      {formData.title && (
                        <h3 className="text-4xl font-bold mb-2">
                          {formData.title}
                        </h3>
                      )}
                      {formData.sub_title && (
                        <p className="text-xl mb-4">{formData.sub_title}</p>
                      )}
                      {formData.link && (
                        <a
                          href={formData.link}
                          className="inline-block bg-white text-black px-8 py-3 rounded font-bold hover:bg-gray-100 transition-colors"
                        >
                          Shop Now
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white border-t">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-medium">Category:</span>{" "}
                      <span
                        className={`font-bold ${formData.category.includes("top-right")
                          ? "text-teal-600"
                          : formData.category.includes("bottom")
                            ? "text-green-600"
                            : "text-gray-600"
                          }`}
                      >
                        {formData.category || "None"}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Link:</span>{" "}
                      <span
                        className={`font-bold ${formData.link ? "text-green-600" : "text-gray-400"
                          }`}
                      >
                        {formData.link ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Heros List */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-stone-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">
                All Heros ({heros?.length || 0})
              </h2>
              <p className="text-sm text-gray-500">Sorted by latest creation</p>
            </div>
            <div className="text-sm text-gray-500">
              {heros?.filter((h) => h.category?.includes("top-right")).length || 0}{" "}
              top-right cards
            </div>
          </div>

          {!heros || heros.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🖼️</div>
              <p>No heros yet.</p>
              <p className="text-sm mt-1">Create your first hero banner!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {heros.map((hero, index) => (
                <div
                  key={hero.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex">
                    {/* Order Indicator */}
                    <div className="w-12 flex flex-col items-center justify-center bg-gray-50">
                      <div className="text-lg font-bold text-gray-700">
                        {index + 1}
                      </div>
                      <div className="text-xs text-gray-500">Hero</div>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-32 h-24 flex-shrink-0">
                      <Image
                        src={hero.image}
                        alt={hero.title}
                        className="w-full h-full"
                        width={500}
                        height={500}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-sm line-clamp-1">
                            {hero.title}
                          </h3>
                          {hero.sub_title && (
                            <p className="text-gray-600 text-xs mt-1 line-clamp-1">
                              {hero.sub_title}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {hero.category && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${hero.category.includes("top-right")
                                  ? "bg-blue-100 text-teal-800"
                                  : hero.category.includes("bottom")
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                  }`}
                              >
                                {hero.category}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 bg-stone-50">
                              Created:{" "}
                              {new Date(hero.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {hasPermission('cms.update') && (
                            <button
                              onClick={() => handleEdit(hero)}
                              className="text-green-600 hover:text-white hover:bg-green-500 border border-green-500 px-2 py-1 rounded text-xs"
                            >
                              Edit
                            </button>
                          )}
                          {hasPermission('cms.delete') && (
                            <button
                              onClick={() => handleDelete(hero.id)}
                              className="text-red-600 hover:text-white hover:bg-red-500 border border-red-500 px-2 py-1 rounded text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Category Summary */}
          <div className="mt-6 pt-6 border-t border-stone-300">
            <h3 className="text-lg font-semibold mb-3">Position Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {AVAILABLE_CATEGORIES.slice(0, 5).map((cat) => {
                const count = heros?.filter((h) => h.category === cat).length || 0;
                if (count === 0) return null;

                return (
                  <div key={cat} className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-sm mb-1">{cat}</div>
                    <div className="text-xl">
                      {count} card{count !== 1 ? "s" : ""}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroCardSection;