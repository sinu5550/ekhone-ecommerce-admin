"use client";

import React, { useState } from "react";
import {
    Scale,
    TrendingUp,
    TrendingDown,
    Loader2,
    DollarSign,
    Receipt,
    RotateCcw
} from "lucide-react";
import DateRangeFilter from "@/components/accounting/DateRangeFilter";
import ExportButtons from "@/components/accounting/ExportButtons";
import AccountingNavTabs from "@/components/accounting/AccountingNavTabs";
import { generatePnLPDF } from "@/lib/pnlPDF";
import { useProfitAndLoss } from "@/hooks/useAccounting";

export default function ProfitAndLossPage() {
    const [filter, setFilter] = useState({
        period: "this_month",
        startDate: "",
        endDate: ""
    });

    const { pnlData, isLoading: loading } = useProfitAndLoss(filter);

    const revenue = pnlData?.revenue || {};
    const grossProfit = pnlData?.grossProfit || {};
    const expenses = pnlData?.operatingExpenses || {};
    const returns = pnlData?.returnsAndLosses || {};
    const netProfit = pnlData?.netProfit || {};
    const shippingCostVal = pnlData?.shippingCost?.totalShippingCost || 0;
    const totalRev = parseFloat(revenue.totalRevenue || 0);

    const getPercent = (val) => {
        if (!totalRev || totalRev === 0) return "0.0%";
        return `${((parseFloat(val || 0) / totalRev) * 100).toFixed(1)}%`;
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return "N/A";
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return String(dateStr);
            const day = String(d.getDate()).padStart(2, "0");
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const year = d.getFullYear();
            return `${day}.${month}.${year}`;
        } catch {
            return String(dateStr);
        }
    };

    const isYearly = filter.period === "this_year" || filter.period === "last_year";
    const todayDisplay = formatDateDisplay(new Date());
    const startDateDisplay = formatDateDisplay(pnlData?.period?.startDate || filter.startDate) || "Beginning";
    const endDateDisplay = formatDateDisplay(pnlData?.period?.endDate || filter.endDate) || "Present";

    const companyInfo = pnlData?.companyInfo || {
        name: "Ekhone",
        address: "Jigatola, Dhaka, Bangladesh",
        phone: "+880 1700000000",
        email: "ahmedsiyan33@gmail.com",
    };

    const exportRows = [
        { section: "Revenue", line: "Total Sales (Delivered Orders)", amount: revenue.totalSales || 0 },
        { section: "Revenue", line: "Other Incomes & Receipts", amount: revenue.otherIncome || 0 },
        { section: "Revenue", line: "Total Revenue", amount: revenue.totalRevenue || 0 },
        { section: "COGS & Direct Cost", line: "Cost of Goods Sold (COGS)", amount: pnlData?.cogs?.costOfGoodsSold || 0 },
        { section: "Direct Cost", line: "Shipping Cost (Order Charges)", amount: shippingCostVal },
        { section: "Gross Profit", line: "Gross Profit", amount: grossProfit.amount || 0 },
        ...(expenses.breakdown || []).map((exp) => ({
            section: "Operating Expenses",
            line: exp.head,
            amount: exp.amount,
        })),
        { section: "Operating Expenses", line: "Total Operating Expenses", amount: expenses.accountHeadExpenses || 0 },
        { section: "Operating Expenses", line: "Total Expense (Heads + Shipping)", amount: expenses.total || 0 },
        { section: "Returns & Losses", line: "Customer Refunds Issued", amount: returns.directRefunds || 0 },
        { section: "Net Profit", line: "Net Profit (Total Revenue − Total Expense)", amount: netProfit.amount || 0 },
    ];

    const exportColumns = [
        { key: "section", label: "Statement Section" },
        { key: "line", label: "Line Item" },
        { key: "amount", label: "Amount (BDT)" },
    ];

    const handleDownloadPDF = async () => {
        if (!pnlData) return;
        await generatePnLPDF({
            pnlData,
            filter,
            companyInfo,
        });
    };

    return (
        <div className="space-y-6 text-gray-800 pb-12">
            {/* Navigation Tabs */}
            <AccountingNavTabs />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher text-gray-900">
                        Profit & Loss Statement
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Audited financial statement & ledger report: Total Sales, Shipping Cost, Total Expense, Gross & Net Profit
                    </p>
                </div>

                <ExportButtons
                    data={exportRows}
                    fileName="profit-and-loss-statement"
                    columns={exportColumns}
                    showPdf={true}
                    onExportPdf={handleDownloadPDF}
                    pdfButtonText="Download PDF"
                />
            </div>

            {/* Filter */}
            <DateRangeFilter
                period={filter.period}
                startDate={filter.startDate}
                endDate={filter.endDate}
                showStatus={false}
                onFilterChange={setFilter}
            />

            {loading && !pnlData ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <Loader2 size={32} className="text-secound animate-spin mb-3" />
                    <p className="text-xs text-gray-500 font-medium">Generating audited income statement...</p>
                </div>
            ) : (
                <>
                    {/* Top KPI Banner - 4 Core Pillars */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Total Revenue
                                </p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    ৳{(revenue.totalRevenue || 0).toLocaleString()}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Sales: ৳{(revenue.totalSales || 0).toLocaleString()} + Other: ৳{(revenue.otherIncome || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 bg-secound/10 text-secound rounded-lg">
                                <DollarSign size={22} />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                                    Gross Profit
                                </p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    ৳{(grossProfit.amount || 0).toLocaleString()}
                                </h3>
                                <p className="text-xs text-amber-600 font-medium mt-0.5">
                                    Total Sales − Shipping Cost ({grossProfit.marginPercent || 0}%)
                                </p>
                            </div>
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                                <TrendingUp size={22} />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                                    Total Expense
                                </p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    ৳{(expenses.total || 0).toLocaleString()}
                                </h3>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    Accounts: ৳{(expenses.accountHeadExpenses || 0).toLocaleString()} + Shipping: ৳{shippingCostVal.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 bg-rose-50 text-rose-600 rounded-lg">
                                <Receipt size={22} />
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                                    Net Profit / (Loss)
                                </p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">
                                    ৳{(netProfit.amount || 0).toLocaleString()}
                                </h3>
                                <p
                                    className={`text-xs font-semibold mt-0.5 ${
                                        (netProfit.amount || 0) >= 0 ? "text-emerald-600" : "text-rose-600"
                                    }`}
                                >
                                    Total Revenue − Total Expense ({netProfit.marginPercent || 0}%)
                                </p>
                            </div>
                            <div
                                className={`p-3 rounded-lg ${
                                    (netProfit.amount || 0) >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
                                }`}
                            >
                                <Scale size={22} />
                            </div>
                        </div>
                    </div>

                    {/* Formal Statement Card (Replicating the Reference Ledger Design) */}
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 sm:p-10 max-w-5xl mx-auto print:border-none print:shadow-none print:p-0">
                        {/* Title Header */}
                        <div className="text-center pb-4">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-wider uppercase font-sans">
                                {isYearly ? "YEARLY PROFIT AND LOSS STATEMENT" : "PROFIT AND LOSS STATEMENT"}
                            </h2>
                        </div>

                        {/* Top Line Divider */}
                        <div className="border-b border-gray-300 mb-6"></div>

                        {/* Company & Prepared Metadata Block */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-gray-300 text-xs">
                            {/* Left: Company & Address */}
                            <div className="md:col-span-5 space-y-3">
                                <div>
                                    <p className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                                        COMPANY NAME:
                                    </p>
                                    <p className="text-gray-800 font-semibold text-sm mt-0.5">
                                        {companyInfo.name || "Ekhone"}
                                    </p>
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                                        ADDRESS:
                                    </p>
                                    <p className="text-gray-600 mt-0.5 leading-relaxed whitespace-pre-line">
                                        {companyInfo.address}
                                    </p>
                                </div>
                            </div>

                            {/* Middle: Contacts */}
                            <div className="md:col-span-3 space-y-2">
                                <p className="font-bold text-gray-900 uppercase tracking-wider text-[11px]">
                                    CONTACTS:
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold text-gray-900">Phone:</span> {companyInfo.phone}
                                </p>
                                <p className="text-gray-700">
                                    <span className="font-semibold text-gray-900">Email:</span> {companyInfo.email}
                                </p>
                            </div>

                            {/* Right: Boxed Date Table */}
                            <div className="md:col-span-4 flex flex-col md:items-end justify-start">
                                <p className="text-[10px] font-bold text-gray-600 tracking-wider uppercase mb-1.5 text-right">
                                    {isYearly ? "YEARLY PROFIT AND LOSS STATEMENT" : "PROFIT AND LOSS STATEMENT"}
                                </p>
                                <div className="w-full sm:w-64 border border-gray-300 rounded overflow-hidden text-xs">
                                    <div className="grid grid-cols-2 border-b border-gray-200 divide-x divide-gray-200">
                                        <div className="px-3 py-1.5 font-bold text-gray-700 bg-white uppercase text-[10px]">
                                            DATE PREPARED
                                        </div>
                                        <div className="px-3 py-1.5 font-bold text-gray-900 bg-gray-100/90 text-center text-xs">
                                            {todayDisplay}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 border-b border-gray-200 divide-x divide-gray-200">
                                        <div className="px-3 py-1.5 font-bold text-gray-700 bg-white uppercase text-[10px]">
                                            {isYearly ? "START YEAR" : "START DATE"}
                                        </div>
                                        <div className="px-3 py-1.5 font-semibold text-gray-900 bg-gray-100/90 text-center text-xs">
                                            {startDateDisplay}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                                        <div className="px-3 py-1.5 font-bold text-gray-700 bg-white uppercase text-[10px]">
                                            {isYearly ? "END YEAR" : "END DATE"}
                                        </div>
                                        <div className="px-3 py-1.5 font-semibold text-gray-900 bg-gray-100/90 text-center text-xs">
                                            {endDateDisplay}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statement Tables with Light Gray Banner Sections */}
                        <div className="space-y-6 pt-6 text-sm font-sans">
                            {/* 1. REVENUE SECTION */}
                            <div>
                                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider">
                                    <span>REVENUE</span>
                                    <div className="flex items-center gap-12 text-xs font-semibold text-gray-600">
                                        <span className="w-28 text-right">AMOUNT (৳)</span>
                                        <span className="w-16 text-right">% REV</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 text-xs sm:text-sm">
                                    <div className="flex items-center justify-between py-2 px-4 hover:bg-gray-50/50">
                                        <span className="text-gray-700">Gross Sales (Delivered Orders)</span>
                                        <div className="flex items-center gap-12 text-right">
                                            <span className="w-28 font-medium text-gray-900">
                                                ৳{(revenue.totalSales || 0).toLocaleString()}
                                            </span>
                                            <span className="w-16 text-gray-500 font-mono text-xs">
                                                {getPercent(revenue.totalSales)}
                                            </span>
                                        </div>
                                    </div>

                                    {returns.directRefunds > 0 && (
                                        <div className="flex items-center justify-between py-2 px-4 hover:bg-gray-50/50 text-rose-700">
                                            <span>- Less Sales Returns and Allowances</span>
                                            <div className="flex items-center gap-12 text-right">
                                                <span className="w-28 font-medium">
                                                    (৳{returns.directRefunds.toLocaleString()})
                                                </span>
                                                <span className="w-16 text-gray-500 font-mono text-xs">
                                                    {getPercent(returns.directRefunds)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {revenue.otherIncome > 0 && (
                                        <div className="flex items-center justify-between py-2 px-4 hover:bg-gray-50/50">
                                            <span className="text-gray-700">Other Operating Income (Account Heads)</span>
                                            <div className="flex items-center gap-12 text-right">
                                                <span className="w-28 font-medium text-gray-900">
                                                    ৳{(revenue.otherIncome || 0).toLocaleString()}
                                                </span>
                                                <span className="w-16 text-gray-500 font-mono text-xs">
                                                    {getPercent(revenue.otherIncome)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between py-2.5 px-4 font-bold text-gray-900 bg-gray-50/70 border-t border-b border-gray-200">
                                        <span className="uppercase tracking-wide">NET SALES / TOTAL REVENUE</span>
                                        <div className="flex items-center gap-12 text-right">
                                            <span className="w-28 text-slate-900">
                                                ৳{(revenue.totalRevenue || 0).toLocaleString()}
                                            </span>
                                            <span className="w-16 text-gray-600 font-mono text-xs">
                                                100.0%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. COST OF SALES / SHIPPING SECTION */}
                            <div>
                                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider">
                                    <span>COST OF SALES</span>
                                    <div className="flex items-center gap-12 text-xs font-semibold text-gray-600">
                                        <span className="w-28 text-right">AMOUNT (৳)</span>
                                        <span className="w-16 text-right">% REV</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 text-xs sm:text-sm">
                                    <div className="flex items-center justify-between py-2 px-4 hover:bg-gray-50/50">
                                        <span className="text-gray-700">- Dedicated Shipping Cost (Order Delivery Charges)</span>
                                        <div className="flex items-center gap-12 text-right">
                                            <span className="w-28 font-medium text-gray-900">
                                                ৳{shippingCostVal.toLocaleString()}
                                            </span>
                                            <span className="w-16 text-gray-500 font-mono text-xs">
                                                {getPercent(shippingCostVal)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between py-2.5 px-4 font-bold text-amber-900 bg-amber-50/80 border-t border-b border-amber-200">
                                        <div className="flex items-center gap-2">
                                            <span className="uppercase tracking-wide">GROSS PROFIT (LOSS)</span>
                                            <span className="text-xs text-amber-700 font-normal">
                                                (Total Sales − Shipping Cost)
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-12 text-right">
                                            <span className="w-28 text-amber-950 font-extrabold">
                                                ৳{(grossProfit.amount || 0).toLocaleString()}
                                            </span>
                                            <span className="w-16 text-amber-700 font-bold font-mono text-xs">
                                                {grossProfit.marginPercent || 0}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. OPERATING EXPENSES SECTION */}
                            <div>
                                <div className="flex items-center justify-between px-4 py-2 bg-gray-100 rounded font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider">
                                    <span>OPERATING EXPENSES</span>
                                    <div className="flex items-center gap-12 text-xs font-semibold text-gray-600">
                                        <span className="w-28 text-right">AMOUNT (৳)</span>
                                        <span className="w-16 text-right">% REV</span>
                                    </div>
                                </div>
                                <div className="divide-y divide-gray-100 text-xs sm:text-sm">
                                    <div className="py-1.5 px-4 text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50/50">
                                        EXPENSE HEADS & ADMINISTRATION
                                    </div>
                                    {(expenses.breakdown || []).map((exp, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 px-4 hover:bg-gray-50/50">
                                            <span className="text-gray-700">- {exp.head}</span>
                                            <div className="flex items-center gap-12 text-right">
                                                <span className="w-28 font-medium text-gray-900">
                                                    ৳{exp.amount.toLocaleString()}
                                                </span>
                                                <span className="w-16 text-gray-500 font-mono text-xs">
                                                    {getPercent(exp.amount)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {(!expenses.breakdown || expenses.breakdown.length === 0) && (
                                        <div className="py-2 px-4 text-xs text-gray-400 italic">
                                            No operating expense entries recorded for this period
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between py-2.5 px-4 font-bold text-gray-900 bg-gray-50/70 border-t border-b border-gray-200">
                                        <span className="uppercase tracking-wide">TOTAL OPERATING EXPENSES</span>
                                        <div className="flex items-center gap-12 text-right">
                                            <span className="w-28 text-rose-700">
                                                (৳{(expenses.total || 0).toLocaleString()})
                                            </span>
                                            <span className="w-16 text-gray-600 font-mono text-xs">
                                                {getPercent(expenses.total)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. NET PROFIT (LOSS) FINAL SUMMARY */}
                            <div className="pt-2">
                                <div
                                    className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                                        (netProfit.amount || 0) >= 0
                                            ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                                            : "bg-rose-50 text-rose-950 border-rose-300"
                                    }`}
                                >
                                    <div>
                                        <h3 className="text-base sm:text-lg font-extrabold uppercase tracking-wide">
                                            {(netProfit.amount || 0) >= 0 ? "NET PROFIT" : "NET LOSS"}
                                        </h3>
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            Total Revenue − Total Expense (Net Margin: {netProfit.marginPercent || 0}%)
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xl sm:text-2xl font-extrabold tracking-tight">
                                            ৳{(netProfit.amount || 0).toLocaleString()}
                                        </span>
                                        <span className="block text-xs font-semibold text-gray-500 font-mono mt-0.5">
                                            Margin: {netProfit.marginPercent || 0}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Statement Footer */}
                        <div className="mt-8 pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400">
                            <span>Ekhone Financial Accounting System</span>
                            <span>Confidential Internal Document</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

