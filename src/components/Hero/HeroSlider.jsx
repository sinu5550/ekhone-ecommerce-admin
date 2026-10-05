"use client";

import { useState, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import Image from "next/image";
import { Search, X, Check, Package, Sparkles, AlertCircle, Trash2, Edit2, Plus, ExternalLink } from "lucide-react";
import { useHeroSliders, useCreateHeroSlider, useUpdateHeroSlider, useDeleteHeroSlider } from "@/hooks/useHeroSlider";
import { useProducts } from "@/lib/dataFetch";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import CloudinaryImageInput from "../ui/CloudinaryImageInput";
import { usePermission } from "@/context/PermissionProvider";

const HeroSliderSection = () => {
  // Form state
  const [formData, setFormData] = useState({
    badge: "BANGLADESH'S PREMIUM STORE",
    title: "",
    sub_title: "",
    image: "",
    link: "",
    categoryLink: "/product",
    productId: null
  });

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  const { heroSliders, isLoading, error, mutate } = useHeroSliders();
  const { createHeroSlider } = useCreateHeroSlider();
  const { updateHeroSlider } = useUpdateHeroSlider();
  const { deleteHeroSlider } = useDeleteHeroSlider();
  const { hasPermission } = usePermission();

  // Fetch all products for search and selection
  const { data: rawProductData = [] } = useProducts(1, 1000);
  const productList = useMemo(() => {
    return Array.isArray(rawProductData)
      ? rawProductData
      : rawProductData?.products || [];
  }, [rawProductData]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return productList.slice(0, 15);
    const q = productSearch.toLowerCase();
    return productList.filter(
      (p) =>
        p.productName?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [productList, productSearch]);

  const getProductImg = (prod) => {
    if (!prod) return null;

    // 1. Direct array of images
    if (Array.isArray(prod.images) && prod.images.length > 0) {
      const first = prod.images[0];
      if (typeof first === "string" && first.trim()) return first.trim();
      if (first?.url && typeof first.url === "string") return first.url.trim();
      if (first?.secure_url && typeof first.secure_url === "string") return first.secure_url.trim();
    }

    // 2. Product variants image
    if (Array.isArray(prod.productVariants) && prod.productVariants.length > 0) {
      const variantWithImg = prod.productVariants.find(
        (v) => v?.image && typeof v.image === "string" && v.image.trim()
      );
      if (variantWithImg?.image) return variantWithImg.image.trim();
    }

    // 3. String representation (JSON or raw URL)
    if (typeof prod.images === "string" && prod.images.trim()) {
      try {
        const parsed = JSON.parse(prod.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          if (typeof first === "string" && first.trim()) return first.trim();
          if (first?.url) return first.url.trim();
          if (first?.secure_url) return first.secure_url.trim();
        }
      } catch (_) {
        if (prod.images.startsWith("http") || prod.images.startsWith("/")) {
          return prod.images.trim();
        }
      }
    }

    // 4. Fallback prod.image
    if (prod.image && typeof prod.image === "string" && prod.image.trim()) {
      return prod.image.trim();
    }

    return null;
  };

  const clearErrors = useCallback((field) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const handleImageUpload = useCallback((url) => {
    setFormData((prev) => ({
      ...prev,
      image: url
    }));
    clearErrors("image");
  }, [clearErrors]);

  const handleImageError = useCallback((error) => {
    setErrors((prev) => ({
      ...prev,
      image: { message: error }
    }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle choosing product from list
  const handleSelectProduct = (prod) => {
    setSelectedProduct(prod);
    const prodImg = getProductImg(prod);
    const productSlug = prod.slug || prod.id;
    setFormData((prev) => ({
      ...prev,
      productId: prod.id,
      title: prev.title || prod.productName,
      sub_title: prev.sub_title || `Buy 100% authentic ${prod.productName} — Cash on Delivery nationwide.`,
      image: prev.image || prodImg || "",
      link: prev.link || `/product/${productSlug}`
    }));
    setProductSearch("");
  };

  const handleRemoveSelectedProduct = () => {
    setSelectedProduct(null);
    setFormData((prev) => ({
      ...prev,
      productId: null
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Title is required");
      return;
    }

    if (!formData.image.trim()) {
      toast.error("Product image is required. Please choose a product or upload an image.");
      return;
    }

    try {
      if (editingId) {
        await updateHeroSlider(editingId, formData);
        toast.success("Hero slider updated successfully");
        setEditingId(null);
      } else {
        await createHeroSlider(formData);
        toast.success("Hero slider created successfully");
      }

      // Clear form
      setFormData({
        badge: "BANGLADESH'S PREMIUM STORE",
        title: "",
        sub_title: "",
        image: "",
        link: "",
        categoryLink: "/product",
        productId: null
      });
      setSelectedProduct(null);
      setErrors({});

      // Refresh data
      mutate();
    } catch (err) {
      toast.error(err.message || "Something went wrong");
      console.error("Submit error:", err);
    }
  };

  const handleEdit = (slider) => {
    const linkedProd = slider.product || productList.find((p) => p.id === slider.productId) || null;
    setSelectedProduct(linkedProd);
    const productSlug = linkedProd?.slug || slider.product?.slug || slider.productId || "";
    setFormData({
      badge: slider.badge || "BANGLADESH'S PREMIUM STORE",
      title: slider.title || "",
      sub_title: slider.sub_title || "",
      image: slider.image || "",
      link: slider.link || (productSlug ? `/product/${productSlug}` : ""),
      categoryLink: slider.categoryLink || "/product",
      productId: slider.productId || null
    });
    setEditingId(slider.id);
    setErrors({});
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Hero Slider?",
      text: "This slide will be removed from your website home hero carousel.",
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

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="bg-white p-4 rounded-xl shadow-xs space-y-6 border border-stone-200 font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-[#102D50] text-white p-6 rounded-xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/10 text-white text-xs font-bold mb-2">
            <Sparkles size={13} className="text-amber-400" />
            <span>Home Page Hero Section</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Hero Slider & Showcase Manager</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Choose products to feature in the hero section, set custom promo headlines, badges, and background banner images.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Form (Span 6) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-md border border-stone-200 space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? "Edit Hero Slide" : "Add New Hero Slide"}
            </h2>
            {editingId && (
              <span className="text-xs px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200">
                Editing Mode
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. CHOOSE PRODUCT (Live Search & Select) */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Choose Product to Showcase (Optional / Recommended)
              </label>

              {!selectedProduct ? (
                <div className="space-y-2">
                  <div className="relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search product by name or SKU..."
                      className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  {/* Search Results Dropdown List */}
                  {productSearch.trim() && (
                    <div className="max-h-48 overflow-y-auto bg-white rounded-lg border border-slate-200 divide-y shadow-md">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((prod) => {
                          const img = getProductImg(prod);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleSelectProduct(prod)}
                              className="p-2.5 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition text-xs"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded border bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                                  {img ? (
                                    <img src={img} alt={prod.productName} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package size={14} className="text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-slate-800 truncate">{prod.productName}</p>
                                  <p className="text-[10px] text-slate-400">SKU: {prod.sku || "N/A"}</p>
                                </div>
                              </div>
                              <span className="font-bold text-slate-900 shrink-0">
                                ৳{parseFloat(prod.price || prod.salePrice || 0).toLocaleString()}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400">
                          No products found matching &quot;{productSearch}&quot;
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Selected Product Card */
                <div className="p-3 bg-white rounded-lg border border-emerald-300 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-lg border border-slate-200 overflow-hidden shrink-0 bg-slate-50">
                      {getProductImg(selectedProduct) ? (
                        <img
                          src={getProductImg(selectedProduct)}
                          alt={selectedProduct.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package size={20} className="text-slate-400 m-auto mt-2" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                          <Check size={10} /> Linked Product
                        </span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 truncate mt-0.5">
                        {selectedProduct.productName}
                      </p>
                      <p className="text-[11px] font-bold text-primary">
                        ৳{parseFloat(selectedProduct.price || selectedProduct.salePrice || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveSelectedProduct}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Remove selected product"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* 2. SLIDE DETAILS */}
            <div className="space-y-3">
              {/* Badge Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Top Badge Tagline
                </label>
                <input
                  type="text"
                  name="badge"
                  value={formData.badge}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="e.g. BANGLADESH'S PREMIUM STORE or EXCLUSIVE OFFER"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Main Headline / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                  placeholder="Online Shopping in Bangladesh, All in One Place"
                  required
                />
              </div>

              {/* Sub Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sub-title / Description
                </label>
                <textarea
                  name="sub_title"
                  value={formData.sub_title}
                  onChange={handleChange}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                  placeholder="Buy authentic products — pay Cash on Delivery at your doorstep."
                />
              </div>

              {/* Image Input (Cloudinary upload or Auto-filled from product) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Slide / Product Image <span className="text-rose-500">*</span>
                </label>
                {formData.image && (
                  <div className="mb-2 p-2 bg-slate-50 border rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded border bg-white overflow-hidden shrink-0">
                        <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs text-slate-600 truncate max-w-[200px]">{formData.image}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, image: "" }))}
                      className="text-xs text-rose-600 hover:underline font-semibold"
                    >
                      Change
                    </button>
                  </div>
                )}
                {!formData.image && (
                  <CloudinaryImageInput
                    label="Upload Custom Slide Image"
                    onUpload={handleImageUpload}
                    onError={handleImageError}
                    required
                  />
                )}
              </div>

              {/* Action Link (Shop now CTA URL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shop Now Button Link
                  </label>
                  <input
                    type="text"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="/product/..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Browse Category Link
                  </label>
                  <input
                    type="text"
                    name="categoryLink"
                    value={formData.categoryLink}
                    onChange={handleChange}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="/product"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              {hasPermission("cms.create") && (
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-bold text-xs transition cursor-pointer shadow-sm active:scale-95"
                >
                  {editingId ? "Update Slide" : "Add to Hero Carousel"}
                </button>
              )}

              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setSelectedProduct(null);
                    setFormData({
                      badge: "BANGLADESH'S PREMIUM STORE",
                      title: "",
                      sub_title: "",
                      image: "",
                      link: "",
                      categoryLink: "/product",
                      productId: null
                    });
                    setErrors({});
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-5 py-2.5 rounded-lg font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right: All Hero Sliders List (Span 6) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl shadow-md border border-stone-200 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Hero Slides ({heroSliders?.length || 0})</h2>
              <p className="text-xs text-slate-500">Currently active on the website home hero carousel</p>
            </div>
          </div>

          {!heroSliders || heroSliders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Package size={32} className="mx-auto text-slate-300" />
              <p className="text-xs font-semibold">No custom hero slides added yet.</p>
              <p className="text-[11px] text-slate-400">
                Create slides above by selecting products or uploading custom banners.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
              {heroSliders.map((slider, index) => (
                <div
                  key={slider.id}
                  className="border border-slate-200 rounded-xl p-3.5 hover:shadow-md transition bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </div>

                    <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 overflow-hidden shrink-0">
                      <img
                        src={slider.image}
                        alt={slider.title}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150?text=No+Image";
                        }}
                      />
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      {slider.badge && (
                        <span className="text-[9px] font-bold text-primary uppercase tracking-wide block truncate">
                          {slider.badge}
                        </span>
                      )}
                      <h4 className="text-xs font-bold text-slate-900 truncate max-w-[220px]">
                        {slider.title}
                      </h4>
                      {slider.product && (
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                          Product: {slider.product.productName}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {hasPermission("cms.update") && (
                      <button
                        type="button"
                        onClick={() => handleEdit(slider)}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-300 transition cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                    )}
                    {hasPermission("cms.delete") && (
                      <button
                        type="button"
                        onClick={() => handleDelete(slider.id)}
                        className="p-1.5 text-rose-700 hover:bg-rose-100 rounded-md border border-rose-300 transition cursor-pointer text-xs flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    )}
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