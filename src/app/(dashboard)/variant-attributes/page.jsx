"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus, Pipette } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useVariantAttributes } from "@/lib/dataFetch";
import { useModal } from "@/hooks/useModal";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/shared/pagination";
import { apiClient } from "@/lib/apiClient";
import VariantAttributesAddModal from "@/components/modal/VariantModal/VariantAttributesAddModal";
import VariantAttributesEditModal from "@/components/modal/VariantModal/VariantAttributesEditModal";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";

const RECORDS_PER_PAGE = 20;

const VariantAttributes = () => {

    const { data: variantData = [], isLoading, mutate } = useVariantAttributes();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedItem, setSelectedItem] = useState(null);
    const addModal = useModal();
    const editModal = useModal();
    const { hasPermission } = usePermission();

    /** Filtering Logic */
    const filteredVariants = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return variantData.filter((item) => {
            return !term ||
                item.variant?.toLowerCase().includes(term) ||
                item.values?.some(value =>
                    value?.toLowerCase().includes(term)
                );
        });
    }, [variantData, searchTerm]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredVariants, RECORDS_PER_PAGE);

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    /** Delete variant attribute */
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Variant Attribute?",
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
                    variantData.filter(v => v.id !== id),
                    false
                );
                await apiClient(`/api/variant-attributes/${id}`, { method: "DELETE" });
                mutate();
                toast.success("Variant attribute deleted successfully");
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


    const isHexColor = (value) => {
        return typeof value === 'string' && /^#[0-9A-F]{6}$/i.test(value);
    };

    // Check if this is a color attribute based on name or values
    const isColorAttribute = (item) => {
        if (item.variant?.toLowerCase().includes('color')) {
            return true;
        }

        if (item.values && Array.isArray(item.values)) {
            return item.values.some(value => isHexColor(value));
        }

        return false;
    };

    // Get text color that contrasts with background
    const getContrastColor = (hexColor) => {
        // Remove the # if present
        const hex = hexColor.replace('#', '');

        // Convert to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);

        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

        // Return black or white based on luminance
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    };

    // Format values for display
    const renderValue = (value, index) => {
        if (isHexColor(value)) {
            const textColor = getContrastColor(value);
            return (
                <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 shadow-sm"
                    style={{
                        backgroundColor: value,
                        color: textColor,
                        textShadow: textColor === '#FFFFFF' ? '0 1px 1px rgba(0,0,0,0.2)' : 'none'
                    }}
                >
                    <span className="w-3 h-3 rounded-full border border-current opacity-50"
                        style={{ backgroundColor: value, filter: 'brightness(0.8)' }}
                    />
                    {value}
                </span>
            );
        } else {
            return (
                <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100/70 text-sky-700 border border-sky-200"
                >
                    {value}
                </span>
            );
        }
    };

    // Loading state
    if (isLoading) return <LoadingSpinner />

    return (
        <ProtectedRoute >
            <div className="space-y-6 p-4 text-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher">Manage Variant Attributes</h1>
                        <p className="text-gray-600 text-sm">Manage your variant attributes list</p>
                    </div>
                    {hasPermission('variant_attribute.create') && (
                        <button
                            onClick={addModal.open}
                            className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                        >
                            <Plus size={18} /> Add Variant Attribute
                        </button>
                    )}
                </div>

                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    {/* Search + Filter */}
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            {/* Filters Label */}
                            <div className="flex items-center gap-3">
                                <h3 className="text-sm font-semibold text-gray-700 whitespace-nowrap">Filters:</h3>
                                {searchTerm && (
                                    <button
                                        onClick={() => setSearchTerm("")}
                                        className="text-xs text-teal-600 hover:text-teal-800 underline transition-colors duration-200 whitespace-nowrap"
                                    >
                                        Clear search
                                    </button>
                                )}
                            </div>

                            {/* Search Input */}
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
                                        placeholder="Search by variant name or values..."
                                        className="pl-10 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                        <table className="w-full">
                            <thead className="bg-amber-50">
                                <tr>
                                    {["#", "Variant", "Values", "Actions"].map((header) => (
                                        <th
                                            key={header}
                                            className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                        >
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            {hasPermission('variant_attribute.view') && (
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentRecords.length > 0 ? (
                                        currentRecords.map((item, index) => {
                                            const isColor = isColorAttribute(item);
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-6 py-3 text-sm text-gray-900">
                                                        {indexOfFirstRecord + index }
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium text-gray-900">
                                                                {item.variant || "—"}
                                                            </span>
                                                            {isColor && (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                                                    <Pipette size={12} />
                                                                    Color
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {item.values && Array.isArray(item.values) ? (
                                                                item.values.map((value, idx) => renderValue(value, idx))
                                                            ) : (
                                                                <span className="text-gray-400 text-sm">—</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex gap-2">
                                                            {hasPermission('variant_attribute.update') && (
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedItem(item);
                                                                        editModal.open();
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 rounded-lg hover:bg-green-50"
                                                                    title="Edit variant attribute"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                            )}
                                                            {hasPermission('variant_attribute.delete') && (
                                                                <button
                                                                    onClick={() => handleDelete(item.id)}
                                                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50"
                                                                    title="Delete variant attribute"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                    <p className="text-lg font-medium text-gray-900">No variant attributes found</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {searchTerm
                                                            ? "Try adjusting your search criteria"
                                                            : "Get started by adding your first variant attribute"
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
                <VariantAttributesAddModal
                    isOpen={addModal.isOpen}
                    onClose={addModal.close}
                    onSuccess={handleAddSuccess}
                />

                {selectedItem && (
                    <VariantAttributesEditModal
                        isOpen={editModal.isOpen}
                        onClose={() => {
                            editModal.close();
                            setSelectedItem(null);
                        }}
                        variantAttribute={selectedItem}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
};

export default VariantAttributes;