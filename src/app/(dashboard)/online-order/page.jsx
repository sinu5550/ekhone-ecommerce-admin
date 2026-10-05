"use client";

import { useState, useMemo, useCallback, useEffect, useRef, Suspense } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { Search, Trash2, Plus, Loader2, MoreVertical, Eye, Download, ShoppingCart, TrendingUp, Clock, ShieldCheck, XCircle, RotateCcw, Phone, Printer, Tag, FileText, MapPin, Copy, Pencil, Check, Truck, Send, Package, X, ChevronDown, CheckSquare, Square, Info, AlertCircle, SlidersHorizontal } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useOrders, useCustomers } from "@/lib/dataFetch";
import { useModal } from "@/hooks/useModal";
import Pagination from "@/components/shared/pagination";
import { usePagination } from "@/hooks/usePagination";
import { apiClient } from "@/lib/apiClient";
import OrderAddDrawer from "@/components/modal/OrderModal/OrderAddDrawer";
import { useRouter, useSearchParams } from "next/navigation";
import OrderManageModal from "@/components/modal/OrderModal/OrderManageModal";
import CreatePaymentModal from "@/components/modal/OrderModal/CreatePaymentModal";
import DispatchModal from "@/components/modal/CourierModal/DispatchModal";
import OrderDetailDrawer from "@/components/modal/OrderModal/OrderDetailDrawer";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import * as XLSX from 'xlsx';
import { usePermission } from "@/context/PermissionProvider";
import { clientPDFGenerator, getInvoiceNumber, printPDFBlob } from "@/lib/invoicePDF";

const RECORDS_PER_PAGE = 20;

