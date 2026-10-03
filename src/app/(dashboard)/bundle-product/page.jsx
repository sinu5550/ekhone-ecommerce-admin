"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus, Loader2, Package } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useModal } from "@/hooks/useModal";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/shared/pagination";
import { apiClient } from "@/lib/apiClient";
import { useBundleProducts } from "@/lib/dataFetch";
import BundleAddModal from "@/components/modal/BundleProductModal/BundleAddModal";
import BundleEditModal from "@/components/modal/BundleProductModal/BundleEditModal";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";

const RECORDS_PER_PAGE = 20;

const BundleProductPage = () => {
    const { data, isLoading, mutate } = useBundleProducts();
    const bundleData = data?.data || [];

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);
    const [isTogglingStatus, setIsTogglingStatus] = useState(null);
    const { hasPermission } = usePermission();
    const addModal = useModal();
    const editModal = useModal();

    /** Filtering Logic */
    const filteredBundles = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return bundleData.filter((item) => {
            const matchesSearch =
                !term ||
                [item.name, item.slug, item.description].some(
                    (field) => field?.toLowerCase().includes(term)
                );

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && item.status) ||
                (statusFilter === "inactive" && !item.status);

            const matchesType =
                typeFilter === "all" ||
                item.discountType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [bundleData, searchTerm, statusFilter, typeFilter]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredBundles, RECORDS_PER_PAGE);

    /** Format date for display */
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    /** Calculate total products in bundle */
    const getTotalProducts = (bundle) => {
        return bundle.bundleItems?.reduce((total, item) => total + item.quantity, 0) || 0;
    };

    /** Handlers */
    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    const handleToggleStatus = async (id) => {
        setIsTogglingStatus(id);

        try {
            await apiClient(`/api/bundle-product/${id}/status`, {
                method: "PATCH",
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
            title: "Delete Bundle?",
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
                await apiClient(`/api/bundle-product/${id}`, { method: "DELETE" });
                await mutate();
                toast.success("Bundle deleted successfully");
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
        <ProtectedRoute>
            <div className="space-y-6 p-4 text-gray-900">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher">Bundle Products</h1>
                        <p className="text-gray-600 text-sm">Manage your bundle products list</p>
                    </div>
                    {hasPermission('bundle_product.create') && (
                        <button
                            onClick={addModal.open}
                            className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                        >
                            <Plus size={18} /> Create Bundle
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
                                        placeholder="Search by name, slug or description..."
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
                                    {["#", "Image", "Bundle Details", "Products", "Base Price", "Discount", "Final Price", "Validity", "Status", "Actions"].map(
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
                            {hasPermission('bundle_product.view') && (
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={10} className="px-6 py-12 text-center">
                                                <div className="flex justify-center items-center">
                                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                                    <span className="ml-2">Loading bundle products...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : currentRecords.length > 0 ? (
                                        currentRecords.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-3 text-sm text-gray-900">
                                                    {indexOfFirstRecord + index + 1}
                                                </td>

                                                <td className="px-6 py-3">
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                                    />
                                                </td>

                                                <td className="px-6 py-3">
                                                    <div className="space-y-1">
                                                        <div className="font-medium text-sm text-gray-900">{item.name}</div>
                                                        <div className="text-xs text-gray-500">{item.slug}</div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3 text-sm text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <Package size={16} className="text-secound" />
                                                        <span>{getTotalProducts(item)}</span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    ৳ {Number(item.price).toFixed(2)}
                                                </td>

                                                <td className="px-6 py-3 text-sm text-gray-700">
                                                    <div className="space-y-1">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${item.discountType === 'Percentage'
                                                            ? 'bg-blue-100 text-sky-600'
                                                            : 'bg-green-100 text-green-800'
                                                            }`}>
                                                            {item.discountType === 'Percentage'
                                                                ? `${item.discountValue}%`
                                                                : `৳ ${Number(item.discountValue).toFixed(2)}`
                                                            }
                                                        </span>
                                                        <div className="text-xs text-gray-500 mt-1">
                                                            Save ৳ {Number(item.discountAmount).toFixed(2)}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3 text-sm font-bold text-green-700">
                                                    ৳ {Number(item.finalPrice).toFixed(2)}
                                                </td>

                                                <td className="px-6 py-3 text-sm text-gray-700">
                                                    <div className="text-xs space-y-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium">Start:</span>
                                                            {formatDate(item.startDate)}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-medium">End:</span>
                                                            {formatDate(item.endDate)}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {item.status ? "Active" : "Inactive"}
                                                        </span>
                                                        {hasPermission('bundle_product.status_update') && (
                                                            <label className="relative flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={item.status}
                                                                    onChange={() => handleToggleStatus(item.id)}
                                                                    disabled={isTogglingStatus === item.id}
                                                                    className="sr-only"
                                                                />
                                                                <div
                                                                    className={`w-10 h-5 rounded-full transition-colors duration-200 ${item.status ? "bg-green-500" : "bg-gray-300"
                                                                        } ${isTogglingStatus === item.id
                                                                            ? "opacity-50 cursor-not-allowed"
                                                                            : "cursor-pointer"
                                                                        }`}
                                                                >
                                                                    <div
                                                                        className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${item.status ? "translate-x-5" : "translate-x-0.5"
                                                                            } mt-0.5`}
                                                                    />
                                                                </div>
                                                            </label>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-6 py-3">
                                                    <div className="flex gap-2">
                                                        {hasPermission('bundle_product.update') && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedItem(item);
                                                                    editModal.open();
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 rounded-lg hover:bg-green-50 cursor-pointer"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                        )}
                                                        {hasPermission('bundle_product.delete') && (
                                                            <button
                                                                onClick={() => handleDelete(item.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50 cursor-pointer"
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
                                                    <Package className="h-12 w-12 text-gray-300 mb-2" />
                                                    <p className="text-lg font-medium text-gray-900">No bundles found</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {hasActiveFilters
                                                            ? "Try adjusting your search or filter criteria"
                                                            : "Get started by adding your first bundle"}
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
                <BundleAddModal
                    isOpen={addModal.isOpen}
                    onClose={addModal.close}
                    onSuccess={handleAddSuccess}
                />

                {selectedItem && (
                    <BundleEditModal
                        isOpen={editModal.isOpen}
                        onClose={() => {
                            editModal.close();
                            setSelectedItem(null);
                        }}
                        bundle={selectedItem}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
};

export default BundleProductPage;