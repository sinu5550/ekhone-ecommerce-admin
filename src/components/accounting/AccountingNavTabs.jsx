"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    ListTree,
    Receipt,
    BarChart3,
    FileSpreadsheet,
    Scale,
    Package,
    Calendar,
    Truck
} from "lucide-react";

const ACCOUNTING_TABS = [
    { name: "Dashboard", href: "/accounting", icon: LayoutDashboard },
    { name: "Account Heads", href: "/accounting/heads", icon: ListTree },
    { name: "Income & Expense", href: "/accounting/transactions", icon: Receipt },
    { name: "Head-wise Expenses", href: "/accounting/head-wise-expenses", icon: BarChart3 },
    { name: "Sales & Collection", href: "/accounting/sales-collection", icon: FileSpreadsheet },
    { name: "Profit & Loss (P&L)", href: "/accounting/profit-and-loss", icon: Scale },
    { name: "Product-wise Sales", href: "/accounting/product-sales", icon: Package },
    { name: "Date-wise Report", href: "/accounting/date-wise-report", icon: Calendar },
    { name: "Courier-wise Sales", href: "/accounting/courier-report", icon: Truck }
];

export default function AccountingNavTabs() {
    const pathname = usePathname();

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-1.5 shadow-2xs mb-6 overflow-x-auto scrollbar-none">
            <nav className="flex items-center gap-1 min-w-max">
                {ACCOUNTING_TABS.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;

                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            prefetch={true}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap ${
                                isActive
                                    ? "bg-secound text-white shadow-xs font-bold"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/80"
                            }`}
                        >
                            <Icon size={15} className={isActive ? "text-white" : "text-gray-500"} />
                            <span>{tab.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
