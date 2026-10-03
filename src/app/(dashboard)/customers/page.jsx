"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { Search, Trash2, Plus, Loader2, Eye, MapPin, Download, Users, ShieldCheck, DollarSign, TrendingUp, Edit2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useCustomers, useOrders } from "@/lib/dataFetch";
import { useModal } from "@/hooks/useModal";
import Pagination from "@/components/shared/pagination";
import { apiClient } from "@/lib/apiClient";
import CustomerAddModal from "@/components/modal/CustomerModal/CustomerAddModal";
import CustomerDetailDrawer from "@/components/modal/CustomerModal/CustomerDetailDrawer";
import Link from "next/link";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import * as XLSX from 'xlsx';
import { usePermission } from "@/context/PermissionProvider";

const RECORDS_PER_PAGE = 20;

const Customers = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [segmentFilter, setSegmentFilter] = useState("all");
    const [signupPeriod, setSignupPeriod] = useState("all");
    const [signupStartDate, setSignupStartDate] = useState("");
    const [signupEndDate, setSignupEndDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [isTogglingStatus, setIsTogglingStatus] = useState(null);
    const [isDeleting, setIsDeleting] = useState(null);
    const [isExporting, setIsExporting] = useState(false);
    const [drawerCustomer, setDrawerCustomer] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { hasPermission } = usePermission();
    const addModal = useModal();

    const handleOpenDrawer = (customer) => {
        setDrawerCustomer(customer);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
    };

    // Use the updated hook with pagination parameters
    const {
        data: customerData = [],
        pagination,
        isLoading,
        mutate
    } = useCustomers(
        currentPage,
        RECORDS_PER_PAGE,
        searchTerm,
        statusFilter
    );

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, segmentFilter, signupPeriod, signupStartDate, signupEndDate]);

    // Global fetch for calculations
    const { data: allCustomers = [] } = useCustomers(1, 10000);
    const { data: allOrders = [] } = useOrders(1, 10000);

    const customerOrdersMap = useMemo(() => {
        const map = {};
        allOrders.forEach(order => {
            const customerId = order.customer?.id || order.customer?._id || order.customerId;
            if (!customerId) return;
            if (order.status === "Cancelled" || order.status === "Cancel") return;
            const amt = parseFloat(order.grandTotal || 0);
            map[customerId] = (map[customerId] || 0) + amt;
        });
        return map;
    }, [allOrders]);

    const getCustomerSegment = useCallback((customer) => {
        const orderCount = customer._count?.onlineOrders || 0;
        const totalSpent = customerOrdersMap[customer.id] || customerOrdersMap[customer._id] || 0;

        if (totalSpent >= 5000 || orderCount >= 3) {
            return "VIP";
        }
        if (totalSpent > 0 && orderCount > 0) {
            return "Retail";
        }
        if (orderCount === 0) {
            return "New Customer";
        }
        return "Retail";
    }, [customerOrdersMap]);

    const isWithinPeriod = useCallback((createdAtDateStr) => {
        if (!createdAtDateStr) return false;
        const date = new Date(createdAtDateStr);
        const now = new Date();

        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(yesterdayStart.getDate() - 1);

        const weekAgo = new Date(todayStart);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const monthAgo = new Date(todayStart);
        monthAgo.setMonth(monthAgo.getMonth() - 1);

        if (signupPeriod === "today") {
            return date >= todayStart;
        }
        if (signupPeriod === "yesterday") {
            return date >= yesterdayStart && date < todayStart;
        }
        if (signupPeriod === "weekly") {
            return date >= weekAgo;
        }
        if (signupPeriod === "monthly") {
            return date >= monthAgo;
        }
        if (signupPeriod === "custom") {
            const start = signupStartDate ? new Date(signupStartDate) : null;
            const end = signupEndDate ? new Date(signupEndDate) : null;
            if (start && end) {
                const endInclusive = new Date(end);
                endInclusive.setDate(endInclusive.getDate() + 1);
                return date >= start && date < endInclusive;
            }
            if (start) return date >= start;
            if (end) {
                const endInclusive = new Date(end);
                endInclusive.setDate(endInclusive.getDate() + 1);
                return date < endInclusive;
            }
        }
        return true;
    }, [signupPeriod, signupStartDate, signupEndDate]);

    const filteredCustomerData = useMemo(() => {
        return customerData.filter(customer => {
            const matchesSegment = segmentFilter === "all" || getCustomerSegment(customer) === segmentFilter;
            const matchesPeriod = signupPeriod === "all" || isWithinPeriod(customer.createdAt);
            return matchesSegment && matchesPeriod;
        });
    }, [customerData, segmentFilter, signupPeriod, isWithinPeriod, getCustomerSegment]);

    const recentSignups = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        return allCustomers.filter(c => {
            if (!c.createdAt) return false;
            const date = new Date(c.createdAt);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).length;
    }, [allCustomers]);

    const activeCount = allCustomers.filter(c => c.status).length;
    const suspendedCount = allCustomers.length - activeCount;

    const ltvStats = useMemo(() => {
        let totalRevenue = 0;
        allOrders.forEach(o => {
            if (o.status !== "Cancelled" && o.status !== "Cancel") {
                totalRevenue += parseFloat(o.grandTotal || 0);
            }
        });
        const avgSpend = allCustomers.length > 0 ? (totalRevenue / allCustomers.length) : 0;
        return { totalRevenue, avgSpend };
    }, [allOrders, allCustomers]);

    const repeatCustomerRate = useMemo(() => {
        let repeatCustomers = 0;
        allCustomers.forEach(c => {
            const orderCount = c._count?.onlineOrders || 0;
            if (orderCount > 1) {
                repeatCustomers++;
            }
        });
        return allCustomers.length > 0 ? ((repeatCustomers / allCustomers.length) * 100).toFixed(0) : 0;
    }, [allCustomers]);

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    /** Toggle status */
    const handleToggleStatus = async (id) => {
        const customerToUpdate = customerData.find((item) => item.id === id) || (drawerCustomer?.id === id ? drawerCustomer : null);
        if (!customerToUpdate) return;

        setIsTogglingStatus(id);

        try {
            const newStatus = !customerToUpdate.status;

            const response = await apiClient(`/api/customer/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!response.success) {
                throw new Error(response.message || "Failed to update status");
            }

            if (drawerCustomer?.id === id) {
                setDrawerCustomer(prev => prev ? { ...prev, status: newStatus } : null);
            }

            await mutate();
            toast.success(response.message || "Customer status updated successfully");
        } catch (err) {
            console.error("Status update failed:", err);
            toast.error(err.message || "Failed to update customer status");
        } finally {
            setIsTogglingStatus(null);
        }
    };

    const handleDelete = async (id) => {
        const customerToDelete = customerData.find((item) => item.id === id);
        if (!customerToDelete) return;

        const result = await Swal.fire({
            title: "Delete Customer?",
            html: `
                <div class="text-left">
                    <p class="mb-2">Are you sure you want to delete this customer?</p>
                    <div class="bg-red-50 border border-red-200 rounded p-3 mt-3">
                        <p class="text-sm font-medium text-red-800 mb-1">Customer Information:</p>
                        <p class="text-sm text-gray-700">${customerToDelete.fullName} (${customerToDelete.customerCode})</p>
                        <p class="text-sm text-gray-700">Phone: ${customerToDelete.phone}</p>
                    </div>
                    <p class="text-sm text-red-600 mt-3 font-medium">This action cannot be undone!</p>
                </div>
            `,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!",
            cancelButtonText: "Cancel",
            reverseButtons: true,
            customClass: {
                confirmButton: 'px-4 py-2 text-sm font-medium',
                cancelButton: 'px-4 py-2 text-sm font-medium'
            }
        });

        if (result.isConfirmed) {
            setIsDeleting(id);
            try {
                const response = await apiClient(`/api/customer/${id}`, {
                    method: "DELETE"
                });

                if (!response.success) {
                    throw new Error(response.message || "Failed to delete customer");
                }

                await mutate();
                toast.success(response.message || "Customer deleted successfully");
            } catch (err) {
                console.error("Delete failed:", err);

                if (err.message.includes("Cannot delete customer with existing transactions")) {
                    Swal.fire({
                        title: "Cannot Delete Customer",
                        html: `
                            <div class="text-left">
                                <p class="mb-3">${err.message}</p>
                                <div class="bg-amber-50 border border-amber-200 rounded p-3">
                                    <p class="text-sm font-medium text-amber-800">Suggestion:</p>
                                    <p class="text-sm text-gray-700 mt-1">
                                        Instead of deleting, you can deactivate the customer account by toggling the status switch.
                                    </p>
                                </div>
                            </div>
                        `,
                        icon: "error",
                        confirmButtonColor: "#d97706",
                        confirmButtonText: "Deactivate Instead"
                    }).then((result) => {
                        if (result.isConfirmed && customerToDelete.status) {
                            handleToggleStatus(id);
                        }
                    });
                } else {
                    toast.error(err.message || "Delete failed. Please try again.");
                }
            } finally {
                setIsDeleting(null);
            }
        }
    };

    const handleAddSuccess = () => {
        mutate();
        addModal.close();
        toast.success("Customer added successfully!");
    };

    const handleEditCustomer = async (customer) => {
        const { value: formValues } = await Swal.fire({
            title: 'Edit Customer Information',
            html: `
                <div class="space-y-4 text-left p-2">
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
                        <input id="swal-name" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" value="${customer.fullName || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                        <input id="swal-phone" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" value="${customer.phone || ''}">
                    </div>
                    <div>
                        <label class="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                        <input id="swal-email" class="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary" value="${customer.email || ''}">
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Save Changes',
            confirmButtonColor: '#0f766e',
            cancelButtonColor: '#6b7280',
            preConfirm: () => {
                return {
                    fullName: document.getElementById('swal-name').value.trim(),
                    phone: document.getElementById('swal-phone').value.trim(),
                    email: document.getElementById('swal-email').value.trim(),
                };
            }
        });

        if (formValues) {
            try {
                const response = await apiClient(`/api/customer/${customer.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formValues),
                });

                if (!response.success) {
                    throw new Error(response.message || "Failed to update customer");
                }

                await mutate();
                if (drawerCustomer?.id === customer.id) {
                    setDrawerCustomer(prev => prev ? { ...prev, ...formValues } : null);
                }
                toast.success("Customer updated successfully!");
            } catch (err) {
                console.error("Edit failed:", err);
                toast.error(err.message || "Failed to update customer");
            }
        }
    };

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setSegmentFilter("all");
        setSignupPeriod("all");
        setSignupStartDate("");
        setSignupEndDate("");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm || statusFilter !== "all" || segmentFilter !== "all" || signupPeriod !== "all" || signupStartDate || signupEndDate;

    // Get primary address
    const getPrimaryAddress = (customer) => {
        if (!customer.customerAddresses || customer.customerAddresses.length === 0) {
            return "No address";
        }

        const defaultAddress = customer.customerAddresses.find(addr => addr.isDefault);
        const address = defaultAddress || customer.customerAddresses[0];

        return `${address.district}, ${address.division}`;
    };

    // Get full address details for a single address
    const getFullAddress = (address) => {
        if (!address) return "N/A";
        if (typeof address === 'string') return address;
        const parts = [];
        if (address.recipientName) parts.push(`Name: ${address.recipientName}`);
        if (address.phoneNumber) parts.push(`Phone: ${address.phoneNumber}`);
        if (address.address) parts.push(address.address);
        if (address.city && address.city !== address.division) parts.push(address.city);
        if (address.upazila) parts.push(address.upazila);
        if (address.district) parts.push(address.district);
        if (address.division) parts.push(address.division);
        if (address.postalCode) parts.push(`Postal: ${address.postalCode}`);
        return parts.join(", ") || "N/A";
    };

    // Get order count with fallback to allOrders
    const getOrderCount = (customer) => {
        if (customer._count?.onlineOrders !== undefined) {
            return customer._count.onlineOrders;
        }
        const customerId = customer.id || customer._id;
        if (!customerId) return 0;
        return allOrders.filter(o => {
            const oCustId = o.customer?.id || o.customer?._id || o.customerId;
            return String(oCustId) === String(customerId);
        }).length;
    };

    // Format phone number
    const formatPhone = (phone) => {
        if (!phone) return "N/A";
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11 && cleaned.startsWith('01')) {
            return `+880 ${cleaned.substring(0, 4)}-${cleaned.substring(4)}`;
        }
        return phone;
    };

    // Export to Excel - supports both registered and guest checkout customers
    const handleExportExcel = async () => {
        try {
            setIsExporting(true);

            // Fetch all customers for export with fallback to loaded customers
            let exportData = [];
            try {
                const response = await apiClient(`/api/customer?limit=10000`);
                exportData = response?.customers || response?.data?.customers || response?.data || (Array.isArray(response) ? response : []);
            } catch (err) {
                console.warn("API fetch for export failed, falling back to loaded customer list:", err);
            }

            if (!Array.isArray(exportData) || exportData.length === 0) {
                exportData = Array.isArray(allCustomers) ? [...allCustomers] : [];
            }

            // Include any guest customers from orders who might not have standalone customer profiles
            const existingIds = new Set(exportData.map(c => String(c.id || c._id)));
            allOrders.forEach(order => {
                const cust = order.customer;
                const custId = cust?.id || cust?._id || order.customerId;
                if (custId && !existingIds.has(String(custId))) {
                    existingIds.add(String(custId));
                    exportData.push({
                        id: custId,
                        customerCode: cust?.customerCode || `GUEST-${custId}`,
                        fullName: cust?.fullName || order.shippingAddress?.recipientName || "Guest Customer",
                        phone: cust?.phone || order.shippingAddress?.phoneNumber || "",
                        email: cust?.email || "",
                        status: true,
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt,
                        customerAddresses: order.shippingAddress ? [order.shippingAddress] : [],
                        _count: { onlineOrders: 1 }
                    });
                }
            });

            if (exportData.length === 0) {
                toast.error("No customers available to export");
                setIsExporting(false);
                return;
            }

            let maxAddresses = 0;
            exportData.forEach(customer => {
                if (customer.customerAddresses && Array.isArray(customer.customerAddresses)) {
                    maxAddresses = Math.max(maxAddresses, customer.customerAddresses.length);
                }
            });
            maxAddresses = Math.max(maxAddresses, 1);

            const excelData = exportData.map((customer, index) => {
                const isGuest = customer.email?.startsWith('guest_') || customer.fullName === 'Guest Customer' || (customer.customerCode && String(customer.customerCode).startsWith('GUEST'));
                const totalSpent = customerOrdersMap[customer.id] || customerOrdersMap[customer._id] || 0;
                const orderCount = getOrderCount(customer);

                const row = {
                    'SL No': index + 1,
                    'Customer Code': customer.customerCode || 'N/A',
                    'Full Name': customer.fullName || (isGuest ? 'Guest Customer' : 'N/A'),
                    'Phone': customer.phone || 'N/A',
                    'Email': customer.email || 'N/A',
                    'Customer Type': isGuest ? 'Guest' : 'Registered',
                    'Status': customer.status ? 'Active' : 'Inactive',
                    'Customer Segment': getCustomerSegment(customer),
                    'Total Orders': orderCount,
                    'Total Spent (BDT)': totalSpent,
                };

                const addresses = customer.customerAddresses && Array.isArray(customer.customerAddresses)
                    ? customer.customerAddresses
                    : [];

                if (addresses.length > 0) {
                    addresses.forEach((addr, addrIndex) => {
                        const addressNum = addrIndex + 1;
                        const fullAddress = getFullAddress(addr);
                        const isDefault = addr.isDefault ? " (Default)" : "";
                        row[`Address ${addressNum}`] = fullAddress + isDefault;
                    });
                } else {
                    row['Address 1'] = 'No address';
                }

                row['Total Addresses'] = addresses.length;
                row['Created At'] = customer.createdAt && !isNaN(new Date(customer.createdAt).getTime())
                    ? new Date(customer.createdAt).toLocaleString()
                    : 'N/A';
                row['Updated At'] = customer.updatedAt && !isNaN(new Date(customer.updatedAt).getTime())
                    ? new Date(customer.updatedAt).toLocaleString()
                    : 'N/A';

                return row;
            });

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(excelData);

            const colWidths = [
                { wch: 8 },  // SL No
                { wch: 18 }, // Customer Code
                { wch: 25 }, // Full Name
                { wch: 16 }, // Phone
                { wch: 30 }, // Email
                { wch: 16 }, // Customer Type
                { wch: 12 }, // Status
                { wch: 18 }, // Customer Segment
                { wch: 14 }, // Total Orders
                { wch: 18 }, // Total Spent (BDT)
            ];

            for (let i = 1; i <= maxAddresses; i++) {
                colWidths.push({ wch: 50 });
            }
            colWidths.push(
                { wch: 16 }, // Total Addresses
                { wch: 22 }, // Created At
                { wch: 22 }  // Updated At
            );

            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, 'Customers');

            const date = new Date();
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            const fileName = `Customer list Ekhone e-commerce ${dateStr}.xlsx`;

            XLSX.writeFile(wb, fileName);

            toast.success(`Successfully exported ${exportData.length} customers to Excel`);
        } catch (error) {
            console.error("Export failed:", error);
            toast.error("Failed to export customers to Excel. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    // Calculate displayed range
    const indexOfFirstRecord = (pagination.currentPage - 1) * pagination.limit + 1;
    const indexOfLastRecord = Math.min(
        pagination.currentPage * pagination.limit,
        pagination.totalItems
    );

    return (
        <ProtectedRoute>
            <div className="space-y-6 pt-4 text-gray-800">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher">
                            Customer Management
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Total {pagination.totalItems} customers
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {hasPermission('customer.export_excel') && (
                            <button
                                onClick={handleExportExcel}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-4 py-2.5 border border-secound hover:bg-secound text-secound hover:text-white rounded font-medium cursor-pointer transition-all duration-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        Exporting...
                                    </>
                                ) : (
                                    <>
                                        <Download size={18} />
                                        Export Excel
                                    </>
                                )}
                            </button>
                        )}
                        {hasPermission('customer.create') && (
                            <button
                                onClick={addModal.open}
                                className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-all duration-200 hover:shadow-md"
                            >
                                <Plus size={18} /> Add New Customer
                            </button>
                        )}
                    </div>
                </div>
                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{allCustomers.length}</h3>
                            <p className="text-xs text-slate-400 mt-1">Total Customers</p>
                            <p className="text-[10px] text-green-600 font-semibold mt-0.5">+{recentSignups} this month</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{activeCount} Active</h3>
                            <p className="text-xs text-slate-400 mt-1">{suspendedCount} Suspended</p>
                            <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">● Healthy</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">৳{ltvStats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</h3>
                            <p className="text-xs text-slate-400 mt-1">Lifetime Value (LTV)</p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Avg Spend: ৳{ltvStats.avgSpend.toFixed(0)}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{repeatCustomerRate}%</h3>
                            <p className="text-xs text-slate-400 mt-1">Repeat Customer Rate</p>
                            <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Target Benchmark: 15%</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    {/* Search + Filter */}
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filters:</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetFilters}
                                        className="text-xs text-teal-600 hover:text-teal-800 underline transition-colors duration-200 whitespace-nowrap flex items-center gap-1"
                                    >
                                        Clear all filters
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                <div className="relative flex-1 sm:flex-none sm:w-96">
                                    <Search
                                        className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                                        size={18}
                                    />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Search by name, code, phone, email, or address..."
                                        className="pl-10 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    />
                                </div>

                                <select
                                    value={signupPeriod}
                                    onChange={(e) => {
                                        setSignupPeriod(e.target.value);
                                    }}
                                    className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-44"
                                >
                                    <option value="all">All Onboarded</option>
                                    <option value="today">Today</option>
                                    <option value="yesterday">Yesterday</option>
                                    <option value="weekly">Last 7 Days</option>
                                    <option value="monthly">Last 30 Days</option>
                                    <option value="custom">Custom Range</option>
                                </select>

                                {signupPeriod === "custom" && (
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <input
                                            type="date"
                                            value={signupStartDate}
                                            onChange={(e) => setSignupStartDate(e.target.value)}
                                            className="px-2 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                                        />
                                        <span className="text-gray-400 text-xs">to</span>
                                        <input
                                            type="date"
                                            value={signupEndDate}
                                            onChange={(e) => setSignupEndDate(e.target.value)}
                                            className="px-2 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                                        />
                                    </div>
                                )}

                                <select
                                    value={segmentFilter}
                                    onChange={(e) => {
                                        setSegmentFilter(e.target.value);
                                    }}
                                    className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-40"
                                >
                                    <option value="all">All Segments</option>
                                    <option value="VIP">VIP Only</option>
                                    <option value="Retail">Retail Only</option>
                                    <option value="New Customer">New Customer</option>
                                </select>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => {
                                        setStatusFilter(e.target.value);
                                    }}
                                    className="px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-40"
                                >
                                    <option value="all">All Status</option>
                                    <option value="active">Active Only</option>
                                    <option value="inactive">Inactive Only</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    {[
                                        "#",
                                        "Customer Info",
                                        "Contact",
                                        "Address",
                                        "Status",
                                        "Total Spent & Orders",
                                        "Actions"
                                    ].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            {hasPermission('customer.view') && (
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                    <span className="ml-2">Loading customers data...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredCustomerData.length > 0 ? (
                                        filteredCustomerData.map((customer, index) => (
                                            <tr
                                                key={customer.id}
                                                className="hover:bg-gray-50 transition-colors duration-150"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                    {indexOfFirstRecord + index}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div
                                                        className="cursor-pointer group"
                                                        onClick={() => handleOpenDrawer(customer)}
                                                        title="Click to view details in drawer"
                                                    >
                                                        <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                                            {customer.fullName}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            ID: <span className="font-medium text-gray-700 group-hover:text-primary">{customer.customerCode}</span>
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="space-y-1">
                                                        <p className="text-sm text-gray-900 font-medium">
                                                            {formatPhone(customer.phone)}
                                                        </p>
                                                        {customer.email && (
                                                            <p className="text-sm text-gray-600 break-all">
                                                                {customer.email}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-start gap-2">
                                                        <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm text-gray-700 line-clamp-2">
                                                                {getPrimaryAddress(customer)}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                {customer.customerAddresses?.length || 0} address(es)
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${customer.status
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {customer.status ? "Active" : "Inactive"}
                                                        </span>
                                                        {hasPermission('customer.status_update') && (
                                                            <label className="relative flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={customer.status}
                                                                    onChange={() => handleToggleStatus(customer.id)}
                                                                    disabled={isTogglingStatus === customer.id}
                                                                    className="sr-only"
                                                                />
                                                                <div
                                                                    className={`w-11 h-6 rounded-full transition-colors duration-200 ${isTogglingStatus === customer.id
                                                                        ? "opacity-50 cursor-not-allowed"
                                                                        : "cursor-pointer"
                                                                        } ${customer.status
                                                                            ? "bg-green-500"
                                                                            : "bg-gray-300"
                                                                        }`}
                                                                >
                                                                    {isTogglingStatus === customer.id ? (
                                                                        <div className="flex items-center justify-center w-full h-full">
                                                                            <Loader2 className="h-3 w-3 animate-spin text-white" />
                                                                        </div>
                                                                    ) : (
                                                                        <div
                                                                            className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 transform ${customer.status ? "translate-x-5" : "translate-x-0.5"
                                                                                } mt-0.5`}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </label>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="space-y-1.5">
                                                        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                                                            ৳{(customerOrdersMap[customer.id] || customerOrdersMap[customer._id] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <span className="inline-flex items-center text-xs bg-blue-50 text-teal-800 font-medium px-2 py-0.5 rounded">
                                                                {getOrderCount(customer)} order{getOrderCount(customer) === 1 ? '' : 's'}
                                                            </span>
                                                            <span className="text-[10px] text-gray-500 font-medium bg-slate-100 py-0.5 px-1.5 rounded">
                                                                {getCustomerSegment(customer)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2">
                                                        {hasPermission('customer.view_details') && (
                                                            <button
                                                                onClick={() => handleOpenDrawer(customer)}
                                                                className="p-2 text-gray-600 hover:text-primary hover:bg-teal-50 transition-colors duration-200 rounded cursor-pointer inline-flex items-center justify-center"
                                                                title="View Details (Drawer)"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                        )}
                                                        {hasPermission('customer.update') && (
                                                            <button
                                                                onClick={() => handleEditCustomer(customer)}
                                                                className="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 transition-colors duration-200 rounded-lg cursor-pointer inline-flex items-center justify-center"
                                                                title="Edit Customer"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                        )}
                                                        {hasPermission('customer.delete') && (
                                                            <button
                                                                onClick={() => handleDelete(customer.id)}
                                                                disabled={isDeleting === customer.id}
                                                                className={`p-2 transition-colors duration-200 rounded-lg ${isDeleting === customer.id
                                                                    ? "text-gray-400 cursor-not-allowed"
                                                                    : "text-gray-600 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                                                    }`}
                                                                title="Delete Customer"
                                                            >
                                                                {isDeleting === customer.id ? (
                                                                    <Loader2 size={18} className="animate-spin" />
                                                                ) : (
                                                                    <Trash2 size={18} />
                                                                )}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search className="h-16 w-16 text-gray-300 mb-4" />
                                                    <p className="text-lg font-medium text-gray-900">No customers found</p>
                                                    <p className="text-sm text-gray-600 mt-2 max-w-md">
                                                        {hasActiveFilters
                                                            ? "No customers match your search criteria. Try adjusting your filters."
                                                            : "You haven't added any customers yet. Start by adding your first customer to manage orders and invoices."}
                                                    </p>
                                                    {!hasActiveFilters && (
                                                        <button
                                                            onClick={addModal.open}
                                                            className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors duration-200"
                                                        >
                                                            <Plus size={16} /> Add First Customer
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={setCurrentPage}
                            totalRecords={pagination.totalItems}
                            indexOfFirstRecord={indexOfFirstRecord}
                            indexOfLastRecord={indexOfLastRecord}
                            className="border border-gray-100 px-5 py-3 rounded-lg"
                        />
                    )}
                </div>

                {/* Modals */}
                <CustomerAddModal
                    isOpen={addModal.isOpen}
                    onClose={addModal.close}
                    onSuccess={handleAddSuccess}
                />

                {/* Customer Detail Drawer */}
                <CustomerDetailDrawer
                    isOpen={isDrawerOpen}
                    onClose={handleCloseDrawer}
                    customer={drawerCustomer}
                    initialOrders={
                        drawerCustomer
                            ? allOrders.filter(o => {
                                const cId = o.customer?.id || o.customer?._id || o.customerId;
                                return cId === drawerCustomer.id || cId === drawerCustomer._id;
                            })
                            : []
                    }
                    totalSpent={drawerCustomer ? (customerOrdersMap[drawerCustomer.id] || customerOrdersMap[drawerCustomer._id] || 0) : 0}
                    segment={drawerCustomer ? getCustomerSegment(drawerCustomer) : 'Retail'}
                    onToggleStatus={handleToggleStatus}
                    onEdit={handleEditCustomer}
                    isTogglingStatus={isTogglingStatus}
                />
            </div>
        </ProtectedRoute>
    );
};

export default Customers;