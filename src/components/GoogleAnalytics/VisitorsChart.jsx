// components/admin/VisitorsChart.jsx
"use client";

import React from 'react';
import {
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const MONTHS_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const parseDate = (dateInput) => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === 'number') return new Date(dateInput);

    const str = String(dateInput).trim();

    if (/^\d{8}$/.test(str)) {
        const year = parseInt(str.substring(0, 4), 10);
        const month = parseInt(str.substring(4, 6), 10) - 1;
        const day = parseInt(str.substring(6, 8), 10);
        const date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return date;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;

    const parts = str.split(/[\/\-\.]/);
    if (parts.length === 3) {
        const [a, b, year] = parts.map(Number);
        if (a && b && year) {
            let date = new Date(year, b - 1, a);
            if (!isNaN(date.getTime())) return date;
            date = new Date(year, a - 1, b);
            if (!isNaN(date.getTime())) return date;
        }
    }

    return null;
};

const formatHumanDate = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return String(dateInput || 'Unknown');

    const day = date.getDate();
    const month = MONTHS_SHORT[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
};

const formatAxisDate = (dateInput) => {
    const date = parseDate(dateInput);
    if (!date) return String(dateInput || '');

    const day = date.getDate();
    const month = MONTHS_SHORT[date.getMonth()];
    const shortYear = String(date.getFullYear()).slice(-2);

    return `${day} ${month} ${shortYear}`;
};

const processData = (data) => {
    if (!data || !Array.isArray(data)) return [];

    return data
        .map(item => ({
            ...item,
            axisLabel: formatAxisDate(item.date),
            tooltipLabel: formatHumanDate(item.date),
        }))
        .sort((a, b) => {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            if (!dateA || !dateB) return 0;
            return dateA.getTime() - dateB.getTime();
        });
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const fullDate = payload[0]?.payload?.tooltipLabel || formatHumanDate(label);

        return (
            <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
                <p className="text-xs font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-100">
                    {fullDate}
                </p>
                <div className="space-y-1">
                    {payload.map((item, index) => (
                        <div key={index} className="flex items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ background: item.color }}
                                />
                                <span className="text-gray-600">{item.name}:</span>
                            </div>
                            <span className="font-semibold text-gray-900">
                                {item.value?.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
};

const CustomAxisTick = ({ x, y, payload }) => {
    return (
        <text
            x={x}
            y={y + 12}
            textAnchor="middle"
            fill="#6B7280"
            fontSize={11}
            fontWeight={500}
        >
            {payload.value}
        </text>
    );
};

export default function VisitorsChart({ data }) {
    const hasData = data && data.length > 0;
    const processedData = processData(data);
    const hasPreviousPeriod = processedData.some(item => item.previousPeriod != null);

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-full">
            <div>
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                Visitor Analytics
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#249D8F]" />
                            <span className="font-medium text-gray-600">Visitors</span>
                        </div>
                        {hasPreviousPeriod && (
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
                                <span className="font-medium text-gray-500">Previous</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6">
                    {!hasData ? (
                        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
                            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                                <TrendingUp className="w-5 h-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">No time-series data available</p>
                            <p className="text-xs text-gray-500 mt-1">Data will populate over time as visitors browse</p>
                        </div>
                    ) : (
                        <div className="h-[320px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={processedData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorVisitorsClassic" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#249D8F" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#249D8F" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#F3F4F6"
                                        vertical={false}
                                    />

                                    <XAxis
                                        dataKey="axisLabel"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={<CustomAxisTick />}
                                        dy={5}
                                        interval="preserveStartEnd"
                                    />

                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#6B7280', fontWeight: 500 }}
                                        allowDecimals={false}
                                    />

                                    <Tooltip content={<CustomTooltip />} />

                                    <Area
                                        type="monotone"
                                        dataKey="visitors"
                                        stroke="#249D8F"
                                        strokeWidth={2}
                                        fill="url(#colorVisitorsClassic)"
                                        name="Visitors"
                                    />

                                    {hasPreviousPeriod && (
                                        <Line
                                            type="monotone"
                                            dataKey="previousPeriod"
                                            stroke="#9CA3AF"
                                            strokeWidth={1.5}
                                            strokeDasharray="4 4"
                                            dot={false}
                                            name="Previous Period"
                                        />
                                    )}
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}