"use client";

import React from "react";

const ICON_THEMES = {
    secound: "bg-secound/10 text-secound",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    emerald: "bg-emerald-50 text-emerald-600",
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    purple: "bg-purple-50 text-purple-600",
    teal: "bg-teal-50 text-teal-600",
};

export default function AccountingKPICard({
    title,
    amount,
    prefix = "৳",
    subtitle,
    badge,
    badgeType = "neutral",
    icon: Icon,
    variant = "secound",
}) {
    const iconStyle = ICON_THEMES[variant] || ICON_THEMES.secound;

    const formattedAmount =
        typeof amount === "number"
            ? amount.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })
            : amount ?? "0";

    const badgeStyles = {
        success: "text-emerald-700 bg-emerald-50 border border-emerald-200",
        danger: "text-rose-700 bg-rose-50 border border-rose-200",
        warning: "text-amber-700 bg-amber-50 border border-amber-200",
        info: "text-indigo-700 bg-indigo-50 border border-indigo-200",
        neutral: "text-gray-600 bg-gray-100 border border-gray-200",
    };

    return (
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between gap-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 min-w-0">
                {Icon && (
                    <div className={`p-3 rounded-lg shrink-0 ${iconStyle}`}>
                        <Icon size={24} />
                    </div>
                )}
                <div className="min-w-0">
                    <div className="flex items-baseline gap-1">
                        {prefix && <span className="text-base font-bold text-gray-500">{prefix}</span>}
                        <h3 className="text-2xl font-bold text-slate-900 truncate">{formattedAmount}</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{title}</p>
                    {subtitle && <p className="text-[11px] text-gray-400 mt-0.5 truncate">{subtitle}</p>}
                </div>
            </div>

            {badge && (
                <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${
                        badgeStyles[badgeType] || badgeStyles.neutral
                    }`}
                >
                    {badge}
                </span>
            )}
        </div>
    );
}
