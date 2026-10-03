"use client";

import { useState, useMemo, useCallback } from "react";
import { Search, Edit, Trash2, Plus, Sparkles, Package, RotateCcw, CheckCircle2, XCircle, Layers } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import Pagination from "../shared/pagination";
import { usePagination } from "@/hooks/usePagination";
import { useModal } from "@/hooks/useModal";
import { apiClient } from "@/lib/apiClient";
import { useCollections } from "@/lib/dataFetch";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import CollectionAddModal from "../modal/CollectionModal/CollectionAddModal";
import CollectionEditModal from "../modal/CollectionModal/CollectionEditModal";
import { usePermission } from "@/context/PermissionProvider";

const RECORDS_PER_PAGE = 20;

const CollectionTable = () => {
    const { data: collectionsData = [], isLoading, mutate } = useCollections();
    const { hasPermission } = usePermission();

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedItem, setSelectedItem] = useState(null);

    const addModal = useModal();
    const editModal = useModal();

    // Stats calculations
    const activeCount = useMemo(() => {
        return collectionsData.filter(col => col.status === true).length;
    }, [collectionsData]);

    const draftCount = useMemo(() => {
        return collectionsData.filter(col => col.status === false).length;
    }, [collectionsData]);

    const totalProductsCount = useMemo(() => {
        return collectionsData.reduce((acc, curr) => acc + (curr.productCount || curr.products?.length || 0), 0);
    }, [collectionsData]);

    const topCollection = useMemo(() => {
        if (!collectionsData.length) return null;
        return [...collectionsData].sort((a, b) => (b.productCount || 0) - (a.productCount || 0))[0];
    }, [collectionsData]);

    /** Filtering Logic */
    const filteredCollections = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();

        return collectionsData
            .filter(col => {
                const matchesSearch = !term ||
                    [col.name, col.slug, col.description]
                        .some(field => field?.toLowerCase().includes(term));

                const matchesStatus = statusFilter === "all" ||
                    (statusFilter === "published" && col.status === true) ||
                    (statusFilter === "unpublished" && col.status === false);

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => (Number(a.priority) || 1) - (Number(b.priority) || 1));
    }, [collectionsData, searchTerm, statusFilter]);

    /** Pagination Hook */
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredCollections, RECORDS_PER_PAGE);

    /** Handlers */
    const handleSearch = useCallback(value => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    const handleReset = () => {
        setSearchTerm("");
        setStatusFilter("all");
        setCurrentPage(1);
    };

    /** Status Toggle */
    const handleStatusToggle = async (id, currentStatus) => {
        const collection = collectionsData.find(c => c.id === id);
        if (!collection) return;

        const newStatus = !currentStatus;

        try {
            // Optimistic update
            mutate(
                collectionsData.map(c => c.id === id ? { ...c, status: newStatus } : c),
                false
            );

            await apiClient(`/api/collections/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            toast.success(`Collection is now ${newStatus ? "Published" : "Unpublished"}`);
            mutate();
        } catch (error) {
            console.error("Status update failed:", error);
            mutate();
            toast.error(error.message || "Failed to update status");
        }
    };

    /** Delete handler */
    const handleDelete = async (id, name) => {
        const result = await Swal.fire({
            title: "Delete Collection?",
            text: `Are you sure you want to delete "${name}"? Products inside it will not be deleted.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Yes, delete it!",
        });

        if (!result.isConfirmed) return;

        try {
            // Optimistic delete
            mutate(
                collectionsData.filter(c => c.id !== id),
                false
            );

            await apiClient(`/api/collections/${id}`, {
                method: "DELETE",
            });

            toast.success("Collection deleted successfully");
            mutate();
        } catch (error) {
            console.error("Delete failed:", error);
            mutate();
            toast.error(error.message || "Failed to delete collection");
        }
    };

    if (isLoading) return <LoadingSpinner />;

    return (
        <div className="space-y-6 p-4 text-gray-900">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-philosopher flex items-center gap-2">
                        <Sparkles className="text-amber-500 w-6 h-6" /> Collections Management
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Create and manage dynamic product collections (e.g. Eid Collection, Summer Collection)
                    </p>
                </div>
                {(hasPermission('collection.create') || hasPermission('product.create') || hasPermission('category.create')) && (
                    <button
                        onClick={addModal.open}
                        className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200"
                    >
                        <Plus size={18} /> Add Collection
                    </button>
                )}
            </div>

            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Total Collections */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Collections</span>
                        <div className="p-2 bg-secound/10 text-secound rounded-lg">
                            <Sparkles className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{collectionsData.length}</h3>
                        <p className="text-xs text-slate-400 mt-1">{activeCount} Published / {draftCount} Unpublished</p>
                    </div>
                </div>

                {/* Published Collections */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Published Status</span>
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-emerald-600">{activeCount} Active</h3>
                        <p className="text-xs text-slate-400 mt-1">Live on store frontend</p>
                    </div>
                </div>

                {/* Total Product Associations */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Products</span>
                        <div className="p-2 bg-secound/10 text-secound rounded-lg">
                            <Package className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900">{totalProductsCount}</h3>
                        <p className="text-xs text-slate-400 mt-1">Products across collections</p>
                    </div>
                </div>

                {/* Top Collection */}
                <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="absolute top-0 right-0 h-1.5 w-full bg-secound transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Collection</span>
                        <div className="p-2 bg-secound/10 text-secound rounded-lg">
                            <Layers className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 truncate">
                            {topCollection ? topCollection.name : "N/A"}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                            {topCollection ? `${topCollection.productCount || 0} Products attached` : "No products yet"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, slug, description..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full sm:w-44 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                    >
                        <option value="all">All Status</option>
                        <option value="published">Published</option>
                        <option value="unpublished">Unpublished</option>
                    </select>
                </div>

                <button
                    onClick={handleReset}
                    title="Reset filters"
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    <RotateCcw size={16} /> Reset
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                                <th className="p-4">Priority</th>
                                <th className="p-4">Collection Name</th>
                                <th className="p-4">Slug</th>
                                <th className="p-4">Products</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                            {currentRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Sparkles className="w-8 h-8 text-slate-300" />
                                            <p className="font-medium text-slate-600">No collections found</p>
                                            <p className="text-xs text-slate-400">
                                                {searchTerm || statusFilter !== "all"
                                                    ? "Try clearing filters to view collections."
                                                    : "Click 'Add Collection' above to create your first collection."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentRecords.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors duration-150">
                                        {/* Priority */}
                                        <td className="p-4 font-semibold text-slate-800">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                                                {item.priority ?? 1}
                                            </span>
                                        </td>

                                        {/* Collection Name */}
                                        <td className="p-4 font-semibold text-slate-900">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-amber-500" />
                                                <span>{item.name}</span>
                                            </div>
                                        </td>

                                        {/* Slug */}
                                        <td className="p-4">
                                            <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700 font-mono">
                                                {item.slug}
                                            </code>
                                        </td>

                                        {/* Products Count */}
                                        <td className="p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
                                                <Package size={13} />
                                                {item.productCount ?? item.products?.length ?? 0} Products
                                            </span>
                                        </td>

                                        {/* Status */}
                                        <td className="p-4">
                                            {(hasPermission('status_update') || hasPermission('collection.status_update') || hasPermission('collection.update') || hasPermission('product.update')) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStatusToggle(item.id, item.status)}
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 ${
                                                        item.status
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                                            : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                                                    }`}
                                                >
                                                    {item.status ? (
                                                        <>
                                                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                                            Published
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                                            Unpublished
                                                        </>
                                                    )}
                                                </button>
                                            ) : (
                                                <span
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                        item.status
                                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                                            : "bg-rose-50 text-rose-700 border border-rose-200"
                                                    }`}
                                                >
                                                    {item.status ? "Published" : "Unpublished"}
                                                </span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {(hasPermission('collection.update') || hasPermission('product.update') || hasPermission('category.update')) && (
                                                    <button
                                                        onClick={() => {
                                                             setSelectedItem(item);
                                                             editModal.open();
                                                        }}
                                                        title="Edit Collection"
                                                        className="p-1.5 text-slate-500 hover:text-secound hover:bg-slate-100 rounded transition-colors"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                )}
                                                {(hasPermission('collection.delete') || hasPermission('product.delete') || hasPermission('category.delete')) && (
                                                    <button
                                                        onClick={() => handleDelete(item.id, item.name)}
                                                        title="Delete Collection"
                                                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-slate-100">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalRecords={totalRecords}
                            recordsPerPage={RECORDS_PER_PAGE}
                            indexOfFirstRecord={indexOfFirstRecord}
                            indexOfLastRecord={indexOfLastRecord}
                        />
                    </div>
                )}
            </div>

            {/* Modals */}
            <CollectionAddModal
                isOpen={addModal.isOpen}
                onClose={addModal.close}
                onSuccess={() => mutate()}
            />

            <CollectionEditModal
                isOpen={editModal.isOpen}
                onClose={editModal.close}
                collection={selectedItem}
                onSuccess={() => mutate()}
            />
        </div>
    );
};

export default CollectionTable;
