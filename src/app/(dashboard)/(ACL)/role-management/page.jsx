'use client'

import { useAssignPermissions, usePermissions, useRoles, useRolePermissions } from "@/hooks/useRBAC";
import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Search, Loader2, Check, Shield, Key, ChevronDown, ChevronRight, LayoutGrid, X } from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { usePermission } from "@/context/PermissionProvider";

const RolePermissionManager = () => {

    const { roles = [] } = useRoles();
    const { permissions = [] } = usePermissions();
    const { assign } = useAssignPermissions();
    const { getRolePermissions } = useRolePermissions();
    const [selectedRole, setSelectedRole] = useState("");
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingPermissions, setLoadingPermissions] = useState(false);
    const [expandedModules, setExpandedModules] = useState({});
    const loadedRoleRef = useRef(null);
    const getRolePermissionsRef = useRef(getRolePermissions);
    const { hasPermission } = usePermission();

    useEffect(() => {
        getRolePermissionsRef.current = getRolePermissions;
    }, [getRolePermissions]);

    const fetchRolePermissions = useCallback(async (roleId) => {
        if (!roleId) {
            setSelectedPermissions([]);
            return;
        }

        try {
            setLoadingPermissions(true);
            const response = await getRolePermissionsRef.current(roleId);
            setSelectedPermissions(response || []);
            loadedRoleRef.current = roleId;
        } catch (error) {
            console.error("Failed to fetch role permissions:", error);
            toast.error("Failed to load role permissions");
            setSelectedPermissions([]);
        } finally {
            setLoadingPermissions(false);
        }
    }, []);

    useEffect(() => {
        if (selectedRole !== loadedRoleRef.current) {
            fetchRolePermissions(selectedRole);
        }
    }, [selectedRole, fetchRolePermissions]);

    // Filter roles to hide 'system_admin'
    const filteredRoles = useMemo(() => {
        return roles.filter(role => role.name?.toLowerCase() !== 'system_admin');
    }, [roles]);

    const groupedPermissions = useMemo(() => {
        const grouped = {};
        const term = searchTerm.toLowerCase().trim();

        const filtered = permissions.filter((perm) => {
            return !term ||
                perm.module?.toLowerCase().includes(term) ||
                perm.action?.toLowerCase().includes(term) ||
                perm.slug?.toLowerCase().includes(term);
        });

        filtered.forEach((perm) => {
            const module = perm.module || 'Other';
            if (!grouped[module]) {
                grouped[module] = [];
            }
            grouped[module].push(perm);
        });

        const sortedGrouped = {};
        Object.keys(grouped).sort().forEach(key => {
            sortedGrouped[key] = grouped[key];
        });

        return sortedGrouped;
    }, [permissions, searchTerm]);

    const totalFilteredPermissions = useMemo(() => {
        return Object.values(groupedPermissions).reduce((acc, perms) => acc + perms.length, 0);
    }, [groupedPermissions]);

    const selectedRoleName = useMemo(() => {
        const role = roles.find(r => r.id === selectedRole);
        return role?.name || '';
    }, [roles, selectedRole]);

    const isModuleFullySelected = useCallback((modulePermissions) => {
        return modulePermissions.every(perm => selectedPermissions.includes(perm.id));
    }, [selectedPermissions]);

    const isModulePartiallySelected = useCallback((modulePermissions) => {
        const selectedCount = modulePermissions.filter(perm => selectedPermissions.includes(perm.id)).length;
        return selectedCount > 0 && selectedCount < modulePermissions.length;
    }, [selectedPermissions]);

    const toggleModule = useCallback((modulePermissions) => {
        const moduleIds = modulePermissions.map(p => p.id);
        const allSelected = moduleIds.every(id => selectedPermissions.includes(id));

        if (allSelected) {
            setSelectedPermissions(prev => prev.filter(id => !moduleIds.includes(id)));
        } else {
            const newIds = moduleIds.filter(id => !selectedPermissions.includes(id));
            setSelectedPermissions(prev => [...prev, ...newIds]);
        }
    }, [selectedPermissions]);

    const togglePermission = useCallback((id) => {
        setSelectedPermissions((prev) =>
            prev.includes(id)
                ? prev.filter((p) => p !== id)
                : [...prev, id]
        );
    }, []);

    const toggleModuleExpansion = useCallback((module) => {
        setExpandedModules(prev => ({
            ...prev,
            [module]: !prev[module]
        }));
    }, []);

    const toggleAllPermissions = useCallback(() => {
        const allIds = Object.values(groupedPermissions).flat().map(p => p.id);
        const allSelected = allIds.every(id => selectedPermissions.includes(id));

        if (allSelected) {
            setSelectedPermissions([]);
        } else {
            setSelectedPermissions(allIds);
        }
    }, [groupedPermissions, selectedPermissions]);

    const handleSubmit = useCallback(async () => {
        if (!selectedRole) {
            toast.error("Please select a role first");
            return;
        }

        if (selectedPermissions.length === 0) {
            toast.error("Please select at least one permission");
            return;
        }

        const result = await Swal.fire({
            title: "Assign Permissions?",
            text: `You are about to assign ${selectedPermissions.length} permission(s) to "${selectedRoleName}"`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, assign them!",
            cancelButtonText: "Cancel",
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                await assign({
                    roleId: selectedRole,
                    permissionIds: selectedPermissions,
                });

                toast.success(`Permissions assigned to "${selectedRoleName}" successfully`);
                loadedRoleRef.current = null;
                await fetchRolePermissions(selectedRole);
            } catch (err) {
                console.error("Assignment failed:", err);
                toast.error(err.message || "Failed to assign permissions");
            } finally {
                setLoading(false);
            }
        }
    }, [selectedRole, selectedPermissions, selectedRoleName, assign, fetchRolePermissions]);

    const handleSearchChange = useCallback((e) => {
        setSearchTerm(e.target.value);
    }, []);

    const handleClearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    const handleRoleChange = useCallback((e) => {
        const newRoleId = e.target.value;
        setSelectedRole(newRoleId);
        setExpandedModules({});
        setSearchTerm('');
        if (newRoleId !== loadedRoleRef.current) {
            loadedRoleRef.current = null;
        }
    }, []);

    const getModuleStyles = (module) => {
        const styles = {

            dashboard: { bg: "bg-blue-500", hover: "hover:bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
            role_management: { bg: "bg-indigo-500", hover: "hover:bg-indigo-50", border: "border-indigo-200", text: "text-indigo-600" },
            product: { bg: "bg-emerald-500", hover: "hover:bg-emerald-50", border: "border-emerald-200", text: "text-emerald-600" },
            create_product: { bg: "bg-green-500", hover: "hover:bg-green-50", border: "border-green-200", text: "text-green-600" },
            manage_stock: { bg: "bg-lime-500", hover: "hover:bg-lime-50", border: "border-lime-200", text: "text-lime-600" },
            stock_adjustment: { bg: "bg-yellow-500", hover: "hover:bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600" },
            main_category: { bg: "bg-orange-500", hover: "hover:bg-orange-50", border: "border-orange-200", text: "text-orange-600" },
            category: { bg: "bg-amber-500", hover: "hover:bg-amber-50", border: "border-amber-200", text: "text-amber-600" },
            sub_category: { bg: "bg-yellow-500", hover: "hover:bg-yellow-50", border: "border-yellow-200", text: "text-yellow-600" },
            brand: { bg: "bg-pink-500", hover: "hover:bg-pink-50", border: "border-pink-200", text: "text-pink-600" },
            unit: { bg: "bg-cyan-500", hover: "hover:bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600" },
            variant_attribute: { bg: "bg-violet-500", hover: "hover:bg-violet-50", border: "border-violet-200", text: "text-violet-600" },
            warranty: { bg: "bg-rose-500", hover: "hover:bg-rose-50", border: "border-rose-200", text: "text-rose-600" },
            order: { bg: "bg-sky-500", hover: "hover:bg-sky-50", border: "border-sky-200", text: "text-sky-600" },
            invoice: { bg: "bg-red-500", hover: "hover:bg-red-50", border: "border-red-200", text: "text-red-600" },
            coupon: { bg: "bg-fuchsia-500", hover: "hover:bg-fuchsia-50", border: "border-fuchsia-200", text: "text-fuchsia-600" },
            discount: { bg: "bg-purple-500", hover: "hover:bg-purple-50", border: "border-purple-200", text: "text-purple-600" },
            bundle_product: { bg: "bg-primary", hover: "hover:bg-teal-50", border: "border-teal-200", text: "text-teal-600" },
            customer: { bg: "bg-cyan-500", hover: "hover:bg-cyan-50", border: "border-cyan-200", text: "text-cyan-600" },
            user: { bg: "bg-purple-500", hover: "hover:bg-purple-50", border: "border-purple-200", text: "text-purple-600" },
            admin: { bg: "bg-slate-500", hover: "hover:bg-slate-50", border: "border-slate-200", text: "text-slate-600" },
            payment: { bg: "bg-blue-500", hover: "hover:bg-blue-50", border: "border-blue-200", text: "text-blue-600" },
            report: { bg: "bg-stone-500", hover: "hover:bg-stone-50", border: "border-stone-200", text: "text-stone-600" },
            setting: { bg: "bg-gray-500", hover: "hover:bg-gray-50", border: "border-gray-200", text: "text-gray-600" },
            notification: { bg: "bg-violet-500", hover: "hover:bg-violet-50", border: "border-violet-200", text: "text-violet-600" },
            cms: { bg: "bg-teal-500", hover: "hover:bg-teal-50", border: "border-teal-200", text: "text-teal-600" },
            analytics: { bg: "bg-green-500", hover: "hover:bg-green-50", border: "border-green-200", text: "text-green-600" },
            access_management: { bg: "bg-violet-500", hover: "hover:bg-violet-50", border: "border-violet-200", text: "text-violet-600" },
             text: { bg: "bg-zinc-500", hover: "hover:bg-zinc-50", border: "border-zinc-200", text: "text-zinc-600" },
        };

        return styles[module?.toLowerCase()] || { bg: "bg-gray-500", hover: "hover:bg-gray-50", border: "border-gray-200", text: "text-gray-600" };
    };

    return (
        <ProtectedRoute>
            <div className="">
                <div className="mb-6">
                    <h1 className="text-3xl font-semibold text-gray-800 font-philosopher">Permission Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage role permissions and access controls</p>
                </div>
                {hasPermission('access_management.view') && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <div className="lg:col-span-1 sticky top-10">
                            <div className="bg-white rounded border border-gray-200 p-4 sticky top-24">
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Select Role
                                    </label>
                                    <select
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none transition text-sm"
                                        value={selectedRole}
                                        onChange={handleRoleChange}
                                    >
                                        <option value="">--- Choose a role ---</option>
                                        {filteredRoles?.map((role) => (
                                            <option key={role.id} value={role.id}>
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedRole && (
                                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">
                                                {selectedRoleName}
                                            </span>
                                            <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full">
                                                {selectedPermissions.length} selected
                                            </span>
                                        </div>
                                        {loadingPermissions && (
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Loading permissions...
                                            </div>
                                        )}
                                    </div>
                                )}
                                {hasPermission('access_management.assign_role_permissions') && (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading || !selectedRole || loadingPermissions}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition cursor-pointer"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Assigning...
                                            </>
                                        ) : (
                                            <>
                                                <Key className="h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                )}
                                <div className="mt-3 p-2 bg-purple-50 border border-purple-100 rounded">
                                    <p className="text-xs text-purple-600 italic">
                                        <span className="font-medium">Tip:</span> Assign permissions to control what users with this role can access.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-3">
                            <div className="bg-white rounded-lg border border-gray-200">
                                <div className="p-4 border-b border-gray-200">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            <LayoutGrid className="h-4 w-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700">
                                                Permissions
                                                {selectedRole && !loadingPermissions && (
                                                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                                                        ({totalFilteredPermissions})
                                                    </span>
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={handleSearchChange}
                                                    placeholder="Search permissions..."
                                                    className="pl-8 pr-8 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-primary focus:border-primary outline-none w-full sm:w-56 transition"
                                                />
                                                {searchTerm && (
                                                    <button
                                                        onClick={handleClearSearch}
                                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 hover:bg-gray-100 rounded-full p-0.5 transition"
                                                    >
                                                        <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                                                    </button>
                                                )}
                                            </div>

                                            {selectedRole && Object.keys(groupedPermissions).length > 0 && !loadingPermissions && (
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => setExpandedModules({})}
                                                        className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition"
                                                    >
                                                        Collapse
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            const allExpanded = {};
                                                            Object.keys(groupedPermissions).forEach(module => {
                                                                allExpanded[module] = true;
                                                            });
                                                            setExpandedModules(allExpanded);
                                                        }}
                                                        className="px-2.5 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-md transition"
                                                    >
                                                        Expand
                                                    </button>
                                                    <button
                                                        onClick={toggleAllPermissions}
                                                        className="px-2.5 py-1 text-xs text-sky-600 hover:bg-sky-50 rounded-md transition cursor-pointer"
                                                    >
                                                        {Object.values(groupedPermissions).flat().every(id => selectedPermissions.includes(id))
                                                            ? 'Deselect All'
                                                            : 'Select All'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4">
                                    {!selectedRole ? (
                                        <div className="text-center py-12">
                                            <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">Select a role to manage permissions</p>
                                        </div>
                                    ) : loadingPermissions ? (
                                        <div className="text-center py-12">
                                            <Loader2 className="h-8 w-8 text-sky-500 animate-spin mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">Loading permissions...</p>
                                        </div>
                                    ) : Object.keys(groupedPermissions).length === 0 ? (
                                        <div className="text-center py-12">
                                            <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">
                                                {searchTerm ? "No permissions match your search" : "No permissions available"}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {Object.entries(groupedPermissions).map(([module, modulePermissions]) => {
                                                const isExpanded = expandedModules[module] ?? true;
                                                const isFullySelected = isModuleFullySelected(modulePermissions);
                                                const isPartiallySelected = isModulePartiallySelected(modulePermissions);
                                                const moduleSelectedCount = modulePermissions.filter(p => selectedPermissions.includes(p.id)).length;
                                                const styles = getModuleStyles(module);

                                                return (
                                                    <div key={module} className="border border-stone-200 rounded overflow-hidden">
                                                        <div
                                                            className={`flex items-center justify-between px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition ${isPartiallySelected ? 'bg-sky-50/50' :
                                                                isFullySelected ? 'bg-stone-100' : 'bg-white'
                                                                }`}
                                                            onClick={() => toggleModuleExpansion(module)}
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className={`w-3 h-3 animate-pulse rounded-full ${styles.bg}`} />
                                                                <span className="text-sm font-medium text-gray-800 capitalize truncate">
                                                                    {module}
                                                                </span>
                                                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                                                    ({moduleSelectedCount}/{modulePermissions.length})
                                                                </span>
                                                                {isFullySelected && (
                                                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                        Full Access
                                                                    </span>
                                                                )}
                                                                {isPartiallySelected && (
                                                                    <span className="text-xs bg-sky-100 text-sky-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                                        Partial
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 ml-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleModule(modulePermissions);
                                                                    }}
                                                                    className={`px-2.5 py-0.5 text-xs rounded-md transition ${isFullySelected
                                                                        ? 'text-red-600 hover:bg-red-50'
                                                                        : 'text-sky-600 hover:bg-sky-50'
                                                                        }`}
                                                                >
                                                                    {isFullySelected ? 'Remove' : 'Add All'}
                                                                </button>
                                                                {isExpanded ? (
                                                                    <ChevronDown className="h-4 w-4 text-gray-400" />
                                                                ) : (
                                                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </div>

                                                        {isExpanded && (
                                                            <div className="px-4 py-3 bg-gray-50/50 border-t border-gray-200">
                                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-4 gap-5">
                                                                    {modulePermissions?.map((perm) => {
                                                                        const isChecked = selectedPermissions.includes(perm.id);
                                                                        return (
                                                                            <label
                                                                                key={perm.id}
                                                                                className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition ${isChecked
                                                                                    ? 'bg-sky-50 border border-sky-200'
                                                                                    : 'bg-white border border-gray-200 hover:border-gray-300'
                                                                                    }`}
                                                                                onClick={() => togglePermission(perm.id)}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isChecked}
                                                                                    onChange={() => togglePermission(perm.id)}
                                                                                    className="w-3.5 h-3.5 text-sky-600 border-gray-300 rounded focus:ring-sky-500 focus:ring-1 cursor-pointer"
                                                                                />
                                                                                <span className="text-xs text-gray-700 truncate">
                                                                                    {perm.action}
                                                                                </span>
                                                                                {isChecked && (
                                                                                    <Check className="h-3 w-3 text-pink-600 ml-auto flex-shrink-0" />
                                                                                )}
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {selectedRole && Object.keys(groupedPermissions).length > 0 && !loadingPermissions && (
                                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <span className="text-sm text-gray-600">
                                                    <span className="font-medium">{selectedPermissions.length}</span> of{' '}
                                                    <span className="font-medium">{totalFilteredPermissions}</span> selected
                                                </span>
                                                <span className="text-md font-medium text-orange-500">
                                                    {Math.round((selectedPermissions.length / totalFilteredPermissions) * 100)}%
                                                </span>
                                            </div>
                                            <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-orange-600 transition-all duration-300 rounded-full"
                                                    style={{
                                                        width: `${(selectedPermissions.length / totalFilteredPermissions) * 100}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default RolePermissionManager;