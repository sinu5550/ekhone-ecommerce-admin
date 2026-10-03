"use client";

import React, { useState } from "react";
import {
    Truck,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    RotateCcw,
    DollarSign,
    Loader2,
    TrendingUp,
    Percent,
    ShieldCheck,
    ArrowUpRight
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import DateRangeFilter from "@/components/accounting/DateRangeFilter";
import ExportButtons from "@/components/accounting/ExportButtons";
import AccountingNavTabs from "@/components/accounting/AccountingNavTabs";
import { useCourierReport } from "@/hooks/useAccounting";

export default function CourierReportPage() {
    const [selectedCourier, setSelectedCourier] = useState("all");
    const [filter, setFilter] = useState({
        period: "this_month",
        startDate: "",
        endDate: "",
    });

    const { courierStats, shipments, isLoading: loading } = useCourierReport({
        courier: selectedCourier,
        period: filter.period,
        startDate: filter.startDate,
        endDate: filter.endDate
    });

    const steadfast = courierStats.STEADFAST || {};
    const pathao = courierStats.PATHAO || {};

    // Comparison chart data
    const comparisonChartData = [
        {
            courier: "Steadfast",
            Delivered: steadfast.delivered || 0,
            "In-Transit": steadfast.inTransit || 0,
            Returned: steadfast.returned || 0,
        },
        {
            courier: "Pathao",
            Delivered: pathao.delivered || 0,
            "In-Transit": pathao.inTransit || 0,
            Returned: pathao.returned || 0,
        },
    ];

    const exportColumns = [
        { key: "trackingCode", label: "Tracking Code" },
        { key: "orderNumber", label: "Order #" },
        { key: "recipientName", label: "Customer" },
        { key: "recipientPhone", label: "Phone" },
        { key: "courier", label: "Courier" },
        { key: "codAmount", label: "COD Amount (৳)" },
        { key: "courierCharge", label: "Courier Charge (৳)" },
        { key: "status", label: "Status" },
    ];

    return (
        <div className="space-y-6 pb-12">
            {/* Navigation Tabs */}
            <AccountingNavTabs />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="font-philosopher text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                        <Truck className="w-6 h-6 text-secound" />
                        Courier Sales & Reconciliation
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Comparative logistics analytics: COD delivery recovery, return rate losses & courier charges
                    </p>
                </div>

                <ExportButtons data={shipments} fileName="courier-sales-report" columns={exportColumns} />
            </div>

            {/* Filter */}
            <div className="space-y-3">
                <DateRangeFilter
                    period={filter.period}
                    startDate={filter.startDate}
                    endDate={filter.endDate}
                    showStatus={false}
                    onFilterChange={setFilter}
                />

                {/* Courier Switcher */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm w-fit">
                    <span className="text-xs font-semibold text-gray-500 ml-2">Courier:</span>
                    {["all", "STEADFAST", "PATHAO"].map((c) => (
                        <button
                            key={c}
                            onClick={() => setSelectedCourier(c)}
                            className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                                selectedCourier === c
                                    ? "bg-secound text-white shadow-xs"
                                    : "text-gray-600 hover:bg-gray-100"
                            }`}
                        >
                            {c === "all" ? "All Couriers" : c === "STEADFAST" ? "Steadfast" : "Pathao"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Head-to-Head Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Steadfast Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                                <Truck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Steadfast Courier
                                </h3>
                                <p className="text-xs text-gray-500">Logistics & COD Reconciliation</p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold text-xs rounded-full border border-blue-100">
                            {steadfast.totalParcels || 0} Parcels
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-100 text-center">
                        <div>
                            <span className="text-[11px] text-gray-500 uppercase font-medium">Delivered</span>
                            <p className="text-lg font-bold text-emerald-600">
                                {steadfast.delivered || 0}
                            </p>
                            <span className="text-[10px] text-gray-400">
                                Success: {steadfast.successRate || 0}%
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] text-gray-500 uppercase font-medium">In Transit</span>
                            <p className="text-lg font-bold text-sky-600">
                                {steadfast.inTransit || 0}
                            </p>
                            <span className="text-[10px] text-gray-400">
                                Pending COD: ৳{(steadfast.pendingCod || 0).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] text-gray-500 uppercase font-medium">Returned</span>
                            <p className="text-lg font-bold text-rose-600">
                                {steadfast.returned || 0}
                            </p>
                            <span className="text-[10px] text-gray-400">
                                Return Rate: {steadfast.returnRate || 0}%
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-gray-600">
                            <span>Total COD Sent</span>
                            <span className="font-semibold text-gray-900">
                                ৳{(steadfast.totalCodSent || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Delivered COD Collected</span>
                            <span className="font-semibold text-emerald-600">
                                ৳{(steadfast.deliveredCodCollected || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Courier Charges</span>
                            <span className="font-semibold text-rose-600">
                                ৳{(steadfast.courierCharges || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-gray-900 text-sm">
                            <span>Net Realized from Steadfast</span>
                            <span className="text-secound">
                                ৳{(steadfast.netRealized || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Pathao Card */}
                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm relative">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-100">
                                <Truck className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">
                                    Pathao Courier
                                </h3>
                                <p className="text-xs text-gray-500">Logistics & COD Reconciliation</p>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-semibold text-xs rounded-full border border-rose-100">
                            {pathao.totalParcels || 0} Parcels
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 py-3 border-y border-gray-100 text-center">
                        <div>
                            <span className="text-[11px] text-gray-500 uppercase font-medium">Delivered</span>
                            <p className="text-lg font-bold text-emerald-600">
                                {pathao.delivered || 0}
                            </p>
                            <span className="text-[10px] text-gray-400">
                                Success: {pathao.successRate || 0}%
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] text-gray-500 uppercase font-medium">In Transit</span>
                            <p className="text-lg font-bold text-sky-600">
                                {pathao.inTransit || 0}
                            </p>
                            <span className="text-[10px] text-gray-400">
                                Pending COD: ৳{(pathao.pendingCod || 0).toLocaleString()}
                            </span>
                        </div>
                        <div>
                            <span className="text-[11px] text-gray-500 uppercase font-medium">Returned</span>
                            <p className="text-lg font-bold text-rose-600">
                                {pathao.returned || 0}
                            </p>
                            <span className="text-[10px] text-gray-400">
                                Return Rate: {pathao.returnRate || 0}%
                            </span>
                        </div>
                    </div>

                    <div className="pt-4 space-y-2 text-xs">
                        <div className="flex justify-between text-gray-600">
                            <span>Total COD Sent</span>
                            <span className="font-semibold text-gray-900">
                                ৳{(pathao.totalCodSent || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Delivered COD Collected</span>
                            <span className="font-semibold text-emerald-600">
                                ৳{(pathao.deliveredCodCollected || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Courier Charges</span>
                            <span className="font-semibold text-rose-600">
                                ৳{(pathao.courierCharges || 0).toLocaleString()}
                            </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-100 font-bold text-gray-900 text-sm">
                            <span>Net Realized from Pathao</span>
                            <span className="text-secound">
                                ৳{(pathao.netRealized || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Bar Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Courier Delivery Status Comparison
                </h3>
                <p className="text-xs text-gray-500 mb-4">Delivered vs In-Transit vs Returned parcels</p>

                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="courier" tick={{ fontSize: 12, fontWeight: 600 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e5e7eb" }} />
                            <Legend />
                            <Bar dataKey="Delivered" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="In-Transit" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Returned" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Detailed Shipment Table */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-900">
                            Courier Consignment Records
                        </h3>
                        <p className="text-xs text-gray-500">Parcels dispatched with tracking codes and COD dues</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                        {shipments.length} parcels shown
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold bg-gray-50/70">
                                <th className="py-3 px-4">Tracking Code</th>
                                <th className="py-3 px-4">Order #</th>
                                <th className="py-3 px-4">Courier</th>
                                <th className="py-3 px-4">Recipient</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">COD Amount</th>
                                <th className="py-3 px-4 text-right">Courier Charge</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-secound mb-2" />
                                        Fetching courier records...
                                    </td>
                                </tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        No courier parcels found for this filter.
                                    </td>
                                </tr>
                            ) : (
                                shipments.map((s) => (
                                    <tr key={s.id} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-secound">
                                            {s.trackingCode || "N/A"}
                                        </td>
                                        <td className="py-3 px-4 font-mono font-semibold text-gray-700">
                                            #{s.orderNumber || "—"}
                                        </td>
                                        <td className="py-3 px-4 font-semibold text-gray-900">
                                            {s.courier}
                                        </td>
                                        <td className="py-3 px-4">
                                            <p className="font-semibold text-gray-900">{s.recipientName}</p>
                                            <p className="text-[11px] text-gray-500 font-mono">{s.recipientPhone}</p>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                                                    s.status === "Delivered"
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : s.status === "Returned"
                                                        ? "bg-rose-50 text-rose-700 border-rose-200"
                                                        : "bg-sky-50 text-sky-700 border-sky-200"
                                                }`}
                                            >
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                                            ৳{s.codAmount.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-rose-600">
                                            ৳{s.courierCharge.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

