"use client";

import React, { useState } from "react";
import {
    DollarSign,
    TrendingUp,
    Scale,
    Receipt,
    Truck,
    RotateCcw,
    CheckCircle2,
    Calendar,
    FileSpreadsheet,
    ListTree,
    Plus,
    Loader2,
    ArrowUpRight
} from "lucide-react";
import Link from "next/link";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from "recharts";
import AccountingKPICard from "@/components/accounting/AccountingKPICard";
import DateRangeFilter from "@/components/accounting/DateRangeFilter";
import HeadModal from "@/components/accounting/HeadModal";
import TransactionModal from "@/components/accounting/TransactionModal";
import AccountingNavTabs from "@/components/accounting/AccountingNavTabs";
import { useAccountingDashboard, useAccountingHeads } from "@/hooks/useAccounting";

const PIE_COLORS = ["#8d2b3a", "#059669", "#d97706", "#2563eb", "#7c3aed", "#0891b2", "#e11d48", "#475569"];

export default function AccountingDashboardPage() {
    const [filter, setFilter] = useState({
        period: "this_month",
        startDate: "",
        endDate: "",
        status: "all"
    });

    const { kpiData, headBreakdown, dateWiseData, isLoading: loading, mutate: mutateDashboard } = useAccountingDashboard(filter);
    const { heads, mutate: mutateHeads } = useAccountingHeads();

    // Modals
    const [isHeadModalOpen, setIsHeadModalOpen] = useState(false);
    const [isTransModalOpen, setIsTransModalOpen] = useState(false);
    const [transDefaultType, setTransDefaultType] = useState("EXPENSE");

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    const openRecordExpense = () => {
        setTransDefaultType("EXPENSE");
        setIsTransModalOpen(true);
    };

    const openRecordIncome = () => {
        setTransDefaultType("INCOME");
        setIsTransModalOpen(true);
    };

    const kpis = kpiData?.kpis || {};

    return (
        <div className="space-y-6 text-gray-800 pb-12">
            {/* Navigation Tabs */}
            <AccountingNavTabs />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher text-gray-900">
                        Accounting & Financials
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Live financial performance, ledger collections, courier balances & profit analysis
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsHeadModalOpen(true)}
                        className="flex items-center gap-1.5 px-3.5 py-2 border border-secound hover:bg-secound text-secound hover:text-white rounded text-xs font-medium cursor-pointer transition-all duration-300 shadow-xs"
                    >
                        <ListTree size={16} />
                        Add Account Head
                    </button>
                    <button
                        type="button"
                        onClick={openRecordIncome}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-xs"
                    >
                        <Plus size={16} />
                        Record Income
                    </button>
                    <button
                        type="button"
                        onClick={openRecordExpense}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-secound hover:bg-secound-hover text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-xs"
                    >
                        <Plus size={16} />
                        Record Expense
                    </button>
                </div>
            </div>

            {/* Date Range & Status Filter Ribbon */}
            <DateRangeFilter
                period={filter.period}
                startDate={filter.startDate}
                endDate={filter.endDate}
                status={filter.status}
                onFilterChange={handleFilterChange}
            />

            {/* Loading Indicator */}
            {loading && !kpiData ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <Loader2 size={32} className="text-secound animate-spin mb-3" />
                    <p className="text-xs text-gray-500 font-medium">Computing live financial statistics...</p>
                </div>
            ) : (
                <>
                    {/* Row 1: Inflows & Revenue */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Revenue & Collections
                            </h2>
                            <span className="text-[11px] text-gray-400">Total Revenue = Total Sales + Other Income</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <AccountingKPICard
                                title="Total Sales"
                                amount={kpis.totalSales || 0}
                                subtitle="Sum of delivered orders"
                                badge="Orders"
                                badgeType="info"
                                icon={DollarSign}
                                variant="secound"
                            />

                            <AccountingKPICard
                                title="Total Collection"
                                amount={kpis.totalCollection || 0}
                                subtitle={`Due: ৳${(kpis.totalDue || 0).toLocaleString()}`}
                                badge="Payments/Orders"
                                badgeType="success"
                                icon={CheckCircle2}
                                variant="green"
                            />

                            <AccountingKPICard
                                title="Other Income"
                                amount={kpis.otherIncome || 0}
                                subtitle="Income transactions"
                                badge="Account Head"
                                badgeType="neutral"
                                icon={TrendingUp}
                                variant="teal"
                            />

                            <AccountingKPICard
                                title="Total Revenue"
                                amount={kpis.totalRevenue || 0}
                                subtitle="Sales + Other Income"
                                badge="Sales + Accounts"
                                badgeType="info"
                                icon={DollarSign}
                                variant="blue"
                            />
                        </div>
                    </div>

                    {/* Row 2: Expenses & Profitability */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                                Costs & Profitability
                            </h2>
                            <span className="text-[11px] text-gray-400">Net Profit = Total Revenue − Total Expense</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <AccountingKPICard
                                title="Shipping Cost"
                                amount={kpis.shippingCost !== undefined ? kpis.shippingCost : (kpis.courierCharges || 0)}
                                subtitle="Courier delivery & COD costs"
                                badge="Shipping"
                                badgeType="neutral"
                                icon={Truck}
                                variant="purple"
                            />

                            <AccountingKPICard
                                title="Total Expense"
                                amount={kpis.totalExpenses || 0}
                                subtitle={`Ops: ৳${(kpis.operatingExpensesOnly || 0).toLocaleString()} + Shipping`}
                                badge="Accounts + Shipping"
                                badgeType="danger"
                                icon={Receipt}
                                variant="rose"
                            />

                            <AccountingKPICard
                                title="Gross Profit"
                                amount={kpis.grossProfit || 0}
                                subtitle="Total Sales − Product Cost (COGS) − Shipping"
                                badge={`${kpis.grossProfitMargin || 0}% margin`}
                                badgeType="warning"
                                icon={TrendingUp}
                                variant="amber"
                            />

                            <AccountingKPICard
                                title="Net Profit"
                                amount={kpis.netProfit || 0}
                                subtitle="Total Revenue − Total Expense"
                                badge={`${kpis.netProfitMargin || 0}% net`}
                                badgeType={kpis.netProfit >= 0 ? "success" : "danger"}
                                icon={Scale}
                                variant={kpis.netProfit >= 0 ? "emerald" : "rose"}
                            />
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Daily Sales vs Collection Trend */}
                        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-base font-bold font-philosopher text-gray-900">
                                        Sales & Collection Timeline
                                    </h3>
                                    <p className="text-xs text-gray-500">Daily financial cash inflow trend</p>
                                </div>
                                <Link
                                    href="/accounting/date-wise-report"
                                    className="text-xs text-secound hover:underline font-semibold flex items-center gap-1"
                                >
                                    Full Ledger <ArrowUpRight size={14} />
                                </Link>
                            </div>

                            <div className="h-[280px] w-full">
                                {dateWiseData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dateWiseData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#8d2b3a" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#8d2b3a" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.2} />
                                                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                                            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
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
                                                name="Collected (৳)"
                                                stroke="#059669"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colGrad)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                        No timeline data available for selected period
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Head-wise Expenses Donut */}
                        <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm flex flex-col justify-between">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <div>
                                        <h3 className="text-base font-bold font-philosopher text-gray-900">
                                            Expense Breakdown
                                        </h3>
                                        <p className="text-xs text-gray-500">By Account Head</p>
                                    </div>
                                    <Link
                                        href="/accounting/head-wise-expenses"
                                        className="text-xs text-secound hover:underline font-semibold"
                                    >
                                        Details →
                                    </Link>
                                </div>

                                <div className="h-[200px] w-full flex items-center justify-center">
                                    {headBreakdown.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={headBreakdown}
                                                    dataKey="amount"
                                                    nameKey="title"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={80}
                                                    paddingAngle={3}
                                                >
                                                    {headBreakdown.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value) => [`৳${Number(value).toLocaleString()}`, "Amount"]}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-xs text-gray-400">No expenses recorded yet</div>
                                    )}
                                </div>
                            </div>

                            {/* Top Expense Heads */}
                            <div className="space-y-2 pt-3 border-t border-gray-100">
                                {headBreakdown.slice(0, 3).map((h, i) => (
                                    <div key={h.headId || i} className="flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                                            <span
                                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                                            />
                                            <span className="truncate text-gray-700 font-medium">
                                                {h.title}
                                            </span>
                                        </div>
                                        <span className="font-semibold text-gray-900">
                                            ৳{h.amount.toLocaleString()} ({h.percentage}%)
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Access Report Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <Link
                            href="/accounting/sales-collection"
                            className="p-5 bg-white border border-gray-200 rounded-lg hover:border-secound hover:shadow-md transition-all group"
                        >
                            <FileSpreadsheet size={22} className="text-secound mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="text-sm font-bold font-philosopher text-gray-900">Sales & Collection</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Order-by-order recovery ledger</p>
                        </Link>

                        <Link
                            href="/accounting/profit-and-loss"
                            className="p-5 bg-white border border-gray-200 rounded-lg hover:border-emerald-600 hover:shadow-md transition-all group"
                        >
                            <Scale size={22} className="text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="text-sm font-bold font-philosopher text-gray-900">Profit & Loss (P&L)</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Formal income statement</p>
                        </Link>

                        <Link
                            href="/accounting/courier-report"
                            className="p-5 bg-white border border-gray-200 rounded-lg hover:border-blue-600 hover:shadow-md transition-all group"
                        >
                            <Truck size={22} className="text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="text-sm font-bold font-philosopher text-gray-900">Courier Sales</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Steadfast & Pathao COD analysis</p>
                        </Link>

                        <Link
                            href="/accounting/product-sales"
                            className="p-5 bg-white border border-gray-200 rounded-lg hover:border-purple-600 hover:shadow-md transition-all group"
                        >
                            <TrendingUp size={22} className="text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                            <h4 className="text-sm font-bold font-philosopher text-gray-900">Product-wise Sales</h4>
                            <p className="text-xs text-gray-500 mt-0.5">Unit margins & sales quantity</p>
                        </Link>
                    </div>

                    {/* Recent Transactions List */}
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-bold font-philosopher text-gray-900">
                                    Recent Voucher Entries
                                </h3>
                                <p className="text-xs text-gray-500">Latest recorded income and expense vouchers</p>
                            </div>
                            <Link
                                href="/accounting/transactions"
                                className="text-xs text-secound hover:underline font-semibold"
                            >
                                All Vouchers →
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold">
                                        <th className="py-3 px-4">Voucher #</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Type</th>
                                        <th className="py-3 px-4">Account Head</th>
                                        <th className="py-3 px-4">Payment Method</th>
                                        <th className="py-3 px-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {kpiData?.recentTransactions && kpiData.recentTransactions.length > 0 ? (
                                        kpiData.recentTransactions.map((trx) => (
                                            <tr key={trx.id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="py-3 px-4 font-mono font-medium text-secound">
                                                    {trx.voucherNo}
                                                </td>
                                                <td className="py-3 px-4 text-gray-500 text-xs">
                                                    {new Date(trx.date).toLocaleDateString("en-GB")}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span
                                                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                            trx.type === "INCOME"
                                                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                                : "bg-rose-50 text-rose-700 border border-rose-200"
                                                        }`}
                                                    >
                                                        {trx.type}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-900">
                                                    {trx.accountHead?.title}
                                                </td>
                                                <td className="py-3 px-4 text-gray-600 text-xs">{trx.paymentMethod}</td>
                                                <td className="py-3 px-4 text-right font-bold text-gray-900">
                                                    {trx.type === "INCOME" ? "+" : "-"}৳
                                                    {parseFloat(trx.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                                                No manual income or expense vouchers recorded yet. Click &quot;Record Expense&quot; to add one.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Modals */}
            <HeadModal
                isOpen={isHeadModalOpen}
                onClose={() => setIsHeadModalOpen(false)}
                onSuccess={() => {
                    mutateHeads();
                    mutateDashboard();
                }}
            />

            <TransactionModal
                isOpen={isTransModalOpen}
                onClose={() => setIsTransModalOpen(false)}
                defaultType={transDefaultType}
                heads={heads}
                onSuccess={() => {
                    mutateDashboard();
                    mutateHeads();
                }}
            />
        </div>
    );
}
