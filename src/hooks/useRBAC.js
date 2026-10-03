// hooks/useRBAC.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// GET ALL ADMIN
export const useAdminUsers = () => {
    const { data, error, isLoading, mutate } = useSWR(
        `${API_URL}/api/admin-user`,
        fetcher
    );

    return {
        users: data || [],
        isLoading,
        error,
        mutate
    };
};

// UPDATE ADMIN STATUS
export const useUpdateAdminStatus = () => {
    const updateStatus = async (userId, status) => {
        const res = await fetch(
            `${API_URL}/api/admin-user/users/${userId}/status`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader(),
                },
                body: JSON.stringify({
                    status: status
                }),
            }
        );

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Failed to update status");
        }

        return res.json();
    };

    return { updateStatus };
};

// GET ALL ADMIN ROLES
export const useRoles = () => {
    const { data, error, isLoading, mutate } = useSWR(
        `${API_URL}/api/rbac/roles`,
        fetcher
    );

    return {
        roles: data || [],
        error,
        isLoading,
        mutate
    };
};

// CREATE ADMIN ROLE
export const useCreateRole = () => {
    const createRole = async (roleData) => {
        const response = await fetch(`${API_URL}/api/rbac/roles`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(roleData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create role');
        }

        return response.json();
    };

    return { createRole };
};

// GET ALL PERMISSIONS
export const usePermissions = () => {
    const { data, error, isLoading, mutate } = useSWR(
        `${API_URL}/api/rbac/permissions`,
        fetcher
    );

    return {
        permissions: data || [],
        isLoading,
        error,
        mutate
    };
};

// CREATE PERMISSION
export const useCreatePermission = () => {
    const createPermission = async (payload) => {
        const res = await fetch(`${API_URL}/api/rbac/permissions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message || "Failed to create permission");
        }

        return res.json();
    };

    return { createPermission };
};

// ASSIGN PERMISSIONS
export const useAssignPermissions = () => {
    const assign = async (payload) => {
        const res = await fetch(`${API_URL}/api/rbac/roles/assign-permissions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...getAuthHeader(),
            },
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }

        return res.json();
    };

    return { assign };
};

// UPDATE ADMIN ROLE USING PATCH
export const useUpdateUserRole = () => {
    const updateRole = async (userId, roleId) => {
        const res = await fetch(`${API_URL}/api/admin-user/users/${userId}/role`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeader(),
                },
                body: JSON.stringify({ roleId }),
            }
        );

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }

        return res.json();
    };

    return { updateRole };
};

// DELETE ADMIN 
export const useDeleteUser = () => {
    const deleteUser = async (userId) => {
        const res = await fetch(`${API_URL}/api/admin-user/users/${userId}`,
            {
                method: "DELETE",
                headers: {
                    ...getAuthHeader(),
                },
            }
        );

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }

        return res.json();
    };

    return { deleteUser };
};

// GET ROLE PERMISSIONS
export const useRolePermissions = () => {
    const getRolePermissions = async (roleId) => {
        const res = await fetch(
            `${API_URL}/api/rbac/roles/${roleId}/permissions`,
            {
                headers: {
                    ...getAuthHeader(),
                },
            }
        );

        if (!res.ok) {
            throw new Error("Failed to load role permissions");
        }

        return res.json();
    };

    return {
        getRolePermissions,
    };
};