"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus, Loader2, LayoutGrid, List, Award, Package, TrendingUp, RotateCcw } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { useBrands, useProducts } from "@/lib/dataFetch";
import { useModal } from "@/hooks/useModal";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/shared/pagination";
import BrandAddModal from "@/components/modal/BrandModal/BrandAddModal";
import BrandEditModal from "@/components/modal/BrandModal/BrandEditModal";
import Image from "next/image";
import { apiClient } from "@/lib/apiClient";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";

const RECORDS_PER_PAGE = 20;

const BrandPage = () => {
    const { data: brandData = [], isLoading: brandLoading, error, mutate } = useBrands();
    const { pagination } = useProducts(1, 1);

    const isLoading = brandLoading;

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [viewMode, setViewMode] = useState("table"); // "table" or "grid"
    const addModal = useModal();
    const editModal = useModal();
    const { hasPermission } = usePermission();

    /** Filtering Logic */
    const filteredBrands = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return brandData.filter((brand) => {
            return !term ||
                [brand.name].some(
                    (field) => field?.toLowerCase().includes(term)
                );
        });
    }, [brandData, searchTerm]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredBrands, RECORDS_PER_PAGE);

    const resetFilters = useCallback(() => {
        setSearchTerm("");
        setCurrentPage(1);
    }, [setCurrentPage]);

    const hasActiveFilters = !!searchTerm;

    /** Delete brand */
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Brand?",
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
                    brandData.filter(b => b.id !== id),
                    false
                );
                await apiClient(`/api/brands/${id}`, { method: "DELETE" });
                mutate();
                toast.success("Brand deleted successfully");
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
        setSelectedBrand(null);
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
    if (isLoading) {
        return (
            <div className="space-y-6 p-4">
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-2 text-lg">Loading brands...</span>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute >
            <div className="space-y-6 p-4 text-gray-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher">Manage Brand</h1>
                        <p className="text-gray-600 text-sm">Manage your brand list</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* View Switcher Button */}
                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-1 shadow-2xs">
                            <button
                                onClick={() => setViewMode("table")}
                                className={`p-1.5 rounded-md transition-all duration-200 flex items-center justify-center cursor-pointer ${viewMode === "table" ? "bg-white text-secound shadow-xs" : "text-gray-400 hover:text-gray-600"}`}
                                title="Table View"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded-md transition-all duration-200 flex items-center justify-center cursor-pointer ${viewMode === "grid" ? "bg-white text-secound shadow-xs" : "text-gray-400 hover:text-gray-600"}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>
                        {hasPermission('brand.create') && (
                            <button
                                onClick={addModal.open}
                                className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                            >
                                <Plus size={18} /> Add Brand
                            </button>
                        )}
                    </div>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    {/* Total Brands Card */}
                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Brands</span>
                            <div className="p-2 bg-secound/10 text-secound rounded-lg">
                                <Award className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{brandData.length}</h3>
                            <p className="text-xs text-slate-400 mt-1">Brands registered</p>
                        </div>
                    </div>

                    {/* Total Catalog Products Card */}
                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                        <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Products</span>
                            <div className="p-2 bg-secound/10 text-secound rounded-lg">
                                <Package className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-slate-900">{(pagination?.totalItems || 0).toLocaleString()}</h3>
                            <p className="text-xs text-slate-400 mt-1">Products in catalog</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                        <h3 className="text-sm font-semibold text-gray-700">Filters:</h3>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                            <div className="relative w-full sm:max-w-md sm:ml-auto flex items-center gap-3">
                                <div className="relative w-full">
                                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by brand name..."
                                        className="pl-10 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                    />
                                </div>
                                <button
                                    onClick={resetFilters}
                                    disabled={!hasActiveFilters}
                                    className="px-3 py-2 border border-dashed border-gray-300 rounded text-xs font-semibold text-gray-500 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 whitespace-nowrap flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                    <RotateCcw size={13} />
                                    Reset Filters
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Dismissible Active Filter Chips */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap items-center gap-2 py-1 px-1 bg-white border border-gray-100 rounded-lg shadow-2xs">
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
                            <button
                                onClick={resetFilters}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 ml-auto cursor-pointer hover:underline transition-all"
                            >
                                Reset All
                            </button>
                        </div>
                    )}

                    {viewMode === "grid" ? (
                        /* Grid View */
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5 py-4">
                            {currentRecords.length > 0 ? (
                                currentRecords.map((brand, index) => (
                                    <div
                                        key={brand.id}
                                        className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col items-center justify-between shadow-2xs hover:shadow-md hover:border-slate-300 transition-all duration-300 relative group"
                                    >
                                        <div className="w-full aspect-square relative flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-100 mb-3 min-h-[120px]">
                                            {brand.image ? (
                                                <Image
                                                    src={brand.image}
                                                    alt={brand.name}
                                                    fill
                                                    sizes="(max-width: 768px) 100px, 120px"
                                                    className="object-contain p-2"
                                                />
                                            ) : (
                                                <Award className="w-12 h-12 text-slate-300" />
                                            )}
                                        </div>
                                        <h4 className="text-sm font-semibold text-slate-800 text-center truncate w-full mb-3" title={brand.name}>
                                            {brand.name}
                                        </h4>
                                        <div className="flex gap-2 w-full justify-center border-t border-slate-100 pt-3">
                                            {hasPermission('brand.update') && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedBrand(brand);
                                                        editModal.open();
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                            )}
                                            {hasPermission('brand.delete') && (
                                                <button
                                                    onClick={() => handleDelete(brand.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="absolute top-2 left-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono">
                                            #{indexOfFirstRecord + index}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center text-gray-500">
                                    <Search className="h-12 w-12 text-gray-300 mb-2 mx-auto" />
                                    <p className="text-lg font-medium text-gray-900">No brand found</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Table View */
                        <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                            <table className="w-full">
                                <thead className="bg-amber-50">
                                    <tr>
                                        {["#", "Brand Name", "image", "Actions"].map((header) => (
                                            <th
                                                key={header}
                                                className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>

                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentRecords.length > 0 ? (
                                        currentRecords?.map((brand, index) => (
                                            <tr key={brand.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-3 text-sm text-gray-900">
                                                    {indexOfFirstRecord + index}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    {brand.name}
                                                </td>
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    <span>
                                                        {brand.image ? (
                                                            <Image
                                                                src={brand.image}
                                                                alt={brand.name}
                                                                width={32}
                                                                height={32}
                                                                className="rounded" />
                                                        ) : (
                                                            "—"
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex gap-2">
                                                        {hasPermission('brand.update') && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedBrand(brand);
                                                                    editModal.open();
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 rounded-lg hover:bg-green-50 cursor-pointer"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                        )}
                                                        {hasPermission('brand.delete') && (
                                                            <button
                                                                onClick={() => handleDelete(brand.id)}
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
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                    <p className="text-lg font-medium text-gray-900">No brand found</p>
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
                            </table>
                        </div>
                    )}

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
                <BrandAddModal
                    isOpen={addModal.isOpen}
                    onClose={addModal.close}
                    onSuccess={handleAddSuccess}
                />

                {selectedBrand && (
                    <BrandEditModal
                        isOpen={editModal.isOpen}
                        onClose={() => {
                            editModal.close();
                            setSelectedBrand(null);
                        }}
                        brand={selectedBrand}
                        onSuccess={handleEditSuccess}
                    />
                )}
            </div>
        </ProtectedRoute >
    );
};

export default BrandPage;