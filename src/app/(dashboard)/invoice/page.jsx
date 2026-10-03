// app/invoice/page.jsx
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Loader2, FileText, Eye, Download, ShoppingCart, TrendingUp, Clock } from "lucide-react";
import { toast } from "react-hot-toast";
import { useModal } from "@/hooks/useModal";
import Pagination from "@/components/shared/pagination";
import { useOrders } from "@/lib/dataFetch";
import InvoiceDetailsModal from "@/components/modal/InvoiceModal/InvoiceDetailsModal";
import { clientPDFGenerator, getInvoiceNumber } from "@/lib/invoicePDF";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";

const RECORDS_PER_PAGE = 20;

const InvoicePage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
    const [downloadingFormat, setDownloadingFormat] = useState(null);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const { hasPermission } = usePermission();

    const viewModal = useModal();

    // Fetch paginated orders directly as source of invoices
    const {
        data: ordersData = [],
        pagination: ordersPagination,
        isLoading: ordersLoading,
        error: ordersError,
        mutate: mutateOrders
    } = useOrders(
        currentPage,
        RECORDS_PER_PAGE,
        searchTerm,
        "",
        paymentStatusFilter
    );

    // Global fetch for all orders to compute KPI statistics
    const { data: allOrders = [] } = useOrders(1, 10000);

    const invoiceStats = useMemo(() => {
        let total = allOrders.length;
        let totalAmount = 0;
        let paidAmount = 0;
        let dueAmount = 0;

        allOrders.forEach(ord => {
            totalAmount += parseFloat(ord.grandTotal || ord.totalAmount || 0);
            paidAmount += parseFloat(ord.paidAmount || 0);
            dueAmount += parseFloat(ord.dueAmount || 0);
        });

        return {
            total,
            totalAmount,
            paidAmount,
            dueAmount
        };
    }, [allOrders]);

    // Reset page on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, paymentStatusFilter]);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch {
            return "—";
        }
    };

    const formatCurrency = (amount) => {
        if (amount === null || amount === undefined) return "৳0.00";
        return `৳${parseFloat(amount).toFixed(2)}`;
    };

    const indexOfFirstRecord = ordersPagination?.totalItems > 0
        ? (ordersPagination.currentPage - 1) * ordersPagination.limit + 1
        : 0;
    const indexOfLastRecord = Math.min(
        ordersPagination.currentPage * ordersPagination.limit,
        ordersPagination.totalItems
    );

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    const toggleSelectAll = () => {
        const currentIds = ordersData.map(o => o.id);
        const allSelected = currentIds.length > 0 && currentIds.every(id => selectedOrderIds.includes(id));
        if (allSelected) {
            setSelectedOrderIds(prev => prev.filter(id => !currentIds.includes(id)));
        } else {
            setSelectedOrderIds(prev => Array.from(new Set([...prev, ...currentIds])));
        }
    };

    const toggleSelectOrder = (id) => {
        setSelectedOrderIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleViewInvoice = (order) => {
        setSelectedInvoice(order);
        viewModal.open();
    };

    const handleDownloadSingleInvoice = async (order, format = "standard") => {
        const invNum = getInvoiceNumber(order);
        const formatLabel = format === "pos" ? "POS Receipt" : format === "label" ? "Shipping Label" : "Standard Invoice";
        const toastId = toast.loading(`Generating ${formatLabel} (${invNum})...`);
        setDownloadingInvoiceId(order.id);
        setDownloadingFormat(format);

        try {
            let pdfBlob;
            let fileName = "";
            if (format === "pos") {
                pdfBlob = await clientPDFGenerator.generatePOSReceipt(order);
                fileName = `POS-Receipt-${invNum}.pdf`;
            } else if (format === "label") {
                pdfBlob = await clientPDFGenerator.generateShippingLabel(order);
                fileName = `Shipping-Label-${invNum}.pdf`;
            } else {
                pdfBlob = await clientPDFGenerator.generateInvoice(order);
                fileName = `Invoice-${invNum}.pdf`;
            }

            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(`${formatLabel} (${invNum}) downloaded successfully`, { id: toastId });
        } catch (error) {
            console.error("Download failed:", error);
            toast.error(error.message || "Failed to download invoice. Please try again.", { id: toastId });
        } finally {
            setDownloadingInvoiceId(null);
            setDownloadingFormat(null);
        }
    };

    const handleDownloadBulkInvoices = async () => {
        let ordersToDownload = [];
        if (selectedOrderIds.length > 0) {
            ordersToDownload = allOrders.filter(o => selectedOrderIds.includes(o.id));
            if (ordersToDownload.length === 0 && ordersData.length > 0) {
                ordersToDownload = ordersData.filter(o => selectedOrderIds.includes(o.id));
            }
        } else {
            ordersToDownload = allOrders.length > 0 ? allOrders : ordersData;
        }

        if (!ordersToDownload || ordersToDownload.length === 0) {
            toast.error("No orders/invoices found to generate.");
            return;
        }

        setIsDownloadingAll(true);
        const isBulk = selectedOrderIds.length > 0;
        const toastId = toast.loading(
            isBulk
                ? `Generating single PDF with ${ordersToDownload.length} selected invoice(s)...`
                : `Generating single PDF with all ${ordersToDownload.length} invoice(s)...`
        );

        try {
            const pdfBlob = await clientPDFGenerator.generateAllInvoices(ordersToDownload);
            const date = new Date();
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            const fileName = isBulk
                ? `Selected-Invoices-${ordersToDownload.length}-Orders-${dateStr}.pdf`
                : `All-Invoices-${dateStr}.pdf`;

            const url = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            toast.success(
                `Successfully downloaded ${ordersToDownload.length} invoice(s) in a single PDF!`,
                { id: toastId }
            );
        } catch (error) {
            console.error("Bulk invoice download failed:", error);
            toast.error(error.message || "Failed to download invoices. Please try again.", { id: toastId });
        } finally {
            setIsDownloadingAll(false);
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setPaymentStatusFilter("all");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm || paymentStatusFilter !== "all";

    return (
        <ProtectedRoute>
            <div className="space-y-6 text-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher">Invoice Management</h1>
                        <p className="text-gray-600 text-sm">
                            Generate & manage invoices ({ordersPagination?.totalItems || 0} orders available)
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleDownloadBulkInvoices}
                            disabled={isDownloadingAll || (selectedOrderIds.length === 0 && ordersData.length === 0)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded font-medium cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs ${selectedOrderIds.length > 0
                                    ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                                    : "bg-secound hover:bg-secound-hover text-white"
                                }`}
                            title={selectedOrderIds.length > 0 ? `Download ${selectedOrderIds.length} selected invoices in a single PDF` : "Download all invoices in a single PDF"}
                        >
                            {isDownloadingAll ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Generating PDF...
                                </>
                            ) : (
                                <>
                                    <FileText size={18} />
                                    {selectedOrderIds.length > 0
                                        ? `Download Invoices (${selectedOrderIds.length})`
                                        : "All Invoices"}
                                </>
                            )}
                        </button>
                        {selectedOrderIds.length > 0 && (
                            <button
                                onClick={() => setSelectedOrderIds([])}
                                className="px-3 py-2.5 text-xs text-gray-600 hover:text-red-600 bg-gray-100 hover:bg-red-50 rounded border border-gray-200 transition-colors cursor-pointer"
                                title="Clear selection"
                            >
                                Clear ({selectedOrderIds.length})
                            </button>
                        )}
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-3 bg-secound/10 text-secound rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{invoiceStats.total}</h3>
                            <p className="text-xs text-slate-400 mt-1">Total Invoices</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <ShoppingCart size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">৳{invoiceStats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-slate-400 mt-1">Total Billed</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">৳{invoiceStats.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-slate-400 mt-1">Total Collected</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 transition-all hover:shadow-md">
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">৳{invoiceStats.dueAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                            <p className="text-xs text-slate-400 mt-1">Total Pending</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
                    {/* Filters */}
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 mb-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex flex-col sm:flex-row gap-3 flex-1">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Search by Invoice No, Order No, Customer, Phone..."
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white"
                                    />
                                </div>

                                <select
                                    value={paymentStatusFilter}
                                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-secound text-sm bg-white cursor-pointer"
                                >
                                    <option value="all">All Payment Status</option>
                                    <option value="Paid">Paid</option>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Partial">Partial</option>
                                </select>
                            </div>

                            {hasActiveFilters && (
                                <button
                                    onClick={resetFilters}
                                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer hover:underline"
                                >
                                    Reset Filters
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full">
                            <thead className="bg-amber-50/80">
                                <tr>
                                    <th className="px-4 py-3 text-center w-10">
                                        <input
                                            type="checkbox"
                                            checked={ordersData.length > 0 && ordersData.every(o => selectedOrderIds.includes(o.id))}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-secound rounded border-gray-300 focus:ring-secound cursor-pointer"
                                            title="Select all on this page"
                                        />
                                    </th>
                                    {["#", "Invoice NO", "Order NO", "Customer", "Payment Info", "Date", "Actions"].map(
                                        (header) => (
                                            <th key={header} className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                                                {header}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ordersLoading ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex justify-center items-center">
                                                <Loader2 className="h-6 w-6 animate-spin text-secound" />
                                                <span className="ml-2">Loading invoices...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : ordersError ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-red-600">
                                            Error loading invoices: {ordersError.message}
                                        </td>
                                    </tr>
                                ) : ordersData.length > 0 ? (
                                    ordersData.map((order, index) => {
                                        const invNum = getInvoiceNumber(order);
                                        const isSelected = selectedOrderIds.includes(order.id);
                                        return (
                                            <tr key={order.id} className={`hover:bg-gray-50 transition-colors duration-150 ${isSelected ? "bg-amber-50/40" : ""}`}>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectOrder(order.id)}
                                                        className="w-4 h-4 text-secound rounded border-gray-300 focus:ring-secound cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-900">
                                                    {indexOfFirstRecord + index}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                                                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800">{invNum}</span>
                                                </td>
                                                <td className="px-6 py-3 text-sm">
                                                    <span className="font-mono text-sky-600 font-medium">
                                                        {order.orderNumber || "—"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-sm">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{order.customer?.fullName || "Guest"}</div>
                                                        {order.customer?.phone && (
                                                            <div className="text-xs text-gray-500 font-mono">{order.customer.phone}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-sm">
                                                    <div className="flex flex-col gap-1 min-w-[140px]">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-500 font-medium">Total:</span>
                                                            <span className="font-bold text-gray-900">{formatCurrency(order.grandTotal || order.totalAmount || 0)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-500 font-medium">Paid:</span>
                                                            <span className="font-semibold text-green-600">{formatCurrency(order.paidAmount || 0)}</span>
                                                        </div>
                                                        {parseFloat(order.dueAmount || 0) > 0 && (
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-500 font-medium">Due:</span>
                                                                <span className="font-semibold text-red-600">{formatCurrency(order.dueAmount || 0)}</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-1 mt-0.5 border-t border-gray-100 flex items-center justify-between gap-1.5">
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${order.paymentMethod === "OnlinePayment" || order.paymentMethod === "bKash" || order.paymentMethod === "Nagad"
                                                                        ? "bg-green-50 text-green-700 border border-green-200"
                                                                        : order.paymentMethod === "COD" || order.paymentMethod === "CashOnDelivery"
                                                                            ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                                            : "bg-gray-50 text-gray-700 border border-gray-200"
                                                                    }`}
                                                            >
                                                                {order.paymentMethod || "COD"}
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${order.paymentStatus === "Paid"
                                                                        ? "bg-green-100 text-green-800"
                                                                        : order.paymentStatus === "Partial"
                                                                            ? "bg-sky-100 text-sky-800"
                                                                            : "bg-yellow-100 text-yellow-800"
                                                                    }`}
                                                            >
                                                                {order.paymentStatus === "Paid" ? "✓ Paid" :
                                                                    order.paymentStatus === "Partial" ? "⏳ Partial" : "⏰ Unpaid"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-500">{formatDate(order.orderDate || order.createdAt)}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex gap-2 items-center">
                                                        <button
                                                            onClick={() => handleViewInvoice(order)}
                                                            className="p-2 text-gray-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors cursor-pointer"
                                                            title="View Invoice Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDownloadSingleInvoice(order, "standard")}
                                                            disabled={downloadingInvoiceId === order.id}
                                                            className={`p-2 rounded-lg transition-colors cursor-pointer ${downloadingInvoiceId === order.id
                                                                    ? "text-gray-300 cursor-not-allowed"
                                                                    : "text-gray-400 hover:text-secound hover:bg-slate-100"
                                                                }`}
                                                            title={`Download PDF (${invNum})`}
                                                        >
                                                            {downloadingInvoiceId === order.id && downloadingFormat === "standard" ? (
                                                                <Loader2 size={16} className="animate-spin text-secound" />
                                                            ) : (
                                                                <Download size={16} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                <p className="text-lg font-medium text-gray-900">No invoices found</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {hasActiveFilters
                                                        ? "Try adjusting your search or filter criteria"
                                                        : "No orders found to generate invoices"}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {ordersPagination?.totalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={ordersPagination.totalPages}
                                onPageChange={setCurrentPage}
                                totalRecords={ordersPagination.totalItems}
                                indexOfFirstRecord={indexOfFirstRecord}
                                indexOfLastRecord={indexOfLastRecord}
                                className="border border-gray-100 px-5 py-3 rounded-lg"
                            />
                        </div>
                    )}
                </div>

                {/* Invoice Details Modal */}
                <InvoiceDetailsModal
                    isOpen={viewModal.isOpen}
                    onClose={() => {
                        viewModal.close();
                        setSelectedInvoice(null);
                    }}
                    invoice={selectedInvoice}
                    formatDate={formatDate}
                    formatCurrency={formatCurrency}
                />
            </div>
        </ProtectedRoute>
    );
};

export default InvoicePage;