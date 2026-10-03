"use client";

import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useHeroSliders, useCreateHeroSlider, useUpdateHeroSlider, useDeleteHeroSlider } from "@/hooks/useHeroSlider";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import CloudinaryImageInput from "../ui/CloudinaryImageInput";
import { usePermission } from "@/context/PermissionProvider";

const HeroSliderSection = () => {
  // Form state
  const [formData, setFormData] = useState({
    sub_title: '',
    title: '',
    image: '',
    link: ''
  });

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);
  const { heroSliders, isLoading, error, mutate } = useHeroSliders();
  const { createHeroSlider } = useCreateHeroSlider();
  const { updateHeroSlider } = useUpdateHeroSlider();
  const { deleteHeroSlider } = useDeleteHeroSlider();
  const { hasPermission } = usePermission();

  const clearErrors = useCallback((field) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleImageUpload = useCallback((url) => {
    setFormData(prev => ({
      ...prev,
      image: url
    }));
    clearErrors("image");
  }, [clearErrors]);

  const handleImageError = useCallback((error) => {
    setErrors(prev => ({
      ...prev,
      image: { message: error }
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
        // Update existing hero slider
        await updateHeroSlider(editingId, formData);
        toast.success("Hero slider updated successfully");
        setEditingId(null);
      } else {
        // Create new hero slider
        await createHeroSlider(formData);
        toast.success("Hero slider created successfully");
      }

      // Clear form
      setFormData({
        sub_title: '',
        title: '',
        image: '',
        link: ''
      });
      setErrors({});

      // Refresh data
      mutate();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
      console.error("Submit error:", error);
    }
  };

  const handleEdit = (slider) => {
    setFormData({
      sub_title: slider.sub_title || '',
      title: slider.title,
      image: slider.image,
      link: slider.link || ''
    });
    setEditingId(slider.id);
    setErrors({});
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Hero Slider?",
      text: "This slider will be removed from the carousel.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    });

    if (result.isConfirmed) {
      try {
        await deleteHeroSlider(id);
        toast.success("Hero slider deleted successfully");
        mutate();
      } catch (err) {
        console.error("Delete failed:", err);
        toast.error(err.message || "Delete failed. Please try again.");
      }
    }
  };

  if (isLoading) return <LoadingSpinner />

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-6 border border-stone-200">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow border border-stone-200">
        <h1 className="text-3xl font-bold mb-2 font-philosopher">Hero Slider Management</h1>
        <p className="text-gray-600">Manage your website's hero slider carousel</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-stone-200">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Hero Slider" : "Create New Hero Slider"}
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
                <label className="block text-sm font-medium mb-1">Sub Title</label>
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
                <p className="text-[10px] text-gray-500 mt-1">Recommended: image size (1920x1080px or 16:9 ratio)</p>
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
                  placeholder="/collections/featured"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              {hasPermission('cms.create') && (
                <button
                  type="submit"
                  className="bg-secound text-white px-6 py-2 rounded hover:bg-secound-hove cursor-pointer"
                >
                  {editingId ? "Update Slider" : "Create Slider"}
                </button>
              )}

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      sub_title: '',
                      title: '',
                      image: '',
                      link: ''
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
              <h3 className="text-lg font-semibold mb-3">Slider Preview</h3>
              <div className="border rounded-lg overflow-hidden bg-gray-50">
                <div className="relative h-56">
                  <img
                    src={formData.image}
                    alt="Slider Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/1920x1080?text=Slider+Image+Not+Found';
                    }}
                  />
                  {(formData.title || formData.sub_title) && (
                    <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent flex items-center">
                      <div className="p-6 text-white max-w-xl">
                        {formData.sub_title && (
                          <p className="text-lg font-medium mb-1">{formData.sub_title}</p>
                        )}
                        {formData.title && (
                          <h3 className="text-3xl font-bold mb-3">{formData.title}</h3>
                        )}
                        {formData.link && (
                          <a
                            href={formData.link}
                            className="inline-block bg-white text-black px-6 py-2 rounded font-medium hover:bg-gray-100"
                          >
                            Explore Now
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white border-t">
                  <div className="flex justify-between text-sm">
                    <span>Has Link: <strong>{formData.link ? 'Yes' : 'No'}</strong></span>
                    <span>Has Sub Title: <strong>{formData.sub_title ? 'Yes' : 'No'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Hero Sliders List */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-stone-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">All Hero Sliders ({heroSliders?.length || 0})</h2>
              <p className="text-sm text-gray-500">Sorted by latest creation</p>
            </div>
            <span className="text-sm text-gray-500">Carousel items</span>
          </div>

          {!heroSliders || heroSliders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔄</div>
              <p>No hero sliders yet.</p>
              <p className="text-sm mt-1">Create your first slider for the carousel!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {heroSliders.map((slider, index) => (
                <div
                  key={slider.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="flex">
                    {/* Slider Number */}
                    <div className="w-12 flex flex-col items-center justify-center bg-gray-50">
                      <div className="text-lg font-bold text-gray-700">{index + 1}</div>
                      <div className="text-xs text-gray-500">Slide</div>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-32 h-24 flex-shrink-0">
                      <img
                        src={slider.image}
                        alt={slider.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150x100?text=Image+Not+Found';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-sm line-clamp-1">{slider.title}</h3>
                          {slider.sub_title && (
                            <p className="text-gray-600 text-xs mt-1 line-clamp-1">{slider.sub_title}</p>
                          )}
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              Created: {new Date(slider.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 ml-2">
                          {hasPermission('cms.update') && (
                            <button
                              onClick={() => handleEdit(slider)}
                              className="text-green-600 hover:text-white hover:bg-green-500 border border-green-500 px-2 py-1 rounded text-xs"
                            >
                              Edit
                            </button>
                          )}
                          {hasPermission('cms.delete') && (
                            <button
                              onClick={() => handleDelete(slider.id)}
                              className="text-red-600 hover:text-white hover:bg-red-500 border border-red-500 px-2 py-1 rounded text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      {slider.link && (
                        <div className="mt-2">
                          <a
                            href={slider.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline text-xs"
                          >
                            ↗ View Link
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HeroSliderSection;