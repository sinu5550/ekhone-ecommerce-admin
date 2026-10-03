"use client";

import React, { useState } from "react";
import {
    BarChart3,
    Loader2,
    TrendingUp,
    Receipt
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import DateRangeFilter from "@/components/accounting/DateRangeFilter";
import ExportButtons from "@/components/accounting/ExportButtons";
import AccountingNavTabs from "@/components/accounting/AccountingNavTabs";
import { useHeadWiseExpenses } from "@/hooks/useAccounting";

const COLORS = ["#8d2b3a", "#059669", "#d97706", "#2563eb", "#7c3aed", "#0891b2", "#e11d48", "#475569", "#10b981", "#6366f1"];

export default function HeadWiseExpensesPage() {
    const [filter, setFilter] = useState({
        period: "this_month",
        startDate: "",
        endDate: "",
    });

    const { breakdown, totalExpenses, isLoading: loading } = useHeadWiseExpenses({
        period: filter.period,
        startDate: filter.startDate,
        endDate: filter.endDate
    });

    const topHead = breakdown.length > 0 ? breakdown[0] : null;

    const exportColumns = [
        { key: "code", label: "Head Code" },
        { key: "title", label: "Account Head" },
        { key: "count", label: "Transactions" },
        { key: "amount", label: "Total Amount (৳)" },
        { key: "percentage", label: "Share (%)", accessor: (row) => `${row.percentage}%` },
    ];

    return (
        <div className="space-y-6 text-gray-800 pb-12">
            {/* Navigation Tabs */}
            <AccountingNavTabs />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher text-gray-900">
                        Head-wise Expense Analysis
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Detailed departmental cost distribution, marketing burn & overhead allocation
                    </p>
                </div>

                <ExportButtons data={breakdown} fileName="head-wise-expenses" columns={exportColumns} />
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                            Total Period Expenses
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{totalExpenses.toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">All operating costs & logistics fees</p>
                    </div>
                    <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                        <Receipt size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold text-secound uppercase tracking-wider">
                            Highest Expense Head
                        </p>
                        <h3 className="text-xl font-bold text-slate-900 mt-1 truncate">
                            {topHead ? topHead.title : "—"}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {topHead ? `৳${topHead.amount.toLocaleString()} (${topHead.percentage}%)` : "No expenses"}
                        </p>
                    </div>
                    <div className="p-3 bg-secound/10 text-secound rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                            Active Expense Heads
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {breakdown.length}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Categories with expenses</p>
                    </div>
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                        <BarChart3 size={24} />
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Horizontal Bar Chart */}
                <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                    <h3 className="text-base font-bold font-philosopher text-gray-900 mb-0.5">
                        Expense Comparison by Account Head
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Total amount spent per category</p>

                    <div className="h-[280px] w-full">
                        {breakdown.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={breakdown.slice(0, 8)} layout="vertical" margin={{ top: 5, right: 20, left: 30, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis dataKey="title" type="category" tick={{ fontSize: 11 }} width={120} />
                                    <Tooltip
                                        formatter={(val) => [`৳${Number(val).toLocaleString()}`, "Expense Amount"]}
                                        contentStyle={{ borderRadius: "8px", fontSize: "12px", border: "1px solid #e2e8f0" }}
                                    />
                                    <Bar dataKey="amount" fill="#8d2b3a" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                No expenses recorded to chart for this period
                            </div>
                        )}
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-base font-bold font-philosopher text-gray-900 mb-0.5">
                            Share Distribution
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">% of total budget</p>

                        <div className="h-[230px] w-full flex items-center justify-center">
                            {breakdown.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={breakdown}
                                            dataKey="amount"
                                            nameKey="title"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={55}
                                            outerRadius={85}
                                            paddingAngle={3}
                                        >
                                            {breakdown.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value) => [`৳${Number(value).toLocaleString()}`, "Amount"]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-xs text-gray-400">No data</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-900">Head-wise Cost Summary</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold">
                                <th className="py-3 px-4">Code</th>
                                <th className="py-3 px-4">Account Head</th>
                                <th className="py-3 px-4 text-center">Transactions</th>
                                <th className="py-3 px-4 text-right">Total Spent</th>
                                <th className="py-3 px-4">Share of Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        <Loader2 size={24} className="animate-spin mx-auto text-secound mb-2" />
                                        Aggregating expense heads...
                                    </td>
                                </tr>
                            ) : breakdown.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400 text-sm">
                                        No expenses recorded for the selected date period.
                                    </td>
                                </tr>
                            ) : (
                                breakdown.map((item, idx) => (
                                    <tr key={item.headId || idx} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-gray-500 text-xs">
                                            {item.code}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-gray-900 flex items-center gap-2">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                            />
                                            {item.title}
                                        </td>
                                        <td className="py-3 px-4 text-center font-semibold text-gray-700 text-xs">
                                            {item.count}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                                            ৳{item.amount.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2 max-w-xs">
                                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-secound h-2 rounded-full transition-all"
                                                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-gray-700 text-xs w-12 text-right">
                                                    {item.percentage}%
                                                </span>
                                            </div>
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
