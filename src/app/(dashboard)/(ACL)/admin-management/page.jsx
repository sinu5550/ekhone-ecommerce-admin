'use client'

import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { usePermission } from "@/context/PermissionProvider";
import { useAdminUsers, useRoles, useUpdateAdminStatus } from "@/hooks/useRBAC";
import { useDeleteUser, useUpdateUserRole } from "@/hooks/useRBAC";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { Search, Edit, Trash2, Loader2, Plus } from "lucide-react";
import Link from "next/link";
import React, { useState, useMemo, useCallback } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";

const AdminUserTable = () => {

    const { users, isLoading, mutate } = useAdminUsers();
    const { roles } = useRoles();
    const { updateRole } = useUpdateUserRole();
    const { deleteUser } = useDeleteUser();
    const { updateStatus } = useUpdateAdminStatus();
    const { hasPermission } = usePermission();
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [selectedRole, setSelectedRole] = useState("");
    const [isTogglingStatus, setIsTogglingStatus] = useState(null);

    // Filter roles to hide 'system_admin'
    const filteredRoles = useMemo(() => {
        return roles.filter(role => role.name?.toLowerCase() !== 'system_admin');
    }, [roles]);

    // Filtering Logic
    const filteredUsers = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();
        return users.filter((user) => {
            return !term ||
                user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term);
        });
    }, [users, searchTerm]);

    // Check if user has system_admin role
    const isDeveloperAdmin = useCallback((user) => {
        return user?.role?.name?.toLowerCase() === 'system_admin';
    }, []);

    // Helper function to check if status is Active (case insensitive)
    const isActiveStatus = useCallback((status) => {
        return status?.toUpperCase() === 'ACTIVE';
    }, []);

    // UPDATE ROLE
    const handleRoleUpdate = async () => {
        try {
            await updateRole(editingUser, selectedRole);
            setEditingUser(null);
            await mutate();
            toast.success("Role updated successfully");
        } catch (error) {
            console.error("Role update failed:", error);
            toast.error("Failed to update role. Please try again.");
        }
    };

    // TOGGLE STATUS
    const handleToggleStatus = async (id) => {
        const userToUpdate = users.find(user => user.id === id);
        if (!userToUpdate) return;

        setIsTogglingStatus(id);

        try {
            // Toggle between 'Active' and 'Inactive' (matching enum exactly)
            const newStatus = isActiveStatus(userToUpdate.status) ? "Inactive" : "Active";

            // Call updateStatus with userId and new status
            await updateStatus(id, newStatus);

            // Refresh the users list
            await mutate();

            toast.success(
                `User ${newStatus === "Active" ? "Activated" : "Deactivated"} Successfully`
            );
        } catch (err) {
            console.error("Status update failed:", err);
            toast.error(err.message || "Failed to update status. Please try again.");
        } finally {
            setIsTogglingStatus(null);
        }
    };

    // DELETE USER
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: "Delete Admin User?",
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
                await deleteUser(id);
                await mutate();
                toast.success("Admin user deleted successfully");
            } catch (error) {
                console.error("Delete failed:", error);
                toast.error("Delete failed. Please try again.");
            }
        }
    };

    const handleSearch = useCallback((value) => {
        setSearchTerm(value);
    }, []);

    // Loading state
    if (isLoading) return <LoadingSpinner />


    return (
        <ProtectedRoute>
            <div className="space-y-6 p-4 text-gray-900">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="w-full sm:w-auto">
                        <h1 className="text-xl sm:text-2xl font-bold font-philosopher">All Admin User List</h1>
                        <p className="text-gray-600 text-sm">Manage admin access based on role and permission</p>
                    </div>
                    {hasPermission("role_management.create") && (
                        <div className="">
                            <Link href='/sign-up'>
                                <button className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium cursor-pointer transition-all duration-200">
                                    <Plus size={18} />
                                    <span>Create Admin User</span>
                                </button>
                            </Link>

                        </div>
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
                                    placeholder="Search by name or email..."
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
                                    {["Name", "Email", "Role", "Status", "Actions"].map((header) => (
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
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => {
                                        const isDevAdmin = isDeveloperAdmin(user);
                                        const isActive = isActiveStatus(user.status);

                                        return (
                                            <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                                    {user.name}
                                                    {isDevAdmin && (
                                                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                                                            System Admin
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-700">
                                                    {user.email}
                                                </td>

                                                {/* ROLE */}
                                                <td className="px-6 py-3 text-sm text-gray-700">
                                                    {editingUser === user.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                                                onChange={(e) => setSelectedRole(e.target.value)}
                                                                defaultValue={user.roleId || ""}
                                                            >
                                                                <option value="">Select role</option>
                                                                {filteredRoles.map((r) => (
                                                                    <option key={r.id} value={r.id}>
                                                                        {r.name}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <button
                                                                onClick={handleRoleUpdate}
                                                                className="px-3 py-1.5 bg-secound text-white rounded text-sm hover:bg-secound-hover transition-colors duration-500 cursor-pointer"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingUser(null)}
                                                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors duration-200"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        user.role?.name || <span className="text-gray-400">No Role</span>
                                                    )}
                                                </td>

                                                {/* STATUS with Toggle Switch */}
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {user.status || 'Inactive'}
                                                        </span>

                                                        {hasPermission("role_management.update") && !isDevAdmin && (
                                                            <label className="relative flex items-center cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isActive}
                                                                    onChange={() => handleToggleStatus(user.id)}
                                                                    disabled={isTogglingStatus === user.id}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-10 h-5 rounded-full transition-colors duration-200 ${isTogglingStatus === user.id
                                                                    ? "opacity-50 cursor-not-allowed"
                                                                    : "cursor-pointer"
                                                                    } ${isActive
                                                                        ? "bg-green-500"
                                                                        : "bg-gray-300"
                                                                    }`}>
                                                                    {isTogglingStatus === user.id ? (
                                                                        <div className="flex items-center justify-center w-full h-full">
                                                                            <Loader2 className="h-3 w-3 animate-spin text-white" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 transform ${isActive
                                                                            ? "translate-x-5"
                                                                            : "translate-x-0.5"
                                                                            } mt-0.5`} />
                                                                    )}
                                                                </div>
                                                            </label>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* ACTIONS */}
                                                <td className="px-6 py-3">
                                                    <div className="flex gap-2">
                                                        {hasPermission("role_management.update") && !isDevAdmin && (
                                                            <button
                                                                onClick={() => {
                                                                    setEditingUser(user.id);
                                                                    setSelectedRole(user.roleId);
                                                                }}
                                                                className="p-2 text-gray-400 hover:text-green-600 transition-colors duration-200 rounded-lg hover:bg-green-50 cursor-pointer"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                        )}

                                                        {hasPermission("role_management.delete") && !isDevAdmin && (
                                                            <button
                                                                onClick={() => handleDelete(user.id)}
                                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors duration-200 rounded-lg hover:bg-red-50 cursor-pointer"
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
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="h-12 w-12 text-gray-300 mb-2" />
                                                <p className="text-lg font-medium text-gray-900">No admin users found</p>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {searchTerm
                                                        ? "Try adjusting your search criteria"
                                                        : "No admin users have been created yet"
                                                    }
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default AdminUserTable;