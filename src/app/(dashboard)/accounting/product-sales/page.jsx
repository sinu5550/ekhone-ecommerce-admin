"use client";

import React, { useState, useMemo } from "react";
import {
    Package,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    DollarSign,
    TrendingUp,
    Boxes
} from "lucide-react";
import AccountingNavTabs from "@/components/accounting/AccountingNavTabs";
import { useProductSalesReport } from "@/hooks/useAccounting";
import DateRangeFilter from "@/components/accounting/DateRangeFilter";
import ExportButtons from "@/components/accounting/ExportButtons";

export default function ProductWiseSalesPage() {
    // Filters
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("revenue");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState({
        period: "this_month",
        startDate: "",
        endDate: "",
    });

    const queryParams = useMemo(() => ({
        page,
        limit: 20,
        sortBy,
        order,
        search: search || undefined,
        period: filter.period || undefined,
        startDate: filter.startDate || undefined,
        endDate: filter.endDate || undefined,
    }), [page, sortBy, order, search, filter]);

    const { products, summary, pagination, isLoading } = useProductSalesReport(queryParams);

    const handleSort = (field) => {
        if (sortBy === field) {
            setOrder(order === "desc" ? "asc" : "desc");
        } else {
            setSortBy(field);
            setOrder("desc");
        }
        setPage(1);
    };

    const exportColumns = [
        { key: "sku", label: "SKU" },
        { key: "productName", label: "Product Name" },
        { key: "category", label: "Category" },
        { key: "unitsSold", label: "Units Sold" },
        { key: "sellingPrice", label: "Selling Price (৳)" },
        { key: "costPrice", label: "Cost Price (৳)" },
        { key: "totalRevenue", label: "Total Revenue (৳)" },
        { key: "totalCost", label: "Total Cost (৳)" },
        { key: "grossProfit", label: "Gross Profit (৳)" },
        { key: "profitMargin", label: "Margin (%)", accessor: (row) => `${row.profitMargin}%` },
    ];

    return (
        <div className="space-y-6 text-gray-800 pb-12">
            {/* Nav Tabs */}
            <AccountingNavTabs />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher text-gray-900">
                        Product-wise Sales & Margins
                    </h1>
                    <p className="text-gray-600 text-sm mt-1">
                        Itemized product sales volume, inventory costs, revenue realization & profit margins
                    </p>
                </div>

                <ExportButtons data={products} fileName="product-wise-sales-report" columns={exportColumns} />
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
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Total Product Revenue
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalRevenue.toLocaleString()}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">{summary.totalProducts} active products sold</p>
                    </div>
                    <div className="p-3 bg-secound/10 text-secound rounded-lg">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                            Total Gross Profit
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            ৳{summary.totalGrossProfit.toLocaleString()}
                        </h3>
                        <p className="text-xs text-emerald-600 font-medium mt-0.5">
                            Average Margin: {summary.totalRevenue > 0 ? ((summary.totalGrossProfit / summary.totalRevenue) * 100).toFixed(1) : 0}%
                        </p>
                    </div>
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp size={24} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                            Units Sold
                        </p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">
                            {summary.totalUnitsSold.toLocaleString()} pcs
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Dispatched to customers</p>
                    </div>
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                        <Boxes size={24} />
                    </div>
                </div>
            </div>

            {/* Filter & Sort Bar */}
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="relative min-w-[260px] flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Search product name or SKU..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">Sort by:</span>
                        <button
                            type="button"
                            onClick={() => handleSort("revenue")}
                            className={`px-3 py-1 text-xs font-medium rounded border cursor-pointer transition-all ${
                                sortBy === "revenue"
                                    ? "bg-secound text-white border-secound font-semibold"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            Revenue {sortBy === "revenue" && (order === "desc" ? "↓" : "↑")}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSort("quantity")}
                            className={`px-3 py-1 text-xs font-medium rounded border cursor-pointer transition-all ${
                                sortBy === "quantity"
                                    ? "bg-secound text-white border-secound font-semibold"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            Units Sold {sortBy === "quantity" && (order === "desc" ? "↓" : "↑")}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSort("profit")}
                            className={`px-3 py-1 text-xs font-medium rounded border cursor-pointer transition-all ${
                                sortBy === "profit"
                                    ? "bg-secound text-white border-secound font-semibold"
                                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            Profit {sortBy === "profit" && (order === "desc" ? "↓" : "↑")}
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/70 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-600 font-semibold">
                                <th className="py-3 px-4">SKU</th>
                                <th className="py-3 px-4">Product Name</th>
                                <th className="py-3 px-4">Category</th>
                                <th className="py-3 px-4 text-center">Units Sold</th>
                                <th className="py-3 px-4 text-right">Selling Price</th>
                                <th className="py-3 px-4 text-right">Unit Cost</th>
                                <th className="py-3 px-4 text-right">Total Revenue</th>
                                <th className="py-3 px-4 text-right">Gross Profit</th>
                                <th className="py-3 px-4 text-right">Margin %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400">
                                        <Loader2 size={24} className="animate-spin mx-auto text-secound mb-2" />
                                        Computing product performance metrics...
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-12 text-center text-gray-400 text-sm">
                                        No product sales recorded in this time window.
                                    </td>
                                </tr>
                            ) : (
                                products.map((p) => (
                                    <tr key={p.productId} className="hover:bg-gray-50/60 transition-colors">
                                        <td className="py-3 px-4 font-mono font-bold text-gray-500 text-xs">
                                            {p.sku || `PROD-${p.productId}`}
                                        </td>
                                        <td className="py-3 px-4 font-bold text-gray-900 max-w-xs truncate">
                                            {p.productName}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500 text-xs">{p.category}</td>
                                        <td className="py-3 px-4 text-center font-bold text-gray-900">
                                            {p.unitsSold}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-700">
                                            ৳{p.sellingPrice.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-gray-500 font-mono text-xs">
                                            ৳{p.costPrice > 0 ? p.costPrice.toLocaleString() : "Est. 65%"}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-gray-900">
                                            ৳{p.totalRevenue.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right font-bold text-emerald-600">
                                            ৳{p.grossProfit.toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <span
                                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                    p.profitMargin >= 30
                                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                        : p.profitMargin >= 15
                                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                                        : "bg-rose-50 text-rose-700 border border-rose-200"
                                                }`}
                                            >
                                                {p.profitMargin}%
                                            </span>
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
                            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} products)
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
