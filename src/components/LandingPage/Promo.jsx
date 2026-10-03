"use client";

import {
  useCreatePromo,
  useDeletePromo,
  usePromos,
  useUpdatePromo,
} from "@/hooks/usePromo";
import Image from "next/image";
import { useState, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import CloudinaryImageInput from "../ui/CloudinaryImageInput";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import { Pencil, Trash2 } from "lucide-react";

const PromoSection = () => {
  const [formData, setFormData] = useState({
    title: "",
    image: "",
    description: "",
    promo_batch: "",
    link: "",
    position: "LEFT",
  });

  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  const { promos, isLoading, error, mutate } = usePromos();
  const { createPromo } = useCreatePromo();
  const { updatePromo } = useUpdatePromo();
  const { deletePromo } = useDeletePromo();

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
    clearErrors(name);
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
        await updatePromo(editingId, formData);
        toast.success("Promo updated successfully");
        setEditingId(null);
      } else {
        await createPromo(formData);
        toast.success("Promo created successfully");
      }

      setFormData({
        title: "",
        image: "",
        description: "",
        promo_batch: "",
        link: "",
        position: "LEFT",
      });
      setErrors({});
      mutate();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
      console.error("Submit error:", error);
    }
  };

  const handleEdit = (promo) => {
    setFormData({
      title: promo.title,
      image: promo.image,
      description: promo.description || "",
      promo_batch: promo.promo_batch || "",
      link: promo.link || "",
      position: promo.position || "LEFT",
    });
    setEditingId(promo.id);
    setErrors({});
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This promo will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await deletePromo(id);
        toast.success("Promo deleted successfully");
        mutate();
      } catch (err) {
        console.error("Delete failed:", err);
        toast.error(err.message || "Delete failed. Please try again.");
      }
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 p-4">Error loading promos: {error.message}</div>;

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-6 border border-stone-200">
      <div className="bg-white p-4 rounded-lg border border-stone-300">
        <h1 className="text-3xl font-bold mb-2 font-philosopher">
          Special Offers & Promotions
        </h1>
        <p className="text-gray-600 font-exo">
          Manage promotional offers and banners
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border border-stone-200">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? "Edit Promo" : "Create New Promo"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g.,New arrivals, Limited Time Offer..."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <CloudinaryImageInput
                  label="Promo Image"
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
                <p className="text-[10px] text-gray-500 mt-1">Recommended: image size (800x800px) for best display</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent h-20"
                  placeholder="Promo description..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Promo Batch
                </label>
                <input
                  type="text"
                  name="promo_batch"
                  value={formData.promo_batch}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="e.g., Up to 10% Off"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Link</label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter link..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Position <span className="text-rose-500">*</span>
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="LEFT">LEFT</option>
                  <option value="MIDDLE">MIDDLE</option>
                  <option value="RIGHT">RIGHT</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-secound text-white px-6 py-2 rounded hover:bg-secound-hover cursor-pointer"
              >
                {editingId ? "Update Promo" : "Create Promo"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      title: "",
                      image: "",
                      description: "",
                      promo_batch: "",
                      link: "",
                      position: "LEFT",
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

          {formData.image && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="text-lg font-semibold mb-3">Live Preview</h3>
              <div className="relative rounded-lg overflow-hidden shadow-lg">
                <div className="bg-gray-100 p-6 transition-all duration-300">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    <div className="w-full md:w-2/5">
                      <Image
                        src={formData.image}
                        alt="Preview"
                        width={400}
                        height={400}
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                      />
                    </div>
                    <div className="flex-1 text-gray-800">
                      <div className="mb-2">
                        <span className="text-xs font-semibold bg-gray-200 px-2 py-1 rounded">
                          {formData.promo_batch || "PROMOTION"}
                        </span>
                      </div>
                      <h4 className="text-2xl font-bold font-philosopher mb-2">
                        {formData.title || "Your Title Here"}
                      </h4>
                      <p className="text-sm opacity-90 mb-3">
                        {formData.description || "Your description will appear here. Make it engaging and compelling for customers."}
                      </p>
                      <button className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-gray-700 transition-all duration-300">
                        Shop Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500 text-center">
                Position: {formData.position}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-stone-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">
              All Promos ({promos?.length || 0})
            </h2>
            <span className="text-sm text-gray-500">Sorted by latest</span>
          </div>

          {promos?.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎉</div>
              <p>No promotional offers yet.</p>
              <p className="text-sm mt-1">Create your first promo!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {promos?.map((promo) => (
                <div
                  key={promo.id}
                  className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="w-full md:w-1/3 rounded-lg bg-gray-100">
                        <Image
                          src={promo.image}
                          alt={promo.title}
                          width={400}
                          height={400}
                          className="w-full h-32 object-cover rounded-lg shadow"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg text-gray-800">{promo.title}</h3>
                            {promo.description && (
                              <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                {promo.description}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(promo)}
                              className="bg-green-100 hover:bg-green-200 text-green-600 p-1.5 rounded-md transition-colors"
                              aria-label="Edit promo"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(promo.id)}
                              className="bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded-md transition-colors"
                              aria-label="Delete promo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-sm">
                          {promo.promo_batch && (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                              {promo.promo_batch}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs font-semibold text-white ${promo.position === "LEFT"
                            ? "bg-green-500"
                            : promo.position === "RIGHT-TOP"
                              ? "bg-purple-500"
                              : "bg-yellow-500"
                            }`}>
                            {promo.position}
                          </span>
                          {promo.link && (
                            <a
                              href={promo.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-600 hover:text-gray-800 underline flex items-center gap-1 text-xs"
                            >
                              View Link →
                            </a>
                          )}
                        </div>

                        <div className="mt-2 text-xs text-gray-400">
                          Created: {new Date(promo.createdAt).toLocaleDateString()}
                        </div>
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
  );
};

export default PromoSection;