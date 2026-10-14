"use client";

import { useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
  Sparkles,
  Link as LinkIcon,
  CheckCircle2,
  XCircle,
  Trash2,
  Plus,
  Eye,
  X
} from "lucide-react";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import {
  usePopupBanners,
  useSavePopupBanner,
  useTogglePopupBanner,
  useDeletePopupBanner,
} from "@/hooks/usePopupBanner";

export default function PopupBannerPage() {
  const { banners, isLoading, mutate } = usePopupBanners();
  const { saveBanner } = useSavePopupBanner();
  const { toggleBanner } = useTogglePopupBanner();
  const { deleteBanner } = useDeletePopupBanner();

  const [formData, setFormData] = useState({
    title: "",
    image: "",
    link: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const handleImageUploaded = (url) => {
    setFormData((prev) => ({ ...prev, image: url }));
    toast.success("Image uploaded successfully!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      toast.error("Please upload an image first!");
      return;
    }

    setSubmitting(true);
    try {
      await saveBanner(formData);
      toast.success("Popup banner saved successfully!");
      setFormData({
        title: "",
        image: "",
        link: "",
        isActive: true,
      });
      mutate();
    } catch (err) {
      toast.error(err.message || "Failed to save popup banner");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleBanner(id);
      toast.success("Banner status updated!");
      mutate();
    } catch (err) {
      toast.error(err.message || "Status update failed");
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This popup banner will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#F45116",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Yes, delete it",
    });

    if (result.isConfirmed) {
      try {
        await deleteBanner(id);
        toast.success("Banner deleted successfully!");
        mutate();
      } catch (err) {
        toast.error(err.message || "Delete failed");
      }
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#102D50] to-[#1E4675] text-white p-6 sm:p-8 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-xs font-medium tracking-wide mb-2">
            <Sparkles size={14} className="text-[#F45116]" />
            <span>Storefront Marketing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Promotional Popup Banner
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Upload a 1:1 square promotional image (with ✕ close button and zero padding) that appears once when a customer first visits and scrolls the site.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Upload & Setup Form */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Plus size={18} className="text-[#F45116]" />
            <span>Upload New Popup Banner</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Campaign Title (Optional Note)
              </label>
              <input
                type="text"
                placeholder="e.g. 10% Discount Puja Offer"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F45116]/20 focus:border-[#F45116]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Target Redirect Link (Optional)
              </label>
              <div className="relative">
                <LinkIcon size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. /product/apple-iphone-12-pro-max"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#F45116]/20 focus:border-[#F45116]"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Leave blank if you just want to display the image with no click link.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                1:1 Square Banner Image *
              </label>
              <CloudinaryImageInput
                label="Select 1:1 Image"
                onUpload={handleImageUploaded}
              />
            </div>

            {formData.image && (
              <div className="mt-3 relative w-full aspect-square rounded-2xl overflow-hidden border-2 border-[#F45116]/30 shadow-md">
                <Image
                  src={formData.image}
                  alt="Popup preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting || !formData.image}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#F45116] to-[#FF6B35] text-white font-bold text-sm rounded-xl hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer shadow-md active:scale-95"
              >
                {submitting ? "Saving Banner..." : "Save & Activate Popup Banner"}
              </button>
            </div>
          </form>
        </div>

        {/* Existing Banners List */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/90 shadow-xs space-y-5">
          <h2 className="text-lg font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
            <span>Configured Popup Banners</span>
            <span className="text-xs font-normal text-slate-500">
              Total: {banners?.length || 0}
            </span>
          </h2>

          {isLoading ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : !banners || banners.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              No promotional popup banners added yet. Upload one on the left to get started!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {banners.map((item) => (
                <div
                  key={item.id}
                  className={`relative rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                    item.isActive
                      ? "border-emerald-500 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    {/* Status badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.isActive
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.isActive ? (
                          <>
                            <CheckCircle2 size={13} />
                            <span>Currently Active</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={13} />
                            <span>Inactive</span>
                          </>
                        )}
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPreviewImage(item.image);
                            setPreviewOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                          title="Preview"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-200 mb-3 bg-slate-100">
                      <Image
                        src={item.image}
                        alt={item.title || "Popup"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-slate-800 line-clamp-1">
                        {item.title || "Untitled Promotion"}
                      </h4>
                      {item.link ? (
                        <p className="text-xs text-slate-500 line-clamp-1 flex items-center gap-1">
                          <LinkIcon size={12} className="shrink-0 text-slate-400" />
                          <span className="truncate">{item.link}</span>
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400">No redirect link</p>
                      )}
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                        item.isActive
                          ? "bg-amber-100 hover:bg-amber-200 text-amber-800"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {item.isActive ? "Deactivate Popup" : "Set As Active Popup"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Live Preview */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-[380px] aspect-square rounded-2xl shadow-2xl overflow-hidden bg-white">
            <button
              type="button"
              onClick={() => setPreviewOpen(false)}
              className="absolute top-3 right-3 z-50 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center cursor-pointer shadow-md"
            >
              <X size={18} />
            </button>
            <Image
              src={previewImage}
              alt="Modal Preview"
              fill
              className="object-cover"
            />
          </div>
        </div>
      )}
    </div>
  );
}
