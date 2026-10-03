"use client";

import React, { useState, useMemo } from "react";
import {
    Calendar,
    Loader2,
    DollarSign,
    TrendingUp,
    Receipt,
    Wallet
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import AccountingNavTabs from "@/components/accounting/AccountingNavTabs";
import { useDateWiseReport } from "@/hooks/useAccounting";
import DateRangeFilter from "@/components/accounting/DateRangeFilter";
import ExportButtons from "@/components/accounting/ExportButtons";

export default function DateWiseReportPage() {
    const [filter, setFilter] = useState({
        period: "this_month",
        startDate: "",
        endDate: "",
    });

    const queryParams = useMemo(() => ({
        period: filter.period || undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
    }), [filter]);

    const { records, summary, isLoading } = useDateWiseReport(queryParams);

    const chartData = useMemo(() => [...records].reverse(), [records]);

    const exportColumns = [
        { key: "date", label: "Date" },
        { key: "orderCount", label: "Orders" },
        { key: "sales", label: "Sales (৳)" },
        { key: "collections", label: "Collections (৳)" },
        { key: "expenses", label: "Expenses (৳)" },
        { key: "netFlow", label: "Net Cashflow (৳)" },
    ];

    return (
        <div className="space-y-6 text-gray-800 pb-12">
            {/* Nav Tabs */}
            <AccountingNavTabs />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher text-gray-900">
                        Date-wise Financial Ledger
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Daily cashflow tracking, order sales volume, collections recovered & outgoing expenses
                    </p>
                </div>

                <ExportButtons data={records} fileName="date-wise-financial-report" columns={exportColumns} />
            </div>

            {/* Filter */}
            <DateRangeFilter
                period={filter.period}
                startDate={filter.startDate}
                endDate={filter.endDate}
                showStatus={false}
                onFilterChange={setFilter}
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Total Period Sales
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalSales.toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Generated orders</p>
                    </div>
                    <div className="p-3 bg-secound/10 text-secound rounded-lg">
                        <DollarSign size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                            Total Collections
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalCollections.toLocaleString()}
                        </h3>
                        <p className="text-xs text-emerald-600 mt-0.5">Cash received</p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                            Total Expenses
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalExpenses.toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Operating costs</p>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                        <Receipt size={22} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-teal-700 uppercase tracking-wider">
                            Net Cash Flow
                        </p>
                        <h3
                            className={`text-2xl font-bold mt-1 ${
                                summary.netCashFlow >= 0 ? "text-emerald-600" : "text-rose-600"
                            }`}
                        >
                            ৳{summary.netCashFlow.toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Collections minus Expenses</p>
                    </div>
                    <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                        <Wallet size={22} />
                    </div>
                </div>
            </div>

            {/* Timeline Area Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                <h3 className="text-base font-bold font-philosopher text-gray-900 mb-0.5">
                    Daily Cash Inflows vs Cash Outflows
                </h3>
                <p className="text-xs text-gray-500 mb-4">Comparing sales demand, collections & expenses</p>

                <div className="h-[280px] w-full">
                    {chartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8d2b3a" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#8d2b3a" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#e11d48" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip
                                    formatter={(val) => [`৳${Number(val).toLocaleString()}`, ""]}
                                    contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e2e8f0" }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    name="Sales (৳)"
                                    stroke="#8d2b3a"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#salesGrad)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="collections"
                                    name="Collections (৳)"
                                    stroke="#059669"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colGrad)"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expenses"
                                    name="Expenses (৳)"
                                    stroke="#e11d48"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#expGrad)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">
                            No chart data available for selected period
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold">
                                <th className="py-3 px-4">Date</th>
                                <th className="py-3 px-4 text-center">Orders</th>
                                <th className="py-3 px-4 text-right">Sales Amount</th>
                                <th className="py-3 px-4 text-right">Collections</th>
                                <th className="py-3 px-4 text-right">Expenses</th>
                                <th className="py-3 px-4 text-right">Daily Net Cash Flow</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400">
                                        <Loader2 size={24} className="animate-spin mx-auto text-secound mb-2" />
                                        Compiling daily ledgers...
                                    </td>
                                </tr>
                            ) : records.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                                        No financial activities found in this period.
                                    </td>
                                </tr>
                            ) : (
                                records.map((r) => (
                                    <tr key={r.date} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-gray-900">
                                            {r.date}
                                        </td>
                                        <td className="py-3 px-4 text-center font-semibold text-gray-700 text-xs">
                                            {r.orderCount}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                                            ৳{r.sales.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                            ৳{r.collections.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-rose-600">
                                            ৳{r.expenses.toLocaleString()}
                                        </td>
                                        <td
                                            className={`py-3 px-4 text-right font-bold ${
                                                r.netFlow >= 0 ? "text-emerald-600" : "text-rose-600"
                                            }`}
                                        >
                                            {r.netFlow >= 0 ? "+" : ""}৳{r.netFlow.toLocaleString()}
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
