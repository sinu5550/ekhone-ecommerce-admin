"use client";

import React, { useState } from "react";
import {
    ListTree,
    Plus,
    Search,
    Edit2,
    Trash2,
    CheckCircle2,
    XCircle,
    Sparkles,
    Loader2
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import HeadModal from "@/components/accounting/HeadModal";
import ExportButtons from "@/components/accounting/ExportButtons";
import AccountingNavTabs from "@/components/accounting/AccountingNavTabs";
import { useAccountingHeads } from "@/hooks/useAccounting";

export default function AccountHeadsPage() {
    const [seeding, setSeeding] = useState(false);
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");

    const [selectedHead, setSelectedHead] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { heads, isLoading: loading, mutate: fetchHeads } = useAccountingHeads({
        type: typeFilter,
        status: statusFilter,
        search
    });

    const handleSeedDefaults = async () => {
        try {
            setSeeding(true);
            const res = await apiClient("/api/accounting/heads/seed-defaults", { method: "POST" });
            toast.success(res.message || "Default account heads initialized!");
            fetchHeads();
        } catch (error) {
            console.error("Seed error:", error);
            toast.error(error.message || "Failed to seed default heads");
        } finally {
            setSeeding(false);
        }
    };

    const handleDelete = async (head) => {
        const result = await Swal.fire({
            title: `Delete '${head.title}'?`,
            text: "Are you sure? Heads with linked transactions cannot be deleted.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e11d48",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, delete",
        });

        if (result.isConfirmed) {
            try {
                await apiClient(`/api/accounting/heads/${head.id}`, { method: "DELETE" });
                toast.success("Account head deleted successfully");
                fetchHeads();
            } catch (error) {
                Swal.fire({
                    icon: "error",
                    title: "Cannot Delete",
                    text: error.message || "Failed to delete account head",
                });
            }
        }
    };

    const handleToggleStatus = async (head) => {
        try {
            await apiClient(`/api/accounting/heads/${head.id}`, {
                method: "PUT",
                body: JSON.stringify({ status: !head.status }),
            });
            toast.success(`Account head marked as ${!head.status ? "Active" : "Inactive"}`);
            fetchHeads();
        } catch (error) {
            toast.error("Failed to update status");
        }
    };

    const openCreateModal = () => {
        setSelectedHead(null);
        setIsModalOpen(true);
    };

    const openEditModal = (head) => {
        setSelectedHead(head);
        setIsModalOpen(true);
    };

    const exportColumns = [
        { key: "code", label: "Code" },
        { key: "title", label: "Title" },
        { key: "type", label: "Type" },
        { key: "description", label: "Description" },
        { key: "transactionCount", label: "Transactions" },
        { key: "totalAmount", label: "Total Amount" },
        { key: "status", label: "Status", accessor: (row) => (row.status ? "Active" : "Inactive") },
    ];

    return (
        <div className="space-y-6 text-gray-800 pb-12">
            {/* Navigation Tabs */}
            <AccountingNavTabs />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher text-gray-900">
                        Account Heads
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Chart of accounts: Categorize all revenues, direct costs & operating expenses ({heads.length} total)
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSeedDefaults}
                        disabled={seeding}
                        className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-300 hover:bg-gray-100 text-gray-700 rounded text-xs font-medium cursor-pointer transition-all shadow-xs"
                    >
                        {seeding ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        Seed Standard Heads
                    </button>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="flex items-center gap-1.5 px-4 py-2 bg-secound hover:bg-secound-hover text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-xs"
                    >
                        <Plus size={16} />
                        Add New Head
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Search */}
                        <div className="relative min-w-[220px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Search by title or code..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700"
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200">
                            {["all", "INCOME", "EXPENSE"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTypeFilter(t)}
                                    className={`px-3 py-1 rounded text-xs font-medium capitalize cursor-pointer transition-all ${
                                        typeFilter === t
                                            ? "bg-secound text-white font-semibold shadow-xs"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    {t === "all" ? "All Types" : t.toLowerCase()}
                                </button>
                            ))}
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700 cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                        </select>
                    </div>

                    <ExportButtons data={heads} fileName="account-heads" columns={exportColumns} />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold">
                                <th className="py-3 px-4">Code</th>
                                <th className="py-3 px-4">Account Head</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Description</th>
                                <th className="py-3 px-4 text-center">Transactions</th>
                                <th className="py-3 px-4 text-right">Total Volume</th>
                                <th className="py-3 px-4 text-center">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-400">
                                        <Loader2 size={24} className="animate-spin mx-auto text-secound mb-2" />
                                        Loading account heads...
                                    </td>
                                </tr>
                            ) : heads.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-12 text-center text-gray-400 text-sm">
                                        No account heads found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                heads.map((h) => (
                                    <tr key={h.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-gray-500 text-xs">
                                            {h.code || `AH-${h.id}`}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-gray-900">
                                            {h.title}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    h.type === "INCOME"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                                }`}
                                            >
                                                {h.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 max-w-xs truncate text-xs">
                                            {h.description || "—"}
                                        </td>
                                        <td className="py-3 px-4 text-center font-semibold text-gray-700 text-xs">
                                            {h.transactionCount || 0}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                                            ৳{(h.totalAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleToggleStatus(h)}
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition-all ${
                                                    h.status
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                                        : "bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                                                }`}
                                            >
                                                {h.status ? (
                                                    <>
                                                        <CheckCircle2 size={12} className="text-emerald-600" />
                                                        Active
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle size={12} className="text-gray-400" />
                                                        Inactive
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(h)}
                                                    className="p-1.5 rounded text-gray-500 hover:text-secound hover:bg-secound/10 transition-colors cursor-pointer"
                                                    title="Edit Head"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(h)}
                                                    className="p-1.5 rounded text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                    title="Delete Head"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            <HeadModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                head={selectedHead}
                onSuccess={fetchHeads}
            />
        </div>
    );
}
