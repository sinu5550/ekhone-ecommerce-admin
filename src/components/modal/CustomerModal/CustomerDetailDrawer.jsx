'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    ShoppingBag,
    DollarSign,
    Edit2,
    Clock,
    Home,
    Briefcase,
    Loader2,
    AlertCircle,
    CreditCard,
    Award
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

export default function CustomerDetailDrawer({
    isOpen,
    onClose,
    customer,
    initialOrders = [],
    totalSpent = 0,
    segment = 'Retail',
    onToggleStatus,
    onEdit,
    isTogglingStatus
}) {
    const [activeTab, setActiveTab] = useState('overview');
    const [detailedData, setDetailedData] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [error, setError] = useState(null);

    // Escape key listener & prevent body scroll
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
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
    }, [isOpen, onClose]);

    // Fetch full customer details (orders & addresses)
    useEffect(() => {
        if (!isOpen || !customer?.id) {
            setDetailedData(null);
            setError(null);
            setActiveTab('overview');
            return;
        }

        let isMounted = true;

        const fetchDetails = async () => {
            setIsLoadingDetails(true);
            setError(null);
            try {
                const response = await apiClient(`/api/customer/${customer.id}`);
                if (isMounted) {
                    if (response?.success && response.data) {
                        setDetailedData(response.data);
                    } else {
                        setDetailedData(customer);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    console.error('Error fetching customer drawer details:', err);
                    setError(err.message || 'Failed to fetch customer details');
                    setDetailedData(customer);
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
    }, [isOpen, customer]);

    const activeCustomer = detailedData || customer;
    if (!activeCustomer) return null;

    const addresses = activeCustomer.customerAddresses || activeCustomer.addresses || [];
    const orders = (activeCustomer.onlineOrders && activeCustomer.onlineOrders.length > 0)
        ? activeCustomer.onlineOrders
        : (initialOrders && initialOrders.length > 0 ? initialOrders : []);
    const loyaltyPoints = activeCustomer.loyaltyPoints?.points || 0;

    const orderCount = activeCustomer._count?.onlineOrders ?? orders.length;
    const addressCount = addresses.length;

    const defaultAddress = addresses.find((addr) => addr.isDefault) || addresses[0];

    const formatDate = (dateString) => {
        if (!dateString) return 'Not available';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatPhone = (phone) => {
        if (!phone) return 'Not provided';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11 && cleaned.startsWith('01')) {
            return `+880 ${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
        }
        return phone;
    };

    const getSegmentBadge = (seg) => {
        switch (seg?.toLowerCase()) {
            case 'vip':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
                        ★ VIP
                    </span>
                );
            case 'new customer':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        New Customer
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        Retail
                    </span>
                );
        }
    };

    const getOrderStatusBadge = (status) => {
        const s = String(status || '').toLowerCase().replace(/[\s\-_]/g, '');
        switch (s) {
            case 'pending':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-yellow-100 text-yellow-800 border border-yellow-200">Pending</span>;
            case 'confirmed':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-sky-100 text-sky-800 border border-sky-200">Confirmed</span>;
            case 'readytoship':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-teal-100 text-teal-800 border border-teal-200">Ready To Ship</span>;
            case 'incourier':
            case 'shipped':
            case 'shipping':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-indigo-100 text-indigo-800 border border-indigo-200">In-Courier</span>;
            case 'shiplater':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 border border-blue-200">Ship Later</span>;
            case 'hold':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-amber-100 text-amber-800 border border-amber-200">Hold</span>;
            case 'returned':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-rose-100 text-rose-800 border border-rose-200">Returned</span>;
            case 'preorder':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-800 border border-purple-200">Pre-order</span>;
            case 'delivered':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-100 text-emerald-800 border border-emerald-200">Delivered</span>;
            case 'cancelled':
            case 'cancel':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-red-100 text-red-800 border border-red-200">Cancelled</span>;
            case 'missing':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-pink-100 text-pink-800 border border-pink-200">Missing</span>;
            case 'lost':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">Lost</span>;
            case 'fake':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-stone-200 text-stone-800 border border-stone-300">Fake</span>;
            case 'trash':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-200 text-gray-700 border border-gray-300">Trash</span>;
            case 'processing':
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 border border-purple-200">Processing</span>;
            default:
                return <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-700 border border-gray-200">{status || 'Pending'}</span>;
        }
    };

    const getAddressIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'home':
                return Home;
            case 'office':
                return Briefcase;
            default:
                return MapPin;
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'orders', label: 'Orders', icon: ShoppingBag, count: orderCount },
        { id: 'addresses', label: 'Addresses', icon: MapPin, count: addressCount }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* True Half-Page Drawer Panel */}
                    <motion.div
                        className="fixed inset-y-0 right-0 w-full md:w-[50vw] lg:w-[50vw] xl:w-[50vw] bg-white shadow-2xl flex flex-col h-full border-l border-gray-200 z-50"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                    >
                        {/* Drawer Header */}
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/80 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3.5 min-w-0">
                                {/* Circle Avatar with Primary Background */}
                                <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl shadow-xs shrink-0">
                                    {activeCustomer.fullName?.[0]?.toUpperCase() || 'C'}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h2 className="text-lg font-bold text-gray-900 truncate">
                                            {activeCustomer.fullName || 'Customer Details'}
                                        </h2>
                                        {getSegmentBadge(segment)}
                                    </div>
                                    <div className="flex items-center gap-2.5 text-xs text-gray-500 mt-0.5 flex-wrap">
                                        <span className="font-mono bg-gray-200/80 px-2 py-0.5 rounded text-gray-700 font-medium">
                                            {activeCustomer.customerCode || `#${activeCustomer.id}`}
                                        </span>
                                        <span>•</span>
                                        <span>Joined {new Date(activeCustomer.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {/* Edit Button */}
                                {onEdit && (
                                    <button
                                        onClick={() => onEdit(activeCustomer)}
                                        className="px-3 py-1.5 text-gray-600 hover:text-teal-700 hover:bg-teal-50 rounded transition-colors inline-flex items-center gap-1.5 text-xs font-medium border border-gray-200 hover:border-teal-200 cursor-pointer"
                                        title="Edit Customer"
                                    >
                                        <Edit2 size={14} />
                                        <span>Edit</span>
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

                        {/* 4 Clean Metric Stat Cards (Total Spent, Orders, Addresses, Status) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 bg-white border-b border-gray-100">
                            <div className="bg-emerald-50/60 border border-emerald-100 rounded p-3 flex flex-col justify-between">
                                <span className="text-xs font-medium text-emerald-800 block truncate">Total Spent</span>
                                <p className="text-base font-bold text-gray-900 mt-1 truncate">
                                    ৳{Number(totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                            </div>

                            <div className="bg-blue-50/60 border border-blue-100 rounded p-3 flex flex-col justify-between">
                                <span className="text-xs font-medium text-blue-800 block truncate">Total Orders</span>
                                <p className="text-base font-bold text-gray-900 mt-1">{orderCount}</p>
                            </div>

                            <div className="bg-amber-50/60 border border-amber-100 rounded p-3 flex flex-col justify-between">
                                <span className="text-xs font-medium text-amber-800 block truncate">Saved Addresses</span>
                                <p className="text-base font-bold text-gray-900 mt-1">{addressCount}</p>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-col justify-between">
                                <span className="text-xs font-medium text-slate-700 block truncate">Account Status</span>
                                <div className="flex items-center gap-2 mt-1">
                                    <span
                                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            activeCustomer.status
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-rose-100 text-rose-600'
                                        }`}
                                    >
                                        {activeCustomer.status ? 'Active' : 'Inactive'}
                                    </span>
                                    {onToggleStatus && (
                                        <button
                                            onClick={() => onToggleStatus(activeCustomer.id)}
                                            disabled={isTogglingStatus === activeCustomer.id}
                                            className="text-[11px] text-gray-500 hover:text-primary underline cursor-pointer"
                                            title="Toggle status"
                                        >
                                            {isTogglingStatus === activeCustomer.id ? '...' : 'Toggle'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tabs Navigation (Overview, Orders, Addresses) */}
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
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                                        }`}
                                    >
                                        <Icon size={14} />
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span
                                                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                                    isActive ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'
                                                }`}
                                            >
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Drawer Scrollable Body */}
                        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/60 space-y-5">
                            {isLoadingDetails && (
                                <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 border border-primary/20 px-3 py-2 rounded">
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Syncing order and address records...</span>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded">
                                    <AlertCircle size={14} />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* OVERVIEW TAB */}
                            {activeTab === 'overview' && (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Contact Information Card */}
                                        <div className="bg-white rounded border border-gray-200 p-4 shadow-xs">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <User size={14} className="text-primary" />
                                                Contact Information
                                            </h3>
                                            <div className="divide-y divide-gray-100 text-xs">
                                                <div className="py-2.5 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                                                        <Mail size={13} className="text-gray-400" /> Email
                                                    </span>
                                                    <span className="font-semibold text-gray-900 break-all text-right">
                                                        {activeCustomer.email || 'Not provided'}
                                                    </span>
                                                </div>
                                                <div className="py-2.5 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                                                        <Phone size={13} className="text-gray-400" /> Phone
                                                    </span>
                                                    <span className="font-semibold text-gray-900 text-right">
                                                        {formatPhone(activeCustomer.phone)}
                                                    </span>
                                                </div>
                                                <div className="py-2.5 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                                                        <CreditCard size={13} className="text-gray-400" /> Customer Code
                                                    </span>
                                                    <span className="font-semibold text-gray-900 font-mono text-right">
                                                        {activeCustomer.customerCode || 'N/A'}
                                                    </span>
                                                </div>
                                                {loyaltyPoints > 0 && (
                                                    <div className="py-2.5 flex items-center justify-between gap-2">
                                                        <span className="text-gray-500 flex items-center gap-1.5 shrink-0">
                                                            <Award size={13} className="text-amber-500" /> Loyalty Points
                                                        </span>
                                                        <span className="font-semibold text-amber-700 font-mono text-right">
                                                            {loyaltyPoints} pts
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Account Information Card */}
                                        <div className="bg-white rounded border border-gray-200 p-4 shadow-xs">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <Calendar size={14} className="text-primary" />
                                                Account Information
                                            </h3>
                                            <div className="divide-y divide-gray-100 text-xs">
                                                <div className="py-2.5 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500">Account Status</span>
                                                    <span
                                                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                                            activeCustomer.status
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {activeCustomer.status ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <div className="py-2.5 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500">Member Since</span>
                                                    <span className="font-semibold text-gray-900 text-right">
                                                        {formatDate(activeCustomer.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="py-2.5 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500">Last Updated</span>
                                                    <span className="font-semibold text-gray-900 text-right">
                                                        {formatDate(activeCustomer.updatedAt)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Primary Shipping Address */}
                                        <div className="bg-white rounded border border-gray-200 p-4 shadow-xs">
                                            <div className="flex items-center justify-between mb-3">
                                                <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                                                    <MapPin size={14} className="text-primary" />
                                                    Primary Address
                                                </h3>
                                                {addresses.length > 0 && (
                                                    <button
                                                        onClick={() => setActiveTab('addresses')}
                                                        className="text-xs font-medium text-primary hover:underline cursor-pointer"
                                                    >
                                                        View all ({addresses.length})
                                                    </button>
                                                )}
                                            </div>

                                            {defaultAddress ? (
                                                <div className="p-3 rounded bg-slate-50 border border-gray-200 space-y-1.5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                                            {defaultAddress.type || 'Home'}
                                                        </span>
                                                        {defaultAddress.isDefault && (
                                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-medium text-gray-900 leading-snug">
                                                        {defaultAddress.address}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {[
                                                            defaultAddress.upazila,
                                                            defaultAddress.district,
                                                            defaultAddress.division,
                                                            defaultAddress.postalCode
                                                        ]
                                                            .filter(Boolean)
                                                            .join(', ') || 'Bangladesh'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center py-6 text-gray-400 text-xs">
                                                    No address registered yet.
                                                </div>
                                            )}
                                        </div>

                                        {/* Recent Activity */}
                                        <div className="bg-white rounded border border-gray-200 p-4 shadow-xs">
                                            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                                <Clock size={14} className="text-primary" />
                                                Recent Activity
                                            </h3>
                                            <div className="divide-y divide-gray-100 text-xs">
                                                <div className="py-2.5 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500">Last order placed</span>
                                                    <span className="font-semibold text-gray-900 text-right">
                                                        {orders[0]?.createdAt ? formatDate(orders[0].createdAt) : 'No orders yet'}
                                                    </span>
                                                </div>
                                                {orders[0] && (
                                                    <div className="py-2.5 flex items-center justify-between gap-2">
                                                        <span className="text-gray-500">Last order amount</span>
                                                        <span className="font-semibold text-gray-900 text-right">
                                                            ৳{Number(orders[0].grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="py-2.5 flex items-center justify-between gap-2">
                                                    <span className="text-gray-500">Customer segment</span>
                                                    <span className="font-semibold text-gray-900 text-right">
                                                        {segment}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ORDERS TAB */}
                            {activeTab === 'orders' && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Order History ({orders.length})
                                    </h3>

                                    {orders.length > 0 ? (
                                        <div className="bg-white rounded border border-gray-200 overflow-hidden shadow-xs">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200 uppercase tracking-wider">
                                                        <tr>
                                                            <th className="px-4 py-3">Order #</th>
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3">Status</th>
                                                            <th className="px-4 py-3 text-right">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {orders.map((order) => (
                                                            <tr key={order.id} className="hover:bg-gray-50/80 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <span className="font-semibold text-gray-900 block">
                                                                        #{order.orderNumber}
                                                                    </span>
                                                                    {order.orderItems && order.orderItems.length > 0 && (
                                                                        <span className="text-[10px] text-gray-400">
                                                                            {order.orderItems.length} item(s)
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                                                                    {formatDate(order.createdAt)}
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    {getOrderStatusBadge(order.status)}
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-bold text-gray-900 whitespace-nowrap">
                                                                    ৳{Number(order.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded border border-gray-200 p-12 text-center">
                                            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <h4 className="text-xs font-semibold text-gray-800">No Orders Found</h4>
                                            <p className="text-[11px] text-gray-500 mt-1">This customer has not placed any orders yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ADDRESSES TAB */}
                            {activeTab === 'addresses' && (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                                        Saved Shipping Addresses ({addresses.length})
                                    </h3>

                                    {addresses.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            {addresses.map((address, idx) => {
                                                const AddressIcon = getAddressIcon(address.type);
                                                return (
                                                    <div
                                                        key={address.id || idx}
                                                        className="bg-white p-4 rounded border border-gray-200 hover:border-primary/40 transition-colors shadow-xs space-y-2.5"
                                                    >
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1.5 bg-primary/10 rounded text-primary">
                                                                    <AddressIcon size={14} />
                                                                </div>
                                                                <div>
                                                                    <h4 className="text-xs font-semibold text-gray-900">
                                                                        {address.type || 'Address'}
                                                                    </h4>
                                                                    {address.isDefault && (
                                                                        <span className="text-[9px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                                                                            Default
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                                            {address.address}
                                                        </p>

                                                        <div className="grid grid-cols-2 gap-1.5 text-[10px] pt-2 border-t border-gray-100 text-gray-500">
                                                            <div>
                                                                <span className="text-gray-400">Upazila: </span>
                                                                <span className="font-medium text-gray-700">{address.upazila || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400">District: </span>
                                                                <span className="font-medium text-gray-700">{address.district || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400">Division: </span>
                                                                <span className="font-medium text-gray-700">{address.division || 'N/A'}</span>
                                                            </div>
                                                            <div>
                                                                <span className="text-gray-400">Postal: </span>
                                                                <span className="font-medium text-gray-700">{address.postalCode || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-white rounded border border-gray-200 p-12 text-center">
                                            <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <h4 className="text-xs font-semibold text-gray-800">No Addresses Added</h4>
                                            <p className="text-[11px] text-gray-500 mt-1">This customer does not have any saved addresses yet.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Drawer Footer */}
                        <div className="px-6 py-3.5 bg-white border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-400 font-mono">
                                Customer ID: {activeCustomer.id}
                            </span>
                            <button
                                onClick={onClose}
                                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
