'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function useProtectedRoute(options = {}) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const [isAuthorized, setIsAuthorized] = useState(false);

    const {
        redirectTo = '/',
        checkRole = false,
        allowedRoles = []
    } = options;

    useEffect(() => {
        if (loading) return;

        if (!user) {
            sessionStorage.setItem('redirectAfterLogin', pathname);
            router.push(redirectTo);
            return;
        }

        if (checkRole && allowedRoles.length > 0) {
            const role = user?.user_metadata?.role || 'user';

            if (!allowedRoles.includes(role)) {
                router.push('/unauthorized');
                return;
            }
        }

        setIsAuthorized(true);
    }, [user, loading]);

    return { user, loading, isAuthorized };
}