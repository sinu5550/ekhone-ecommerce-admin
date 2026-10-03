'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    isAuthenticated,
    getCurrentUser,
    refreshToken,
    clearSession,
    notifyAuthChange,
} from '@/lib/auth-helpers';
import LoadingSpinner from '@/components/LoadingSpinner/LoadingSpinner';

const AUTH_STATUS = {
    LOADING: 'loading',
    AUTHENTICATED: 'authenticated',
    UNAUTHENTICATED: 'unauthenticated',
    UNAUTHORIZED: 'unauthorized',
};

export function useProtectedRoute(options = {}) {
    const {
        redirectTo = '/',
        checkRole = false,
        allowedRoles = [],
    } = options;

    const router = useRouter();
    const pathname = usePathname();

    const [status, setStatus] = useState(AUTH_STATUS.LOADING);
    const [user, setUser] = useState(null);

    const roles = useMemo(() => allowedRoles, [allowedRoles.join(',')]);

    useEffect(() => {
        let mounted = true;

        const redirect = (path) => {
            sessionStorage.setItem('redirectAfterLogin', pathname);
            if (typeof window !== 'undefined') {
                window.location.replace(path);
            } else {
                router.replace(path);
            }
        };

        const authenticate = async () => {
            try {
                if (!isAuthenticated()) {
                    if (mounted) setStatus(AUTH_STATUS.UNAUTHENTICATED);
                    redirect(redirectTo);
                    return;
                }

                let currentUser = await getCurrentUser();

                if (!currentUser) {
                    try {
                        await refreshToken();
                        currentUser = await getCurrentUser();
                    } catch {
                        clearSession();
                        notifyAuthChange();

                        if (mounted) {
                            setStatus(AUTH_STATUS.UNAUTHENTICATED);
                        }

                        redirect(redirectTo);
                        return;
                    }
                }

                if (!currentUser) {
                    clearSession();
                    notifyAuthChange();

                    if (mounted) {
                        setStatus(AUTH_STATUS.UNAUTHENTICATED);
                    }

                    redirect(redirectTo);
                    return;
                }

                if (checkRole && roles.length > 0) {
                    const role =
                        currentUser?.user_metadata?.role ?? 'user';

                    if (!roles.includes(role)) {
                        if (mounted) {
                            setStatus(AUTH_STATUS.UNAUTHORIZED);
                        }

                        router.replace('/unauthorized');
                        return;
                    }
                }

                if (mounted) {
                    setUser(currentUser);
                    setStatus(AUTH_STATUS.AUTHENTICATED);
                }
            } catch (err) {
                console.error(err);

                clearSession();
                notifyAuthChange();

                if (mounted) {
                    setStatus(AUTH_STATUS.UNAUTHENTICATED);
                }

                redirect(redirectTo);
            }
        };

        authenticate();

        if (typeof window !== 'undefined') {
            const handleAuthChange = () => {
                authenticate();
            };
            window.addEventListener('auth-change', handleAuthChange);
            return () => {
                mounted = false;
                window.removeEventListener('auth-change', handleAuthChange);
            };
        }

        return () => {
            mounted = false;
        };
    }, [pathname, redirectTo, checkRole, roles, router]);

    return {
        user,
        loading: status === AUTH_STATUS.LOADING,
        isAuthorized: status === AUTH_STATUS.AUTHENTICATED,
        status,
    };
}

export function ProtectedRoute({
    children,
    redirectTo = '/',
    loadingComponent = null,
    unauthorizedComponent = null,
    checkRole = false,
    allowedRoles = [],
}) {
    const { user, loading, isAuthorized } = useProtectedRoute({
        redirectTo,
        checkRole,
        allowedRoles,
    });

    if (loading) {
        return (
            loadingComponent ?? (
                <div>
                    <LoadingSpinner />
                </div>
            )
        );
    }

    if (!isAuthorized) {
        return unauthorizedComponent ?? null;
    }

    return (
        <>
            {typeof children === 'function'
                ? children(user)
                : children}
        </>
    );
}

export function AdminRoute(props) {
    return (
        <ProtectedRoute
            {...props}
            checkRole
            allowedRoles={['admin']}
        />
    );
}

export function PublicOnlyRoute({
    children,
    redirectTo = '/',
}) {
    const router = useRouter();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isAuthenticated()) {
            router.replace(redirectTo);
        } else {
            setLoading(false);
        }
    }, [router, redirectTo]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-teal-500" />
            </div>
        );
    }

    return children;
}