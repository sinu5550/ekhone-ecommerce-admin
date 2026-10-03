"use client";

import React, { useState } from "react";
import { Calendar, Filter, RotateCcw } from "lucide-react";

export default function DateRangeFilter({
    period = "this_month",
    startDate = "",
    endDate = "",
    status = "all",
    showStatus = true,
    statusOptions = [
        { label: "All Statuses", value: "all" },
        { label: "Delivered", value: "Delivered" },
        { label: "Confirmed", value: "Confirmed" },
        { label: "Processing", value: "Processing" },
        { label: "Shipped", value: "Shipped" },
        { label: "Pending", value: "Pending" },
    ],
    onFilterChange,
    onReset,
}) {
    const [localPeriod, setLocalPeriod] = useState(period);
    const [localStart, setLocalStart] = useState(startDate);
    const [localEnd, setLocalEnd] = useState(endDate);
    const [localStatus, setLocalStatus] = useState(status);

    const presets = [
        { id: "all", label: "All Time" },
        { id: "today", label: "Today" },
        { id: "yesterday", label: "Yesterday" },
        { id: "last_7_days", label: "Last 7 Days" },
        { id: "this_month", label: "This Month" },
        { id: "last_month", label: "Last Month" },
        { id: "this_year", label: "This Year" },
    ];

    const handlePresetClick = (pId) => {
        setLocalPeriod(pId);
        setLocalStart("");
        setLocalEnd("");
        if (onFilterChange) {
            onFilterChange({
                period: pId,
                startDate: "",
                endDate: "",
                status: localStatus,
            });
        }
    };

    const handleDateApply = () => {
        setLocalPeriod("custom");
        if (onFilterChange) {
            onFilterChange({
                period: "custom",
                startDate: localStart,
                endDate: localEnd,
                status: localStatus,
            });
        }
    };

    const handleStatusChange = (newStatus) => {
        setLocalStatus(newStatus);
        if (onFilterChange) {
            onFilterChange({
                period: localPeriod,
                startDate: localStart,
                endDate: localEnd,
                status: newStatus,
            });
        }
    };

    const handleReset = () => {
        setLocalPeriod("this_month");
        setLocalStart("");
        setLocalEnd("");
        setLocalStatus("all");
        if (onReset) {
            onReset();
        } else if (onFilterChange) {
            onFilterChange({
                period: "this_month",
                startDate: "",
                endDate: "",
                status: "all",
            });
        }
    };

    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 mb-6">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3">
                {/* Period Presets Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-gray-700 flex items-center gap-1 mr-1">
                            <Calendar size={14} className="text-secound" />
                            Period:
                        </span>
                        {presets.map((p) => {
                            const active = localPeriod === p.id;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => handlePresetClick(p.id)}
                                    className={`px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-all ${
                                        active
                                            ? "bg-secound text-white shadow-xs font-semibold"
                                            : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                                    }`}
                                >
                                    {p.label}
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                    >
                        <RotateCcw size={13} />
                        Reset Filter
                    </button>
                </div>

                {/* Custom Date Range & Status Dropdown */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">From:</span>
                        <input
                            type="date"
                            value={localStart}
                            onChange={(e) => setLocalStart(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-medium">To:</span>
                        <input
                            type="date"
                            value={localEnd}
                            onChange={(e) => setLocalEnd(e.target.value)}
                            className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleDateApply}
                        className="px-3.5 py-1.5 bg-secound hover:bg-secound-hover text-white rounded text-xs font-medium cursor-pointer transition-colors shadow-xs"
                    >
                        Apply Range
                    </button>

                    {showStatus && (
                        <div className="sm:ml-auto flex items-center gap-2">
                            <span className="text-xs text-gray-600 font-medium flex items-center gap-1">
                                <Filter size={13} className="text-gray-400" />
                                Status:
                            </span>
                            <select
                                value={localStatus}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-secound text-gray-700 cursor-pointer"
                            >
                                {statusOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
