"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useModal } from "@/hooks/useModal";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/shared/pagination";
import { apiClient } from "@/lib/apiClient";
import { useCoupons } from "@/lib/dataFetch";
import CouponAddModal from "@/components/modal/CouponModal/CouponAddModal";
import CouponEditModal from "@/components/modal/CouponModal/CouponEditModal";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";


const RECORDS_PER_PAGE = 20;

const CouponPage = () => {

    const { data: couponData = [], isLoading, mutate } = useCoupons();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);
    const [isTogglingStatus, setIsTogglingStatus] = useState(null);
    const { hasPermission } = usePermission();

    const addModal = useModal();
    const editModal = useModal();

    /** Filtering Logic */
    const filteredCoupons = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return couponData.filter((item) => {
            const matchesSearch =
                !term ||
                [item.name, item.code, item.description].some(
                    (field) => field?.toLowerCase().includes(term)
                );

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && item.active) ||
                (statusFilter === "inactive" && !item.active);

            const matchesType =
                typeFilter === "all" ||
                item.discountType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [couponData, searchTerm, statusFilter, typeFilter]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredCoupons, RECORDS_PER_PAGE);

    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    /** Format validity period */
    const formatValidity = (startAt, endAt) => {
        if (!startAt || !endAt) return "—";
        return `${formatDate(startAt)} - ${formatDate(endAt)}`;
    };

    /** Handlers */
    const handleSearch = useCallback(
        (value) => {
            setSearchTerm(value);
            setCurrentPage(1);
        },
        [setCurrentPage]
    );

    const handleToggleStatus = async (id) => {
        const couponToUpdate = couponData.find((item) => item.id === id);
        if (!couponToUpdate) return;

        setIsTogglingStatus(id);

        try {
            const newStatus = !couponToUpdate.active;

            await apiClient(`/api/coupon/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ active: newStatus }),
            });

            await mutate();
            toast.success("Status updated successfully");
        } catch (err) {
            console.error("Status update failed:", err);
            toast.error("Failed to update status");
        } finally {
            setIsTogglingStatus(null);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Coupon?",
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
                await apiClient(`/api/coupon/${id}`, { method: "DELETE" });
                await mutate();
                toast.success("Coupon deleted successfully");
            } catch (err) {
                console.error("Delete failed:", err);
                toast.error("Delete failed. Please try again.");
            }
        }
    };

    const handleEditSuccess = () => {
        mutate();
        editModal.close();
        setSelectedItem(null);
    };

    const handleAddSuccess = () => {
        mutate();
        addModal.close();
    };

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setTypeFilter("all");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm || statusFilter !== "all" || typeFilter !== "all";

    return (
        <ProtectedRoute >
            <div className="space-y-6 p-4 text-gray-900">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher">Manage Coupon</h1>
                        <p className="text-gray-600 text-sm">Manage your Coupon list</p>
                    </div>
                    {hasPermission('coupon.create') && (
                        <button
                            onClick={addModal.open}
                            className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                        >
                            <Plus size={18} /> Add Coupon
                        </button>
                    )}
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    {/* Search + Filter */}
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filters:</h3>
                                {hasActiveFilters && (
                                    <button
                                        onClick={resetFilters}
                                        className="text-xs text-teal-600 hover:text-teal-800 underline transition-colors duration-200 whitespace-nowrap"
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
                                        placeholder="Search by name, code or description..."
                                        className="pl-10 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <select
                                        value={typeFilter}
                                        onChange={(e) => {
                                            setTypeFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-40"
                                    >
                                        <option value="all">All Type</option>
                                        <option value="Fixed">Fixed</option>
                                        <option value="Percentage">Percentage</option>
                                    </select>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => {
                                            setStatusFilter(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-32"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                        <table className="w-full">
                            <thead className="bg-amber-50">
                                <tr>
                                    {["#", "Name", "Code", "Type", "Discount", "Status", "Actions"].map(
                                        (header) => (
                                            <th
                                                key={header}
                                                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        )
                                    )}
                                </tr>
                            </thead>

                            {hasPermission('coupon.view') && (
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-12 text-center">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                    <span className="ml-2">Loading coupon...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentRecords.length > 0 ? (
                                        currentRecords.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-3 text-sm text-gray-900">
                                                    {indexOfFirstRecord + index}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    {item.name}
                                                </td>
                                                <td className="px-6 py-3 text-sm">
                                                    <span className="bg-purple-100/70 border border-purple-300/70 text-purple-700 px-2.5 py-1 rounded-bl-2xl rounded-tr-2xl text-xs font-medium">
                                                        {item.code}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-700">
                                                    {item.discountType || "—"}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-700">
                                                    {item.discountType === "Percentage"
                                                        ? `${item.discountValue}%`
                                                        : `৳ ${item.discountValue}`
                                                    }
                                                </td>

                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.active
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {item.active ? "Active" : "Inactive"}
                                                        </span>
                                                        {hasPermission('coupon.status_update') && (
                                                            <label className="relative flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.active}
                                                                    onChange={() => handleToggleStatus(item.id)}
                                                                    disabled={isTogglingStatus === item.id}
                                                                    className="sr-only"
                                                                />
                                                                <div
                                                                    className={`w-10 h-5 rounded-full transition-colors duration-200 ${item.active ? "bg-green-500" : "bg-gray-300"
                                                                        } ${isTogglingStatus === item.id
                                                                            ? "opacity-50 cursor-not-allowed"
                                                                            : "cursor-pointer"
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${item.active ? "translate-x-5" : "translate-x-0.5"
                                                                            } mt-0.5`}
                                                                    />
                                                                </div>
                                                            </label>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3">
                                                    <div className="flex gap-2">
                                                        {hasPermission('coupon.update') && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedItem(item);
                                                                    editModal.open();
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 rounded-lg hover:bg-green-50"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                        )}
                                                        {hasPermission('coupon.delete') && (
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                    <p className="text-lg font-medium text-gray-900">No coupons found</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {hasActiveFilters
                                                            ? "Try adjusting your search or filter criteria"
                                                            : "Get started by adding your first coupon"
                                                        }
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            )}
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalRecords={totalRecords}
                            indexOfFirstRecord={indexOfFirstRecord}
                            indexOfLastRecord={indexOfLastRecord}
                            className="border border-gray-100 px-5 py-3 rounded-lg"
                        />
                    )}
                </div>

                {/* Modals */}
                <CouponAddModal
                    isOpen={addModal.isOpen}
                    onClose={addModal.close}
                    onSuccess={handleAddSuccess}
                />

                {selectedItem && (
                    <CouponEditModal
                        isOpen={editModal.isOpen}
                        onClose={() => {
                            editModal.close();
                            setSelectedItem(null);
                        }}
                        coupon={selectedItem}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
};

export default CouponPage;