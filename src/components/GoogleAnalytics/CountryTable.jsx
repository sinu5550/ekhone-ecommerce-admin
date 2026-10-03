// components/admin/CountryTable.jsx
"use client";

import React from 'react';
import { Globe } from 'lucide-react';

export default function CountryTable({ data }) {
    const hasData = data && data.length > 0;

    // Original logic: relative percentage to the top country
    const maxVisitors = hasData ? Math.max(...data.map(item => item.visitors)) : 0;
    const totalVisitors = hasData ? data.reduce((sum, item) => sum + item.visitors, 0) : 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Visitors by Country
                    </h3>
                </div>
                {hasData && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded border border-gray-200/60">
                        {totalVisitors.toLocaleString()} Total
                    </span>
                )}
            </div>

            {/* Table Header */}
            {hasData && (
                <div className="px-6 py-2.5 bg-gray-50/80 border-b border-gray-100 grid grid-cols-12 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <span className="col-span-6">Country</span>
                    <span className="col-span-3 text-right">Visitors</span>
                    <span className="col-span-3 text-right">Share</span>
                </div>
            )}

            {/* Content Section */}
            {!hasData ? (
                <div className="flex flex-col items-center justify-center p-8 text-center my-auto">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">No country data available</p>
                    <p className="text-xs text-gray-500 mt-1">Data will populate as visitors browse your site.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 overflow-y-auto">
                    {data.map((item, index) => {
                        const relativeWidth = maxVisitors > 0 ? (item.visitors / maxVisitors) * 100 : 0;
                        const sharePercentage = totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0;

                        return (
                            <div
                                key={index}
                                className="px-6 py-3 hover:bg-gray-50/50 transition-colors duration-150"
                            >
                                <div className="grid grid-cols-12 items-center text-sm mb-1.5">
                                    {/* Country Name */}
                                    <div className="col-span-6 flex items-center gap-2 pr-2">
                                        <span className="text-xs text-gray-400 font-mono w-4">
                                            {index + 1}.
                                        </span>
                                        <span className="font-medium text-gray-800 truncate">
                                            {item.country}
                                        </span>
                                    </div>

                                    {/* Visitor Count */}
                                    <div className="col-span-3 text-right font-medium text-gray-900">
                                        {item.visitors.toLocaleString()}
                                    </div>

                                    {/* Share % */}
                                    <div className="col-span-3 text-right text-xs text-gray-500 font-medium">
                                        {sharePercentage}%
                                    </div>
                                </div>

                                {/* Minimal Progress Bar */}
                                <div className="w-full bg-gray-100 rounded-full h-1">
                                    <div
                                        className="bg-[#cc1c74] h-1 rounded-full transition-all duration-300"
                                        style={{ width: `${relativeWidth}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}