'use client'

import React, { useState, useMemo, useCallback } from "react";
import { usePermissions, useCreatePermission } from "@/hooks/useRBAC";
import { Search, Plus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { usePagination } from "@/hooks/usePagination";
import Pagination from "@/components/shared/pagination";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";

const RECORDS_PER_PAGE = 20;

const CreatePermission = () => {
    const { permissions = [], isLoading, mutate } = usePermissions();
    const { createPermission } = useCreatePermission();
    const { hasPermission, user } = usePermission(); 

    const [searchTerm, setSearchTerm] = useState("");
    const [module, setModule] = useState("");
    const [action, setAction] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Check if user has system_admin role
    const isDeveloperAdmin = useMemo(() => {
        return user?.role?.name?.toLowerCase() === 'system_admin';
    }, [user]);

    // Filtering Logic
    const filteredPermissions = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return permissions.filter((p) => {
            return !term ||
                p.module?.toLowerCase().includes(term) ||
                p.action?.toLowerCase().includes(term) ||
                p.slug?.toLowerCase().includes(term);
        });
    }, [permissions, searchTerm]);

    // Pagination Hook
    const {
        currentRecords,
        currentPage,
        setCurrentPage,
        totalPages,
        totalRecords,
        indexOfFirstRecord,
        indexOfLastRecord,
    } = usePagination(filteredPermissions, RECORDS_PER_PAGE);

    // CREATE HANDLER
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!module || !action) {
            setError("Module and Action are required");
            toast.error("Module and Action are required");
            return;
        }

        try {
            setLoading(true);
            setError("");

            await createPermission({ module, action });

            setModule("");
            setAction("");
            toast.success("Permission created successfully");

            await mutate(); 

        } catch (err) {
            setError(err.message);
            toast.error(err.message || "Failed to create permission");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    }, [setCurrentPage]);

    // Loading state
    if (isLoading) return <LoadingSpinner />
       

    return (
        <ProtectedRoute >
            <div className="space-y-6 p-4 text-gray-900">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher">Manage Permissions</h1>
                        <p className="text-gray-600 text-sm">Manage and create permissions for your application</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-1 2xl:grid-cols-3 gap-6">
                    {/* Table Section - Takes 2/3 on 2xl */}
                    <div className="2xl:col-span-2">
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
                                            placeholder="Search by module, action, or slug..."
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
                                            {["#", "Module", "Action", "Slug"].map((header) => (
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
                                            currentRecords.map((p, index) => (
                                                <tr key={p.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-6 py-3 text-sm text-gray-900">
                                                        {indexOfFirstRecord + index}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                        <span className="bg-sky-100 text-sky-700 px-2.5 py-1 rounded-full text-xs font-medium">
                                                            {p.module}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-700">
                                                        <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-tl-2xl rounded-br-2xl text-xs font-medium">
                                                            {p.action}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-500 font-mono">
                                                        {p.slug}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                        <p className="text-lg font-medium text-gray-900">No permissions found</p>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {searchTerm
                                                                ? "Try adjusting your search criteria"
                                                                : "Get started by creating your first permission"
                                                            }
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
                    </div>

                    {/* Form Section - Takes 1/3 on 2xl */}
                    <div className="2xl:col-span-1">
                        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 space-y-4 sticky top-24">
                            <div className="flex items-center gap-2 border-b border-gray-200 pb-4">
                                <Plus size={20} className="text-primary" />
                                <h2 className="text-lg font-semibold text-gray-900">Create Permission</h2>
                            </div>

                            {/* Only show the form if user is system_admin */}
                            {isDeveloperAdmin ? (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Module <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={module}
                                            onChange={(e) => setModule(e.target.value)}
                                            placeholder="e.g. orders, products, users"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200"
                                            disabled={loading}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Enter the module name (e.g., orders, products)</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Action <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={action}
                                            onChange={(e) => setAction(e.target.value)}
                                            placeholder="e.g. create, update, delete, view"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200"
                                            disabled={loading}
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Enter the action (e.g., create, update, delete)</p>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-red-600 text-sm">{error}</p>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={18} />
                                                Create Permission
                                            </>
                                        )}
                                    </button>

                                    <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg">
                                        <p className="text-xs text-sky-700">
                                            <span className="font-semibold">Note:</span> Permission slug will be automatically generated as <span className="font-mono">module.action</span>
                                        </p>
                                    </div>
                                </form>
                            ) : (
                                // Show message for non-system_admin users
                                <div className="flex flex-col items-center justify-center py-8 text-center">
                                    <div className="bg-gray-100 rounded-full p-4 mb-3">
                                        <Plus size={32} className="text-gray-400" />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-700 mb-1">Access Restricted</h3>
                                    <p className="text-xs text-gray-500 max-w-xs">
                                        Only System Administrators (system_admin) can create new permissions.
                                    </p>
                                    <div className="mt-3 px-3 py-1 bg-purple-50 border border-purple-200 rounded-full">
                                        <span className="text-xs text-purple-600">🔒 Developer Admin Only</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute >
    );
};

export default CreatePermission;