// components/admin/StatsCards.jsx
"use client";

import React from 'react';
import {
    Users,
    Eye,
    Clock,
    BarChart3,
    Key,
    UserPlus,
    Calendar,
    TrendingDown,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';

const iconMap = {
    'Active Users': <Users className="w-5 h-5 text-primary" />,
    'Page Views': <Eye className="w-5 h-5 text-primary" />,
    'Bounce Rate': <TrendingDown className="w-5 h-5 text-primary" />,
    'Avg Session': <Clock className="w-5 h-5 text-primary" />,
    'Event Count': <BarChart3 className="w-5 h-5 text-primary" />,
    'Key Events': <Key className="w-5 h-5 text-primary" />,
    'New Users': <UserPlus className="w-5 h-5 text-primary" />,
    'Active Users (Last 30m)': <Calendar className="w-5 h-5 text-primary" />,
};

export default function StatsCards({ stats }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => {
                const IconComponent = iconMap[stat.title] || <Users className="w-5 h-5 text-primary" />;
                const isPositive = stat.change !== undefined && stat.change >= 0;

                return (
                    <div
                        key={index}
                        className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-colors"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    {stat.title}
                                </p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {typeof stat.value === 'number' && stat.value % 1 !== 0
                                        ? stat.value.toFixed(1)
                                        : stat.value.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/10">
                                {IconComponent}
                            </div>
                        </div>

                        {stat.change !== undefined && (
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                <div
                                    className={`inline-flex items-center gap-1 font-semibold ${
                                        isPositive ? 'text-emerald-600' : 'text-rose-600'
                                    }`}
                                >
                                    {isPositive ? (
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                    ) : (
                                        <ArrowDownRight className="w-3.5 h-3.5" />
                                    )}
                                    <span>{Math.abs(stat.change)}%</span>
                                </div>
                                <span className="text-gray-400">vs last period</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}