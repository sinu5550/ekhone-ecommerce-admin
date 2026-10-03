"use client";

import React, { useState } from "react";
import {
    FileSpreadsheet,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    DollarSign,
    TrendingUp,
    Clock
} from "lucide-react";
import ExportButtons from "@/components/accounting/ExportButtons";
import AccountingNavTabs from "@/components/accounting/AccountingNavTabs";
import { useSalesCollectionReport } from "@/hooks/useAccounting";

export default function SalesCollectionPage() {
    // Filters
    const [search, setSearch] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [orderStatus, setOrderStatus] = useState("all");
    const [courier, setCourier] = useState("all");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);

    const {
        orders,
        summary,
        pagination,
        isLoading: loading
    } = useSalesCollectionReport({
        page,
        limit: 20,
        search,
        paymentStatus,
        orderStatus,
        courier,
        startDate,
        endDate
    });

    const resetFilters = () => {
        setSearch("");
        setPaymentStatus("all");
        setOrderStatus("all");
        setCourier("all");
        setStartDate("");
        setEndDate("");
        setPage(1);
    };

    const hasActiveFilters = search || paymentStatus !== "all" || orderStatus !== "all" || courier !== "all" || startDate || endDate;

    const exportColumns = [
        { key: "orderNumber", label: "Order #" },
        { key: "orderDate", label: "Date", accessor: (row) => new Date(row.orderDate).toLocaleDateString("en-GB") },
        { key: "customer", label: "Customer Name", accessor: (row) => row.customer?.fullName || "" },
        { key: "phone", label: "Phone", accessor: (row) => row.customer?.phone || "" },
        { key: "courier", label: "Courier", accessor: (row) => row.shipment?.courier || "Direct" },
        { key: "trackingCode", label: "Tracking Code", accessor: (row) => row.shipment?.trackingCode || "—" },
        { key: "grandTotal", label: "Sales Value (৳)" },
        { key: "paidAmount", label: "Collected (৳)" },
        { key: "dueAmount", label: "Due (৳)" },
        { key: "paymentStatus", label: "Payment Status" },
        { key: "status", label: "Order Status" },
    ];

    return (
        <div className="space-y-6 text-gray-800 pb-12">
            {/* Navigation Tabs */}
            <AccountingNavTabs />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher text-gray-900">
                        Sales & Collection Ledger
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Cross-referenced delivered order sales, payment collections, customer dues, and courier reconciliations
                    </p>
                </div>

                <ExportButtons data={orders} fileName="sales-and-collection" columns={exportColumns} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Total Sales Value
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalSales.toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">{pagination.totalItems} orders</p>
                    </div>
                    <div className="p-3 bg-secound/10 text-secound rounded-lg">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                            Total Collected (Cash In)
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalCollected.toLocaleString()}
                        </h3>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                            Recovery Rate: {summary.totalSales > 0 ? ((summary.totalCollected / summary.totalSales) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                            Total Outstanding Due
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalDue.toLocaleString()}
                        </h3>
                        <p className="text-xs text-rose-600 font-medium mt-0.5">Unpaid or pending COD</p>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3 flex-1">
                            {/* Search */}
                            <div className="relative min-w-[240px] flex-1 max-w-sm">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    placeholder="Search order #, customer, phone, tracking..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700"
                                />
                            </div>

                            {/* Payment Status */}
                            <select
                                value={paymentStatus}
                                onChange={(e) => {
                                    setPaymentStatus(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700 cursor-pointer"
                            >
                                <option value="all">All Payment Status</option>
                                <option value="Paid">Paid</option>
                                <option value="Unpaid">Unpaid</option>
                                <option value="Partial">Partial</option>
                                <option value="COD">COD</option>
                            </select>

                            {/* Order Status */}
                            <select
                                value={orderStatus}
                                onChange={(e) => {
                                    setOrderStatus(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700 cursor-pointer"
                            >
                                <option value="all">All Delivered Orders</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="ReadyToShip">Ready To Ship</option>
                                <option value="InCourier">In-Courier</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="PreOrder">Pre-order</option>
                                <option value="ShipLater">Ship Later</option>
                                <option value="Hold">Hold</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Returned">Returned</option>
                            </select>

                            {/* Courier */}
                            <select
                                value={courier}
                                onChange={(e) => {
                                    setCourier(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700 cursor-pointer"
                            >
                                <option value="all">All Couriers</option>
                                <option value="STEADFAST">Steadfast</option>
                                <option value="PATHAO">Pathao</option>
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer hover:underline self-end lg:self-center"
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 font-medium">From Date:</span>
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
                            <span className="text-xs text-gray-600 font-medium">To Date:</span>
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
                                <th className="py-3 px-4">Order #</th>
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4">Customer</th>
                                <th className="py-3 px-4">Courier / Tracking</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4">Payment</th>
                                <th className="py-3 px-4 text-right">Order Total</th>
                                <th className="py-3 px-4 text-right">Collected</th>
                                <th className="py-3 px-4 text-right">Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400">
                                        <Loader2 size={24} className="animate-spin mx-auto text-secound mb-2" />
                                        Loading ledger records...
                                    </td>
                                </tr>
                            ) : orders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                                        No sales or collection records found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                orders.map((o) => (
                                    <tr key={o.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-secound text-xs">
                                            #{o.orderNumber}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">
                                            {new Date(o.orderDate).toLocaleDateString("en-GB")}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-gray-900">
                                                {o.customer?.fullName || "Guest Customer"}
                                            </p>
                                            <p className="text-xs text-gray-500 font-mono">
                                                {o.customer?.phone}
                                            </p>
                                        </td>
                                        <td className="py-3 px-4">
                                            {o.shipment ? (
                                                <div>
                                                    <span className="font-semibold text-gray-700 text-xs">
                                                        {o.shipment.courier}
                                                    </span>
                                                    <p className="text-xs font-mono text-gray-500">
                                                        {o.shipment.trackingCode || "Pending"}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Direct / Store</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    o.status === "Delivered"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : o.status === "Cancelled"
                                                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                                                        : "bg-sky-50 text-sky-700 border border-sky-200"
                                                }`}
                                            >
                                                {o.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    o.paymentStatus === "Paid"
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : o.paymentStatus === "Partial"
                                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                        : "bg-gray-100 text-gray-700 border border-gray-200"
                                                }`}
                                            >
                                                {o.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                                            ৳{parseFloat(o.grandTotal || o.totalAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                            ৳{parseFloat(o.paidAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-amber-600">
                                            ৳{parseFloat(o.dueAmount || 0).toLocaleString()}
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
                            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} orders)
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
        </div>
    );
}
