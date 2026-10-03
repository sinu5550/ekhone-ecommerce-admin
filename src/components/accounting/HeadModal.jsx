"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Save } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";

export default function HeadModal({ isOpen, onClose, head = null, onSuccess }) {
    const [title, setTitle] = useState("");
    const [code, setCode] = useState("");
    const [type, setType] = useState("EXPENSE");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (head) {
            setTitle(head.title || "");
            setCode(head.code || "");
            setType(head.type || "EXPENSE");
            setDescription(head.description || "");
            setStatus(head.status ?? true);
        } else {
            setTitle("");
            setCode("");
            setType("EXPENSE");
            setDescription("");
            setStatus(true);
        }
    }, [head, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Account Head title is required");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                title: title.trim(),
                code: code.trim() || undefined,
                type,
                description: description.trim() || undefined,
                status,
            };

            if (head?.id) {
                await apiClient(`/api/accounting/heads/${head.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                toast.success("Account head updated successfully!");
            } else {
                await apiClient("/api/accounting/heads", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                toast.success("Account head created successfully!");
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Save head error:", error);
            toast.error(error.message || "Failed to save account head");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-bold font-philosopher text-gray-900">
                        {head ? "Edit Account Head" : "Add Account Head"}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Head Type <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType("EXPENSE")}
                                className={`py-2 text-xs font-semibold rounded border transition-all cursor-pointer ${
                                    type === "EXPENSE"
                                        ? "bg-rose-50 border-rose-500 text-rose-700 shadow-xs"
                                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                Expense
                            </button>
                            <button
                                type="button"
                                onClick={() => setType("INCOME")}
                                className={`py-2 text-xs font-semibold rounded border transition-all cursor-pointer ${
                                    type === "INCOME"
                                        ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs"
                                        : "border-gray-300 text-gray-600 hover:bg-gray-50"
                                }`}
                            >
                                Income
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Title / Head Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Office Rent, Marketing Ads, Packaging"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white text-gray-800"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Head Code (Optional)
                        </label>
                        <input
                            type="text"
                            placeholder="Auto-generated if empty (e.g. AH-EXP-001)"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white text-gray-800 font-mono text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Description / Purpose
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Briefly describe this account head..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white text-gray-800"
                        />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                        <span className="text-xs font-semibold text-gray-700">
                            Status (Active)
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={status}
                                onChange={(e) => setStatus(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secound"></div>
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded border border-gray-200 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-1.5 px-4 py-2 bg-secound hover:bg-secound-hover text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    {head ? "Update Head" : "Save Head"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
