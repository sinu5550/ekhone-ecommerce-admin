"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus, Folder, Network, Package, TrendingUp, ListTree, RotateCcw, GitBranch, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import Pagination from "../shared/pagination";
import { usePagination } from "@/hooks/usePagination";
import { useModal } from "@/hooks/useModal";
import { apiClient } from "@/lib/apiClient";
import { useSubCategories, useCategories, useMainCategories, useProducts } from "@/lib/dataFetch";
import SubCategoryAddModal from "../modal/SubCategoryModal/SubCategoryAddModal";
import SubCategoryEditModal from "../modal/SubCategoryModal/SubCategoryEditModal";
import { usePermission } from "@/context/PermissionProvider";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";

const RECORDS_PER_PAGE = 20;

const SubCategoryTable = () => {

    const { data: subCategoryData = [], isLoading: subCatLoading, mutate } = useSubCategories();
    const { data: categoryData = [] } = useCategories();
    const { data: mainCategoriesData = [] } = useMainCategories();
    const { pagination } = useProducts(1, 1);

    const isLoading = subCatLoading;

    const [searchTerm, setSearchTerm] = useState("");
    const [mainCategoryFilter, setMainCategoryFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [subCategoryFilter, setSubCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isTogglingStatus, setIsTogglingStatus] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const addModal = useModal();
    const editModal = useModal();
    const { hasPermission } = usePermission();

    const { activeCount, draftCount } = useMemo(() => {
        let active = 0;
        let draft = 0;
        subCategoryData.forEach(c => {
            if (c.status) active++;
            else draft++;
        });
        return { activeCount: active, draftCount: draft };
    }, [subCategoryData]);

    // Extract unique main categories for filter dropdown - FIXED
    const mainCategories = useMemo(() => {
        const uniqueMainCategories = new Map();
        subCategoryData.forEach(subCat => {
            if (subCat.category?.mainCategory) {
                uniqueMainCategories.set(subCat.category.mainCategory.id, subCat.category.mainCategory);
            }
        });
        return Array.from(uniqueMainCategories.values()).sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0));
    }, [subCategoryData]);

    // Extract unique categories for filter dropdown
    const categories = useMemo(() => {
        const uniqueCategories = new Map();
        subCategoryData.forEach(subCat => {
            if (subCat.category) {
                uniqueCategories.set(subCat.category.id, subCat.category);
            }
        });
        return Array.from(uniqueCategories.values()).sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0));
    }, [subCategoryData]);

    // Extract unique subcategories for filter dropdown
    const availableSubCategories = useMemo(() => {
        const uniqueSubCategories = new Map();
        subCategoryData.forEach(subCat => {
            uniqueSubCategories.set(subCat.id, { id: subCat.id, name: subCat.name, code: subCat.code, priority: subCat.priority });
        });
        return Array.from(uniqueSubCategories.values()).sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0));
    }, [subCategoryData]);


    /** Filtering Logic */
    const filteredSubCategories = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();

        return subCategoryData
            .filter(subCat => {
                // Search filter
                const matchesSearch = !term ||
                    [
                        subCat.name,
                        subCat.code,
                        subCat.description,
                        subCat.category?.name,
                        subCat.category?.code,
                        subCat.category?.mainCategory?.name,
                        subCat.category?.mainCategory?.code
                    ].some(field => field?.toLowerCase().includes(term));

                // Main category filter - FIXED
                const matchesMainCategory = mainCategoryFilter === "all" ||
                    subCat.category?.mainCategory?.id.toString() === mainCategoryFilter;

                // Category filter
                const matchesCategory = categoryFilter === "all" ||
                    subCat.category?.id.toString() === categoryFilter;

                // Sub category filter
                const matchesSubCategory = subCategoryFilter === "all" ||
                    subCat.id.toString() === subCategoryFilter;

                // Status filter
                const matchesStatus = statusFilter === "all" ||
                    (statusFilter === "active" ? Boolean(subCat.status) : !subCat.status);

                return matchesSearch && matchesMainCategory && matchesCategory && matchesSubCategory && matchesStatus;
            })
            .sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0));
    }, [subCategoryData, searchTerm, mainCategoryFilter, categoryFilter, subCategoryFilter, statusFilter]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredSubCategories, RECORDS_PER_PAGE);

    /** Handlers */
    const handleSearch = useCallback(value => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    const handleMainCategoryFilter = useCallback(value => {
        setMainCategoryFilter(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    const handleCategoryFilter = useCallback(value => {
        setCategoryFilter(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    const handleSubCategoryFilter = useCallback(value => {
        setSubCategoryFilter(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    const handleStatusFilter = useCallback(value => {
        setStatusFilter(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    /** Toggle status (Optimistic update) */
    const handleToggleStatus = async (id) => {
        const target = subCategoryData.find(c => c.id === id);
        if (!target) return;
        const newStatus = !target.status;

        const optimisticData = subCategoryData.map((cat) =>
            cat.id === id ? { ...cat, status: newStatus } : cat
        );

        // Optimistically update the UI instantly
        mutate(optimisticData, false);

        try {
            await apiClient(`/api/sub-categories/${id}`, {
                method: "PATCH",
                body: { status: newStatus },
            });
            mutate();
            toast.success(`Sub-category status updated to ${newStatus ? "Active" : "Inactive"}`);
        } catch (error) {
            console.error("Failed to update status:", error);
            mutate();
            toast.error(error.message || "Failed to update sub-category status");
        }
    };

    /** Delete subcategory */
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Sub Category?",
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
                await apiClient(`/api/sub-categories/${id}`, { method: "DELETE" });
                await mutate();
                toast.success("Sub category deleted successfully");
            } catch (err) {
                console.error("Delete failed:", err);
                toast.error(err.message || "Failed to delete sub category");
            }
        }
    };

    const handleAddSuccess = () => {
        mutate();
        addModal.close();
    };

    const handleEditSuccess = () => {
        mutate();
        editModal.close();
        setSelectedItem(null);
    };

    const resetFilters = () => {
        setSearchTerm("");
        setMainCategoryFilter("all");
        setCategoryFilter("all");
        setSubCategoryFilter("all");
        setStatusFilter("all");
        setCurrentPage(1);
    };

    const hasActiveFilters = searchTerm || mainCategoryFilter !== "all" || categoryFilter !== "all" || subCategoryFilter !== "all" || statusFilter !== "all";

    if (isLoading) return <LoadingSpinner />

    return (
        <div className="space-y-6 p-4 text-gray-900">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher">Manage Sub Categories</h1>
                    <p className="text-gray-600 text-sm">Manage your sub category list</p>
                </div>
                {hasPermission('sub_category.create') && (
                    <button
                        onClick={addModal.open}
                        className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                    >
                        <Plus size={18} /> Add Sub Category
                    </button>
                )}
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Total Sub Categories Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sub-Categories</span>
                        <div className="p-2 bg-secound/10 text-secound rounded-lg">
                            <GitBranch className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold text-slate-900">{subCategoryData.length}</h3>
                            <span className="text-xs text-emerald-600 font-semibold">{activeCount} active</span>
                            <span className="text-xs text-slate-400">/</span>
                            <span className="text-xs text-rose-500 font-semibold">{draftCount} inactive</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Sub-categories in catalog</p>
                    </div>
                </div>

                {/* Total Linked Categories Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Categories</span>
                        <div className="p-2 bg-secound/10 text-secound rounded-lg">
                            <ListTree className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{categoryData.length || categories.length}</h3>
                        <p className="text-xs text-slate-400 mt-1">Active category links</p>
                    </div>
                </div>

                {/* Total Linked Main Categories Card */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Linked Main Categories</span>
                        <div className="p-2 bg-secound/10 text-secound rounded-lg">
                            <Folder className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{mainCategoriesData.length || mainCategories.length}</h3>
                        <p className="text-xs text-slate-400 mt-1">Active main category links</p>
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

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
                {/* Filters Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-10 p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-700">Filters:</h3>
                        {hasActiveFilters && (
                            <button
                                onClick={resetFilters}
                                className="text-xs text-teal-600 hover:text-teal-800 underline transition-colors duration-200"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 w-full sm:w-auto">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Search sub categories..."
                                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                        </div>

                        {/* Sub Category Filter */}
                        <select
                            value={subCategoryFilter}
                            onChange={e => handleSubCategoryFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="all">All Sub Categories</option>
                            {availableSubCategories.map(subCategory => (
                                <option key={subCategory.id} value={subCategory.id}>
                                    {subCategory.name} ({subCategory.code})
                                </option>
                            ))}
                        </select>

                        {/* Category Filter */}
                        <select
                            value={categoryFilter}
                            onChange={e => handleCategoryFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name} ({category.code})
                                </option>
                            ))}
                        </select>

                        {/* Main Category Filter */}
                        <select
                            value={mainCategoryFilter}
                            onChange={e => handleMainCategoryFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="all">All Main Categories</option>
                            {mainCategories.map(mainCat => (
                                <option key={mainCat.id} value={mainCat.id}>
                                    {mainCat.name} ({mainCat.code})
                                </option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={e => handleStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm cursor-pointer"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>

                        {/* Quick Reset Filters Button */}
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

                {/* Dismissible Active Filter Chips */}
                {hasActiveFilters && (
                    <div className="flex flex-wrap items-center gap-2 py-1 px-1 bg-white border border-gray-100 rounded-lg shadow-2xs">
                        <span className="text-xs text-gray-400 font-medium ml-2">Active filters:</span>
                        {searchTerm && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                Search: "{searchTerm}"
                                <button
                                    onClick={() => handleSearch("")}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {subCategoryFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                Sub Category: {availableSubCategories.find(c => c.id.toString() === subCategoryFilter)?.name || subCategoryFilter}
                                <button
                                    onClick={() => handleSubCategoryFilter("all")}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {categoryFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                Category: {categories.find(c => c.id.toString() === categoryFilter)?.name || categoryFilter}
                                <button
                                    onClick={() => handleCategoryFilter("all")}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {mainCategoryFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">
                                Main Category: {mainCategories.find(c => c.id.toString() === mainCategoryFilter)?.name || mainCategoryFilter}
                                <button
                                    onClick={() => handleMainCategoryFilter("all")}
                                    className="hover:bg-slate-200 hover:text-slate-900 text-slate-400 rounded-full w-4 h-4 inline-flex items-center justify-center transition-colors cursor-pointer"
                                >
                                    ✕
                                </button>
                            </span>
                        )}
                        {statusFilter !== "all" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200 capitalize">
                                Status: {statusFilter}
                                <button
                                    onClick={() => handleStatusFilter("all")}
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

                {/* Table */}
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                    <table className="w-full">
                        <thead className="bg-amber-50">
                            <tr>
                                {["#", "Code", "Sub Category Name", "Priority", "Category", "Main Category", "Status", "Actions"].map(header => (
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
                                currentRecords.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 transition-colors duration-150"
                                    >
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                            {indexOfFirstRecord + index + 1}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
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
                                        <td className="px-6 py-3 text-sm text-gray-700">
                                            {item.category ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">{item.category.name}</span>
                                                    <span className="text-[10px] text-gray-500 ">
                                                        {item.category.code}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-700">
                                            {item.category?.mainCategory ? (
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-medium">{item.category.mainCategory.name}</span>
                                                    <span className="text-[10px] text-gray-500 ">
                                                        {item.category.mainCategory.code}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-sm">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                                                    {item.status ? "Active" : "Inactive"}
                                                </span>
                                                {(hasPermission('status_update') || hasPermission('sub_category.update')) && (
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
                                                {hasPermission('sub_category.update') && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedItem(item);
                                                            editModal.open();
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                                        title="Edit sub category"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                )}
                                                {hasPermission('sub_category.delete') && (
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                        title="Delete sub category"
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
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="text-gray-500 flex flex-col items-center">
                                            <Search size={48} className="mx-auto mb-3 text-gray-300" />
                                            <p className="text-lg font-medium text-gray-900">No sub categories found</p>
                                            <p className="text-sm mt-1 text-gray-600">
                                                {subCategoryData.length === 0
                                                    ? "Get started by adding your first sub category"
                                                    : "Try adjusting your search or filters"
                                                }
                                            </p>
                                            {subCategoryData.length === 0 && (
                                                <button
                                                    onClick={addModal.open}
                                                    className="mt-4 px-4 py-2 bg-secound hover:bg-secound-hover text-white rounded-lg transition-colors duration-200"
                                                >
                                                    Add First Sub Category
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                        totalRecords={totalRecords}
                        indexOfFirstRecord={indexOfFirstRecord}
                        indexOfLastRecord={indexOfLastRecord}
                        className="border border-gray-200 px-6 py-4 rounded-lg bg-white"
                    />
                )}
            </div>

            {/* Modals */}
            <SubCategoryAddModal
                isOpen={addModal.isOpen}
                onClose={addModal.close}
                onSuccess={handleAddSuccess}
            />

            {selectedItem && (
                <SubCategoryEditModal
                    isOpen={editModal.isOpen}
                    onClose={() => {
                        editModal.close();
                        setSelectedItem(null);
                    }}
                    subCategory={selectedItem}
                    onSuccess={handleEditSuccess}
                />
            )}
        </div>
    );
};

export default SubCategoryTable;