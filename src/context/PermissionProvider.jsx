'use client';

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getCurrentAdminProfile } from "@/lib/auth-helpers";

const PermissionContext = createContext(null);

export const PermissionProvider = ({ children }) => {

    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Normalize permissions from ANY backend shape
    const normalizePermissions = (data) => {
        if (!data) return [];

        // CASE 1: already flat array
        if (Array.isArray(data.permissions)) {
            return data.permissions;
        }

        // CASE 2: nested role permissions
        if (data?.role?.permissions) {
            return data.role.permissions
                .map(p => p?.permission?.slug)
                .filter(Boolean);
        }

        return [];
    };

    const loadUser = useCallback(async () => {
        try {
            setLoading(true);

            const currentUser = await getCurrentAdminProfile();

            if (!currentUser) {
                setUser(null);
                setPermissions([]);
                return;
            }

            setUser(currentUser);

            const perms = normalizePermissions(currentUser);
            setPermissions(perms);

        } catch (err) {
            console.error("Permission load error:", err);
            setUser(null);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadUser();

        if (typeof window !== 'undefined') {
            const handleAuthChange = () => {
                loadUser();
            };
            window.addEventListener('auth-change', handleAuthChange);
            return () => {
                window.removeEventListener('auth-change', handleAuthChange);
            };
        }
    }, [loadUser]);

    // FAST PERMISSION CHECK
    const hasPermission = useCallback(
        (slug) => {
            if (!slug) return true;
            const roleName = user?.role?.name?.toLowerCase() || '';
            if (
                roleName === 'super admin' ||
                roleName === 'admin' ||
                roleName === 'system_admin' ||
                roleName === 'super_admin' ||
                roleName.includes('admin')
            ) {
                return true;
            }
            if (permissions.includes(slug)) return true;
            if ((slug === 'stock_adjustment.update_stock' || slug === 'manage_stock.update') && permissions.includes('product.update')) {
                return true;
            }
            if ((slug === 'stock_adjustment.view' || slug === 'manage_stock.view') && permissions.includes('product.view')) {
                return true;
            }
            // Fallback for collection permissions if not explicitly defined in DB
            if (slug === 'collection.view' && (permissions.includes('product.view') || permissions.includes('category.view'))) {
                return true;
            }
            if (slug === 'collection.create' && (permissions.includes('product.create') || permissions.includes('category.create'))) {
                return true;
            }
            if (slug === 'collection.update' && (permissions.includes('product.update') || permissions.includes('category.update'))) {
                return true;
            }
            if (slug === 'collection.delete' && (permissions.includes('product.delete') || permissions.includes('category.delete'))) {
                return true;
            }
            if (slug === 'collection.status_update' && (permissions.includes('status_update') || permissions.includes('product.update') || permissions.includes('category.update'))) {
                return true;
            }
            return false;
        },
        [permissions, user]
    );

    // ROLE CHECK
    const hasRole = useCallback(
        (roleName) => {
            return user?.role?.name === roleName;
        },
        [user]
    );

    return (
        <PermissionContext.Provider
            value={{
                user,
                permissions,
                loading,
                hasPermission,
                hasRole,
                refresh: loadUser,
            }}
        >
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermission = () => {
    const context = useContext(PermissionContext);

    if (!context) {
        throw new Error("usePermission must be used inside PermissionProvider");
    }

    return context;
};