"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  CopyCheck,
  Clock,
  MessageSquare,
  ShieldAlert,
  Check,
  RotateCcw,
  Sparkles,
  Info
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { useStoreSetting, useUpdateStoreSetting } from "@/hooks/useStoreSetting";

export default function DuplicateOrderSettingsPage() {
  const { settings, isLoading, mutate } = useStoreSetting();
  const { updateSettings } = useUpdateStoreSetting();

  const [formData, setFormData] = useState({
    checkDuplicateOrder: true,
    duplicateOrderWindowHours: 24,
    duplicateOrderMessage: "You recently placed an order. Our team is processing it. If you need to make changes, please contact us."
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        checkDuplicateOrder: settings.checkDuplicateOrder !== undefined ? Boolean(settings.checkDuplicateOrder) : true,
        duplicateOrderWindowHours: settings.duplicateOrderWindowHours !== undefined ? Number(settings.duplicateOrderWindowHours) : 24,
        duplicateOrderMessage: settings.duplicateOrderMessage || "You recently placed an order. Our team is processing it. If you need to make changes, please contact us."
      });
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const toastId = toast.loading("Saving duplicate order settings...");

    try {
      await updateSettings({
        checkDuplicateOrder: Boolean(formData.checkDuplicateOrder),
        duplicateOrderWindowHours: Math.max(1, parseInt(formData.duplicateOrderWindowHours) || 24),
        duplicateOrderMessage: formData.duplicateOrderMessage.trim()
      });

      await mutate();
      toast.success("Duplicate order settings updated successfully!", { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to update settings", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({
      checkDuplicateOrder: true,
      duplicateOrderWindowHours: 24,
      duplicateOrderMessage: "You recently placed an order. Our team is processing it. If you need to make changes, please contact us."
    });
    toast.success("Reset to recommended defaults (click Save to apply)");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
            <CopyCheck className="w-7 h-7 text-[#F45116]" />
            Duplicate Order Protection Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure automated duplicate order prevention, time windows, and customer popup notifications.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#F45116] rounded-lg hover:bg-[#e0450e] disabled:opacity-50 transition shadow-sm cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card 1: Toggle ON/OFF */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-semibold text-gray-900">
                  Enable Duplicate Order Detection
                </h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed max-w-2xl">
                When enabled, customers who already placed an order with the same phone number within your configured time window will be prevented from placing duplicate orders accidentally. It also synchronizes <code className="bg-gray-100 text-[#102D50] px-1.5 py-0.5 rounded text-[11px] font-mono">check_duplicate_order: 'Yes'</code> with BizMation.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={formData.checkDuplicateOrder}
                onChange={(e) =>
                  setFormData({ ...formData, checkDuplicateOrder: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F45116]"></div>
            </label>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                formData.checkDuplicateOrder
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-gray-100 text-gray-600 border border-gray-200"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  formData.checkDuplicateOrder ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
              Status: {formData.checkDuplicateOrder ? "Active (Enabled)" : "Disabled"}
            </span>
            <span className="text-xs text-gray-400">
              BizMation flag: <b>{formData.checkDuplicateOrder ? "Yes" : "No"}</b>
            </span>
          </div>
        </div>

        {/* Card 2: Time Window */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Clock className="w-5 h-5 text-[#102D50]" />
            <h2 className="text-base font-semibold text-gray-900">
              Duplicate Detection Time Window
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-700">
                Window Duration (in Hours)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={formData.duplicateOrderWindowHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duplicateOrderWindowHours: Math.max(1, parseInt(e.target.value) || 1)
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#F45116] focus:bg-white transition"
                  placeholder="24"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-gray-400 font-medium">
                  Hours
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Recommended: <b>24 hours</b> (1 day). Common options: 1 hour, 6 hours, 24 hours, 48 hours.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-gray-700">Quick Select:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "1 Hour", hours: 1 },
                  { label: "6 Hours", hours: 6 },
                  { label: "12 Hours", hours: 12 },
                  { label: "24 Hours (Default)", hours: 24 },
                  { label: "48 Hours", hours: 48 },
                  { label: "72 Hours", hours: 72 }
                ].map((preset) => (
                  <button
                    key={preset.hours}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        duplicateOrderWindowHours: preset.hours
                      })
                    }
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition cursor-pointer ${
                      formData.duplicateOrderWindowHours === preset.hours
                        ? "bg-[#102D50] text-white border-[#102D50]"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Custom Popup Message */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Customer Notification Popup Message
            </h2>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-gray-700">
              Popup Text
            </label>
            <textarea
              rows={4}
              value={formData.duplicateOrderMessage}
              onChange={(e) =>
                setFormData({ ...formData, duplicateOrderMessage: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-[#F45116] focus:bg-white transition"
              placeholder="You recently placed an order. Our team is processing it. If you need to make changes, please contact us."
            />
            <div className="flex items-start gap-2 p-3 bg-blue-50/70 border border-blue-200/60 rounded-lg text-xs text-blue-800">
              <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span>
                Tip: You can include the customer's previous order number anywhere in the message using <code className="bg-blue-100/80 px-1 py-0.5 rounded font-mono text-[11px] font-bold">#ORD-XXXX</code>, and it will be replaced with their actual order number.
              </span>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="pt-2">
            <span className="block text-xs font-semibold text-gray-600 mb-2">Live Customer Preview:</span>
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-5 max-w-md mx-auto text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-gray-900">Recent Order Detected</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {formData.duplicateOrderMessage.replace(/#ORD-[A-Za-z0-9-]+/gi, "#ORD-202610-000004")}
              </p>
              <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[11px] text-amber-900 font-semibold">
                Order Reference: #ORD-202610-000004
              </div>
              <button
                type="button"
                className="w-full py-2 bg-[#102D50] text-white text-xs font-bold rounded-lg shadow-sm"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#F45116] rounded-lg hover:bg-[#e0450e] disabled:opacity-50 transition shadow cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
