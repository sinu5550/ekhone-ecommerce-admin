'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
    X,
    Package,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    DollarSign,
    CreditCard,
    Truck,
    Clock,
    CheckCircle,
    XCircle,
    Download,
    Printer,
    FileText,
    Copy,
    Tag,
    Edit2,
    Loader2,
    AlertCircle,
    Send,
    MapPinHouse,
    ShieldAlert,
    ShieldCheck,
    ChevronDown,
    Layers,
    RotateCcw,
    Sparkles,
    Trash2,
    HelpCircle,
    AlertTriangle,
    PauseCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import { apiClient } from '@/lib/apiClient';
import { clientPDFGenerator, getInvoiceNumber, printPDFBlob } from '@/lib/invoicePDF';
import VariantAttributes from '@/components/ui/ColorSwatch';

export default function OrderDetailDrawer({
    isOpen,
    onClose,
    order,
    allOrders = [],
    customersList = [],
    onUpdateStatus,
    onPayment,
    onDispatch,
    onToggleBlockCustomer,
    initialTab = 'overview'
}) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [detailedData, setDetailedData] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [error, setError] = useState(null);
    const [downloadingFormat, setDownloadingFormat] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [isTogglingBlock, setIsTogglingBlock] = useState(false);
    const [isInvoiceMenuOpen, setIsInvoiceMenuOpen] = useState(false);
    const invoiceMenuRef = useRef(null);

    // Close invoice menu on click outside
    useEffect(() => {
        const handleClickOutsideMenu = (e) => {
            if (invoiceMenuRef.current && !invoiceMenuRef.current.contains(e.target)) {
                setIsInvoiceMenuOpen(false);
            }
        };
        if (isInvoiceMenuOpen) {
            document.addEventListener('mousedown', handleClickOutsideMenu);
        }
        return () => document.removeEventListener('mousedown', handleClickOutsideMenu);
    }, [isInvoiceMenuOpen]);

    // Sync initial tab when drawer opens
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab || 'overview');
        }
    }, [isOpen, initialTab]);

    // Escape key listener & prevent body scroll
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                if (previewImage) {
                    setPreviewImage(null);
                } else {
                    onClose();
                }
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose, previewImage]);

    // Fetch full order details
    useEffect(() => {
        if (!isOpen || !order?.id) {
            setDetailedData(null);
            setError(null);
            return;
        }

        let isMounted = true;

        const fetchDetails = async () => {
            setIsLoadingDetails(true);
            setError(null);
            try {
                const response = await apiClient(`/api/order/${order.id}`);
                if (isMounted) {
                    if (response?.success && response.data) {
                        setDetailedData(response.data);
                    } else {
                        setDetailedData(order);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching order drawer details:', err);
                    setDetailedData(order);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingDetails(false);
                }
            }
        };

        fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [isOpen, order]);

    const activeOrder = detailedData || order;

    const orderItems = activeOrder?.orderItems || [];
    const bundleOrderItems = activeOrder?.bundleOrderItems || [];
    const customer = activeOrder?.customer || {};
    const shippingAddress = activeOrder?.shippingAddress || {};
    const shipment = activeOrder?.shipment || (Array.isArray(activeOrder?.shipments) && activeOrder.shipments.length > 0 ? activeOrder.shipments[0] : null);

    const isAlreadyDispatched = Boolean(
        shipment ||
        activeOrder?.shipment ||
        (Array.isArray(activeOrder?.shipments) && activeOrder.shipments.length > 0) ||
        activeOrder?.status?.toLowerCase() === 'shipped' ||
        activeOrder?.status?.toLowerCase() === 'delivered' ||
        activeOrder?.consignmentId ||
        activeOrder?.trackingCode ||
        activeOrder?.trackingNumber
    );

    // Find customer blocked status
    const customerId = customer?.id || customer?._id || activeOrder?.customerId;
    const matchedCustomerInList = customersList.find(c => c.id === customerId || c._id === customerId);
    const isCustomerBlocked = matchedCustomerInList
        ? matchedCustomerInList.status === false
        : (customer?.status === false);

    // Customer order stats
    const customerStats = useMemo(() => {
        if (!customerId || allOrders.length === 0) return null;
        const custOrders = allOrders.filter(o => {
            const cId = o.customer?.id || o.customer?._id || o.customerId;
            return cId === customerId;
        });

        return {
            total: custOrders.length,
            delivered: custOrders.filter(o => ['delivered', 'completed'].includes(o.status?.toLowerCase())).length,
            cancelled: custOrders.filter(o => ['cancelled', 'cancel'].includes(o.status?.toLowerCase())).length,
            pending: custOrders.filter(o => ['pending'].includes(o.status?.toLowerCase())).length,
            processing: custOrders.filter(o => ['processing', 'confirmed', 'process'].includes(o.status?.toLowerCase())).length,
            shipped: custOrders.filter(o => ['shipped', 'courier'].includes(o.status?.toLowerCase())).length,
            returned: custOrders.filter(o => ['returned', 'return'].includes(o.status?.toLowerCase())).length,
        };
    }, [customerId, allOrders]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return '৳0.00';
        return `৳${parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getStatusBadge = (status) => {
        const s = String(status || '').toLowerCase().replace(/[\s\-_]/g, '');
        switch (s) {
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
                        <Clock size={12} /> Pending
                    </span>
                );
            case 'confirmed':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-300">
                        <CheckCircle size={12} /> Confirmed
                    </span>
                );
            case 'readytoship':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-100 text-teal-800 border border-teal-300">
                        <Package size={12} /> Ready To Ship
                    </span>
                );
            case 'incourier':
            case 'shipped':
            case 'shipping':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-300">
                        <Truck size={12} /> In-Courier
                    </span>
                );
            case 'shiplater':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
                        <Calendar size={12} /> Ship Later
                    </span>
                );
            case 'hold':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        <PauseCircle size={12} /> Hold
                    </span>
                );
            case 'returned':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
                        <RotateCcw size={12} /> Returned
                    </span>
                );
            case 'preorder':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
                        <Sparkles size={12} /> Pre-order
                    </span>
                );
            case 'delivered':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle size={12} /> Delivered
                    </span>
                );
            case 'cancelled':
            case 'cancel':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                        <XCircle size={12} /> Cancelled
                    </span>
                );
            case 'missing':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-pink-100 text-pink-800 border border-pink-300">
                        <HelpCircle size={12} /> Missing
                    </span>
                );
            case 'lost':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-300">
                        <AlertTriangle size={12} /> Lost
                    </span>
                );
            case 'fake':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-stone-200 text-stone-800 border border-stone-300">
                        <ShieldAlert size={12} /> Fake
                    </span>
                );
            case 'trash':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 border border-gray-300">
                        <Trash2 size={12} /> Trash
                    </span>
                );
            case 'processing':
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                        <Clock size={12} /> Processing
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                        <Clock size={12} /> {status || 'Pending'}
                    </span>
                );
        }
    };

    const calculatePaymentStatus = () => {
        if (!activeOrder) return 'Pending';
        if (activeOrder.paymentStatus) return activeOrder.paymentStatus;
        const due = parseFloat(activeOrder.dueAmount || 0);
        const paid = parseFloat(activeOrder.paidAmount || 0);
        const grandTotal = parseFloat(activeOrder.grandTotal || 0);

        if (due === 0 && paid >= grandTotal) return 'Paid';
        if (paid === 0) return 'Unpaid';
        if (paid > 0 && paid < grandTotal) return 'Partial';
        return 'Pending';
    };

    const paymentStatus = calculatePaymentStatus();

    const getPaymentStatusBadge = (status) => {
        const s = status?.toLowerCase() || '';
        if (s === 'paid') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle size={11} /> Paid
                </span>
            );
        }
        if (s === 'cod') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
                    COD
                </span>
            );
        }
        if (s === 'partial') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                    Partial
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                {status || 'Unpaid'}
            </span>
        );
    };

    const getProductImage = (product, variant) => {
        if (variant?.images && variant.images.length > 0) {
            const vi = variant.images[0];
            return typeof vi === 'string' ? vi : vi.url || vi.imageUrl;
        }
        if (product?.images && product.images.length > 0) {
            const pi = product.images[0];
            return typeof pi === 'string' ? pi : pi.url || pi.imageUrl;
        }
        return null;
    };

    const handleProcessInvoice = async (format = 'standard', action = 'download') => {
        if (!activeOrder) return;
        const invNum = getInvoiceNumber(activeOrder);
        const formatTitle = format === 'pos' ? 'POS Receipt' : format === 'label' ? 'Shipping Label' : 'Invoice';
        const actionVerb = action === 'print' ? 'Preparing to print' : 'Generating';
        const toastId = toast.loading(`${actionVerb} ${formatTitle}...`);
        setDownloadingFormat(`${format}-${action}`);
        setIsInvoiceMenuOpen(false);

        try {
            let pdfBlob;
            let fileName = `Invoice-${invNum}.pdf`;

            if (format === 'pos') {
                pdfBlob = await clientPDFGenerator.generatePosReceipt(activeOrder);
                fileName = `POS-Receipt-${invNum}.pdf`;
            } else if (format === 'label') {
                pdfBlob = await clientPDFGenerator.generateShippingLabel(activeOrder);
                fileName = `Shipping-Label-${invNum}.pdf`;
            } else {
                pdfBlob = await clientPDFGenerator.generateInvoice(activeOrder);
                fileName = `Invoice-${invNum}.pdf`;
            }

            if (action === 'print') {
                await printPDFBlob(pdfBlob);
                toast.success(`Print dialog opened for ${formatTitle}`, { id: toastId });
            } else {
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                toast.success(`${fileName} downloaded successfully`, { id: toastId });
            }
        } catch (err) {
            console.error('Action failed:', err);
            toast.error(err.message || `Failed to process ${formatTitle}`, { id: toastId });
        } finally {
            setDownloadingFormat(null);
        }
    };

    // Backwards compatible alias
    const handleDownloadInvoice = (format = 'standard') => handleProcessInvoice(format, 'download');

    const handleBlockToggle = async () => {
        if (!customerId) {
            toast.error('Customer ID not available');
            return;
        }

        const willBlock = !isCustomerBlocked;
        const actionWord = willBlock ? 'block' : 'unblock';
        const custName = customer.fullName || 'this customer';

        const result = await Swal.fire({
            title: `${willBlock ? 'Block' : 'Unblock'} Customer?`,
            text: `Are you sure you want to ${actionWord} ${custName}? ${willBlock ? 'They will not be able to place new orders.' : 'Their account will be re-activated.'}`,
            icon: willBlock ? 'warning' : 'question',
            showCancelButton: true,
            confirmButtonColor: willBlock ? '#dc2626' : '#10b981',
            cancelButtonColor: '#6b7280',
            confirmButtonText: `Yes, ${actionWord}!`,
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            if (onToggleBlockCustomer) {
                onToggleBlockCustomer(customerId, !willBlock, custName);
            } else {
                setIsTogglingBlock(true);
                const toastId = toast.loading(`${willBlock ? 'Blocking' : 'Unblocking'} customer...`);
                try {
                    const res = await apiClient(`/api/customer/${customerId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: !willBlock })
                    });
                    if (!res.success) throw new Error(res.message || 'Action failed');
                    toast.success(`Customer ${actionWord}ed successfully`, { id: toastId });
                    setDetailedData(prev => prev ? ({ ...prev, customer: { ...prev.customer, status: !willBlock } }) : null);
                } catch (err) {
                    toast.error(err.message || 'Failed to update customer status', { id: toastId });
                } finally {
                    setIsTogglingBlock(false);
                }
            }
        }
    };

    const copyAddress = () => {
        const fullAddr = [
            shippingAddress.recipientName ? `Recipient: ${shippingAddress.recipientName}` : '',
            shippingAddress.phoneNumber ? `Phone: ${shippingAddress.phoneNumber}` : '',
            shippingAddress.address || customer.address || '',
            shippingAddress.upazila ? `Upazila: ${shippingAddress.upazila}` : '',
            shippingAddress.city ? `City: ${shippingAddress.city}` : '',
            shippingAddress.district ? `District: ${shippingAddress.district}` : '',
            shippingAddress.division ? `Division: ${shippingAddress.division}` : '',
            shippingAddress.postalCode ? `Postal Code: ${shippingAddress.postalCode}` : '',
            activeOrder.note ? `Note: ${activeOrder.note}` : ''
        ].filter(Boolean).join('\n');

        navigator.clipboard.writeText(fullAddr);
        toast.success('Shipping address copied to clipboard!');
    };

    const totalItemCount = orderItems.reduce((acc, item) => acc + (parseInt(item.quantity) || 1), 0)
        + bundleOrderItems.reduce((acc, b) => acc + (parseInt(b.quantity) || 1), 0);

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Package },
        { id: 'items', label: 'Items & Bill', icon: Tag, count: totalItemCount },
        { id: 'customer', label: 'Customer & Delivery', icon: User },
        { id: 'tracking', label: 'Parcel & Tracking History', icon: Truck }
    ];

    return (
        <AnimatePresence>
            {isOpen && activeOrder && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Sliding Drawer Panel */}
                    <motion.div
                        className="fixed inset-y-0 right-0 w-full md:w-[65vw] lg:w-[55vw] xl:w-[50vw] bg-white shadow-2xl flex flex-col h-full border-l border-gray-200 z-50"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                    >
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/90 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-secound/10 border border-secound/20 flex items-center justify-center text-secound shadow-xs shrink-0">
                                    <Package size={24} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-lg font-bold text-gray-900 font-mono tracking-tight truncate">
                                            #{activeOrder.orderNumber || `ORD-${activeOrder.id}`}
                                        </h2>
                                        {getStatusBadge(activeOrder.status)}
                                        {getPaymentStatusBadge(paymentStatus)}
                                        {isCustomerBlocked && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                                                <ShieldAlert size={11} /> Blocked Customer
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                                        <span>Ordered {formatDate(activeOrder.orderDate || activeOrder.createdAt)}</span>
                                        {activeOrder.paymentMethod && (
                                            <>
                                                <span>•</span>
                                                <span className="font-medium text-gray-700 bg-gray-200/80 px-1.5 py-0.2 rounded text-[11px]">
                                                    {activeOrder.paymentMethod}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Header Actions */}
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                                {/* Print & Invoice Dropdown */}
                                <div className="relative" ref={invoiceMenuRef}>
                                    <button
                                        onClick={() => setIsInvoiceMenuOpen(!isInvoiceMenuOpen)}
                                        disabled={downloadingFormat !== null}
                                        className="px-2.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded border border-gray-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
                                        title="Print or Download Invoices and Labels"
                                    >
                                        {downloadingFormat ? (
                                            <Loader2 size={13} className="animate-spin text-secound" />
                                        ) : (
                                            <Printer size={13} className="text-secound" />
                                        )}
                                        <span>Print / Invoice</span>
                                        <ChevronDown size={12} className={`text-gray-400 transition-transform duration-200 ${isInvoiceMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {isInvoiceMenuOpen && (
                                        <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                                            <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase bg-gray-50 border-b border-gray-100 flex items-center gap-1">
                                                <Printer size={11} /> Direct Print
                                            </div>
                                            <button
                                                onClick={() => handleProcessInvoice('standard', 'print')}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-secound font-medium transition-colors cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2"><FileText size={14} className="text-blue-500" /> Invoice (A4)</span>
                                                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono">Print</span>
                                            </button>
                                            <button
                                                onClick={() => handleProcessInvoice('label', 'print')}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-purple-600 font-medium transition-colors cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2"><Tag size={14} className="text-purple-500" /> Shipping Label</span>
                                                <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-mono">Print</span>
                                            </button>
                                            <button
                                                onClick={() => handleProcessInvoice('pos', 'print')}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-amber-600 font-medium transition-colors cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2"><Printer size={14} className="text-amber-500" /> POS Receipt (80mm)</span>
                                                <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono">Print</span>
                                            </button>

                                            <div className="px-3 py-1 mt-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase bg-gray-50 border-t border-b border-gray-100 flex items-center gap-1">
                                                <Download size={11} /> Download PDF
                                            </div>
                                            <button
                                                onClick={() => handleProcessInvoice('standard', 'download')}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-blue-600 font-medium transition-colors cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2"><FileText size={14} className="text-blue-500" /> Invoice (A4)</span>
                                                <Download size={12} className="text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleProcessInvoice('label', 'download')}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-purple-600 font-medium transition-colors cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2"><Tag size={14} className="text-purple-500" /> Shipping Label</span>
                                                <Download size={12} className="text-gray-400" />
                                            </button>
                                            <button
                                                onClick={() => handleProcessInvoice('pos', 'download')}
                                                className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between text-gray-700 hover:text-amber-600 font-medium transition-colors cursor-pointer"
                                            >
                                                <span className="flex items-center gap-2"><Printer size={14} className="text-amber-500" /> POS Receipt</span>
                                                <Download size={12} className="text-gray-400" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Update Status */}
                                {onUpdateStatus && (
                                    <button
                                        onClick={() => onUpdateStatus(activeOrder)}
                                        className="px-2.5 py-1.5 text-gray-700 hover:text-primary hover:bg-teal-50 rounded border border-gray-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Update Order Status"
                                    >
                                        <Edit2 size={13} />
                                        <span className="hidden sm:inline">Status</span>
                                    </button>
                                )}

                                {/* Payment Action */}
                                {onPayment && (
                                    <button
                                        onClick={() => onPayment(activeOrder)}
                                        className="px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                        title="Record Payment"
                                    >
                                        <CreditCard size={13} />
                                        <span className="hidden sm:inline">Payment</span>
                                    </button>
                                )}

                                {/* Block/Unblock Customer Header Button */}
                                {customerId && (
                                    <button
                                        onClick={handleBlockToggle}
                                        disabled={isTogglingBlock}
                                        className={`px-2.5 py-1.5 rounded border text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                                            isCustomerBlocked
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                        }`}
                                        title={isCustomerBlocked ? 'Unblock this customer' : 'Block this customer'}
                                    >
                                        {isCustomerBlocked ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                                        <span className="hidden sm:inline">{isCustomerBlocked ? 'Unblock' : 'Block'}</span>
                                    </button>
                                )}

                                {/* Close Button */}
                                <button
                                    onClick={onClose}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors cursor-pointer ml-1"
                                    title="Close drawer (Esc)"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Metric Stat Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 bg-white border-b border-gray-100">
                            <div className="bg-teal-50/60 border border-teal-100 rounded p-3 flex flex-col justify-between">
                                <span className="text-[11px] font-semibold text-teal-900 uppercase tracking-wider block truncate">Grand Total</span>
                                <p className="text-base font-bold text-teal-800 mt-1 truncate">
                                    {formatCurrency(activeOrder.grandTotal)}
                                </p>
                            </div>

                            <div className="bg-emerald-50/60 border border-emerald-100 rounded p-3 flex flex-col justify-between">
                                <span className="text-[11px] font-semibold text-emerald-900 uppercase tracking-wider block truncate">Paid Amount</span>
                                <p className="text-base font-bold text-emerald-800 mt-1 truncate">
                                    {formatCurrency(activeOrder.paidAmount)}
                                </p>
                            </div>

                            <div className="bg-rose-50/60 border border-rose-100 rounded p-3 flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-semibold text-rose-900 uppercase tracking-wider block truncate">Due Amount</span>
                                    {onPayment && parseFloat(activeOrder.dueAmount || 0) > 0 && (
                                        <button
                                            onClick={() => onPayment(activeOrder)}
                                            className="text-[10px] text-rose-700 font-bold hover:underline cursor-pointer"
                                        >
                                            + Pay
                                        </button>
                                    )}
                                </div>
                                <p className="text-base font-bold text-rose-700 mt-1 truncate">
                                    {formatCurrency(activeOrder.dueAmount)}
                                </p>
                            </div>

                            <div className="bg-purple-50/60 border border-purple-100 rounded p-3 flex flex-col justify-between">
                                <span className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider block truncate">Items Count</span>
                                <p className="text-base font-bold text-purple-800 mt-1">
                                    {totalItemCount} <span className="text-xs font-normal text-purple-600">item(s)</span>
                                </p>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex items-center overflow-x-auto border-b border-gray-200 bg-white px-6 hide-scrollbar">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
                                            isActive
                                                ? 'border-secound text-secound'
                                                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon size={14} />
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span
                                                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                                    isActive ? 'bg-secound/10 text-secound' : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Scrollable Drawer Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60 space-y-5">
                            {isLoadingDetails && (
                                <div className="flex items-center gap-2 text-xs text-secound bg-secound/5 border border-secound/20 px-3 py-2 rounded">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Syncing latest order details...</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded">
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* ================= TAB 1: OVERVIEW ================= */}
                            {activeTab === 'overview' && (
                                <div className="space-y-5">
                                    {/* Top Row: Customer & Shipping Quick Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Customer Quick Card */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                    <User size={14} className="text-secound" />
                                                    Customer Information
                                                </h3>
                                                <button
                                                    onClick={() => setActiveTab('customer')}
                                                    className="text-xs text-secound hover:underline font-medium cursor-pointer"
                                                >
                                                    View Profile
                                                </button>
                                            </div>

                                            <div className="divide-y divide-gray-100 text-xs">
                                                <div className="py-2 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500">Name</span>
                                                    <span className="font-semibold text-gray-900">{customer.fullName || '—'}</span>
                                                </div>
                                                <div className="py-2 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500">Phone</span>
                                                    <span className="font-semibold text-gray-900 font-mono">
                                                        {customer.phone ? (
                                                            <a href={`tel:${customer.phone}`} className="hover:text-secound hover:underline">
                                                                {customer.phone}
                                                            </a>
                                                        ) : '—'}
                                                    </span>
                                                </div>
                                                <div className="py-2 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500">Customer Status</span>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                            isCustomerBlocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                                        }`}>
                                                            {isCustomerBlocked ? 'Blocked' : 'Active'}
                                                        </span>
                                                        <button
                                                            onClick={handleBlockToggle}
                                                            className="text-[11px] text-secound hover:underline font-semibold cursor-pointer"
                                                        >
                                                            {isCustomerBlocked ? 'Unblock' : 'Block'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Shipping Quick Card */}
                                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                    <MapPinHouse size={14} className="text-secound" />
                                                    Shipping Destination
                                                </h3>
                                                <button
                                                    onClick={copyAddress}
                                                    className="text-xs text-secound hover:underline font-medium flex items-center gap-1 cursor-pointer"
                                                    title="Copy Shipping Address"
                                                >
                                                    <Copy size={11} /> Copy
                                                </button>
                                            </div>

                                            <div className="text-xs text-gray-700 bg-slate-50 border border-slate-200 rounded p-2.5 space-y-1">
                                                <p className="font-semibold text-gray-900">
                                                    {shippingAddress.recipientName || customer.fullName || 'Recipient'}
                                                </p>
                                                <p className="text-gray-600 leading-snug">
                                                    {shippingAddress.address || customer.address || 'Address not specified'}
                                                </p>
                                                <p className="text-[11px] text-gray-500">
                                                    {[
                                                        shippingAddress.upazila,
                                                        shippingAddress.city,
                                                        shippingAddress.district,
                                                        shippingAddress.division,
                                                        shippingAddress.postalCode
                                                    ].filter(Boolean).join(', ') || 'Bangladesh'}
                                                </p>

                                                {!isAlreadyDispatched && onDispatch && (
                                                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between gap-2">
                                                        <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1">
                                                            <Truck size={12} className="text-secound" /> Dispatch:
                                                        </span>
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => onDispatch(activeOrder, 'STEADFAST')}
                                                                className="px-2 py-0.5 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                                                title="Dispatch to Steadfast"
                                                            >
                                                                <Truck size={11} /> Steadfast
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => onDispatch(activeOrder, 'PATHAO')}
                                                                className="px-2 py-0.5 text-[11px] font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                                                title="Dispatch to Pathao"
                                                            >
                                                                <Send size={11} /> Pathao
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Order Items Preview Card */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-xs space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <Package size={14} className="text-secound" />
                                                Ordered Products ({orderItems.length})
                                            </h3>
                                            <button
                                                onClick={() => setActiveTab('items')}
                                                className="text-xs text-secound hover:underline font-semibold cursor-pointer"
                                            >
                                                See Full Breakdown →
                                            </button>
                                        </div>

                                        <div className="divide-y divide-gray-100">
                                            {orderItems.slice(0, 4).map((item, idx) => {
                                                const imgUrl = getProductImage(item.product, item.productVariant);
                                                const pName = item.product?.productName || item.product?.name || 'Product';
                                                return (
                                                    <div key={item.id || idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div
                                                                onClick={() => {
                                                                    if (imgUrl) {
                                                                        setPreviewImage({
                                                                            url: imgUrl,
                                                                            title: pName,
                                                                            sku: item.product?.sku || item.sku,
                                                                            quantity: item.quantity,
                                                                            price: item.unitPrice
                                                                        });
                                                                    }
                                                                }}
                                                                className={`w-11 h-11 rounded border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden ${
                                                                    imgUrl ? 'cursor-pointer hover:border-secound hover:scale-105 transition-all' : ''
                                                                }`}
                                                            >
                                                                {imgUrl ? (
                                                                    <Image
                                                                        src={imgUrl}
                                                                        alt={pName}
                                                                        width={44}
                                                                        height={44}
                                                                        className="object-cover w-full h-full"
                                                                        unoptimized={typeof imgUrl === 'string' && imgUrl.startsWith('http://')}
                                                                    />
                                                                ) : (
                                                                    <Package size={18} className="text-gray-400" />
                                                                )}
                                                            </div>

                                                            <div className="min-w-0">
                                                                <p className="font-semibold text-gray-900 truncate" title={pName}>
                                                                    {pName}
                                                                </p>
                                                                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                                                                    <span>Qty: <strong className="text-gray-800">{item.quantity || 1}</strong></span>
                                                                    <span>•</span>
                                                                    <span>Price: {formatCurrency(item.unitPrice)}</span>
                                                                    {(item.product?.sku || item.sku) && (
                                                                        <>
                                                                            <span>•</span>
                                                                            <span className="font-mono text-[10px]">SKU: {item.product?.sku || item.sku}</span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="text-right font-bold text-gray-900 shrink-0">
                                                            {formatCurrency(item.lineTotal || (parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 1)))}
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {orderItems.length > 4 && (
                                                <div className="pt-2 text-center">
                                                    <button
                                                        onClick={() => setActiveTab('items')}
                                                        className="text-xs text-secound hover:underline font-semibold cursor-pointer"
                                                    >
                                                        +{orderItems.length - 4} more items. Click to view all →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Order Note if Present */}
                                    {activeOrder.note && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-xs text-amber-900 space-y-1">
                                            <p className="font-bold flex items-center gap-1.5 text-amber-800">
                                                <FileText size={13} /> Order Note / Special Instructions
                                            </p>
                                            <p className="whitespace-pre-wrap">{activeOrder.note}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ================= TAB 2: ITEMS & BILL ================= */}
                            {activeTab === 'items' && (
                                <div className="space-y-5">
                                    {/* Full Products Table */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-xs">
                                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                                Ordered Items ({orderItems.length})
                                            </h3>
                                            <span className="text-xs text-gray-500 font-medium">
                                                Total Units: {totalItemCount}
                                            </span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-xs">
                                                <thead className="bg-gray-50/80 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider text-[11px]">
                                                    <tr>
                                                        <th className="px-4 py-3">Product</th>
                                                        <th className="px-4 py-3 text-center">Qty</th>
                                                        <th className="px-4 py-3 text-right">Unit Price</th>
                                                        <th className="px-4 py-3 text-right">Discount</th>
                                                        <th className="px-4 py-3 text-right">Line Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {orderItems.map((item, idx) => {
                                                        const imgUrl = getProductImage(item.product, item.productVariant);
                                                        const pName = item.product?.productName || item.product?.name || 'Product';
                                                        const lineTot = item.lineTotal || (parseFloat(item.unitPrice || 0) * parseInt(item.quantity || 1));

                                                        return (
                                                            <tr key={item.id || idx} className="hover:bg-gray-50/80 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <div className="flex items-start gap-3">
                                                                        <div
                                                                            onClick={() => {
                                                                                if (imgUrl) {
                                                                                    setPreviewImage({
                                                                                        url: imgUrl,
                                                                                        title: pName,
                                                                                        sku: item.product?.sku || item.sku,
                                                                                        quantity: item.quantity,
                                                                                        price: item.unitPrice
                                                                                    });
                                                                                }
                                                                            }}
                                                                            className={`w-12 h-12 rounded border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden ${
                                                                                imgUrl ? 'cursor-pointer hover:border-secound hover:scale-105 transition-all shadow-2xs' : ''
                                                                            }`}
                                                                        >
                                                                            {imgUrl ? (
                                                                                <Image
                                                                                    src={imgUrl}
                                                                                    alt={pName}
                                                                                    width={48}
                                                                                    height={48}
                                                                                    className="object-cover w-full h-full"
                                                                                    unoptimized={typeof imgUrl === 'string' && imgUrl.startsWith('http://')}
                                                                                />
                                                                            ) : (
                                                                                <Package size={20} className="text-gray-400" />
                                                                            )}
                                                                        </div>

                                                                        <div className="min-w-0 space-y-1">
                                                                            <p className="font-semibold text-gray-900 leading-snug">
                                                                                {pName}
                                                                            </p>
                                                                            {(item.product?.sku || item.sku) && (
                                                                                <p className="text-[10px] text-gray-500 font-mono">
                                                                                    SKU: {item.product?.sku || item.sku}
                                                                                </p>
                                                                            )}
                                                                            {item.productVariant && (
                                                                                <div className="pt-0.5">
                                                                                    <VariantAttributes variant={item.productVariant} size="sm" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>

                                                                <td className="px-4 py-3 text-center font-bold text-gray-900 whitespace-nowrap">
                                                                    {item.quantity || 1}
                                                                </td>

                                                                <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                                                                    {formatCurrency(item.unitPrice)}
                                                                </td>

                                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                                    {parseFloat(item.discount || 0) > 0 ? (
                                                                        <span className="text-rose-600 font-medium">
                                                                            -{formatCurrency(item.discount)}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-gray-400">—</span>
                                                                    )}
                                                                </td>

                                                                <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                                                                    {formatCurrency(lineTot)}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Financial Summary Breakdown Card with Quick Downloads */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                                Payment & Billing Summary
                                            </h3>

                                            {/* Invoice Format Quick Buttons */}
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <button
                                                    onClick={() => handleDownloadInvoice('standard')}
                                                    disabled={downloadingFormat !== null}
                                                    className="px-2.5 py-1 bg-secound/10 hover:bg-secound/20 text-secound rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                                >
                                                    <FileText size={12} /> Invoice PDF
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadInvoice('pos')}
                                                    disabled={downloadingFormat !== null}
                                                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                                >
                                                    <Printer size={12} /> POS Receipt
                                                </button>
                                                <button
                                                    onClick={() => handleDownloadInvoice('label')}
                                                    disabled={downloadingFormat !== null}
                                                    className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                                >
                                                    <Tag size={12} /> Shipping Label
                                                </button>
                                            </div>
                                        </div>

                                        <div className="max-w-md ml-auto space-y-2.5 text-xs">
                                            <div className="flex justify-between text-gray-600">
                                                <span>Subtotal Items</span>
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(activeOrder.totalAmount || activeOrder.subTotal)}
                                                </span>
                                            </div>

                                            {parseFloat(activeOrder.discount || 0) > 0 && (
                                                <div className="flex justify-between text-rose-600">
                                                    <span>Order Discount</span>
                                                    <span className="font-semibold">
                                                        - {formatCurrency(activeOrder.discount)}
                                                    </span>
                                                </div>
                                            )}

                                            {parseFloat(activeOrder.voucher_promo || 0) > 0 && (
                                                <div className="flex justify-between text-rose-600">
                                                    <span>Voucher / Promo Code</span>
                                                    <span className="font-semibold">
                                                        - {formatCurrency(activeOrder.voucher_promo)}
                                                    </span>
                                                </div>
                                            )}

                                            {parseFloat(activeOrder.shippingCost || 0) > 0 && (
                                                <div className="flex justify-between text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Truck size={12} /> Shipping Charge
                                                    </span>
                                                    <span className="font-medium text-gray-900">
                                                        {formatCurrency(activeOrder.shippingCost)}
                                                    </span>
                                                </div>
                                            )}

                                            {parseFloat(activeOrder.tax || 0) > 0 && (
                                                <div className="flex justify-between text-gray-600">
                                                    <span>Tax / VAT</span>
                                                    <span className="font-medium text-gray-900">
                                                        {formatCurrency(activeOrder.tax)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-900">
                                                <span>Grand Total</span>
                                                <span className="text-base text-secound font-extrabold">
                                                    {formatCurrency(activeOrder.grandTotal)}
                                                </span>
                                            </div>

                                            <div className="pt-2 border-t border-dashed border-gray-200 grid grid-cols-2 gap-2 text-xs">
                                                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded border border-emerald-100 flex justify-between items-center">
                                                    <span>Paid:</span>
                                                    <span className="font-bold">{formatCurrency(activeOrder.paidAmount)}</span>
                                                </div>
                                                <div className="bg-rose-50 text-rose-800 p-2.5 rounded border border-rose-100 flex justify-between items-center">
                                                    <span>Due:</span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold">{formatCurrency(activeOrder.dueAmount)}</span>
                                                        {onPayment && parseFloat(activeOrder.dueAmount || 0) > 0 && (
                                                            <button
                                                                onClick={() => onPayment(activeOrder)}
                                                                className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold cursor-pointer"
                                                            >
                                                                Pay
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ================= TAB 3: CUSTOMER & DELIVERY ================= */}
                            {activeTab === 'customer' && (
                                <div className="space-y-5">
                                    {/* Customer Profile Information Card */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <User size={15} className="text-secound" />
                                                Customer Profile
                                            </h3>

                                            {/* Block/Unblock toggle */}
                                            {customerId && (
                                                <button
                                                    onClick={handleBlockToggle}
                                                    disabled={isTogglingBlock}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                                                        isCustomerBlocked
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                                                            : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                                                    }`}
                                                >
                                                    {isCustomerBlocked ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                                                    <span>{isCustomerBlocked ? 'Unblock Customer' : 'Block Customer'}</span>
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                                                <span className="text-gray-500 font-medium">Customer Full Name</span>
                                                <p className="text-sm font-bold text-gray-900">{customer.fullName || '—'}</p>
                                                {customer.customerCode && (
                                                    <p className="text-[11px] text-gray-500 font-mono">Code: {customer.customerCode}</p>
                                                )}
                                            </div>

                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                                                <span className="text-gray-500 font-medium">Contact Phone</span>
                                                <p className="text-sm font-bold text-gray-900 font-mono">
                                                    {customer.phone || '—'}
                                                </p>
                                                {customer.phone && (
                                                    <a
                                                        href={`tel:${customer.phone}`}
                                                        className="inline-flex items-center gap-1 text-[11px] text-secound font-semibold hover:underline"
                                                    >
                                                        <Phone size={11} /> Call Customer
                                                    </a>
                                                )}
                                            </div>

                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                                                <span className="text-gray-500 font-medium">Email Address</span>
                                                <p className="text-xs font-semibold text-gray-900 break-all">{customer.email || 'Not provided'}</p>
                                            </div>

                                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1">
                                                <span className="text-gray-500 font-medium">Account Status</span>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                        isCustomerBlocked ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                                    }`}>
                                                        {isCustomerBlocked ? 'Blocked' : 'Active'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Customer Order Stats if available */}
                                        {customerStats && (
                                            <div className="pt-2 border-t border-gray-100 space-y-2">
                                                <span className="text-xs font-bold text-gray-700">Customer Lifetime Orders</span>
                                                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
                                                    <div className="bg-slate-100 p-2 rounded">
                                                        <p className="font-bold text-gray-900">{customerStats.total}</p>
                                                        <p className="text-[10px] text-gray-500">Total</p>
                                                    </div>
                                                    <div className="bg-emerald-50 text-emerald-800 p-2 rounded">
                                                        <p className="font-bold">{customerStats.delivered}</p>
                                                        <p className="text-[10px]">Delivered</p>
                                                    </div>
                                                    <div className="bg-sky-50 text-sky-800 p-2 rounded">
                                                        <p className="font-bold">{customerStats.shipped}</p>
                                                        <p className="text-[10px]">Shipped</p>
                                                    </div>
                                                    <div className="bg-amber-50 text-amber-800 p-2 rounded">
                                                        <p className="font-bold">{customerStats.processing}</p>
                                                        <p className="text-[10px]">Processing</p>
                                                    </div>
                                                    <div className="bg-yellow-50 text-yellow-800 p-2 rounded">
                                                        <p className="font-bold">{customerStats.pending}</p>
                                                        <p className="text-[10px]">Pending</p>
                                                    </div>
                                                    <div className="bg-rose-50 text-rose-800 p-2 rounded">
                                                        <p className="font-bold">{customerStats.cancelled}</p>
                                                        <p className="text-[10px]">Cancelled</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Shipping Address Detailed Card */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <MapPinHouse size={15} className="text-secound" />
                                                Shipping & Delivery Address
                                            </h3>
                                            <button
                                                onClick={copyAddress}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                            >
                                                <Copy size={12} /> Copy Address
                                            </button>
                                        </div>

                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Recipient</span>
                                                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                                                        {shippingAddress.recipientName || customer.fullName || 'Not specified'}
                                                    </p>
                                                </div>
                                                {shippingAddress.phoneNumber && (
                                                    <div className="text-right">
                                                        <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Recipient Phone</span>
                                                        <p className="text-sm font-bold text-gray-900 font-mono mt-0.5">
                                                            {shippingAddress.phoneNumber}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-2 border-t border-slate-200">
                                                <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Street / Location</span>
                                                <p className="text-xs font-medium text-gray-900 mt-1 leading-relaxed">
                                                    {shippingAddress.address || customer.address || '—'}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200">
                                                <div>
                                                    <span className="text-gray-500 text-[11px]">Upazila:</span>
                                                    <p className="font-semibold text-gray-800">{shippingAddress.upazila || '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 text-[11px]">City / Area:</span>
                                                    <p className="font-semibold text-gray-800">{shippingAddress.city || '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 text-[11px]">District:</span>
                                                    <p className="font-semibold text-gray-800">{shippingAddress.district || '—'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500 text-[11px]">Postal Code:</span>
                                                    <p className="font-semibold text-gray-800 font-mono">{shippingAddress.postalCode || '—'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ================= TAB 4: PARCEL & TRACKING HISTORY ================= */}
                            {activeTab === 'tracking' && (
                                <div className="space-y-5">
                                    {/* Courier Tracking Information */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                <Truck size={15} className="text-secound" />
                                                Courier & Shipment Information
                                            </h3>
                                            {isAlreadyDispatched && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                    <CheckCircle size={13} className="text-emerald-600" />
                                                    Dispatched
                                                </span>
                                            )}
                                        </div>

                                        {shipment ? (
                                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <span className="text-gray-500">Courier Partner:</span>
                                                        <p className="text-sm font-bold text-gray-900 uppercase">
                                                            {shipment.courier || shipment.courierName || shipment.provider || 'Courier'}
                                                        </p>
                                                    </div>
                                                    {(shipment.courier === 'PATHAO' || shipment.courier === 'STEADFAST' || String(shipment.courierName || '').toUpperCase().includes('PATHAO') || String(shipment.courierName || '').toUpperCase().includes('STEADFAST')) && (
                                                        <button
                                                            onClick={() => {
                                                                const courierType = String(shipment.courier || shipment.courierName || '').toUpperCase();
                                                                if (courierType.includes('PATHAO')) {
                                                                    router.push(`/pathao?search=${activeOrder.orderNumber}`);
                                                                } else {
                                                                    router.push(`/steadfast?search=${activeOrder.orderNumber}`);
                                                                }
                                                            }}
                                                            className="text-xs text-secound hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                                                        >
                                                            Manage in {String(shipment.courier || shipment.courierName || '').toUpperCase().includes('PATHAO') ? 'Pathao' : 'Steadfast'} →
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-gray-500">Tracking / Consignment ID:</span>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <p className="text-sm font-bold text-secound font-mono">
                                                                {shipment.consignmentId || shipment.trackingCode || shipment.trackingNumber || '—'}
                                                            </p>
                                                            {(shipment.consignmentId || shipment.trackingCode || shipment.trackingNumber) && (
                                                                <button
                                                                    onClick={() => {
                                                                        navigator.clipboard.writeText(shipment.consignmentId || shipment.trackingCode || shipment.trackingNumber);
                                                                        toast.success('Tracking ID copied!');
                                                                    }}
                                                                    className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded cursor-pointer"
                                                                    title="Copy Tracking ID"
                                                                >
                                                                    <Copy size={11} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Shipment Status:</span>
                                                        <p className="font-semibold text-gray-900">{shipment.status || 'Dispatched'}</p>
                                                    </div>
                                                </div>

                                                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-4">
                                                    <div>
                                                        <span className="text-gray-500">Shipped Date:</span>
                                                        <p className="font-semibold text-gray-900">{formatDate(shipment.createdAt || shipment.shippedDate)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : isAlreadyDispatched ? (
                                            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2 text-xs">
                                                <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                                                    <Truck size={16} />
                                                    <span>Order Already Dispatched ({activeOrder.status})</span>
                                                </div>
                                                <p className="text-gray-600">
                                                    This order has already been marked as <strong className="text-gray-800">{activeOrder.status}</strong>.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-gray-300 space-y-3">
                                                <Truck className="w-10 h-10 text-gray-300 mx-auto" />
                                                <div>
                                                    <p className="text-xs font-bold text-gray-800">No Courier Dispatch Record Yet</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Select a courier partner below to book and dispatch this order:</p>
                                                </div>
                                                {onDispatch && (
                                                    <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => onDispatch(activeOrder, 'STEADFAST')}
                                                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-2xs hover:shadow cursor-pointer"
                                                        >
                                                            <Truck size={14} /> Dispatch to Steadfast
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => onDispatch(activeOrder, 'PATHAO')}
                                                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-2 transition-all shadow-2xs hover:shadow cursor-pointer"
                                                        >
                                                            <Send size={14} /> Dispatch to Pathao
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Parcel Delivery Lifecycle Visual Stepper */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-xs space-y-4">
                                        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                            <Clock size={15} className="text-secound" />
                                            Parcel Delivery Lifecycle & History
                                        </h3>

                                        {/* Stepper Timeline */}
                                        <div className="relative pl-6 border-l-2 border-slate-200 ml-3 space-y-6 py-2 text-xs">
                                            {/* Stage 5: Delivered */}
                                            <div className="relative">
                                                <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white ${
                                                    activeOrder.status === 'Delivered'
                                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {activeOrder.status === 'Delivered' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />}
                                                </span>
                                                <div className={activeOrder.status === 'Delivered' ? 'text-slate-900 font-semibold' : 'text-gray-400'}>
                                                    <p className="text-xs font-bold">5. Parcel Delivered</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Package successfully received by customer.</p>
                                                    {activeOrder.status === 'Delivered' && (
                                                        <p className="text-[10px] text-emerald-700 font-mono mt-0.5">{formatDate(activeOrder.updatedAt)}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stage 4: Shipped / In Transit */}
                                            <div className="relative">
                                                <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white ${
                                                    ['Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched
                                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {(['Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched) && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                    )}
                                                </span>
                                                <div className={(['Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched) ? 'text-slate-900 font-semibold' : 'text-gray-400'}>
                                                    <p className="text-xs font-bold">4. Dispatched / In Transit</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {shipment ? `Handed over to ${shipment.courier || shipment.courierName || 'Courier'}` : 'Handed over to courier service.'}
                                                    </p>
                                                    {(['Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched) && (
                                                        <p className="text-[10px] text-sky-700 font-mono mt-0.5">
                                                            {shipment?.createdAt ? formatDate(shipment.createdAt) : formatDate(activeOrder.updatedAt)}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Stage 3: Processing & Packed */}
                                            <div className="relative">
                                                <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white ${
                                                    ['Processing', 'Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched
                                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-600'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {(['Processing', 'Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched) && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                    )}
                                                </span>
                                                <div className={(['Processing', 'Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched) ? 'text-slate-900 font-semibold' : 'text-gray-400'}>
                                                    <p className="text-xs font-bold">3. Processing & Packed</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Order items picked, checked and packaged.</p>
                                                </div>
                                            </div>

                                            {/* Stage 2: Confirmed */}
                                            <div className="relative">
                                                <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 bg-white ${
                                                    ['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched
                                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-600'
                                                        : 'border-gray-300'
                                                }`}>
                                                    {(['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched) && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                    )}
                                                </span>
                                                <div className={(['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(activeOrder.status) || isAlreadyDispatched) ? 'text-slate-900 font-semibold' : 'text-gray-400'}>
                                                    <p className="text-xs font-bold">2. Order Confirmed</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Order verified and confirmed.</p>
                                                </div>
                                            </div>

                                            {/* Stage 1: Placed */}
                                            <div className="relative">
                                                <span className="absolute -left-[31px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-emerald-600 bg-emerald-50 text-emerald-600">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                                                </span>
                                                <div className="text-slate-900 font-semibold">
                                                    <p className="text-xs font-bold">1. Order Placed</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">Order created in system.</p>
                                                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{formatDate(activeOrder.orderDate || activeOrder.createdAt)}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {activeOrder.status === 'Cancelled' && (
                                            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
                                                <XCircle size={15} />
                                                <span>This order was cancelled on {formatDate(activeOrder.updatedAt)}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-3.5 bg-white border-t border-gray-200 flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                                <span>Order ID: #{activeOrder.id}</span>
                                {isCustomerBlocked && (
                                    <span className="text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded">Blocked Customer</span>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Print A4 */}
                                <button
                                    onClick={() => handleProcessInvoice('standard', 'print')}
                                    disabled={downloadingFormat !== null}
                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Direct Print Standard Invoice (A4)"
                                >
                                    <Printer size={13} />
                                    <span>Print A4</span>
                                </button>

                                {/* Print Label */}
                                <button
                                    onClick={() => handleProcessInvoice('label', 'print')}
                                    disabled={downloadingFormat !== null}
                                    className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold rounded transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                    title="Direct Print Shipping Label"
                                >
                                    <Tag size={13} />
                                    <span>Print Label</span>
                                </button>

                                {/* Download Standard Invoice */}
                                <button
                                    onClick={() => handleProcessInvoice('standard', 'download')}
                                    disabled={downloadingFormat !== null}
                                    className="px-3 py-1.5 bg-secound hover:bg-secound-hover text-white text-xs font-semibold rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                                >
                                    <Download size={13} />
                                    <span>Download PDF</span>
                                </button>

                                <button
                                    onClick={onClose}
                                    className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition-colors cursor-pointer"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Lightbox image preview modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md sm:max-w-lg w-full border border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/90 border-b border-gray-100">
                            <div className="flex-1 min-w-0 pr-3">
                                <h3 className="font-bold text-gray-900 text-sm truncate">
                                    {previewImage.title || 'Product Image'}
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
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="relative w-full h-80 sm:h-96 bg-gray-100/40 flex items-center justify-center p-4">
                            <Image
                                src={previewImage.url}
                                alt={previewImage.title || 'Product Image'}
                                fill
                                sizes="(max-width: 640px) 100vw, 512px"
                                className="object-contain p-2"
                                unoptimized={typeof previewImage.url === 'string' && previewImage.url.startsWith('http://')}
                            />
                        </div>

                        {(previewImage.quantity || previewImage.price) && (
                            <div className="px-5 py-3 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between text-xs text-gray-700">
                                {previewImage.quantity && (
                                    <span>Qty: <strong className="text-gray-900">{previewImage.quantity}</strong></span>
                                )}
                                {previewImage.price && (
                                    <span className="font-semibold text-secound">
                                        Unit Price: ৳{parseFloat(previewImage.price).toLocaleString()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
