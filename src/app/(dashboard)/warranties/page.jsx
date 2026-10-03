"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useWarranties } from "@/lib/dataFetch";
import { useModal } from "@/hooks/useModal";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/shared/pagination";
import WarrantyAddModal from "@/components/modal/WarrantyModal/WarrantyAddModal";
import WarrantyEditModal from "@/components/modal/WarrantyModal/WarrantyEditModal";
import { apiClient } from "@/lib/apiClient";
import { usePermission } from "@/context/PermissionProvider";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";

const RECORDS_PER_PAGE = 20;

const Warranties = () => {

    const { data: warrantyData = [], isLoading, mutate } = useWarranties();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [periodFilter, setPeriodFilter] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);
    const [isTogglingStatus, setIsTogglingStatus] = useState(null);
    const { hasPermission } = usePermission();

    const addModal = useModal();
    const editModal = useModal();

    /** Filtering Logic */
    const filteredWarranties = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return warrantyData.filter((item) => {
            const matchesSearch =
                !term ||
                [item.name, item.duration, item.description].some((field) =>
                    field?.toLowerCase().includes(term)
                );

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && item.status) ||
                (statusFilter === "inactive" && !item.status);

            const matchesPeriod =
                periodFilter === "all" ||
                (periodFilter === "day" && item.period === "day") ||
                (periodFilter === "month" && item.period === "month") ||
                (periodFilter === "year" && item.period === "year");

            return matchesSearch && matchesStatus && matchesPeriod;
        });
    }, [warrantyData, searchTerm, statusFilter, periodFilter]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredWarranties, RECORDS_PER_PAGE);

    const handleSearch = useCallback(
        (value) => {
            setSearchTerm(value);
            setCurrentPage(1);
        },
        [setCurrentPage]
    );

    /** Toggle status (Optimistic update) */
    const handleToggleStatus = async (id) => {
        const warrantyToUpdate = warrantyData.find((item) => item.id === id);
        if (!warrantyToUpdate) return;

        const newStatus = !warrantyToUpdate.status;
        const optimisticData = warrantyData.map((item) =>
            item.id === id ? { ...item, status: newStatus } : item
        );

        // Optimistically update the UI instantly
        mutate(optimisticData, false);

        try {
            await apiClient(`/api/warranty/${id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
            });

            mutate();
            toast.success(`Warranty status updated to ${newStatus ? "Active" : "Inactive"}`);
        } catch (err) {
            console.error("Status update failed:", err);
            mutate();
            toast.error("Failed to update status");
        }
    };

    /** Delete warranty */
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Warranty?",
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
                // Optimistic delete
                mutate(
                    warrantyData.filter((item) => item.id !== id),
                    false
                );
                await apiClient(`/api/warranty/${id}`, { method: "DELETE" });
                mutate();
                toast.success("Warranty deleted successfully");
            } catch (err) {
                console.error("Delete failed:", err);
                mutate();
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

    if (isLoading) return <LoadingSpinner />

    const resetFilters = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setPeriodFilter("all");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm || statusFilter !== "all" || periodFilter !== "all";

    return (
        <div className="space-y-6 p-4 text-gray-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher">
                        Manage Warranty
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Manage your warranty list
                    </p>
                </div>
                {hasPermission('warranty.create') && (
                    <button
                        onClick={addModal.open}
                        className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                    >
                        <Plus size={18} /> Add Warranty
                    </button>
                )}
            </div>
            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filters:</h3>
                            {(searchTerm || statusFilter !== "all" || periodFilter !== "all") && (
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
                                    placeholder="Search by name, duration or description..."
                                    className="pl-10 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                />
                            </div>

                            {/* Filter Dropdowns */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    value={periodFilter}
                                    onChange={(e) => {
                                        setPeriodFilter(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-32"
                                >
                                    <option value="all">All Period</option>
                                    <option value="day">Day</option>
                                    <option value="month">Month</option>
                                    <option value="year">Year</option>
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
                                {["#", "Warranty", "Duration", "Period", "Description", "Status", "Actions"].map(
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

                        {hasPermission('warranty.view') && (
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentRecords.length > 0 ? (
                                    currentRecords.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-gray-50 transition-colors duration-150"
                                        >
                                            <td className="px-6 py-3 text-sm text-gray-900">
                                                {indexOfFirstRecord + index}
                                            </td>

                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-3 text-sm">
                                                <span className="bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                                    {item.duration}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-sm">
                                                <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-bl-xl rounded-tr-xl text-xs font-medium">
                                                    {item.period}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-700 max-w-xs truncate">
                                                {item.description || "—"}
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
                                                    {hasPermission('warranty.status_update') && (
                                                        <label className="relative flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={item.status}
                                                                onChange={() => handleToggleStatus(item.id)}
                                                                disabled={isTogglingStatus === item.id}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${isTogglingStatus === item.id
                                                                ? "opacity-50 cursor-not-allowed"
                                                                : "cursor-pointer"
                                                                } ${item.status
                                                                    ? "bg-green-500"
                                                                    : "bg-gray-300"
                                                                }`}>
                                                                {isTogglingStatus === item.id ? (
                                                                    <div className="flex items-center justify-center w-full h-full">
                                                                        <Loader2 className="h-3 w-3 animate-spin text-white" />
                                                                    </div>
                                                                ) : (
                                                                    <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${item.status ? "translate-x-5" : "translate-x-0.5"
                                                                        } mt-0.5`} />
                                                                )}
                                                            </div>
                                                        </label>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex gap-2">
                                                    {hasPermission('warranty.update') && (
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
                                                    {hasPermission('warranty.delete') && (
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
                                        <td
                                            colSpan={7}
                                            className="px-6 py-12 text-center text-gray-500"
                                        >
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                <p className="text-lg font-medium text-gray-900">No warranties found</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {searchTerm || statusFilter !== "all" || periodFilter !== "all"
                                                        ? "Try adjusting your search or filter criteria"
                                                        : "Get started by adding your first warranty"}
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
            <WarrantyAddModal
                isOpen={addModal.isOpen}
                onClose={addModal.close}
                onSuccess={handleAddSuccess}
            />

            {selectedItem && (
                <WarrantyEditModal
                    isOpen={editModal.isOpen}
                    onClose={() => {
                        editModal.close();
                        setSelectedItem(null);
                    }}
                    warranty={selectedItem}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}

export default Warranties;