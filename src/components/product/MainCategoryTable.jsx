"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus, Loader2, Folder, Network, Package, TrendingUp } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import Pagination from "../shared/pagination";
import { usePagination } from "@/hooks/usePagination";
import { useModal } from "@/hooks/useModal";
import MainCategoryAddModal from "../modal/MainCategoryModal/MainCategoryAddModal";
import { apiClient } from "@/lib/apiClient";
import MainCategoryEditModal from "../modal/MainCategoryModal/MainCategoryEditModal";
import { useMainCategories, useCategories, useProducts } from "@/lib/dataFetch";
import { usePermission } from "@/context/PermissionProvider";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

const RECORDS_PER_PAGE = 20;

export default function MainCategoryTable() {

    const { data: mainCategoriesData = [], isLoading: mainCatLoading, mutate } = useMainCategories();
    const { data: categoriesData = [] } = useCategories();
    const { pagination } = useProducts(1, 1);

    const isLoading = mainCatLoading;

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);
    const [isTogglingStatus, setIsTogglingStatus] = useState(null);
    const { hasPermission } = usePermission();

    const addModal = useModal();
    const editModal = useModal();


    /** Filtering Logic */
    const filteredCategories = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return mainCategoriesData
            .filter((cat) => {
                const matchesSearch =
                    !term ||
                    [cat.name, cat.code, cat.description].some((field) =>
                        field?.toLowerCase().includes(term)
                    );

                const matchesStatus =
                    statusFilter === "all" ||
                    (statusFilter === "active" && cat.status) ||
                    (statusFilter === "inactive" && !cat.status);

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0));
    }, [mainCategoriesData, searchTerm, statusFilter]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredCategories, RECORDS_PER_PAGE);

    /** Handlers */
    const handleSearch = useCallback(
        (value) => {
            setSearchTerm(value);
            setCurrentPage(1);
        },
        [setCurrentPage]
    );

    /** Toggle status (Optimistic update) */
    const handleToggleStatus = async (id) => {
        const categoryToUpdate = mainCategoriesData?.find((cat) => cat.id === id);
        if (!categoryToUpdate) return;

        const newStatus = !categoryToUpdate.status;
        const optimisticData = mainCategoriesData.map((cat) =>
            cat.id === id ? { ...cat, status: newStatus } : cat
        );

        // Optimistically update the UI instantly
        mutate(optimisticData, false);

        try {
            await apiClient(`/api/main-categories/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            mutate();
            toast.success(`Status updated to ${newStatus ? "Active" : "Inactive"}`);
        } catch (err) {
            console.error("Status update failed:", err);
            mutate();
            toast.error(err.message || "Failed to update status");
        }
    };

    /** Delete category */
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Main Category?",
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
                await apiClient(`/api/main-categories/${id}`, { method: "DELETE" });
                await mutate();
                toast.success("Category deleted successfully");
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


    // Calculate KPIs
    const activeCount = useMemo(() => mainCategoriesData.filter(c => c.status).length, [mainCategoriesData]);
    const draftCount = useMemo(() => mainCategoriesData.filter(c => !c.status).length, [mainCategoriesData]);
    const totalSubCategoriesCount = useMemo(() => {
        return mainCategoriesData.reduce((acc, mc) => {
            return acc + (mc.categories?.reduce((cAcc, c) => cAcc + (c.subCategories?.length || 0), 0) || 0);
        }, 0);
    }, [mainCategoriesData]);

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 p-4 text-gray-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher">
                        Manage Main Category
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Manage your main category list
                    </p>
                </div>
                {hasPermission('main_category.create') && (
                    <button
                        onClick={addModal.open}
                        className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                    >
                        <Plus size={18} /> Add Main Category
                    </button>
                )}
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Main Categories Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Main Categories</span>
                        <div className="p-2 bg-secound/10 text-secound rounded-lg">
                            <Folder className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{activeCount} Active</h3>
                        <p className="text-xs text-slate-400 mt-1">{draftCount} Draft/Hidden</p>
                    </div>
                </div>

                {/* Total Associated Categories Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Categories</span>
                        <div className="p-2 bg-secound/10 text-secound rounded-lg">
                            <Network className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{categoriesData?.length || 0}</h3>
                        <p className="text-xs text-slate-400 mt-1">Associated category depth</p>
                    </div>
                </div>

                {/* Total Sub Categories Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sub-Categories</span>
                        <div className="p-2 bg-secound/10 text-secound rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{totalSubCategoriesCount}</h3>
                        <p className="text-xs text-slate-400 mt-1">Sub-category depth</p>
                    </div>
                </div>

                {/* Total Catalog Products Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Catalog Products</span>
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
                {/* Search + Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700">Filters:</h3>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
                        <div className="relative w-full sm:max-w-md sm:ml-auto">
                            <Search
                                className="absolute left-3 top-2.5 text-gray-400"
                                size={18}
                            />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search by name, code, or description..."
                                className="pl-10 pr-3 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary w-full sm:w-auto"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="bg-amber-50">
                            <tr>
                                {["#", "Code", "Name", "Priority", "Description", "Status", "Actions"].map(
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

                        <tbody className="bg-white divide-y divide-gray-200">
                            {currentRecords.length > 0 ? (
                                currentRecords?.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-3 text-sm text-gray-900">
                                            {indexOfFirstRecord + index}
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            <span className="bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                                {item.code}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-3 text-sm">
                                            <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                                                #{item.priority ?? 1}
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
                                                {(hasPermission('status_update') || hasPermission('main_category.update')) && (
                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={Boolean(item.status)}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleStatus(item.id);
                                                        }}
                                                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
                                                            item.status ? "bg-green-500" : "bg-gray-300"
                                                        }`}
                                                        title={`Click to ${item.status ? "deactivate" : "activate"}`}
                                                    >
                                                        <span
                                                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform duration-200 ${
                                                                item.status ? "translate-x-5" : "translate-x-0.5"
                                                            }`}
                                                        />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex gap-2">
                                                {hasPermission('main_category.update') && (
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
                                                {hasPermission('main_category.delete') && (
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
                                            <p className="text-lg font-medium text-gray-900">No categories found</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {searchTerm || statusFilter !== "all"
                                                    ? "Try adjusting your search or filter criteria"
                                                    : "Get started by adding your first main category"}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
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
            <MainCategoryAddModal
                isOpen={addModal.isOpen}
                onClose={addModal.close}
                onSuccess={handleAddSuccess}
            />

            {selectedItem && (
                <MainCategoryEditModal
                    isOpen={editModal.isOpen}
                    onClose={() => {
                        editModal.close();
                        setSelectedItem(null);
                    }}
                    category={selectedItem}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
}