"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useUnits } from "@/lib/dataFetch";
import { useModal } from "@/hooks/useModal";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/shared/pagination";
import { apiClient } from "@/lib/apiClient";
import UnitAddModal from "@/components/modal/UnitModal/UnitAddModal";
import UnitEditModal from "@/components/modal/UnitModal/UnitEditModal";
import { usePermission } from "@/context/PermissionProvider";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";

const RECORDS_PER_PAGE = 20;

const UnitPage = () => {

    const { data: unitData = [], isLoading, error, mutate } = useUnits();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const addModal = useModal();
    const editModal = useModal();
    const { hasPermission } = usePermission();

    /** Filtering Logic */
    const filteredUnit = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return unitData.filter((item) => {
            return !term ||
                [item.name].some(
                    (field) => field?.toLowerCase().includes(term)
                );
        });
    }, [unitData, searchTerm]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredUnit, RECORDS_PER_PAGE);

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    /** Delete brand */
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Unit?",
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
                    unitData.filter(u => u.id !== id),
                    false
                );
                await apiClient(`/api/unit/${id}`, { method: "DELETE" });
                mutate();
                toast.success("Unit deleted successfully");
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

    // Error state
    if (error) {
        return (
            <div className="space-y-6 p-4">
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <h2 className="text-lg font-semibold text-red-800">Error Loading Brands</h2>
                    <p className="text-red-600">Failed to load brands. Please try again later.</p>
                    <button
                        onClick={() => mutate()}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Loading state
    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6 p-4 text-gray-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher">Manage Unit</h1>
                    <p className="text-gray-600 text-sm">Manage your unit list</p>
                </div>
                {hasPermission('unit.create') && (
                    <button
                        onClick={addModal.open}
                        className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                    >
                        <Plus size={18} /> Add Unit
                    </button>
                )}
            </div>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700">Filters:</h3>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                        <div className="relative w-full sm:max-w-md sm:ml-auto">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search by unit name..."
                                className="pl-10 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="bg-amber-50">
                            <tr>
                                {["#", "Unit Name", "Short Name", "Create At", "Actions"].map((header) => (
                                    <th
                                        key={header}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                    >
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {hasPermission('unit.view') && (
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentRecords.length > 0 ? (
                                    currentRecords?.map((item, index) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-3 text-sm text-gray-900">
                                                {indexOfFirstRecord + index}
                                            </td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                {item.name}
                                            </td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                {item.shortName}
                                            </td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                {item.createdAt}
                                            </td>

                                            <td className="px-6 py-3">
                                                <div className="flex gap-2">
                                                    {hasPermission('unit.update') && (
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
                                                    {hasPermission('unit.delete') && (
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
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                <p className="text-lg font-medium text-gray-900">No unit found</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {searchTerm
                                                        ? "Try adjusting your search or filter criteria"
                                                        : "Get started by adding your first brand"
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
            <UnitAddModal
                isOpen={addModal.isOpen}
                onClose={addModal.close}
                onSuccess={handleAddSuccess}
            />

            {selectedItem && (
                <UnitEditModal
                    isOpen={editModal.isOpen}
                    onClose={() => {
                        editModal.close();
                        setSelectedItem(null);
                    }}
                    unit={selectedItem}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
};

export default UnitPage;





