// components/admin/TopPages.jsx
"use client";

import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';

export default function TopPages({ data }) {
    const hasData = data && data.length > 0;

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-full">
            <div>
                {/* Header Section */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Top Pages
                        </h3>
                    </div>
                    {hasData && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded border border-gray-200/60">
                            {data.length} Pages
                        </span>
                    )}
                </div>

                {/* Body Content */}
                {!hasData ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[220px]">
                        <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                            <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">No page data available</p>
                        <p className="text-xs text-gray-500 mt-1">
                            Start getting visitors to see page analytics
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                                    <th className="py-2.5 pl-6 pr-3">Page</th>
                                    <th className="py-2.5 px-3 text-right">Views</th>
                                    <th className="py-2.5 px-3 text-right">Avg Time</th>
                                    <th className="py-2.5 px-3 text-right">Bounce Rate</th>
                                    <th className="py-2.5 pr-6 pl-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((page, index) => (
                                    <tr key={index} className="group hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3 pl-6 pr-3">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-400 font-mono w-4 shrink-0">
                                                    {index + 1}.
                                                </span>
                                                <span className="text-sm font-medium text-gray-800 truncate max-w-xs">
                                                    {page.page || 'Unknown Page'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="text-sm font-medium text-gray-900">
                                                {page.pageViews?.toLocaleString() || 0}
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <span className="text-sm text-gray-600 font-medium">
                                                {Math.round(page.avgTimeOnPage || 0)}s
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <span className={`text-sm font-medium ${page.bounceRate < 40 ? 'text-emerald-600' :
                                                    page.bounceRate < 60 ? 'text-amber-600' : 'text-rose-600'
                                                }`}>
                                                {page.bounceRate || 0}%
                                            </span>
                                        </td>
                                        <td className="py-3 pr-6 pl-3 text-right">
                                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors ml-auto" />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}