"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import {
  Palette,
  Image as ImageIcon,
  Type,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import CloudinaryImageInput from "@/components/ui/CloudinaryImageInput";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { useStoreSetting, useUpdateStoreSetting } from "@/hooks/useStoreSetting";

export default function BrandingSettingsPage() {
  const { settings, isLoading, mutate } = useStoreSetting();
  const { updateSettings } = useUpdateStoreSetting();

  const [formData, setFormData] = useState({
    siteTitle: "Ekhone",
    logo: "",
    footerLogo: "",
    favicon: "",
    navbarLogoBg: false,
    footerLogoBg: false,
    primaryColor: "#F45116",
    secondaryColor: "#102D50",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        siteTitle: settings.siteTitle || "Ekhone",
        logo: settings.logo || "",
        footerLogo: settings.footerLogo || "",
        favicon: settings.favicon || "",
        navbarLogoBg: Boolean(settings.navbarLogoBg),
        footerLogoBg: Boolean(settings.footerLogoBg),
        primaryColor: settings.primaryColor || "#F45116",
        secondaryColor: settings.secondaryColor || "#102D50",
      });

      // Also dynamically update CSS variables in admin document root
      if (typeof document !== "undefined") {
        if (settings.primaryColor) {
          document.documentElement.style.setProperty("--primary", settings.primaryColor);
        }
        if (settings.secondaryColor) {
          document.documentElement.style.setProperty("--secondary", settings.secondaryColor);
          document.documentElement.style.setProperty("--secound", settings.secondaryColor);
        }
      }
    }
  }, [settings]);

  const handleColorChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (typeof document !== "undefined") {
      if (key === "primaryColor") {
        document.documentElement.style.setProperty("--primary", value);
      }
      if (key === "secondaryColor") {
        document.documentElement.style.setProperty("--secondary", value);
        document.documentElement.style.setProperty("--secound", value);
      }
    }
  };

  const handleLogoUpload = (url) => {
    setFormData((prev) => ({ ...prev, logo: url }));
    toast.success("Navbar logo uploaded!");
  };

  const handleFooterLogoUpload = (url) => {
    setFormData((prev) => ({ ...prev, footerLogo: url }));
    toast.success("Footer logo uploaded!");
  };

  const handleFaviconUpload = (url) => {
    setFormData((prev) => ({ ...prev, favicon: url }));
    toast.success("Favicon uploaded!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      toast.success("Branding and theme settings saved successfully!");
      mutate();
    } catch (err) {
      toast.error(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetColors = () => {
    handleColorChange("primaryColor", "#F45116");
    handleColorChange("secondaryColor", "#102D50");
    toast.success("Colors reset to default Ekhone theme!");
  };

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#102D50] to-[#1E4675] text-white p-6 sm:p-7 rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg text-xs font-medium tracking-wide mb-2">
            <Palette size={14} className="text-[#F45116]" />
            <span>Storefront Theme & Branding</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Logo, Favicon & Brand Colors
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl">
            Control your website logo, browser favicon, and primary/secondary theme colors dynamically across both Storefront and Admin Panel.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Navbar & Footer Logo Setup */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon size={20} className="text-[#F45116]" />
              <span>Navbar & Footer Logo Images</span>
            </h2>

            {/* 1. Navbar Logo Section */}
            <div className="space-y-3 pb-5 border-b border-slate-100">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Navbar / Header Logo (PNG, WebP, SVG)
              </label>
              <CloudinaryImageInput
                label="Upload Navbar Logo"
                onUpload={handleLogoUpload}
              />

              {formData.logo ? (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-600 block">Navbar Logo Preview:</span>
                  <div className="flex items-center gap-4">
                    <div
                      className={`relative w-36 h-12 rounded-lg border flex items-center justify-center p-1.5 ${
                        formData.navbarLogoBg ? "bg-white border-slate-300" : "bg-transparent border-dashed border-slate-300"
                      }`}
                    >
                      <Image
                        src={formData.logo}
                        alt="Navbar Logo Preview"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, logo: "" })}
                      className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remove Navbar Logo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center">
                  <span className="text-xs text-slate-500 font-medium">
                    Default logo (<code className="text-slate-700">/ekhone.png</code>) is active for Navbar.
                  </span>
                </div>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={formData.navbarLogoBg}
                  onChange={(e) => setFormData({ ...formData, navbarLogoBg: e.target.checked })}
                  className="w-4 h-4 rounded text-[#F45116] focus:ring-[#F45116] border-slate-300 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  Navbar Logo: Give White Background Box (সাদা ব্যাকগ্রাউন্ড)
                </span>
              </label>
            </div>

            {/* 2. Footer Logo Section */}
            <div className="space-y-3 pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Footer Logo (PNG, WebP, SVG)
              </label>
              <CloudinaryImageInput
                label="Upload Footer Logo"
                onUpload={handleFooterLogoUpload}
              />

              {formData.footerLogo ? (
                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-2">
                  <span className="text-xs font-bold text-slate-600 block">Footer Logo Preview:</span>
                  <div className="flex items-center gap-4">
                    <div
                      className={`relative w-44 h-14 rounded-lg border flex items-center p-1.5 ${
                        formData.footerLogoBg
                          ? "bg-white border-slate-300 justify-center"
                          : "bg-[#0a1c33] border-slate-700 justify-start"
                      }`}
                    >
                      <Image
                        src={formData.footerLogo}
                        alt="Footer Logo Preview"
                        fill
                        className={`object-contain p-1 ${
                          formData.footerLogoBg ? "object-center" : "object-left"
                        }`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, footerLogo: "" })}
                      className="text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                    >
                      Remove Footer Logo
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-center">
                  <span className="text-xs text-slate-500 font-medium">
                    {formData.logo ? "Navbar logo will be used in Footer (or default /ekhone.png)" : "Default logo (/ekhone.png) is active for Footer."}
                  </span>
                </div>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                <input
                  type="checkbox"
                  checked={formData.footerLogoBg}
                  onChange={(e) => setFormData({ ...formData, footerLogoBg: e.target.checked })}
                  className="w-4 h-4 rounded text-[#F45116] focus:ring-[#F45116] border-slate-300 cursor-pointer"
                />
                <span className="text-xs sm:text-sm font-medium text-slate-700">
                  Footer Logo: Give White Background Box
                </span>
              </label>
            </div>
          </div>

          {/* Card 2: Favicon & Brand Colors */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-xs space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Palette size={20} className="text-[#F45116]" />
              <span>Favicon & Brand Colors</span>
            </h2>

            {/* Favicon Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Browser Tab Favicon (1:1 Small Icon)
              </label>
              <CloudinaryImageInput
                label="Upload Browser Favicon"
                onUpload={handleFaviconUpload}
              />
              {formData.favicon && (
                <div className="mt-3 flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="relative w-8 h-8 rounded border border-slate-300 overflow-hidden bg-white shrink-0">
                    <Image
                      src={formData.favicon}
                      alt="Favicon"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-xs text-slate-600 font-medium">Favicon will appear on browser tab</span>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, favicon: "" })}
                    className="ml-auto text-xs text-red-600 hover:underline font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            {/* Brand Colors Setup */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Brand Color Palette
                </span>
                <button
                  type="button"
                  onClick={handleResetColors}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#F45116] font-medium transition cursor-pointer"
                >
                  <RotateCcw size={12} />
                  <span>Reset to Default</span>
                </button>
              </div>

              {/* Primary Color Picker */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Primary Brand Color (Buttons, Badges, Highlights)
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {formData.primaryColor}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={formData.primaryColor}
                    onChange={(e) => handleColorChange("primaryColor", e.target.value)}
                    placeholder="#F45116"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F45116]/20 uppercase"
                  />
                  <div
                    className="w-10 h-10 rounded-lg shadow-xs border border-white"
                    style={{ backgroundColor: formData.primaryColor }}
                  />
                </div>
              </div>

              {/* Secondary Color Picker */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Secondary Brand Color (Header, Navy Accents, Footers)
                  </label>
                  <span className="text-xs font-mono font-bold text-slate-800">
                    {formData.secondaryColor}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondaryColor}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                    className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5 bg-white"
                  />
                  <input
                    type="text"
                    value={formData.secondaryColor}
                    onChange={(e) => handleColorChange("secondaryColor", e.target.value)}
                    placeholder="#102D50"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#F45116]/20 uppercase"
                  />
                  <div
                    className="w-10 h-10 rounded-lg shadow-xs border border-white"
                    style={{ backgroundColor: formData.secondaryColor }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Bar */}
        <div className="bg-white rounded-lg p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Eye size={16} className="text-[#F45116]" />
            <span>Live Color & Button Preview:</span>
          </h3>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              style={{ backgroundColor: formData.primaryColor }}
              className="px-5 py-2.5 rounded-lg text-white font-bold text-xs shadow-md"
            >
              Primary Button ({formData.primaryColor})
            </button>
            <button
              type="button"
              style={{ backgroundColor: formData.secondaryColor }}
              className="px-5 py-2.5 rounded-lg text-white font-bold text-xs shadow-md"
            >
              Secondary Header ({formData.secondaryColor})
            </button>
            <span
              style={{ color: formData.primaryColor }}
              className="font-extrabold text-sm"
            >
              Highlighted Text Example
            </span>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: formData.primaryColor || "#F45116" }}
            className="py-3 px-8 text-white font-bold text-sm rounded-lg hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2"
          >
            <Check size={18} />
            <span>{saving ? "Saving Changes..." : "Save Branding & Theme Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

