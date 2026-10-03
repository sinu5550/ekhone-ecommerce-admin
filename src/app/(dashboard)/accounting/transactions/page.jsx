"use client";

import React, { useState } from "react";
import {
    Receipt,
    Plus,
    Search,
    Edit2,
    Trash2,
    ArrowUpRight,
    ArrowDownRight,
    Loader2,
    ChevronLeft,
    ChevronRight,
    DollarSign
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import TransactionModal from "@/components/accounting/TransactionModal";
import ExportButtons from "@/components/accounting/ExportButtons";
import AccountingNavTabs from "@/components/accounting/AccountingNavTabs";
import { useAccountingTransactions, useAccountingHeads } from "@/hooks/useAccounting";

export default function TransactionsPage() {
    // Filters
    const [typeFilter, setTypeFilter] = useState("all");
    const [headFilter, setHeadFilter] = useState("");
    const [methodFilter, setMethodFilter] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    // Modal
    const [selectedTrx, setSelectedTrx] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalDefaultType, setModalDefaultType] = useState("EXPENSE");

    const { heads } = useAccountingHeads();
    const {
        transactions,
        summary,
        pagination,
        isLoading: loading,
        mutate: fetchTransactions
    } = useAccountingTransactions({
        page,
        limit: 20,
        type: typeFilter,
        accountHeadId: headFilter,
        paymentMethod: methodFilter,
        startDate,
        endDate,
        search
    });

    const handleDelete = async (trx) => {
        const result = await Swal.fire({
            title: `Delete Voucher ${trx.voucherNo}?`,
            text: `Are you sure you want to delete this ${trx.type.toLowerCase()} of ৳${parseFloat(trx.amount).toLocaleString()}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e11d48",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, delete",
        });

        if (result.isConfirmed) {
            try {
                await apiClient(`/api/accounting/transactions/${trx.id}`, { method: "DELETE" });
                toast.success("Transaction deleted successfully");
                fetchTransactions();
            } catch (error) {
                toast.error(error.message || "Failed to delete transaction");
            }
        }
    };

    const openCreateModal = (defType = "EXPENSE") => {
        setSelectedTrx(null);
        setModalDefaultType(defType);
        setIsModalOpen(true);
    };

    const openEditModal = (trx) => {
        setSelectedTrx(trx);
        setModalDefaultType(trx.type);
        setIsModalOpen(true);
    };

    const exportColumns = [
        { key: "voucherNo", label: "Voucher #" },
        { key: "date", label: "Date", accessor: (row) => new Date(row.date).toLocaleDateString("en-GB") },
        { key: "type", label: "Type" },
        { key: "accountHead", label: "Account Head", accessor: (row) => row.accountHead?.title || "" },
        { key: "paymentMethod", label: "Payment Method" },
        { key: "reference", label: "Reference" },
        { key: "amount", label: "Amount" },
        { key: "note", label: "Note" },
    ];

    return (
        <div className="space-y-6 text-gray-800 pb-12">
            {/* Navigation Tabs */}
            <AccountingNavTabs />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher text-gray-900">
                        Income & Expense Entries
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        General financial vouchers for operational costs, overheads, and auxiliary revenues
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => openCreateModal("INCOME")}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer transition-colors shadow-xs"
                    >
                        <Plus size={16} />
                        Record Income
                    </button>
                    <button
                        type="button"
                        onClick={() => openCreateModal("EXPENSE")}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-secound hover:bg-secound-hover text-white rounded cursor-pointer transition-colors shadow-xs"
                    >
                        <Plus size={16} />
                        Record Expense
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                            Total Income
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalIncome.toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <ArrowDownRight size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                            Total Expenses
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalExpense.toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                        <ArrowUpRight size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                            Net Balance
                        </p>
                        <h3
                            className={`text-2xl font-bold mt-1 ${
                                summary.netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                        >
                            ৳{summary.netBalance.toLocaleString()}
                        </h3>
                    </div>
                    <div className="p-3 bg-secound/10 text-secound rounded-lg">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        {/* Search */}
                        <div className="relative min-w-[220px] flex-1 max-w-sm">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Search voucher, ref #, note..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700"
                            />
                        </div>

                        {/* Export */}
                        <ExportButtons data={transactions} fileName="transactions" columns={exportColumns} />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200">
                        {/* Type Filter */}
                        <div className="flex items-center gap-1 bg-white p-1 rounded border border-gray-200">
                            {["all", "EXPENSE", "INCOME"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => {
                                        setTypeFilter(t);
                                        setPage(1);
                                    }}
                                    className={`px-3 py-1 rounded text-xs font-medium capitalize cursor-pointer transition-all ${
                                        typeFilter === t
                                            ? "bg-secound text-white font-semibold shadow-xs"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    {t === "all" ? "All Vouchers" : t.toLowerCase()}
                                </button>
                            ))}
                        </div>

                        {/* Account Head Filter */}
                        <select
                            value={headFilter}
                            onChange={(e) => {
                                setHeadFilter(e.target.value);
                                setPage(1);
                            }}
                            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700 cursor-pointer"
                        >
                            <option value="">All Account Heads</option>
                            {heads.map((h) => (
                                <option key={h.id} value={h.id}>
                                    {h.title} ({h.type})
                                </option>
                            ))}
                        </select>

                        {/* Dates */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 font-medium">From:</span>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 font-medium">To:</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold">
                                <th className="py-3 px-4">Voucher #</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Type</th>
                                <th className="py-3 px-4">Account Head</th>
                                <th className="py-3 px-4">Method</th>
                                <th className="py-3 px-4">Ref / Bill #</th>
                                <th className="py-3 px-4">Note</th>
                                <th className="py-3 px-4 text-right">Amount</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400">
                                        <Loader2 size={24} className="animate-spin mx-auto text-secound mb-2" />
                                        Loading vouchers...
                                    </td>
                                </tr>
                            ) : transactions.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                                        No transactions recorded matching your search.
                                    </td>
                                </tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-secound text-xs">
                                            {t.voucherNo}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">
                                            {new Date(t.date).toLocaleDateString("en-GB")}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    t.type === "INCOME"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                                }`}
                                            >
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-900">
                                            {t.accountHead?.title}
                                        </td>
                                        <td className="py-3 px-4 text-gray-600 text-xs">{t.paymentMethod}</td>
                                        <td className="py-3 px-4 text-gray-500 font-mono text-xs">{t.reference || "—"}</td>
                                        <td className="py-3 px-4 text-gray-500 max-w-xs truncate text-xs">{t.note || "—"}</td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                                            {t.type === "INCOME" ? "+" : "-"}৳{parseFloat(t.amount).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(t)}
                                                    className="p-1.5 rounded text-gray-500 hover:text-secound hover:bg-secound/10 transition-colors cursor-pointer"
                                                    title="Edit Voucher"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(t)}
                                                    className="p-1.5 rounded text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                                    title="Delete Voucher"
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

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-xs text-gray-500 bg-gray-50/50">
                        <span>
                            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} entries)
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                disabled={pagination.currentPage <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="p-1.5 rounded border border-gray-300 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                type="button"
                                disabled={pagination.currentPage >= pagination.totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="p-1.5 rounded border border-gray-300 hover:bg-white disabled:opacity-40 transition-colors cursor-pointer"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <TransactionModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                transaction={selectedTrx}
                defaultType={modalDefaultType}
                heads={heads}
                onSuccess={fetchTransactions}
            />
        </div>
    );
}
