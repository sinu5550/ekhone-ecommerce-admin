"use client";

import React, { useState, useEffect } from "react";
import { X, Loader2, Save, Receipt } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";

const PAYMENT_METHODS = [
    "Cash",
    "bKash",
    "Nagad",
    "Rocket",
    "Bank Transfer",
    "City Bank",
    "BRAC Bank",
    "Islami Bank",
    "Credit Card",
    "Cheque",
    "Other",
];

export default function TransactionModal({
    isOpen,
    onClose,
    transaction = null,
    defaultType = "EXPENSE",
    heads = [],
    onSuccess,
}) {
    const [type, setType] = useState(defaultType);
    const [accountHeadId, setAccountHeadId] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [reference, setReference] = useState("");
    const [note, setNote] = useState("");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (transaction) {
            setType(transaction.type || "EXPENSE");
            setAccountHeadId(transaction.accountHeadId ? String(transaction.accountHeadId) : "");
            setAmount(transaction.amount ? String(transaction.amount) : "");
            setDate(transaction.date ? new Date(transaction.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
            setPaymentMethod(transaction.paymentMethod || "Cash");
            setReference(transaction.reference || "");
            setNote(transaction.note || "");
        } else {
            setType(defaultType);
            setAccountHeadId("");
            setAmount("");
            setDate(new Date().toISOString().slice(0, 10));
            setPaymentMethod("Cash");
            setReference("");
            setNote("");
        }
    }, [transaction, defaultType, isOpen]);

    if (!isOpen) return null;

    const filteredHeads = heads.filter((h) => h.type === type && (h.status ?? true));

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!accountHeadId) {
            toast.error("Please select an Account Head");
            return;
        }

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast.error("Please enter a valid positive amount");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                type,
                accountHeadId: parseInt(accountHeadId),
                amount: numAmount,
                date,
                paymentMethod,
                reference: reference.trim() || undefined,
                note: note.trim() || undefined,
            };

            if (transaction?.id) {
                await apiClient(`/api/accounting/transactions/${transaction.id}`, {
                    method: "PUT",
                    body: JSON.stringify(payload),
                });
                toast.success("Transaction updated successfully!");
            } else {
                await apiClient("/api/accounting/transactions", {
                    method: "POST",
                    body: JSON.stringify(payload),
                });
                toast.success(`${type === "INCOME" ? "Income" : "Expense"} entry recorded successfully!`);
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error("Save transaction error:", error);
            toast.error(error.message || "Failed to record transaction");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 rounded ${
                                type === "INCOME" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                        >
                            <Receipt size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold font-philosopher text-gray-900">
                                {transaction
                                    ? "Edit Transaction"
                                    : type === "INCOME"
                                    ? "Record Income Voucher"
                                    : "Record Expense Voucher"}
                            </h3>
                            <p className="text-xs text-gray-500">Record journal entry under account head</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            Transaction Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setType("EXPENSE");
                                    setAccountHeadId("");
                                }}
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
                                onClick={() => {
                                    setType("INCOME");
                                    setAccountHeadId("");
                                }}
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
                            Account Head <span className="text-red-500">*</span>
                        </label>
                        <select
                            required
                            value={accountHeadId}
                            onChange={(e) => setAccountHeadId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white text-gray-800 cursor-pointer"
                        >
                            <option value="">-- Select Account Head --</option>
                            {filteredHeads.map((h) => (
                                <option key={h.id} value={h.id}>
                                    {h.title} {h.code ? `(${h.code})` : ""}
                                </option>
                            ))}
                        </select>
                        {filteredHeads.length === 0 && (
                            <p className="text-[11px] text-amber-600 mt-1">
                                No active account heads found for {type}. Please add one in Account Heads.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Amount (৳) <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500 font-bold text-sm">৳</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    required
                                    placeholder="0.00"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white text-gray-900 font-semibold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white text-gray-800"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white text-gray-800 cursor-pointer"
                            >
                                {PAYMENT_METHODS.map((pm) => (
                                    <option key={pm} value={pm}>
                                        {pm}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                Reference / Cheque / Bill #
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. Bill #104, TrxID"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white text-gray-800"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Note / Memo
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Add memo or transaction purpose..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white text-gray-800"
                        />
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
                            className={`flex items-center gap-1.5 px-4 py-2 text-white text-xs font-medium rounded transition-colors cursor-pointer shadow-xs disabled:opacity-50 ${
                                type === "INCOME"
                                    ? "bg-emerald-600 hover:bg-emerald-700"
                                    : "bg-secound hover:bg-secound-hover"
                            }`}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={14} />
                                    {transaction ? "Update Entry" : "Save Entry"}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
