// components/admin/EventsTable.jsx
"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Smartphone } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-md border border-gray-200">
                <p className="text-xs font-semibold text-gray-900">{label}</p>
                <p className="text-xs font-medium text-[#249D8F] mt-1">
                    Count: {payload[0].value.toLocaleString()}
                </p>
            </div>
        );
    }
    return null;
};

export default function EventsTable({ eventsByName, eventsByPlatform }) {
    const hasEventsByName = eventsByName && eventsByName.length > 0;
    const hasEventsByPlatform = eventsByPlatform && eventsByPlatform.length > 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events by Name - Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                Events by Name
                            </h3>
                        </div>
                    </div>

                    <div className="p-6">
                        {!hasEventsByName ? (
                            <div className="flex flex-col items-center justify-center min-h-[220px] text-center">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                    <Activity className="w-5 h-5 text-gray-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">No event data available</p>
                            </div>
                        ) : (
                            <div className="h-[240px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={eventsByName} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="eventName"
                                            type="category"
                                            width={90}
                                            tick={{ fontSize: 12, fill: '#4B5563', fontWeight: 500 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar
                                            dataKey="eventCount"
                                            fill="#249D8F"
                                            radius={[0, 4, 4, 0]}
                                            barSize={16}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Events by Platform */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                                Events by Platform
                            </h3>
                        </div>
                    </div>

                    <div className="p-6">
                        {!hasEventsByPlatform ? (
                            <div className="flex flex-col items-center justify-center min-h-[220px] text-center">
                                <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                                    <Smartphone className="w-5 h-5 text-gray-400" />
                                </div>
                                <p className="text-sm font-medium text-gray-900">No platform data available</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {eventsByPlatform.map((platform, index) => {
                                    const maxValue = Math.max(...eventsByPlatform.map(p => p.eventCount));
                                    const percentage = maxValue > 0 ? (platform.eventCount / maxValue) * 100 : 0;

                                    return (
                                        <div key={index} className="space-y-1.5">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-gray-800">{platform.platform}</span>
                                                <span className="font-medium text-gray-900">{platform.eventCount.toLocaleString()}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                <div
                                                    className="bg-[#792CA2] h-1.5 rounded-full transition-all duration-300"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}