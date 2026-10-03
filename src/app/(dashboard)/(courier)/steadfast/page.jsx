"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import {
    Truck,
    Package,
    CheckCircle2,
    Clock,
    RotateCcw,
    AlertTriangle,
    RefreshCw,
    ExternalLink,
    Search,
    Filter,
    Wallet,
    DollarSign,
    Copy,
    Check,
    ChevronLeft,
    ChevronRight,
    Eye,
    ShieldCheck,
    ArrowUpRight,
    X
} from "lucide-react";
import Link from "next/link";

function SteadfastManagementContent() {
    const searchParams = useSearchParams();
    const initialSearch = searchParams.get("search") || "";

    const [shipments, setShipments] = useState([]);
    const [kpis, setKpis] = useState({
        totalShipments: 0,
        inTransit: 0,
        delivered: 0,
        returned: 0,
        stockRestored: 0
    });
    const [balance, setBalance] = useState(null);
    const [loadingBalance, setLoadingBalance] = useState(false);
    const [loadingShipments, setLoadingShipments] = useState(true);
    const [bulkSyncing, setBulkSyncing] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Filters & Pagination
    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0, limit: 20 });

    // Sync search query when URL parameters change
    useEffect(() => {
        const query = searchParams.get("search") || "";
        setSearchQuery(query);
        setCurrentPage(1);
    }, [searchParams]);

    const handleClearSearch = () => {
        setSearchQuery("");
        setCurrentPage(1);
    };

    // Copied feedback state
    const [copiedCode, setCopiedCode] = useState(null);

    // 1. Fetch live balance from Steadfast API
    const fetchBalance = useCallback(async () => {
        try {
            setLoadingBalance(true);
            const res = await apiClient("/api/shipments/balance?courier=STEADFAST");
            const data = res.data || res;
            if (data?.balance !== undefined) {
                setBalance(data.balance);
            }
        } catch (error) {
            console.error("Failed to fetch Steadfast balance:", error);
        } finally {
            setLoadingBalance(false);
        }
    }, []);

    // 2. Fetch exclusively Steadfast shipments
    const fetchShipments = useCallback(async () => {
        try {
            setLoadingShipments(true);
            const params = new URLSearchParams({
                courier: "STEADFAST",
                page: currentPage.toString(),
                limit: "20",
                search: searchQuery,
                status: statusFilter
            });

            const res = await apiClient(`/api/shipments?${params.toString()}`);
            const data = res.data || res;

            setShipments(data.shipments || []);
            if (data.kpis) {
                setKpis(data.kpis);
            }
            if (data.pagination) {
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Failed to fetch Steadfast shipments:", error);
            toast.error(error.message || "Failed to load Steadfast shipments");
        } finally {
            setLoadingShipments(false);
        }
    }, [currentPage, searchQuery, statusFilter]);

    useEffect(() => {
        fetchBalance();
    }, [fetchBalance]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchShipments();
        }, 250);
        return () => clearTimeout(timer);
    }, [fetchShipments]);

    // 3. Admin Action: Mark Product Delivered
    const handleMarkDelivered = async (shipment) => {
        const orderNum = shipment.order?.orderNumber || shipment.invoiceNumber;
        const result = await Swal.fire({
            title: "Confirm Product Delivered?",
            text: `Mark Order #${orderNum} as delivered to customer? This will update the order status and complete COD payment.`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#059669",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, Mark Delivered"
        });

        if (!result.isConfirmed) return;

        try {
            setActionLoadingId(`deliver-${shipment.id}`);
            const res = await apiClient(`/api/shipments/deliver/${shipment.id}`, {
                method: "POST"
            });
            const data = res.data || res;
            toast.success(data.message || `Order #${orderNum} marked as Delivered!`);
            fetchShipments();
        } catch (error) {
            console.error("Failed to mark delivered:", error);
            toast.error(error.message || "Failed to mark product delivered");
        } finally {
            setActionLoadingId(null);
        }
    };

    // 4. Admin Action: Mark Return Received (with duplicate-safe stock restoration)
    const handleReturnReceived = async (shipment) => {
        const orderNum = shipment.order?.orderNumber || shipment.invoiceNumber;

        if (shipment.isStockRestored) {
            toast("Stock for this order was already restored to inventory.", { icon: "ℹ️" });
            return;
        }

        const result = await Swal.fire({
            title: "Receive Return & Restore Stock?",
            html: `
                <div class="text-left text-xs space-y-2 text-slate-600">
                    <p>Are you sure the parcel for <strong>Order #${orderNum}</strong> has been returned to your warehouse?</p>
                    <p class="text-rose-600 font-semibold">⚠️ All ordered item quantities will be automatically restored to inventory stock with duplicate safeguards.</p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#e11d48",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Confirm Return & Restore Stock"
        });

        if (!result.isConfirmed) return;

        try {
            setActionLoadingId(`return-${shipment.id}`);
            const res = await apiClient(`/api/shipments/return-received/${shipment.id}`, {
                method: "POST"
            });
            const data = res.data || res;

            if (data.alreadyRestored) {
                toast("Inventory was already restored previously.", { icon: "ℹ️" });
            } else {
                toast.success(
                    `Return received! Restored stock for ${data.restoredItems?.length || "all"} order items.`,
                    { duration: 5000 }
                );
            }

            fetchShipments();
        } catch (error) {
            console.error("Failed to process return received:", error);
            toast.error(error.message || "Failed to process return received");
        } finally {
            setActionLoadingId(null);
        }
    };

    // 5. Single shipment live sync
    const handleSyncStatus = async (shipment) => {
        const orderNum = shipment.order?.orderNumber || shipment.invoiceNumber;
        try {
            setActionLoadingId(`sync-${shipment.id}`);
            const res = await apiClient(`/api/shipments/sync/${shipment.id}`, {
                method: "POST"
            });
            const data = res.data || res;

            if (data.stockRestored) {
                toast.success(
                    `Order #${orderNum} returned! Inventory stock automatically restored.`,
                    { duration: 5000 }
                );
            } else {
                toast.success(`Synced #${orderNum}: ${data.shipment?.courierStatus || "Updated"}`);
            }

            fetchShipments();
        } catch (error) {
            console.error("Failed to sync shipment:", error);
            toast.error(error.message || "Status sync failed");
        } finally {
            setActionLoadingId(null);
        }
    };

    // 6. Bulk Sync
    const handleBulkSync = async () => {
        try {
            setBulkSyncing(true);
            const res = await apiClient("/api/shipments/bulk-sync", {
                method: "POST"
            });
            const data = res.data || res;

            toast.success(data.message || `Bulk sync complete! Updated ${data.updatedCount || 0} parcels.`);
            fetchShipments();
            fetchBalance();
        } catch (error) {
            console.error("Failed bulk sync:", error);
            toast.error(error.message || "Bulk sync failed");
        } finally {
            setBulkSyncing(false);
        }
    };

    // 7. Copy Utility
    const handleCopy = (text, type) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(`${type}-${text}`);
        toast.success(`Copied ${type}: ${text}`);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    // Status styling
    const getStatusBadge = (status, courierStatus) => {
        const s = String(status || "").toLowerCase();
        const cs = String(courierStatus || "").toLowerCase();

        if (s.includes("return") || s === "returned" || cs.includes("return")) {
            return (
                <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    <RotateCcw className="w-3 h-3" />
                    {courierStatus || status}
                </span>
            );
        }
        if (s.includes("deliver") || cs.includes("deliver")) {
            return (
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    {courierStatus || status}
                </span>
            );
        }
        if (s.includes("transit") || s.includes("dispatched") || cs.includes("transit") || cs.includes("picked")) {
            return (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 border border-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                    <Truck className="w-3 h-3" />
                    {courierStatus || status}
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                <Clock className="w-3 h-3" />
                {courierStatus || status || "In Review"}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
            <div className="space-y-6">
                {/* Header with Title and Live Balance */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                            <Truck className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-slate-800">
                                    Steadfast Courier Shipments
                                </h1>
                                <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live API Connected
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">
                                Dedicated Steadfast parcel dispatching, tracking synchronization, and inventory return controls
                            </p>
                        </div>
                    </div>

                    {/* Balance & Bulk Actions */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Live Steadfast Balance Widget */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Steadfast Wallet</p>
                                <p className="text-base font-bold text-slate-800">
                                    {balance !== null ? `৳${balance.toLocaleString()}` : "৳--"}
                                </p>
                            </div>
                            <button
                                onClick={fetchBalance}
                                disabled={loadingBalance}
                                title="Refresh Live Steadfast Balance"
                                className="text-slate-400 hover:text-emerald-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <RefreshCw className={`w-4 h-4 ${loadingBalance ? "animate-spin text-emerald-600" : ""}`} />
                            </button>
                        </div>

                        {/* Bulk Sync */}
                        <button
                            onClick={handleBulkSync}
                            disabled={bulkSyncing}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${bulkSyncing ? "animate-spin" : ""}`} />
                            {bulkSyncing ? "Syncing..." : "Sync Active Shipments"}
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Cards (Exclusively Steadfast) */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xs text-slate-500 font-semibold">Total Steadfast Parcels</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{kpis.totalShipments || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xs text-slate-500 font-semibold">In Transit / Dispatched</p>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{kpis.inTransit || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xs text-slate-500 font-semibold">Product Delivered</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{kpis.delivered || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                        <p className="text-xs text-slate-500 font-semibold">Return Received</p>
                        <p className="text-2xl font-bold text-rose-600 mt-1">{kpis.returned || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs col-span-2 md:col-span-1">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500 font-semibold">Stock Restored</p>
                            <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{kpis.stockRestored || 0}</p>
                    </div>
                </div>

                {/* Filters and Search Bar */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                        {/* Status Filter Tabs */}
                        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                            {[
                                { id: "all", label: "All Steadfast Shipments" },
                                { id: "InTransit", label: "In Transit" },
                                { id: "Delivered", label: "Delivered" },
                                { id: "Returned", label: "Return Received" }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => {
                                        setStatusFilter(tab.id);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${statusFilter === tab.id
                                            ? "bg-emerald-600 text-white shadow-xs"
                                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 md:w-72 w-full">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setCurrentPage(1);
                                }}
                                placeholder="Search order, phone, tracking code..."
                                className="w-full text-xs pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={handleClearSearch}
                                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                                    title="Clear search"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search Filter Banner if active */}
                {searchQuery && (
                    <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs shadow-2xs">
                        <div className="flex items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Showing shipments matching: <strong className="font-mono text-emerald-900">&ldquo;{searchQuery}&rdquo;</strong></span>
                        </div>
                        <button
                            onClick={handleClearSearch}
                            className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
                        >
                            <X className="w-3.5 h-3.5" />
                            Show All Shipments
                        </button>
                    </div>
                )}

                {/* Shipments Table */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-600 tracking-wider">
                                    <th className="py-3 px-4">Order # & Date</th>
                                    <th className="py-3 px-4">Recipient</th>
                                    <th className="py-3 px-4">Delivery Address</th>
                                    <th className="py-3 px-4">COD / Value</th>
                                    <th className="py-3 px-4">Steadfast Tracking</th>
                                    <th className="py-3 px-4">Status & Stock</th>
                                    <th className="py-3 px-4 text-right">Admin Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loadingShipments ? (
                                    <tr>
                                        <td colSpan="7" className="py-14 text-center text-slate-400">
                                            <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2"></span>
                                            <p className="text-xs">Loading Steadfast shipments...</p>
                                        </td>
                                    </tr>
                                ) : shipments.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="py-14 text-center text-slate-400">
                                            <Package className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                                            <p className="text-sm font-semibold text-slate-600">No Steadfast shipments found</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                Dispatch orders using the Steadfast button on the Online Order page.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    shipments.map((shipment) => {
                                        const order = shipment.order;
                                        const isDelivered = shipment.status === "Delivered";
                                        const isReturned = shipment.status === "Returned" || shipment.status === "Cancelled";
                                        const isRestored = shipment.isStockRestored;

                                        return (
                                            <tr key={shipment.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Order # & Date */}
                                                <td className="py-3 px-4">
                                                    <Link
                                                        href={`/online-order?search=${encodeURIComponent(order?.orderNumber || shipment.invoiceNumber || '')}`}
                                                        className="font-bold text-slate-800 hover:text-emerald-600 text-xs flex items-center gap-1"
                                                    >
                                                        #{order?.orderNumber || shipment.invoiceNumber}
                                                        <ArrowUpRight className="w-3 h-3" />
                                                    </Link>
                                                    <span className="text-[11px] text-slate-400 block mt-0.5">
                                                        {new Date(shipment.createdAt).toLocaleDateString()}
                                                    </span>
                                                    {order?.orderItems?.length > 0 && (
                                                        <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium inline-block mt-1">
                                                            {order.orderItems.length} item(s)
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Recipient */}
                                                <td className="py-3 px-4">
                                                    <p className="font-semibold text-slate-800 text-xs">
                                                        {shipment.recipientName}
                                                    </p>
                                                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                                                        {shipment.recipientPhone}
                                                    </p>
                                                </td>

                                                {/* Address */}
                                                <td className="py-3 px-4 text-xs text-slate-600 max-w-[220px]">
                                                    <p className="line-clamp-2" title={shipment.recipientAddress}>
                                                        {shipment.recipientAddress}
                                                    </p>
                                                </td>

                                                {/* COD / Value */}
                                                <td className="py-3 px-4">
                                                    <span className="text-xs font-bold text-emerald-600 block">
                                                        COD: ৳{Number(shipment.codAmount || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 block">
                                                        Total: ৳{Number(order?.grandTotal || shipment.codAmount || 0).toLocaleString()}
                                                    </span>
                                                </td>

                                                {/* Steadfast Tracking & Consignment */}
                                                <td className="py-3 px-4">
                                                    <div className="space-y-1">
                                                        {shipment.trackingCode && (
                                                            <div className="flex items-center gap-1 text-xs font-mono font-bold text-emerald-700">
                                                                <a
                                                                    href={`https://steadfast.com.bd/t/${shipment.trackingCode}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="hover:underline flex items-center gap-1"
                                                                    title="Open Steadfast Live Tracking"
                                                                >
                                                                    {shipment.trackingCode}
                                                                    <ExternalLink className="w-3 h-3" />
                                                                </a>
                                                                <button
                                                                    onClick={() => handleCopy(shipment.trackingCode, "Tracking")}
                                                                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                                                    title="Copy Tracking Code"
                                                                >
                                                                    {copiedCode === `Tracking-${shipment.trackingCode}` ? (
                                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}

                                                        {shipment.consignmentId && (
                                                            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                                                                <span>CID: {shipment.consignmentId}</span>
                                                                <button
                                                                    onClick={() => handleCopy(shipment.consignmentId, "CID")}
                                                                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                                                                    title="Copy Consignment ID"
                                                                >
                                                                    {copiedCode === `CID-${shipment.consignmentId}` ? (
                                                                        <Check className="w-3 h-3 text-emerald-600" />
                                                                    ) : (
                                                                        <Copy className="w-3 h-3" />
                                                                    )}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Status & Stock Restoration */}
                                                <td className="py-3 px-4">
                                                    <div className="space-y-1">
                                                        <div>{getStatusBadge(shipment.status, shipment.courierStatus)}</div>
                                                        {isRestored && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                                                Stock Restored
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Admin Actions */}
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                                        {/* Action 1: Product Received / Delivered */}
                                                        {!isDelivered && !isReturned && (
                                                            <button
                                                                onClick={() => handleMarkDelivered(shipment)}
                                                                disabled={actionLoadingId === `deliver-${shipment.id}`}
                                                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                                                title="Mark product as received/delivered by customer"
                                                            >
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                <span>Delivered</span>
                                                            </button>
                                                        )}

                                                        {/* Action 2: Return Received */}
                                                        {!isDelivered && !isRestored && (
                                                            <button
                                                                onClick={() => handleReturnReceived(shipment)}
                                                                disabled={actionLoadingId === `return-${shipment.id}`}
                                                                className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                                                title="Mark return received and restore product quantity to stock"
                                                            >
                                                                <RotateCcw className="w-3.5 h-3.5" />
                                                                <span>Return Received</span>
                                                            </button>
                                                        )}

                                                        {/* Action 3: Live Sync */}
                                                        <button
                                                            onClick={() => handleSyncStatus(shipment)}
                                                            disabled={actionLoadingId === `sync-${shipment.id}`}
                                                            title="Check Live Courier Status & Sync"
                                                            className="p-1.5 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-md transition-colors cursor-pointer flex items-center gap-1"
                                                        >
                                                            <RefreshCw className={`w-3.5 h-3.5 ${actionLoadingId === `sync-${shipment.id}` ? "animate-spin text-emerald-600" : ""}`} />
                                                            <span className="hidden lg:inline">Sync</span>
                                                        </button>

                                                        {/* Action 4: External Track */}
                                                        {shipment.trackingCode && (
                                                            <a
                                                                href={`https://steadfast.com.bd/t/${shipment.trackingCode}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="p-1.5 text-xs text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-md transition-colors inline-flex items-center gap-1"
                                                                title="Open Official Steadfast Tracking"
                                                            >
                                                                <ExternalLink className="w-3.5 h-3.5" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {pagination.totalPages > 1 && (
                        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                            <span>
                                Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalItems} total Steadfast parcels)
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage <= 1}
                                    className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                                    disabled={currentPage >= pagination.totalPages}
                                    className="p-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function SteadfastPage() {
    return (
        <Suspense fallback={
            <div className="p-8 text-center text-slate-400">
                <span className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                <p className="text-xs mt-2">Loading Steadfast Dispatch...</p>
            </div>
        }>
            <SteadfastManagementContent />
        </Suspense>
    );
}