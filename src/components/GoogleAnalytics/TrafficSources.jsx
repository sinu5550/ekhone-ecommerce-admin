// components/admin/TrafficSources.jsx
"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Globe } from 'lucide-react';

// Refined palette fitting classical theme with primary accent #249D8F
const COLORS = ['#30AFFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const formatDisplayName = (source, medium) => {
    if (source === '(direct)' && medium === '(none)') {
        return 'Direct Traffic';
    }
    if (source === 'google' && medium === 'organic') {
        return 'Google Organic';
    }
    if (source === 'google' && medium === 'cpc') {
        return 'Google Ads';
    }
    if (source === 'facebook' && medium === 'cpc') {
        return 'Facebook Ads';
    }
    if (source === 'instagram' && medium === 'cpc') {
        return 'Instagram Ads';
    }
    return medium ? `${source} / ${medium}` : source;
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const percentage = data.total > 0 ? ((data.visitors / data.total) * 100).toFixed(1) : '0';

        return (
            <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200 min-w-[180px]">
                <p className="text-xs font-semibold text-gray-900 mb-1.5 pb-1 border-b border-gray-100">
                    {data.name}
                </p>
                <div className="space-y-1 text-xs">
                    <p className="text-gray-600 flex justify-between gap-4">
                        <span>Visitors:</span>
                        <span className="font-semibold text-gray-900">{data.visitors.toLocaleString()}</span>
                    </p>
                    <p className="text-gray-600 flex justify-between gap-4">
                        <span>Share:</span>
                        <span className="font-semibold text-[#249D8F]">{percentage}%</span>
                    </p>
                    {data.source && data.medium && (
                        <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-1 mt-1 font-mono">
                            {data.source} / {data.medium}
                        </p>
                    )}
                </div>
            </div>
        );
    }
    return null;
};

export default function TrafficSources({ data }) {
    const hasData = data && data.length > 0;
    const total = hasData ? data.reduce((sum, item) => sum + item.visitors, 0) : 0;

    const chartData = hasData ? data.map(item => ({
        ...item,
        total,
        name: formatDisplayName(item.source, item.medium),
    })) : [];

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-full">
            <div>
                {/* Header Section */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Traffic Sources
                        </h3>
                    </div>
                    {hasData && (
                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2.5 py-1 rounded border border-gray-200/60">
                            {total.toLocaleString()} Total
                        </span>
                    )}
                </div>

                {/* Body Content */}
                <div className="p-6">
                    {!hasData ? (
                        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                <Globe className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">No traffic data available</p>
                            <p className="text-xs text-gray-500 mt-1">Data will populate as users land on your site</p>
                        </div>
                    ) : (
                        <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="40%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={95}
                                        paddingAngle={3}
                                        dataKey="visitors"
                                        nameKey="name"
                                        stroke="#ffffff"
                                        strokeWidth={2}
                                    >
                                        {chartData.map((_, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        layout="vertical"
                                        align="right"
                                        verticalAlign="middle"
                                        wrapperStyle={{
                                            fontSize: '12px',
                                            paddingLeft: '10px'
                                        }}
                                        formatter={(value) => (
                                            <span className="text-xs font-medium text-gray-700 hover:text-gray-900">
                                                {value}
                                            </span>
                                        )}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}