export const ORDER_STATUS_OPTIONS = [
    { value: "Pending", label: "Pending" },
    { value: "Confirmed", label: "Confirmed" },
    { value: "ReadyToShip", label: "Ready To Ship" },
    { value: "InCourier", label: "In-Courier" },
    { value: "ShipLater", label: "Ship Later" },
    { value: "Hold", label: "Hold" },
    { value: "Returned", label: "Returned" },
    { value: "PreOrder", label: "Pre-order" },
    { value: "Delivered", label: "Delivered" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Missing", label: "Missing" },
    { value: "Lost", label: "Lost" },
    { value: "Fake", label: "Fake" },
    { value: "Trash", label: "Trash" }
];

export const normalizeOrderStatus = (status) => {
    if (!status) return "Pending";
    const s = String(status).toLowerCase().replace(/[\s\-_]/g, '');
    const map = {
        pending: "Pending",
        confirmed: "Confirmed",
        processing: "Processing",
        readytoship: "ReadyToShip",
        incourier: "InCourier",
        shiplater: "ShipLater",
        hold: "Hold",
        returned: "Returned",
        preorder: "PreOrder",
        shipped: "Shipped",
        shipping: "Shipped",
        delivered: "Delivered",
        cancelled: "Cancelled",
        cancel: "Cancelled",
        missing: "Missing",
        lost: "Lost",
        fake: "Fake",
        trash: "Trash"
    };
    return map[s] || status;
};

export const formatOrderStatusDisplay = (status) => {
    const s = normalizeOrderStatus(status);
    const item = ORDER_STATUS_OPTIONS.find(opt => opt.value === s);
    return item ? item.label : (status || "Pending");
};

export const isSalesMetricStatus = (status) => {
    if (!status) return false;
    const s = String(status).toLowerCase().replace(/[\s\-_]/g, '');
    return ['pending', 'confirmed', 'processing', 'hold', 'readytoship', 'incourier', 'shiplater', 'preorder', 'shipped', 'delivered'].includes(s);
};

export const getOrderStatusStyle = (status) => {
    const s = String(status || '').toLowerCase().replace(/[\s\-_]/g, '');
    switch (s) {
        case 'pending':
            return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'confirmed':
            return 'bg-sky-100 text-sky-800 border-sky-300';
        case 'readytoship':
            return 'bg-teal-100 text-teal-800 border-teal-300';
        case 'incourier':
        case 'shipped':
        case 'shipping':
            return 'bg-indigo-100 text-indigo-800 border-indigo-300';
        case 'shiplater':
            return 'bg-blue-100 text-blue-800 border-blue-300';
        case 'hold':
            return 'bg-amber-100 text-amber-800 border-amber-300';
        case 'returned':
            return 'bg-rose-100 text-rose-800 border-rose-300';
        case 'preorder':
            return 'bg-purple-100 text-purple-800 border-purple-300';
        case 'delivered':
            return 'bg-emerald-100 text-emerald-800 border-emerald-300';
        case 'cancelled':
        case 'cancel':
            return 'bg-red-100 text-red-800 border-red-300';
        case 'missing':
            return 'bg-pink-100 text-pink-800 border-pink-300';
        case 'lost':
            return 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300';
        case 'fake':
            return 'bg-stone-200 text-stone-800 border-stone-300';
        case 'trash':
            return 'bg-gray-200 text-gray-700 border-gray-300';
        case 'processing':
            return 'bg-purple-100 text-purple-700 border-purple-200';
        default:
            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
};

// Dropdown Menu Component using Portal
const DropdownMenu = ({ isOpen, onClose, items, position }) => {
    const dropdownRef = useRef(null);
    const [adjustedCoords, setAdjustedCoords] = useState(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleScrollOrResize = (event) => {
            if (dropdownRef.current && dropdownRef.current.contains(event.target)) {
                return;
            }
            onClose();
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (!isOpen || !dropdownRef.current || !position) {
            setAdjustedCoords(null);
            return;
        }

        const menu = dropdownRef.current;
        const menuHeight = menu.offsetHeight || 280;
        const menuWidth = menu.offsetWidth || 220;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        let top;
        if (position.buttonTop !== undefined && position.buttonBottom !== undefined) {
            const spaceBelow = viewportHeight - position.buttonBottom;
            const spaceAbove = position.buttonTop;
            const openUpwards = position.openUpwards || (spaceBelow < menuHeight && spaceAbove > spaceBelow);

            if (openUpwards) {
                top = position.buttonTop - menuHeight - 5;
            } else {
                top = position.buttonBottom + 5;
            }
        } else {
            top = position.top;
        }

        // Clamp vertically so menu never goes outside the viewport
        if (top < 10) {
            top = 10;
        } else if (top + menuHeight > viewportHeight - 10) {
            top = Math.max(10, viewportHeight - menuHeight - 10);
        }

        // Horizontal positioning: align right edge to buttonRight if provided, or use position.left
        let left = position.buttonRight ? (position.buttonRight - menuWidth) : position.left;
        if (left + menuWidth > viewportWidth - 10) {
            left = viewportWidth - menuWidth - 10;
        }
        if (left < 10) {
            left = 10;
        }

        setAdjustedCoords({ top, left });
    }, [isOpen, position, items]);

    if (!isOpen) return null;

    const currentTop = adjustedCoords?.top ?? position?.top ?? 0;
    const currentLeft = adjustedCoords?.left ?? position?.left ?? 0;

    const menuContent = (
        <div
            ref={dropdownRef}
            className="fixed z-[99999] w-56 py-1.5 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-[80vh] overflow-y-auto"
            style={{
                top: `${currentTop}px`,
                left: `${currentLeft}px`,
            }}
        >
            {items.map((item, index) => {
                if (item.divider) {
                    return <div key={index} className="my-1 border-t border-gray-100" />;
                }
                if (item.header) {
                    return (
                        <div key={index} className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/60">
                            {item.label}
                        </div>
                    );
                }
                return (
                    <button
                        key={index}
                        className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 hover:bg-gray-100 cursor-pointer flex items-center gap-2.5 ${item.className || 'text-gray-700'}`}
                        onClick={() => {
                            item.onClick();
                            onClose();
                        }}
                    >
                        {item.icon && <span className="shrink-0">{item.icon}</span>}
                        <span className="flex-1 truncate">{item.label}</span>
                    </button>
                );
            })}
        </div>
    );

    return createPortal(menuContent, document.body);
};

const Order = () => {
    const searchParams = useSearchParams();
    const initialSearch = searchParams?.get("search") || "";
    const initialStatus = searchParams?.get("status") || "all";

    // State for pagination and filters
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isFilterExpanded, setIsFilterExpanded] = useState(false);
    const [, setCurrentTick] = useState(0);

    // Keep relative time info (e.g. 10 min ago) refreshed every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTick((t) => t + 1), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const query = searchParams?.get("search") || "";
        const statusParam = searchParams?.get("status") || "";
        if (query) {
            setSearchTerm(query);
            setCurrentPage(1);
        }
        if (statusParam) {
            setStatusFilter(statusParam);
            setCurrentPage(1);
        }
    }, [searchParams]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [selectedOrderIds, setSelectedOrderIds] = useState([]);
    const [isExporting, setIsExporting] = useState(false);
    const [isDownloadingAll, setIsDownloadingAll] = useState(false);
    const [openBulkDropdown, setOpenBulkDropdown] = useState(false);
    const bulkMenuRef = useRef(null);

    // Close bulk menu on click outside
    useEffect(() => {
        const handleClickOutsideBulk = (event) => {
            if (bulkMenuRef.current && !bulkMenuRef.current.contains(event.target)) {
                setOpenBulkDropdown(false);
            }
        };
        if (openBulkDropdown) {
            document.addEventListener('mousedown', handleClickOutsideBulk);
        }
        return () => document.removeEventListener('mousedown', handleClickOutsideBulk);
    }, [openBulkDropdown]);

    // Custom Filters States
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [orderLimit, setOrderLimit] = useState("all");
    const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
    const [downloadingFormat, setDownloadingFormat] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [drawerOrder, setDrawerOrder] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [drawerTab, setDrawerTab] = useState("overview");

    const handleOpenDrawer = (order, tab = "overview") => {
        setDrawerOrder(order);
        setDrawerTab(tab);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
    };

    const toggleSelectAll = () => {
        const currentIds = displayOrders.map(o => o.id);
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

    const handleProcessInvoiceDirectly = async (orderId, orderNumber, format = "standard", action = "download", orderObj = null) => {
        let orderData = orderObj;
        const matchedInAll = allOrders.find(o => o.id === orderId || o._id === orderId);
        if (!orderData) {
            orderData = matchedInAll;
        } else if (matchedInAll && !orderData.shipment && matchedInAll.shipment) {
            orderData = { ...orderData, shipment: matchedInAll.shipment };
        }

        if (!orderData || !orderData.orderItems || (format === "label" && !orderData.shipment && !orderData.consignmentId)) {
            try {
                const res = await apiClient(`/api/order/${orderId}`);
                const fetched = res?.data || res;
                if (fetched && typeof fetched === 'object') {
                    orderData = { ...(orderData || {}), ...fetched };
                }
            } catch (err) {
                console.error("Order fetch error:", err);
            }
        }
        if (!orderData) {
            toast.error("Order details not found.");
            return;
        }

        const invNum = getInvoiceNumber(orderData);
        const formatLabel = format === "pos" ? "POS Receipt" : format === "label" ? "Shipping Label" : "Standard Invoice";
        const actionLabel = action === "print" ? "Printing" : "Generating";
        const toastId = toast.loading(`${actionLabel} ${formatLabel} (${invNum})...`);
        setDownloadingInvoiceId(orderId);
        setDownloadingFormat(`${action}-${format}`);

        try {
            let pdfBlob;
            let fileName = "";
            if (format === "pos") {
                pdfBlob = await clientPDFGenerator.generatePOSReceipt(orderData);
                fileName = `POS-Receipt-${invNum}.pdf`;
            } else if (format === "label") {
                pdfBlob = await clientPDFGenerator.generateShippingLabel(orderData);
                fileName = `Shipping-Label-${invNum}.pdf`;
            } else {
                pdfBlob = await clientPDFGenerator.generateInvoice(orderData);
                fileName = `Invoice-${invNum}.pdf`;
            }

            if (action === "print") {
                printPDFBlob(pdfBlob);
                toast.success(`${formatLabel} (${invNum}) sent to printer`, { id: toastId });
            } else {
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success(`${formatLabel} (${invNum}) downloaded successfully`, { id: toastId });
            }
        } catch (error) {
            console.error(`Direct ${action} failed:`, error);
            toast.error(error.message || `Failed to ${action} ${formatLabel}. Please try again.`, { id: toastId });
        } finally {
            setDownloadingInvoiceId(null);
            setDownloadingFormat(null);
        }
    };

    const handleDownloadInvoiceDirectly = async (orderId, orderNumber, format = "standard", orderObj = null) => {
        return handleProcessInvoiceDirectly(orderId, orderNumber, format, "download", orderObj);
    };
    const handleBlockCustomerDirectly = async (customerId, isBlocked, customerName) => {
        const actionText = isBlocked ? "unblock" : "block";
        const result = await Swal.fire({
            title: `${isBlocked ? 'Unblock' : 'Block'} Customer?`,
            text: `Are you sure you want to ${actionText} ${customerName || 'this customer'}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: `Yes, ${actionText} it!`,
            cancelButtonText: "Cancel"
        });

        if (result.isConfirmed) {
            const toastId = toast.loading(`${isBlocked ? 'Unblocking' : 'Blocking'} customer...`);
            try {
                const response = await apiClient(`/api/customer/${customerId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: isBlocked }),
                });

                if (!response.success) {
                    throw new Error(response.message || "Action failed");
                }

                toast.success(`Customer ${isBlocked ? 'unblocked' : 'blocked'} successfully`, { id: toastId });
                mutate();
            } catch (err) {
                console.error("Failed to block/unblock customer:", err);
                toast.error(err.message || "Action failed", { id: toastId });
            }
        }
    };

    const router = useRouter();
    const { hasPermission } = usePermission();
    const addModal = useModal();
    const manageModal = useModal();
    const paymentModal = useModal();
    const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
    const [dispatchOrder, setDispatchOrder] = useState(null);
    const [selectedCourier, setSelectedCourier] = useState("STEADFAST");

    // SWR fetch for paginated structure (triggers correctly)
    const {
        mutate
    } = useOrders(currentPage, RECORDS_PER_PAGE, searchTerm, statusFilter, paymentStatusFilter);

    // Global orders for correct stats calculation and client-side filtering/pagination
    const { data: allOrders = [], isLoading, error, mutate: mutateAllOrders } = useOrders(1, 10000);

    // Global customers query to check status for blocking/unblocking context
    const { data: customersList = [] } = useCustomers(1, 10000);

    const customerStats = useMemo(() => {
        if (!selectedOrder || !selectedOrder.customer) return null;

        const customerPhone = selectedOrder.customer.phone;
        const customerId = selectedOrder.customer.id || selectedOrder.customer._id;

        let total = 0;
        let pending = 0;
        let confirmed = 0;
        let processing = 0;
        let shipping = 0;
        let delivered = 0;
        let cancelled = 0;
        let returned = 0;

        allOrders.forEach(o => {
            const matchesPhone = customerPhone && o.customer?.phone === customerPhone;
            const matchesId = customerId && (o.customer?.id === customerId || o.customer?._id === customerId);

            if (matchesPhone || matchesId) {
                total++;
                const status = o.status;
                if (status === "Pending") pending++;
                else if (status === "Confirmed") confirmed++;
                else if (status === "Processing") processing++;
                else if (status === "Shipped" || status === "Shipping") shipping++;
                else if (status === "Delivered") delivered++;
                else if (status === "Cancelled" || status === "Cancel") cancelled++;
                else if (status === "Returned") returned++;
            }
        });

        return {
            total,
            pending,
            confirmed,
            processing,
            shipping,
            delivered,
            cancelled,
            returned
        };
    }, [allOrders, selectedOrder]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, paymentStatusFilter, paymentMethodFilter, startDate, endDate, orderLimit]);

    const BD_TIMEZONE = 'Asia/Dhaka';

    /** Safe Date parser handling ISO, SQL, and timestamp strings */
    const parseToDate = (dateString) => {
        if (!dateString) return null;
        try {
            if (dateString instanceof Date) return isNaN(dateString.getTime()) ? null : dateString;
            let dStr = String(dateString).trim();
            if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(dStr)) {
                dStr = dStr.replace(' ', 'T');
            }
            const d = new Date(dStr);
            return isNaN(d.getTime()) ? null : d;
        } catch {
            return null;
        }
    };

    /** Format date in Bangladesh Standard Time (BST) */
    const formatDate = (dateString) => {
        const date = parseToDate(dateString);
        if (!date) return "—";
        try {
            return date.toLocaleDateString('en-US', {
                timeZone: BD_TIMEZONE,
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return "—";
        }
    };

    /** Format time in Bangladesh Standard Time (BST) (e.g. 11:45 PM) */
    const formatBDTime = (dateString) => {
        const date = parseToDate(dateString);
        if (!date) return "";
        try {
            return date.toLocaleTimeString('en-US', {
                timeZone: BD_TIMEZONE,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            return "";
        }
    };

    /** Format relative time ago (e.g. 10 min ago, 30 min ago, 1h ago, 2d ago) based on local BD timeline */
    const formatTimeAgo = (dateString) => {
        const date = parseToDate(dateString);
        if (!date) return "";
        try {
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 0) return "Just now";
            if (diffInSeconds < 60) return "Just now";

            const diffInMinutes = Math.floor(diffInSeconds / 60);
            if (diffInMinutes < 60) {
                return `${diffInMinutes} min ago`;
            }

            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) {
                return `${diffInHours}h ago`;
            }

            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays === 1) {
                return "1d ago";
            }
            if (diffInDays < 7) {
                return `${diffInDays}d ago`;
            }

            const diffInWeeks = Math.floor(diffInDays / 7);
            if (diffInWeeks < 4) {
                return `${diffInWeeks}w ago`;
            }

            const diffInMonths = Math.floor(diffInDays / 30);
            if (diffInMonths < 12) {
                return `${diffInMonths}mo ago`;
            }

            const diffInYears = Math.floor(diffInDays / 365);
            return `${diffInYears}y ago`;
        } catch (error) {
            return "";
        }
    };

    /** Format exact date & time in Bangladesh Standard Time (BST) with 12-hour format */
    const formatExactDateTime = (dateString) => {
        const date = parseToDate(dateString);
        if (!date) return "—";
        try {
            return date.toLocaleString('en-US', {
                timeZone: BD_TIMEZONE,
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            }) + " (BST)";
        } catch {
            return "—";
        }
    };

    /** Recency badge color & styling */
    const getTimeAgoBadgeStyle = (dateString) => {
        const date = parseToDate(dateString);
        if (!date) return "bg-gray-100 text-gray-600 border-gray-200";
        try {
            const diffInHours = (new Date().getTime() - date.getTime()) / (1000 * 60 * 60);
            if (diffInHours < 1) {
                return "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold";
            }
            if (diffInHours < 24) {
                return "bg-sky-50 text-sky-700 border-sky-300 font-medium";
            }
            if (diffInHours < 48) {
                return "bg-amber-50 text-amber-800 border-amber-300 font-medium";
            }
            return "bg-slate-100/90 text-slate-600 border-slate-200 font-medium";
        } catch {
            return "bg-gray-100 text-gray-600 border-gray-200";
        }
    };

    /**
     * Resolves the true placement timestamp of an order.
     * item.createdAt always preserves the exact database creation timestamp with hour, minute, second.
     * item.orderDate may be truncated to midnight UTC (T00:00:00.000Z) if submitted from a date-only picker.
     */
    const getOrderTimestamp = (item) => {
        if (!item) return null;
        if (item.createdAt) {
            if (!item.orderDate) return item.createdAt;
            const str = String(item.orderDate);
            // If orderDate is midnight UTC (T00:00:00) or date-only, createdAt has the precise time of placement
            if (str.includes('T00:00:00') || str.endsWith(' 00:00:00') || str.length <= 10) {
                return item.createdAt;
            }
            return item.createdAt;
        }
        return item.orderDate;
    };

    /** Safe image extraction helper */
    const getProductImage = (p, variant = null) => {
        // 1. Variant image first if available
        if (variant?.image && typeof variant.image === 'string' && variant.image.trim()) {
            return variant.image.trim();
        }

        if (!p) return null;

        // 2. Direct string image
        if (typeof p.image === 'string' && p.image.trim()) {
            return p.image.trim();
        }
        if (p.image?.url && typeof p.image.url === 'string') {
            return p.image.url.trim();
        }

        // 3. Images array
        if (Array.isArray(p.images) && p.images.length > 0) {
            const first = p.images[0];
            if (typeof first === 'string' && first.trim()) return first.trim();
            if (first && typeof first === 'object' && first.url) return first.url;
        }

        // 4. Images stringified JSON or direct URL
        if (typeof p.images === 'string' && p.images.trim()) {
            try {
                const parsed = JSON.parse(p.images);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const first = parsed[0];
                    if (typeof first === 'string' && first.trim()) return first.trim();
                    if (first && typeof first === 'object' && first.url) return first.url;
                } else if (typeof parsed === 'string' && parsed.trim()) {
                    return parsed.trim();
                }
            } catch {
                if (p.images.startsWith('http://') || p.images.startsWith('https://') || p.images.startsWith('/')) {
                    return p.images.trim();
                }
            }
        }

        // 5. Fallback to variant list on product
        if (Array.isArray(p.productVariants) && p.productVariants.length > 0) {
            const variantWithImg = p.productVariants.find(v => v?.image);
            if (variantWithImg?.image) return variantWithImg.image;
        }

        return null;
    };

    /** Get full shipping address */
    const getFullShippingAddress = (order) => {
        if (!order.shippingAddress) return "—";
        const addr = order.shippingAddress;
        const parts = [];
        if (addr.address) parts.push(addr.address);
        if (addr.upazila) parts.push(addr.upazila);
        if (addr.district) parts.push(addr.district);
        if (addr.division) parts.push(addr.division);
        if (addr.postalCode) parts.push(addr.postalCode);
        if (addr.country) parts.push(addr.country);
        return parts.length > 0 ? parts.join(", ") : "—";
    };

    /** Handlers */
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    /** Toggle dropdown with position */
    const toggleDropdown = (id, event) => {
        if (openDropdown === id) {
            setOpenDropdown(null);
            return;
        }

        const buttonRect = event.currentTarget.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const spaceBelow = viewportHeight - buttonRect.bottom;
        const estimatedHeight = 260; // Estimated height for action items
        const openUpwards = spaceBelow < estimatedHeight && buttonRect.top > spaceBelow;

        const calculatedTop = openUpwards
            ? Math.max(10, buttonRect.top - estimatedHeight - 5)
            : buttonRect.bottom + 5;
        const calculatedLeft = Math.max(10, buttonRect.right - 192);

        setDropdownPosition({
            top: calculatedTop,
            left: calculatedLeft,
            buttonTop: buttonRect.top,
            buttonBottom: buttonRect.bottom,
            buttonRight: buttonRect.right,
            openUpwards,
        });

        setOpenDropdown(id);
    };

    /** Delete order */
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Order?",
            text: "This action cannot be undone.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            try {
                await apiClient(`/api/order/${id}`, { method: "DELETE" });
                await mutate();
                await mutateAllOrders();
                toast.success("Order deleted successfully");
            } catch (err) {
                console.error("Delete failed:", err);
                toast.error("Delete failed. Please try again.");
            }
        }
    };

    const handleStatusChange = async (item, newStatus) => {
        const previousStatus = item.status;
        const normalizedNew = normalizeOrderStatus(newStatus);
        if (normalizeOrderStatus(previousStatus) === normalizedNew) return;

        // Instant Optimistic Update on both paginated and global caches
        const updateCache = (current) => {
            if (!current) return current;
            if (Array.isArray(current)) {
                return current.map(o => o.id === item.id ? { ...o, status: newStatus } : o);
            }
            if (current.orders && Array.isArray(current.orders)) {
                return {
                    ...current,
                    orders: current.orders.map(o => o.id === item.id ? { ...o, status: newStatus } : o)
                };
            }
            return current;
        };

        mutate(updateCache, false);
        mutateAllOrders(updateCache, false);

        const isRestored = ["Returned", "Cancelled"].includes(normalizedNew);

        try {
            await apiClient(`/api/order/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            toast.success(
                `Order #${item.orderNumber} updated to ${formatOrderStatusDisplay(newStatus)}${isRestored ? " (Stock restored)" : ""}`
            );
        } catch (err) {
            // Rollback optimistic state on error
            const rollbackCache = (current) => {
                if (!current) return current;
                if (Array.isArray(current)) {
                    return current.map(o => o.id === item.id ? { ...o, status: previousStatus } : o);
                }
                if (current.orders && Array.isArray(current.orders)) {
                    return {
                        ...current,
                        orders: current.orders.map(o => o.id === item.id ? { ...o, status: previousStatus } : o)
                    };
                }
                return current;
            };
            mutate(rollbackCache, false);
            mutateAllOrders(rollbackCache, false);
            toast.error(err.message || "Failed to update status");
        }
    };

    const handleAddSuccess = () => {
        mutate();
        mutateAllOrders();
        addModal.close();
    };

    const handleManageSuccess = () => {
        mutate();
        mutateAllOrders();
        manageModal.close();
        setSelectedOrder(null);
    };

    const handlePaymentSuccess = () => {
        mutate();
        mutateAllOrders();
        paymentModal.close();
        setSelectedOrder(null);
    };

    const openManageModal = (order) => {
        setSelectedOrder(order);
        manageModal.open();
        setOpenDropdown(null);
    };

    const openPaymentModal = (order) => {
        setSelectedOrder(order);
        paymentModal.open();
        setOpenDropdown(null);
    };

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setPaymentStatusFilter("all");
        setPaymentMethodFilter("all");
        setStartDate("");
        setEndDate("");
        setOrderLimit("all");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm || statusFilter !== "all" || paymentStatusFilter !== "all" || paymentMethodFilter !== "all" || startDate || endDate || orderLimit !== "all";

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchTerm) count++;
        if (statusFilter !== "all") count++;
        if (paymentStatusFilter !== "all") count++;
        if (paymentMethodFilter !== "all") count++;
        if (startDate) count++;
        if (endDate) count++;
        if (orderLimit !== "all") count++;
        return count;
    }, [searchTerm, statusFilter, paymentStatusFilter, paymentMethodFilter, startDate, endDate, orderLimit]);

    // Get unique status and payment status values for filter options from global data
    const statusOptions = useMemo(() => {
        const customStatuses = allOrders.map(item => item.status).filter(Boolean).map(s => normalizeOrderStatus(s));
        const allSet = Array.from(new Set([...ORDER_STATUS_OPTIONS.map(o => o.value), ...customStatuses]));
        return allSet.map(val => {
            const found = ORDER_STATUS_OPTIONS.find(o => o.value === val);
            return { value: val, label: found ? found.label : val };
        });
    }, [allOrders]);

    const paymentStatusOptions = useMemo(() => {
        const paymentStatuses = [...new Set(allOrders.map(item => item.paymentStatus).filter(Boolean))];
        return paymentStatuses;
    }, [allOrders]);

    const paymentMethodOptions = useMemo(() => {
        const paymentMethods = [...new Set(allOrders.map(item => item.paymentMethod).filter(Boolean))];
        return paymentMethods;
    }, [allOrders]);

    const filteredOrders = useMemo(() => {
        return allOrders.filter(order => {
            // Search filter
            const term = searchTerm.toLowerCase().trim();
            const matchesSearch = !term ||
                [order.orderNumber, order.customer?.fullName, order.customer?.phone]
                    .some(f => f?.toLowerCase().includes(term));

            // Status filter
            const matchesStatus = statusFilter === "all" || normalizeOrderStatus(order.status) === normalizeOrderStatus(statusFilter);

            // Payment status filter
            const matchesPaymentStatus = paymentStatusFilter === "all" || order.paymentStatus === paymentStatusFilter;

            // Payment method filter
            const matchesPaymentMethod = paymentMethodFilter === "all" || order.paymentMethod === paymentMethodFilter;

            // Date range filter
            let matchesDate = true;
            const orderTime = order.orderDate ? new Date(order.orderDate).getTime() : null;

            if (startDate) {
                const start = new Date(startDate).setHours(0, 0, 0, 0);
                if (orderTime && orderTime < start) matchesDate = false;
            }
            if (endDate) {
                const end = new Date(endDate).setHours(23, 59, 59, 999);
                if (orderTime && orderTime > end) matchesDate = false;
            }

            // Order limits / Quick Period selector (days filter)
            if (orderLimit !== "all" && orderTime) {
                let limitDays = 0;
                if (orderLimit === "daily") limitDays = 1;
                else if (orderLimit === "weekly") limitDays = 7;
                else if (orderLimit === "monthly") limitDays = 30;
                else if (orderLimit === "2months") limitDays = 60;
                else if (orderLimit === "4months") limitDays = 120;
                else if (orderLimit === "6months") limitDays = 180;
                else if (orderLimit === "yearly") limitDays = 365;

                const limitTime = new Date().getTime() - (limitDays * 24 * 60 * 60 * 1000);
                if (orderTime < limitTime) matchesDate = false;
            }

            return matchesSearch && matchesStatus && matchesPaymentStatus && matchesPaymentMethod && matchesDate;
        });
    }, [allOrders, searchTerm, statusFilter, paymentStatusFilter, paymentMethodFilter, startDate, endDate, orderLimit]);

    /** Pagination hook client-side */
    const {
        currentRecords,
        currentPage: paginatedPage,
        setCurrentPage: setPaginatedPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredOrders, RECORDS_PER_PAGE);

    // Sync currentPage and paginatedPage
    useEffect(() => {
        setPaginatedPage(currentPage);
    }, [currentPage, setPaginatedPage]);

    const displayOrders = currentRecords;

    const orderStats = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);
        const yesterdayEnd = todayStart;

        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = thisMonthStart;

        let todayVal = 0, todayCount = 0;
        let yesterdayVal = 0, yesterdayCount = 0;
        let thisMonthVal = 0, thisMonthCount = 0;
        let lastMonthVal = 0, lastMonthCount = 0;
        let allTimeVal = 0, allTimeCount = 0;

        allOrders.forEach(o => {
            if (!isSalesMetricStatus(o.status)) return;

            const dateStr = o.orderDate || o.createdAt;
            if (!dateStr) return;
            const date = new Date(dateStr);
            const val = parseFloat(o.grandTotal || 0);

            allTimeVal += val;
            allTimeCount += 1;

            if (date >= todayStart) {
                todayVal += val;
                todayCount += 1;
            } else if (date >= yesterdayStart && date < yesterdayEnd) {
                yesterdayVal += val;
                yesterdayCount += 1;
            }

            if (date >= thisMonthStart) {
                thisMonthVal += val;
                thisMonthCount += 1;
            } else if (date >= lastMonthStart && date < lastMonthEnd) {
                lastMonthVal += val;
                lastMonthCount += 1;
            }
        });

        return {
            today: { val: todayVal, count: todayCount },
            yesterday: { val: yesterdayVal, count: yesterdayCount },
            thisMonth: { val: thisMonthVal, count: thisMonthCount },
            lastMonth: { val: lastMonthVal, count: lastMonthCount },
            allTime: { val: allTimeVal, count: allTimeCount }
        };
    }, [allOrders]);

    const excludedStats = useMemo(() => {
        let count = 0;
        let val = 0;
        const breakdown = {
            Cancelled: { count: 0, val: 0 },
            Returned: { count: 0, val: 0 },
            Missing: { count: 0, val: 0 },
            Lost: { count: 0, val: 0 },
            Fake: { count: 0, val: 0 },
            Trash: { count: 0, val: 0 },
        };

        (allOrders || []).forEach(o => {
            if (!isSalesMetricStatus(o.status)) {
                const grandTotal = parseFloat(o.grandTotal || 0);
                count += 1;
                val += grandTotal;
                const norm = normalizeOrderStatus(o.status);
                if (breakdown[norm]) {
                    breakdown[norm].count += 1;
                    breakdown[norm].val += grandTotal;
                }
            }
        });

        return { count, val, breakdown };
    }, [allOrders]);

    // Export to Excel - uses all orders data
    const handleExportExcel = async () => {
        try {
            setIsExporting(true);

            // Fetch all orders for export (no pagination)
            const response = await apiClient(`/api/order?limit=10000`);
            const exportData = response?.orders || [];

            if (exportData.length === 0) {
                toast.error("No orders available to export");
                setIsExporting(false);
                return;
            }

            const excelData = exportData.map((order, index) => {
                let orderItems = '';
                if (order.orderItems && order.orderItems.length > 0) {
                    orderItems = order.orderItems.map(item => {
                        const productName = item.product?.productName || item.product?.name || 'Product';
                        return `${productName} (${item.quantity} × ${item.unitPrice})`;
                    }).join('; ');
                }

                return {
                    'SL No': index + 1,
                    'Order Number': order.orderNumber || '',
                    'Customer Name': order.customer?.fullName || order.customer?.name || '',
                    'Customer Phone': order.customer?.phone || '',
                    'Customer Email': order.customer?.email || '',
                    'Order Date': formatDate(order.orderDate),
                    'Order Status': order.status || '',
                    'Payment Status': order.paymentStatus || '',
                    'Payment Method': order.paymentMethod || '',
                    'Grand Total': order.grandTotal ? `৳${order.grandTotal}` : '',
                    'Paid Amount': order.paidAmount ? `৳${order.paidAmount}` : '',
                    'Due Amount': order.dueAmount ? `৳${order.dueAmount}` : '',
                    'Shipping Address': getFullShippingAddress(order),
                    'Order Items': orderItems,
                    'Created At': order.createdAt ? new Date(order.createdAt).toLocaleString() : '',
                };
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            const colWidths = [
                { wch: 8 }, { wch: 18 }, { wch: 25 }, { wch: 15 },
                { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
                { wch: 50 }, { wch: 60 }, { wch: 20 }
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Orders');

            const date = new Date();
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const fileName = `Order list Dazzling Diva e-commerce ${dateStr}.xlsx`;

            XLSX.writeFile(wb, fileName);

            toast.success(`Successfully exported ${exportData.length} orders to Excel`);
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export orders to Excel. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const handleBulkProcessInvoices = async (format = "standard", action = "download") => {
        let ordersToProcess = [];
        if (selectedOrderIds.length > 0) {
            ordersToProcess = allOrders.filter(o => selectedOrderIds.includes(o.id));
            if (ordersToProcess.length === 0 && displayOrders.length > 0) {
                ordersToProcess = displayOrders.filter(o => selectedOrderIds.includes(o.id));
            }
        } else {
            ordersToProcess = filteredOrders.length > 0 ? filteredOrders : allOrders;
        }

        if (!ordersToProcess || ordersToProcess.length === 0) {
            toast.error("No orders found to process.");
            return;
        }

        setIsDownloadingAll(true);
        const isBulk = selectedOrderIds.length > 0;
        const formatTitle = format === "pos" ? "POS Receipts" : format === "label" ? "Shipping Labels" : "Invoices";
        const actionTitle = action === "print" ? "Printing" : "Generating PDF for";
        const toastId = toast.loading(
            isBulk
                ? `${actionTitle} ${ordersToProcess.length} selected ${formatTitle}...`
                : `${actionTitle} all ${ordersToProcess.length} ${formatTitle}...`
        );

        try {
            let pdfBlob;
            if (format === "pos") {
                pdfBlob = await clientPDFGenerator.generateAllPOSReceipts(ordersToProcess);
            } else if (format === "label") {
                pdfBlob = await clientPDFGenerator.generateAllShippingLabels(ordersToProcess);
            } else {
                pdfBlob = await clientPDFGenerator.generateAllInvoices(ordersToProcess);
            }

            if (action === "print") {
                printPDFBlob(pdfBlob);
                toast.success(
                    `Print dialog opened for ${ordersToProcess.length} ${formatTitle}!`,
                    { id: toastId }
                );
            } else {
                const date = new Date();
                const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                const prefix = format === "pos" ? "POS-Receipts" : format === "label" ? "Shipping-Labels" : "Invoices";
                const fileName = isBulk
                    ? `Selected-${prefix}-${ordersToProcess.length}-Orders-${dateStr}.pdf`
                    : `All-${prefix}-${dateStr}.pdf`;

                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast.success(
                    `Successfully downloaded ${ordersToProcess.length} ${formatTitle} in a single PDF!`,
                    { id: toastId }
                );
            }
        } catch (error) {
            console.error(`Bulk ${format} ${action} failed:`, error);
            toast.error(error.message || `Failed to ${action} ${formatTitle}. Please try again.`, { id: toastId });
        } finally {
            setIsDownloadingAll(false);
            setOpenBulkDropdown(false);
        }
    };

    const handleDownloadAllInvoices = async () => {
        return handleBulkProcessInvoices("standard", "download");
    };

    // Close dropdown on escape key
    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setOpenDropdown(null);
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Get dropdown items for an order with permission checks
    const getDropdownItems = (order) => {
        const items = [];

        if (hasPermission('order.payment_update')) {
            items.push({
                label: 'Create Payment',
                icon: <Plus size={14} className="text-emerald-600" />,
                onClick: () => openPaymentModal(order)
            });
        }

        if (hasPermission('order.status_update')) {
            items.push({
                label: 'Update Order Status',
                icon: <Pencil size={14} className="text-secound" />,
                onClick: () => openManageModal(order)
            });
        }

        if (hasPermission('order.view')) {
            items.push(
                {
                    label: "View Details",
                    icon: <Eye size={14} className="text-blue-600" />,
                    onClick: () => {
                        handleOpenDrawer(order, "overview");
                        setOpenDropdown(null);
                    }
                },
                { divider: true },
                { header: true, label: "Invoice & Print" },
                {
                    label: "Download Invoice (A4)",
                    icon: <Download size={14} className="text-gray-600" />,
                    onClick: () => handleProcessInvoiceDirectly(order.id, order.orderNumber, "standard", "download", order)
                },
                {
                    label: "Direct Print Invoice",
                    icon: <Printer size={14} className="text-secound" />,
                    onClick: () => handleProcessInvoiceDirectly(order.id, order.orderNumber, "standard", "print", order)
                },
                {
                    label: "Download Shipping Label",
                    icon: <Download size={14} className="text-gray-600" />,
                    onClick: () => handleProcessInvoiceDirectly(order.id, order.orderNumber, "label", "download", order)
                },
                {
                    label: "Direct Print Shipping Label",
                    icon: <Printer size={14} className="text-amber-600" />,
                    onClick: () => handleProcessInvoiceDirectly(order.id, order.orderNumber, "label", "print", order)
                },
                {
                    label: "Download POS Receipt",
                    icon: <Download size={14} className="text-gray-600" />,
                    onClick: () => handleProcessInvoiceDirectly(order.id, order.orderNumber, "pos", "download", order)
                },
                {
                    label: "Direct Print POS Receipt",
                    icon: <Printer size={14} className="text-indigo-600" />,
                    onClick: () => handleProcessInvoiceDirectly(order.id, order.orderNumber, "pos", "print", order)
                },
                { divider: true },
                {
                    label: "Parcel History",
                    icon: <Truck size={14} className="text-teal-600" />,
                    onClick: () => {
                        handleOpenDrawer(order, "tracking");
                        setOpenDropdown(null);
                    }
                }
            );

            if (hasPermission('customer.status_update') && order.customer?.id) {
                const matchedCust = customersList.find(c => c.id === order.customer.id || c._id === order.customer.id);
                const isBlocked = matchedCust ? matchedCust.status === false : false;

                if (isBlocked) {
                    items.push({
                        label: "Unblock Customer",
                        icon: <ShieldCheck size={14} className="text-emerald-600" />,
                        className: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50",
                        onClick: () => {
                            handleBlockCustomerDirectly(order.customer.id, true, order.customer.fullName);
                            setOpenDropdown(null);
                        }
                    });
                } else {
                    items.push({
                        label: "Block Customer",
                        icon: <XCircle size={14} className="text-red-600" />,
                        className: "text-red-600 hover:text-red-700 hover:bg-red-50",
                        onClick: () => {
                            handleBlockCustomerDirectly(order.customer.id, false, order.customer.fullName);
                            setOpenDropdown(null);
                        }
                    });
                }
            }
        }

        return items;
    };

    // Check if dropdown should be shown
    const shouldShowDropdown = (order) => {
        return hasPermission('order.view') || hasPermission('order.payment_update') || hasPermission('order.status_update');
    };

    // Calculate displayed range
    const displayIndexOfFirstRecord = indexOfFirstRecord;
    const displayIndexOfLastRecord = indexOfLastRecord;
    const displayTotalItems = filteredOrders.length;
    const displayTotalPages = totalPages;

    return (
        <ProtectedRoute>
            <div className="space-y-6 text-gray-900 w-full max-w-full min-w-0">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold font-philosopher">
                            Manage Orders
                        </h1>
                        <p className="text-gray-600 text-xs sm:text-sm">
                            Total {displayTotalItems} orders
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        {hasPermission('order.export_excel') && (
                            <button
                                onClick={handleExportExcel}
                                disabled={isExporting}
                                className="w-full sm:w-auto justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-secound hover:bg-secound text-secound hover:text-white rounded font-medium cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Exporting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Download size={16} />
                                        <span>Export Excel</span>
                                    </>
                                )}
                            </button>
                        )}
                        {hasPermission('order.view') && (
                            <div className="relative w-full sm:w-auto" ref={bulkMenuRef}>
                                <button
                                    onClick={() => setOpenBulkDropdown(prev => !prev)}
                                    disabled={isDownloadingAll || (selectedOrderIds.length === 0 && filteredOrders.length === 0)}
                                    className={`w-full sm:w-auto justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded font-medium cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs text-xs sm:text-sm ${selectedOrderIds.length > 0
                                        ? "bg-amber-600 hover:bg-amber-700 text-white"
                                        : "bg-secound hover:bg-secound-hover text-white"
                                        }`}
                                    title={selectedOrderIds.length > 0 ? `Bulk options for ${selectedOrderIds.length} selected orders` : "Bulk invoice & print options"}
                                >
                                    {isDownloadingAll ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={16} />
                                            <span className="truncate">
                                                {selectedOrderIds.length > 0
                                                    ? `Bulk (${selectedOrderIds.length})`
                                                    : "Bulk Invoices"}
                                            </span>
                                            <ChevronDown size={14} className={`transition-transform duration-200 shrink-0 ${openBulkDropdown ? 'rotate-180' : ''}`} />
                                        </>
                                    )}
                                </button>

                                {openBulkDropdown && (
                                    <div className="absolute right-0 mt-2 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 py-2 text-xs divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-100">
                                        <div className="px-3.5 py-2 bg-gray-50/90 text-gray-500 font-bold uppercase tracking-wider text-[10px] flex items-center justify-between">
                                            <span>{selectedOrderIds.length > 0 ? `${selectedOrderIds.length} Selected Order(s)` : `All (${filteredOrders.length}) Orders`}</span>
                                            {selectedOrderIds.length > 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedOrderIds([]);
                                                        setOpenBulkDropdown(false);
                                                    }}
                                                    className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                                                >
                                                    Clear Selection
                                                </button>
                                            )}
                                        </div>

                                        {/* Download Section */}
                                        <div className="py-1.5">
                                            <div className="px-3.5 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                                <Download size={12} /> Download (Combined PDF)
                                            </div>
                                            <button
                                                onClick={() => handleBulkProcessInvoices("standard", "download")}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                                            >
                                                <FileText size={16} className="text-secound shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">Standard Invoices (A4)</p>
                                                    <p className="text-[10px] text-gray-500">Full invoice pages with items & totals</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleBulkProcessInvoices("label", "download")}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                                            >
                                                <Tag size={16} className="text-amber-600 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">Shipping Labels</p>
                                                    <p className="text-[10px] text-gray-500">105×148mm labels with COD & QR</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleBulkProcessInvoices("pos", "download")}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                                            >
                                                <Package size={16} className="text-indigo-600 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">POS Receipts</p>
                                                    <p className="text-[10px] text-gray-500">80mm thermal receipt slips</p>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Direct Print Section */}
                                        <div className="py-1.5 bg-emerald-50/20">
                                            <div className="px-3.5 py-1 text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                                                <Printer size={12} /> Direct Print
                                            </div>
                                            <button
                                                onClick={() => handleBulkProcessInvoices("standard", "print")}
                                                className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-gray-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                                            >
                                                <Printer size={16} className="text-emerald-600 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">Print Standard Invoices</p>
                                                    <p className="text-[10px] text-gray-500">Send all invoices to print dialog</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleBulkProcessInvoices("label", "print")}
                                                className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-gray-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                                            >
                                                <Printer size={16} className="text-amber-600 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">Print Shipping Labels</p>
                                                    <p className="text-[10px] text-gray-500">Send shipping labels to print dialog</p>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => handleBulkProcessInvoices("pos", "print")}
                                                className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-gray-700 flex items-center gap-2.5 cursor-pointer transition-colors"
                                            >
                                                <Printer size={16} className="text-indigo-600 shrink-0" />
                                                <div>
                                                    <p className="font-semibold text-gray-900 text-xs">Print POS Receipts</p>
                                                    <p className="text-[10px] text-gray-500">Send POS receipts to thermal printer</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {hasPermission('order.create') && (
                            <button
                                onClick={addModal.open}
                                className="col-span-2 sm:col-span-1 order-first sm:order-last w-full sm:w-auto justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200 text-xs sm:text-sm shadow-xs"
                            >
                                <Plus size={16} />
                                <span>Add Order</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* KPI Header & Excluded Orders Info */}
                <div className="relative flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sales Performance</h3>
                        <div className="group">
                            <button
                                type="button"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 text-[11px] sm:text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                            >
                                <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                                <span>{excludedStats.count} Excluded</span>
                            </button>

                            {/* Excluded Orders Info Card / Popover */}
                            <div className="absolute left-0 top-full mt-2 w-full max-w-sm sm:w-96 p-3.5 sm:p-4 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-2xl shadow-xl ring-1 ring-white/10 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-700/80">
                                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                                        <AlertCircle className="w-4 h-4 text-amber-400" />
                                        Uncalculated / Excluded Orders
                                    </span>
                                    <span className="font-bold text-amber-300">৳{excludedStats.val.toLocaleString()}</span>
                                </div>

                                <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                                    These orders are excluded from active sales performance metrics and revenue calculations:
                                </p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] mb-3">
                                    <div className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
                                        <span className="text-slate-400">Cancelled:</span>
                                        <span className="font-bold text-rose-300">{excludedStats.breakdown.Cancelled.count} (৳{excludedStats.breakdown.Cancelled.val.toLocaleString()})</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
                                        <span className="text-slate-400">Returned:</span>
                                        <span className="font-bold text-rose-300">{excludedStats.breakdown.Returned.count} (৳{excludedStats.breakdown.Returned.val.toLocaleString()})</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
                                        <span className="text-slate-400">Missing:</span>
                                        <span className="font-bold text-pink-300">{excludedStats.breakdown.Missing.count} (৳{excludedStats.breakdown.Missing.val.toLocaleString()})</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
                                        <span className="text-slate-400">Lost / Trash / Fake:</span>
                                        <span className="font-bold text-slate-300">
                                            {excludedStats.breakdown.Lost.count + excludedStats.breakdown.Trash.count + excludedStats.breakdown.Fake.count}
                                        </span>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                                    <p><span className="text-emerald-400 font-semibold">✓ Sales Cards:</span> Pending, Confirmed, Processing, Hold, Ready To Ship, In-Courier, Shipped, Ship Later, Pre-order & Delivered.</p>
                                    <p><span className="text-indigo-400 font-semibold">✓ Total Revenue:</span> Delivered orders only.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-400">
                        Active Pipeline Orders · Revenue based on Delivered
                    </p>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-6">
                    {/* Today Orders */}
                    <div className="min-w-0 rounded-2xl p-3 sm:p-5 border border-blue-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-blue-100/90 via-blue-50/50 to-blue-200/60 transition-all hover:shadow-md h-[120px] sm:h-[135px]">
                        <div className="flex items-center justify-between gap-1">
                            <h4 className="text-base sm:text-xl font-bold text-slate-800 truncate">৳{orderStats.today.val.toLocaleString()}</h4>
                            <div className="p-1.5 sm:p-2 bg-white/90 text-blue-600 rounded-full shadow-xs shrink-0">
                                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">Today Orders</p>
                            <span className="text-[10px] text-blue-700 font-bold block mt-0.5 sm:mt-1">{orderStats.today.count} Order(s)</span>
                        </div>
                    </div>

                    {/* Yesterday Orders */}
                    <div className="min-w-0 rounded-2xl p-3 sm:p-5 border border-emerald-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-emerald-100/90 via-emerald-50/50 to-emerald-200/60 transition-all hover:shadow-md h-[120px] sm:h-[135px]">
                        <div className="flex items-center justify-between gap-1">
                            <h4 className="text-base sm:text-xl font-bold text-slate-800 truncate">৳{orderStats.yesterday.val.toLocaleString()}</h4>
                            <div className="p-1.5 sm:p-2 bg-white/90 text-emerald-600 rounded-full shadow-xs shrink-0">
                                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">Yesterday Orders</p>
                            <span className="text-[10px] text-emerald-700 font-bold block mt-0.5 sm:mt-1">{orderStats.yesterday.count} Order(s)</span>
                        </div>
                    </div>

                    {/* This Month */}
                    <div className="min-w-0 rounded-2xl p-3 sm:p-5 border border-rose-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-rose-100/90 via-rose-50/50 to-purple-200/60 transition-all hover:shadow-md h-[120px] sm:h-[135px]">
                        <div className="flex items-center justify-between gap-1">
                            <h4 className="text-base sm:text-xl font-bold text-slate-800 truncate">৳{orderStats.thisMonth.val.toLocaleString()}</h4>
                            <div className="p-1.5 sm:p-2 bg-white/90 text-rose-600 rounded-full shadow-xs shrink-0">
                                <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">This Month</p>
                            <span className="text-[10px] text-rose-700 font-bold block mt-0.5 sm:mt-1">{orderStats.thisMonth.count} Order(s)</span>
                        </div>
                    </div>

                    {/* Last Month */}
                    <div className="min-w-0 rounded-2xl p-3 sm:p-5 border border-cyan-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-cyan-100/90 via-cyan-50/50 to-teal-200/60 transition-all hover:shadow-md h-[120px] sm:h-[135px]">
                        <div className="flex items-center justify-between gap-1">
                            <h4 className="text-base sm:text-xl font-bold text-slate-800 truncate">৳{orderStats.lastMonth.val.toLocaleString()}</h4>
                            <div className="p-1.5 sm:p-2 bg-white/90 text-cyan-600 rounded-full shadow-xs shrink-0">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">Last Month</p>
                            <span className="text-[10px] text-cyan-700 font-bold block mt-0.5 sm:mt-1">{orderStats.lastMonth.count} Order(s)</span>
                        </div>
                    </div>

                    {/* All-Time Sales */}
                    <div className="col-span-2 sm:col-span-1 min-w-0 rounded-2xl p-3 sm:p-5 border border-purple-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-purple-100/90 via-purple-50/50 to-pink-200/60 transition-all hover:shadow-md h-[120px] sm:h-[135px]">
                        <div className="flex items-center justify-between gap-1">
                            <h4 className="text-base sm:text-xl font-bold text-slate-800 truncate">৳{orderStats.allTime.val.toLocaleString()}</h4>
                            <div className="p-1.5 sm:p-2 bg-white/90 text-purple-600 rounded-full shadow-xs shrink-0">
                                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                        </div>
                        <div>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-semibold truncate">All-Time Sales</p>
                            <span className="text-[10px] text-purple-700 font-bold block mt-0.5 sm:mt-1">{orderStats.allTime.count} Order(s)</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-3 sm:p-5 rounded-xl shadow-xs border border-gray-200 space-y-4">
                    {/* Collapsible Search + Filter */}
                    <div className="flex flex-col gap-3 p-3 sm:p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 shadow-2xs">
                        {/* Always-visible Search Bar + Filter Toggle */}
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 min-w-0">
                                <Search
                                    className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400"
                                    size={18}
                                />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search by order number, customer name, phone..."
                                    className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded w-full min-w-0 text-xs sm:text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition shadow-2xs"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsFilterExpanded(prev => !prev)}
                                className={`flex items-center gap-1.5 px-3 py-2 border rounded text-xs font-semibold cursor-pointer transition shadow-2xs whitespace-nowrap shrink-0 ${
                                    isFilterExpanded || hasActiveFilters
                                        ? "bg-secound text-white border-secound hover:bg-secound-hover"
                                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                                title={isFilterExpanded ? "Collapse Filters" : "Expand Filters"}
                            >
                                <SlidersHorizontal size={14} />
                                <span className="hidden sm:inline">Filters</span>
                                {activeFilterCount > 0 && (
                                    <span className={`inline-flex items-center justify-center px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                        isFilterExpanded || hasActiveFilters
                                            ? "bg-white text-secound"
                                            : "bg-secound text-white"
                                    }`}>
                                        {activeFilterCount}
                                    </span>
                                )}
                                <ChevronDown
                                    size={15}
                                    className={`transition-transform duration-200 ${isFilterExpanded ? 'rotate-180' : ''}`}
                                />
                            </button>
                        </div>

                        {/* Collapsible Filter Panel: Dates, Period, Status, Payment, Summary/Reset */}
                        {isFilterExpanded && (
                            <div className="pt-2 border-t border-gray-200/80 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                {/* Row 1: Date Pickers + Period */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                                    {/* Start Date */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-xs text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition shadow-2xs cursor-pointer"
                                        />
                                    </div>

                                    {/* End Date */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-xs text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition shadow-2xs cursor-pointer"
                                        />
                                    </div>

                                    {/* Period */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            Time Period
                                        </label>
                                        <select
                                            value={orderLimit}
                                            onChange={(e) => { setOrderLimit(e.target.value); setCurrentPage(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-xs text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition shadow-2xs cursor-pointer"
                                        >
                                            <option value="all">All Periods</option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                            <option value="2months">2 Months</option>
                                            <option value="4months">4 Months</option>
                                            <option value="6months">6 Months</option>
                                            <option value="yearly">Yearly</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Row 2: Status, Payment Status, Payment Method & Summary/Reset */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end pt-1">
                                    {/* Status Filter - 3 cols */}
                                    <div className="lg:col-span-3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            Order Status
                                        </label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-xs text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition shadow-2xs cursor-pointer"
                                        >
                                            <option value="all">All Statuses</option>
                                            {statusOptions.map((status) => (
                                                <option key={status.value} value={status.value}>{status.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Payment Status Filter - 3 cols */}
                                    <div className="lg:col-span-3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            Payment Status
                                        </label>
                                        <select
                                            value={paymentStatusFilter}
                                            onChange={(e) => { setPaymentStatusFilter(e.target.value); setCurrentPage(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-xs text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition shadow-2xs cursor-pointer"
                                        >
                                            <option value="all">All Payment Statuses</option>
                                            {paymentStatusOptions.map((status) => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Payment Method Filter - 3 cols */}
                                    <div className="lg:col-span-3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                            Payment Method
                                        </label>
                                        <select
                                            value={paymentMethodFilter}
                                            onChange={(e) => { setPaymentMethodFilter(e.target.value); setCurrentPage(1); }}
                                            className="w-full px-3 py-2 border border-gray-300 rounded bg-white text-xs text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition shadow-2xs cursor-pointer"
                                        >
                                            <option value="all">All Payment Methods</option>
                                            {paymentMethodOptions.map((method) => (
                                                <option key={method} value={method}>{method}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Order Count & Reset Action - 3 cols */}
                                    <div className="lg:col-span-3 flex items-center justify-between sm:justify-end gap-3 min-h-[38px] pt-1 sm:pt-0">
                                        <div className="text-xs text-gray-500 font-medium whitespace-nowrap">
                                            Showing <strong className="text-gray-800">{displayTotalItems > 0 ? displayIndexOfFirstRecord + 1 : 0}-{Math.min(displayIndexOfLastRecord, displayTotalItems)}</strong> of <strong className="text-gray-800">{displayTotalItems}</strong>
                                        </div>
                                        <button
                                            onClick={resetFilters}
                                            disabled={!hasActiveFilters}
                                            className="h-[36px] px-3.5 border border-dashed border-gray-300 rounded text-xs font-semibold text-gray-600 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer bg-white shadow-2xs"
                                        >
                                            <RotateCcw size={13} />
                                            Reset
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Dismissible Active Filter Chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 py-1 px-1 bg-white border border-gray-100 rounded shadow-2xs">
                            <span className="text-xs text-gray-400 font-medium ml-2">Active filters:</span>
                            {searchTerm && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Search: "{searchTerm}"
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {startDate && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Start Date: {startDate}
                                    <button
                                        onClick={() => setStartDate("")}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {endDate && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    End Date: {endDate}
                                    <button
                                        onClick={() => setEndDate("")}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {statusFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Status: {statusFilter}
                                    <button
                                        onClick={() => setStatusFilter("all")}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {paymentStatusFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    Payment: {paymentStatusFilter}
                                    <button
                                        onClick={() => setPaymentStatusFilter("all")}
                                        className="hover:bg-emerald-200 hover:text-emerald-900 text-emerald-500 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {orderLimit !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Period: {orderLimit === "daily" ? "Daily" :
                                        orderLimit === "weekly" ? "Weekly" :
                                            orderLimit === "monthly" ? "Monthly" :
                                                orderLimit === "2months" ? "2 Months" :
                                                    orderLimit === "4months" ? "4 Months" :
                                                        orderLimit === "6months" ? "6 Months" :
                                                            orderLimit === "yearly" ? "Yearly" : orderLimit}
                                    <button
                                        onClick={() => setOrderLimit("all")}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            {paymentMethodFilter !== "all" && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                    Method: {paymentMethodFilter}
                                    <button
                                        onClick={() => setPaymentMethodFilter("all")}
                                        className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </span>
                            )}
                            <button
                                onClick={resetFilters}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 ml-auto cursor-pointer hover:underline transition-all"
                            >
                                Reset All
                            </button>
                        </div>
                    )}

                    {/* Bulk Selection Bar */}
                    {selectedOrderIds.length > 0 && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-gradient-to-r from-amber-50 via-amber-50/50 to-orange-50/40 border border-amber-200 rounded-xl shadow-xs">
                            <div className="flex items-center gap-2.5">
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-600 text-white text-xs font-bold shadow-xs shrink-0">
                                    {selectedOrderIds.length}
                                </span>
                                <div>
                                    <h4 className="text-xs font-bold text-amber-950">
                                        {selectedOrderIds.length} Order{selectedOrderIds.length > 1 ? "s" : ""} Selected
                                    </h4>
                                    <p className="text-[10px] text-amber-700">Choose a document format to download or print in bulk</p>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                                {/* Download Buttons */}
                                <div className="flex flex-wrap items-center bg-white border border-amber-200 rounded-lg p-0.5 shadow-2xs">
                                    <span className="text-[11px] font-bold text-gray-500 px-2 flex items-center gap-1">
                                        <Download size={13} className="text-secound" /> Download:
                                    </span>
                                    <button
                                        onClick={() => handleBulkProcessInvoices("standard", "download")}
                                        disabled={isDownloadingAll}
                                        className="px-2.5 py-1 text-xs font-semibold hover:bg-secound hover:text-white text-gray-700 rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                        title="Download combined Standard A4 Invoices PDF"
                                    >
                                        <FileText size={12} /> Standard A4
                                    </button>
                                    <button
                                        onClick={() => handleBulkProcessInvoices("label", "download")}
                                        disabled={isDownloadingAll}
                                        className="px-2.5 py-1 text-xs font-semibold hover:bg-amber-600 hover:text-white text-gray-700 rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                        title="Download combined Shipping Labels PDF"
                                    >
                                        <Tag size={12} /> Labels
                                    </button>
                                    <button
                                        onClick={() => handleBulkProcessInvoices("pos", "download")}
                                        disabled={isDownloadingAll}
                                        className="px-2.5 py-1 text-xs font-semibold hover:bg-indigo-600 hover:text-white text-gray-700 rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                        title="Download combined POS Receipts PDF"
                                    >
                                        <Package size={12} /> POS
                                    </button>
                                </div>

                                {/* Direct Print Buttons */}
                                <div className="flex flex-wrap items-center bg-white border border-emerald-200 rounded-lg p-0.5 shadow-2xs">
                                    <span className="text-[11px] font-bold text-emerald-800 px-2 flex items-center gap-1">
                                        <Printer size={13} className="text-emerald-600" /> Print:
                                    </span>
                                    <button
                                        onClick={() => handleBulkProcessInvoices("standard", "print")}
                                        disabled={isDownloadingAll}
                                        className="px-2.5 py-1 text-xs font-semibold hover:bg-emerald-600 hover:text-white text-emerald-900 rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                        title="Send Standard Invoices to printer"
                                    >
                                        <FileText size={12} /> Invoices
                                    </button>
                                    <button
                                        onClick={() => handleBulkProcessInvoices("label", "print")}
                                        disabled={isDownloadingAll}
                                        className="px-2.5 py-1 text-xs font-semibold hover:bg-emerald-600 hover:text-white text-emerald-900 rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                        title="Send Shipping Labels to printer"
                                    >
                                        <Tag size={12} /> Labels
                                    </button>
                                    <button
                                        onClick={() => handleBulkProcessInvoices("pos", "print")}
                                        disabled={isDownloadingAll}
                                        className="px-2.5 py-1 text-xs font-semibold hover:bg-emerald-600 hover:text-white text-emerald-900 rounded transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                                        title="Send POS Receipts to printer"
                                    >
                                        <Package size={12} /> POS
                                    </button>
                                </div>

                                {/* Clear Selection */}
                                <button
                                    onClick={() => setSelectedOrderIds([])}
                                    className="px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer ml-auto sm:ml-0"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Desktop Table View */}
                    <div className="hidden lg:block overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-xs">
                        <table className="w-full min-w-[1300px]">
                            <thead className="bg-neutral-50 border-b border-gray-200 text-gray-700 sticky top-0 z-20 shadow-xs">
                                <tr>
                                    <th className="px-4 py-3.5 text-center w-10">
                                        <input
                                            type="checkbox"
                                            checked={displayOrders.length > 0 && displayOrders.every(o => selectedOrderIds.includes(o.id))}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-2 cursor-pointer"
                                            title="Select all orders on this page"
                                        />
                                    </th>
                                    {[
                                        { label: "#", align: "text-center", width: "w-12" },
                                        { label: "Order NO/Date", align: "text-left", width: "whitespace-nowrap min-w-[155px]" },
                                        { label: "Customer Info", align: "text-left", width: "min-w-[180px]" },
                                        { label: "Address", align: "text-left", width: "min-w-[210px]" },
                                        { label: "Products", align: "text-left", width: "min-w-[150px]" },

                                        { label: "Order Status", align: "text-left", width: "whitespace-nowrap min-w-[130px]" },
                                        { label: "Payment Info", align: "text-left", width: "min-w-[160px]" },
                                        { label: "Courier", align: "text-center", width: "whitespace-nowrap min-w-[130px]" },
                                        { label: "Actions", align: "text-center", width: "whitespace-nowrap min-w-[110px]" },
                                    ].map((header) => (
                                        <th
                                            key={header.label}
                                            className={`px-4 py-3.5 ${header.align} text-xs font-semibold text-neutral-600 uppercase tracking-wider ${header.width}`}
                                        >
                                            {header.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            {hasPermission('order.view') && (
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={11} className="px-6 py-12 text-center">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                    <span className="ml-2">Loading orders...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={11} className="px-6 py-12 text-center text-red-600">
                                                Error loading orders: {error.message}
                                            </td>
                                        </tr>
                                    ) : displayOrders.length > 0 ? (
                                        displayOrders.map((item, index) => (
                                            <tr
                                                key={item.id}
                                                className={`hover:bg-gray-50/80 transition-colors duration-150 align-middle ${selectedOrderIds.includes(item.id) ? "bg-amber-50/40" : ""}`}
                                            >
                                                <td className="px-4 py-3 text-center align-middle">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedOrderIds.includes(item.id)}
                                                        onChange={() => toggleSelectOrder(item.id)}
                                                        className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary focus:ring-2 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-sm text-center text-gray-600 font-medium align-middle whitespace-nowrap">
                                                    {displayIndexOfFirstRecord + index}
                                                </td>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 align-middle whitespace-nowrap">
                                                    <div
                                                        className="cursor-pointer group flex flex-col items-start gap-1"
                                                        onClick={() => handleOpenDrawer(item, "overview")}
                                                        title={`Placed (BD Time): ${formatExactDateTime(getOrderTimestamp(item))} (Click to view details)`}
                                                    >
                                                        <span className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                                            {item.orderNumber || "—"}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono group-hover:text-primary transition-colors">
                                                            <span>{formatDate(item.orderDate || item.createdAt)}</span>
                                                            {formatBDTime(getOrderTimestamp(item)) && (
                                                                <>
                                                                    <span className="text-[10px] text-gray-400 font-sans">•</span>
                                                                    <span>{formatBDTime(getOrderTimestamp(item))}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        {formatTimeAgo(getOrderTimestamp(item)) && (
                                                            <span
                                                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border shadow-2xs ${getTimeAgoBadgeStyle(getOrderTimestamp(item))}`}
                                                            >
                                                                {(() => {
                                                                    const orderDateObj = parseToDate(getOrderTimestamp(item));
                                                                    const isVeryRecent = orderDateObj && (new Date().getTime() - orderDateObj.getTime()) < 60 * 60 * 1000;
                                                                    return isVeryRecent ? (
                                                                        <span className="relative flex h-1.5 w-1.5 shrink-0">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                                                                        </span>
                                                                    ) : (
                                                                        <Clock size={10} className="shrink-0 opacity-70" />
                                                                    );
                                                                })()}
                                                                <span>{formatTimeAgo(getOrderTimestamp(item))}</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm align-middle">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <span className="font-semibold text-gray-900 line-clamp-1">{item.customer?.fullName || "—"}</span>
                                                        {item.customer?.phone && (
                                                            <div className="flex flex-col items-start gap-1">
                                                                <span className="text-xs text-gray-500 font-mono">{item.customer.phone}</span>
                                                                <a
                                                                    href={`tel:${item.customer.phone}`}
                                                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-md text-xs transition-all border border-gray-200 shadow-2xs cursor-pointer"
                                                                    title="Call Customer"
                                                                >
                                                                    <Phone size={12} className="text-slate-500" />
                                                                    Call
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm align-middle">
                                                    {(() => {
                                                        const addr = item.shippingAddress || item.customer?.address || {};
                                                        const fullAddr = typeof addr === 'string' ? addr : (addr.address || addr.addressLine1 || "");
                                                        const area = [addr.upazila, addr.city, addr.district].filter(Boolean).join(", ");
                                                        const recipient = addr.recipientName || item.customer?.fullName || "";

                                                        return (
                                                            <div className="flex flex-col items-start gap-1 max-w-[210px]">
                                                                <div className="flex items-center gap-1 text-xs text-gray-900 font-medium">
                                                                    <MapPin size={13} className="text-secound flex-shrink-0" />
                                                                    <span className="truncate" title={recipient}>{recipient || "Recipient"}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 line-clamp-2" title={`${fullAddr} ${area}`}>
                                                                    {fullAddr ? `${fullAddr}${area ? `, ${area}` : ''}` : (area || "—")}
                                                                </p>
                                                                <button
                                                                    onClick={() => {
                                                                        handleOpenDrawer(item, "customer");
                                                                    }}
                                                                    className="inline-flex items-center gap-1 text-[11px] text-secound hover:text-primary font-bold hover:underline cursor-pointer mt-0.5"
                                                                >
                                                                    View Details
                                                                </button>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3 text-sm align-middle">
                                                    <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                                                        {item.orderItems?.slice(0, 3).map((oi, oidx) => {
                                                            const imgUrl = getProductImage(oi.product, oi.productVariant);
                                                            const pName = oi.product?.productName || oi.product?.name || "Product";
                                                            return (
                                                                <div
                                                                    key={oidx}
                                                                    onClick={() => {
                                                                        if (imgUrl) {
                                                                            setPreviewImage({
                                                                                url: imgUrl,
                                                                                title: pName,
                                                                                sku: oi.product?.sku || oi.sku,
                                                                                quantity: oi.quantity,
                                                                                price: oi.unitPrice || oi.price,
                                                                                color: oi.color,
                                                                                size: oi.size
                                                                            });
                                                                        }
                                                                    }}
                                                                    className={`relative group w-9 h-9 rounded border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0 shadow-2xs ${imgUrl ? 'cursor-pointer hover:border-secound hover:scale-110 hover:shadow-md transition-all duration-200' : ''}`}
                                                                    title={imgUrl ? `${pName} (x${oi.quantity}) - Click to preview image` : `${pName} (x${oi.quantity})`}
                                                                >
                                                                    {imgUrl ? (
                                                                        <Image
                                                                            src={imgUrl}
                                                                            alt={pName}
                                                                            width={36}
                                                                            height={36}
                                                                            className="object-cover w-full h-full"
                                                                            loading="lazy"
                                                                            unoptimized={typeof imgUrl === 'string' && imgUrl.startsWith('http://')}
                                                                        />
                                                                    ) : (
                                                                        <Package className="w-4 h-4 text-gray-400" />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                        {item.orderItems?.length > 3 && (
                                                            <span className="text-[11px] text-gray-500 font-semibold font-mono">
                                                                +{item.orderItems.length - 3}
                                                            </span>
                                                        )}
                                                        {item.orderItems?.length > 0 && (
                                                            <button
                                                                onClick={() => {
                                                                    handleOpenDrawer(item, "items");
                                                                }}
                                                                className="text-[11px] text-secound hover:underline ml-1 font-bold cursor-pointer whitespace-nowrap"
                                                            >
                                                                See All
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-sm align-middle whitespace-nowrap">
                                                    <select
                                                        value={normalizeOrderStatus(item.status)}
                                                        onChange={(e) => handleStatusChange(item, e.target.value)}
                                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 border cursor-pointer transition shadow-2xs ${getOrderStatusStyle(item.status)}`}
                                                    >
                                                        {ORDER_STATUS_OPTIONS.map((status) => (
                                                            <option key={status.value} value={status.value} className="bg-white text-gray-900 font-normal">
                                                                {status.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>

                                                <td className="px-4 py-3 text-sm align-middle">
                                                    <div className="flex flex-col gap-1 min-w-[140px]">
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-500 font-medium">Total:</span>
                                                            <span className="font-bold text-gray-900">{item.grandTotal ? `৳${item.grandTotal}` : "—"}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs">
                                                            <span className="text-gray-500 font-medium">Paid:</span>
                                                            <span className="font-semibold text-green-600">{item.paidAmount ? `৳${item.paidAmount}` : "৳0"}</span>
                                                        </div>
                                                        {parseFloat(item.dueAmount || 0) > 0 && (
                                                            <div className="flex items-center justify-between text-xs">
                                                                <span className="text-gray-500 font-medium">Due:</span>
                                                                <span className="font-semibold text-red-600">৳{item.dueAmount}</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-1 mt-0.5 border-t border-gray-100 flex items-center justify-between gap-1.5">
                                                            <span
                                                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${item.paymentMethod === "OnlinePayment" || item.paymentMethod === "bKash" || item.paymentMethod === "Nagad"
                                                                    ? "bg-green-50 text-green-700 border border-green-200"
                                                                    : item.paymentMethod === "COD" || item.paymentMethod === "CashOnDelivery"
                                                                        ? "bg-purple-50 text-purple-700 border border-purple-200"
                                                                        : "bg-gray-50 text-gray-700 border border-gray-200"
                                                                    }`}
                                                            >
                                                                {item.paymentMethod || "COD"}
                                                            </span>
                                                            <span
                                                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${item.paymentStatus === "Paid"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : item.paymentStatus === "Partial"
                                                                        ? "bg-sky-100 text-sky-800"
                                                                        : "bg-yellow-100 text-yellow-800"
                                                                    }`}
                                                            >
                                                                {item.paymentStatus || "Unpaid"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm align-middle text-center">
                                                    {item.shipment ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span
                                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs ${item.shipment.courier === "PATHAO"
                                                                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                                                                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                                    }`}
                                                            >
                                                                {item.shipment.courier === "PATHAO" ? <Send size={11} /> : <Truck size={11} />}
                                                                {item.shipment.courier === "PATHAO" ? "Pathao" : "Steadfast"}
                                                            </span>

                                                            <span className="text-[10px] text-slate-500 font-mono">
                                                                {item.shipment.trackingCode || item.shipment.consignmentId || item.shipment.status}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (item.shipment.courier === "PATHAO") {
                                                                        router.push(`/pathao?search=${item.orderNumber}`);
                                                                    } else {
                                                                        router.push(`/steadfast?search=${item.orderNumber}`);
                                                                    }
                                                                }}
                                                                className={`text-[10px] font-semibold underline cursor-pointer transition-colors ${item.shipment.courier === "PATHAO"
                                                                    ? "text-rose-600 hover:text-rose-800"
                                                                    : "text-emerald-600 hover:text-emerald-800"
                                                                    }`}
                                                            >
                                                                Manage in {item.shipment.courier === "PATHAO" ? "Pathao" : "Steadfast"} →
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1.5 w-28 mx-auto">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setDispatchOrder(item);
                                                                    setSelectedCourier("STEADFAST");
                                                                    setIsDispatchModalOpen(true);
                                                                }}
                                                                className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow-2xs transition-colors cursor-pointer"
                                                                title="Dispatch to Steadfast"
                                                            >
                                                                <Truck size={13} />
                                                                <span>Steadfast</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setDispatchOrder(item);
                                                                    setSelectedCourier("PATHAO");
                                                                    setIsDispatchModalOpen(true);
                                                                }}
                                                                className="w-full flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded shadow-2xs transition-colors cursor-pointer"
                                                                title="Dispatch to Pathao"
                                                            >
                                                                <Send size={13} />
                                                                <span>Pathao</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-sm align-middle text-center">
                                                    <div className="grid grid-cols-2 gap-1.5 w-fit mx-auto">
                                                        {/* Row 1, Col 1: View */}
                                                        {(hasPermission('order.view') || hasPermission('order.update')) ? (
                                                            <div className="relative group flex items-center justify-center">
                                                                <button
                                                                    onClick={() => {
                                                                        handleOpenDrawer(item, 'overview');
                                                                    }}
                                                                    className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors duration-200 cursor-pointer border border-transparent hover:border-emerald-200"
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={16} />
                                                                </button>
                                                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 z-30">
                                                                    View Details
                                                                </span>
                                                            </div>
                                                        ) : <div />}

                                                        {/* Row 1, Col 2: Delete */}
                                                        {hasPermission('order.delete') ? (
                                                            <div className="relative group flex items-center justify-center">
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors duration-200 cursor-pointer border border-transparent hover:border-rose-200"
                                                                    title="Delete Order"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 z-30">
                                                                    Delete Order
                                                                </span>
                                                            </div>
                                                        ) : <div />}

                                                        {/* Row 2, Col 1: Invoice */}
                                                        {hasPermission('order.view') ? (
                                                            <div className="relative group flex items-center justify-center">
                                                                <button
                                                                    onClick={() => handleDownloadInvoiceDirectly(item.id, item.orderNumber, "standard", item)}
                                                                    disabled={downloadingInvoiceId === item.id}
                                                                    className="p-1.5 text-gray-500 hover:text-secound hover:bg-sky-50 rounded-md transition-colors duration-200 cursor-pointer border border-transparent hover:border-sky-200 disabled:opacity-50"
                                                                    title={`Download Invoice (${getInvoiceNumber(item)})`}
                                                                >
                                                                    {downloadingInvoiceId === item.id && downloadingFormat === "standard" ? (
                                                                        <Loader2 size={16} className="animate-spin text-secound" />
                                                                    ) : (
                                                                        <FileText size={16} />
                                                                    )}
                                                                </button>
                                                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 z-30">
                                                                    Invoice ({getInvoiceNumber(item)})
                                                                </span>
                                                            </div>
                                                        ) : <div />}

                                                        {/* Row 2, Col 2: More Actions */}
                                                        {shouldShowDropdown(item) ? (
                                                            <div className="relative group flex items-center justify-center">
                                                                <button
                                                                    onClick={(e) => toggleDropdown(item.id, e)}
                                                                    className="p-1.5 text-gray-500 hover:text-secound hover:bg-slate-100 rounded-md transition-colors duration-200 cursor-pointer border border-transparent hover:border-slate-200"
                                                                    title="More Actions"
                                                                >
                                                                    <MoreVertical size={16} />
                                                                </button>
                                                                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-0.5 text-[10px] font-medium text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 z-30">
                                                                    More Actions
                                                                </span>
                                                            </div>
                                                        ) : <div />}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={11}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                    <p className="text-lg font-medium text-gray-900">No orders found</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {hasActiveFilters
                                                            ? "Try adjusting your search or filter criteria"
                                                            : "Get started by adding your first order"}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {/* Mobile Order Cards View (block on < lg screens) */}
                    <div className="block lg:hidden space-y-2.5">
                        {isLoading ? (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                                <div className="flex flex-col items-center justify-center gap-2">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    <span className="text-sm text-gray-600">Loading orders...</span>
                                </div>
                            </div>
                        ) : error ? (
                            <div className="bg-white rounded-xl border border-rose-200 p-6 text-center text-rose-600 text-sm">
                                Error loading orders: {error.message}
                            </div>
                        ) : displayOrders.length > 0 ? (
                            displayOrders.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleOpenDrawer(item, "overview")}
                                    className="bg-white rounded-xl border border-gray-200 hover:border-primary active:scale-[0.99] p-3.5 transition-all shadow-xs cursor-pointer space-y-2.5"
                                    title="Click to view order details"
                                >
                                    {/* Top Row: Order ID + Status Badge + Amount */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="font-bold text-gray-900 text-sm truncate">
                                                {item.orderNumber || "—"}
                                            </span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${getOrderStatusStyle(item.status)}`}>
                                                {formatOrderStatusDisplay(item.status)}
                                            </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="font-bold text-gray-900 text-sm">
                                                ৳{item.grandTotal || 0}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Middle Row: Customer Info + Action Buttons (Call, More, Delete) */}
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-800 text-xs truncate">
                                                {item.customer?.fullName || "Guest Customer"}
                                            </p>
                                            {item.customer?.phone && (
                                                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                                    {item.customer.phone}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {item.customer?.phone && (
                                                <a
                                                    href={`tel:${item.customer.phone}`}
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold rounded-lg text-xs border border-emerald-200 transition-colors shadow-2xs"
                                                    title="Call Customer"
                                                >
                                                    <Phone size={12} className="text-emerald-600" />
                                                    <span>Call</span>
                                                </a>
                                            )}

                                            {shouldShowDropdown(item) && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        toggleDropdown(item.id, e);
                                                    }}
                                                    className="p-1.5 text-gray-500 hover:text-secound hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 cursor-pointer"
                                                    title="More Actions"
                                                >
                                                    <MoreVertical size={14} />
                                                </button>
                                            )}

                                            {hasPermission('order.delete') && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(item.id);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-gray-200 hover:border-rose-200 cursor-pointer"
                                                    title="Delete Order"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Bottom Row: Date/Time + Due / Relative Time */}
                                    <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono pt-1.5 border-t border-gray-100">
                                        <div className="flex items-center gap-1.5 min-w-0 truncate">
                                            <Clock size={11} className="text-gray-400 shrink-0" />
                                            <span>{formatDate(item.orderDate || item.createdAt)}</span>
                                            {formatBDTime(getOrderTimestamp(item)) && (
                                                <>
                                                    <span className="text-gray-300">•</span>
                                                    <span>{formatBDTime(getOrderTimestamp(item))}</span>
                                                </>
                                            )}
                                        </div>
                                        {parseFloat(item.dueAmount || 0) > 0 ? (
                                            <span className="text-rose-600 font-semibold font-sans text-xs shrink-0">
                                                Due: ৳{item.dueAmount}
                                            </span>
                                        ) : formatTimeAgo(getOrderTimestamp(item)) ? (
                                            <span className="text-gray-400 font-sans text-[10px] shrink-0">
                                                {formatTimeAgo(getOrderTimestamp(item))}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                                <Search className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                <p className="text-base font-medium text-gray-900">No orders found</p>
                                <p className="text-xs text-gray-600 mt-1">
                                    {hasActiveFilters
                                        ? "Try adjusting your search or filter criteria"
                                        : "Get started by adding your first order"}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {displayTotalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={displayTotalPages}
                            onPageChange={setCurrentPage}
                            totalRecords={displayTotalItems}
                            indexOfFirstRecord={displayIndexOfFirstRecord}
                            indexOfLastRecord={displayIndexOfLastRecord}
                            className="border border-gray-100 px-5 py-3 rounded-lg"
                        />
                    )}
                </div>

                {/* Dropdown using Portal */}
                <DropdownMenu
                    isOpen={!!openDropdown}
                    onClose={() => setOpenDropdown(null)}
                    items={openDropdown ? getDropdownItems(allOrders.find(item => item.id === openDropdown)) : []}
                    position={dropdownPosition}
                />

                {/* Modals */}
                <OrderAddDrawer
                    isOpen={addModal.isOpen}
                    onClose={addModal.close}
                    onSuccess={handleAddSuccess}
                />

                <OrderManageModal
                    isOpen={manageModal.isOpen}
                    onClose={manageModal.close}
                    order={selectedOrder}
                    onSuccess={handleManageSuccess}
                />

                <CreatePaymentModal
                    isOpen={paymentModal.isOpen}
                    onClose={paymentModal.close}
                    order={selectedOrder}
                    onSuccess={handlePaymentSuccess}
                />

                <DispatchModal
                    isOpen={isDispatchModalOpen}
                    onClose={() => {
                        setIsDispatchModalOpen(false);
                        setDispatchOrder(null);
                    }}
                    order={dispatchOrder}
                    defaultCourier={selectedCourier}
                    onDispatchSuccess={() => {
                        mutate();
                        mutateAllOrders();
                    }}
                />

                {/* Image Preview Lightbox Modal */}
                {previewImage && (
                    <div
                        className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200"
                        onClick={() => setPreviewImage(null)}
                    >
                        <div
                            className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md sm:max-w-lg w-full border border-gray-100 animate-in zoom-in-95 duration-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/90 border-b border-gray-100">
                                <div className="flex-1 min-w-0 pr-3">
                                    <h3 className="font-bold text-gray-900 text-sm truncate" title={previewImage.title}>
                                        {previewImage.title || "Product Image Preview"}
                                    </h3>
                                    {previewImage.sku && (
                                        <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                            SKU: {previewImage.sku}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={() => setPreviewImage(null)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors cursor-pointer"
                                    title="Close preview"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Image Container */}
                            <div className="relative w-full h-80 sm:h-96 bg-gray-100/40 flex items-center justify-center p-4">
                                <Image
                                    src={previewImage.url}
                                    alt={previewImage.title || "Product Image"}
                                    fill
                                    sizes="(max-width: 640px) 100vw, 512px"
                                    className="object-contain p-2"
                                    unoptimized={typeof previewImage.url === 'string' && previewImage.url.startsWith('http://')}
                                />
                            </div>

                            {/* Modal Footer with details */}
                            {(previewImage.quantity || previewImage.price || previewImage.color || previewImage.size) && (
                                <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
                                    <div className="flex items-center gap-2">
                                        {previewImage.quantity && (
                                            <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                                                Qty: <strong className="text-gray-900">{previewImage.quantity}</strong>
                                            </span>
                                        )}
                                        {previewImage.price && (
                                            <span className="font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                                                Price: <strong>৳{previewImage.price}</strong>
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {previewImage.color && (
                                            <span className="bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded text-[11px]">
                                                Color: {previewImage.color}
                                            </span>
                                        )}
                                        {previewImage.size && (
                                            <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded text-[11px]">
                                                Size: {previewImage.size}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Order Detail Drawer */}
                <OrderDetailDrawer
                    isOpen={isDrawerOpen}
                    onClose={handleCloseDrawer}
                    order={drawerOrder}
                    allOrders={allOrders}
                    customersList={customersList}
                    initialTab={drawerTab}
                    onUpdateStatus={openManageModal}
                    onPayment={openPaymentModal}
                    onDispatch={(ord, courier = "STEADFAST") => {
                        setDispatchOrder(ord);
                        setSelectedCourier(courier);
                        setIsDispatchModalOpen(true);
                    }}
                    onToggleBlockCustomer={handleBlockCustomerDirectly}
                />
            </div>
        </ProtectedRoute>
    );
}

export default function OrderPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-gray-500 font-medium">Loading orders...</div>}>
            <Order />
        </Suspense>
    );
}