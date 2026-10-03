'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    getCurrentUser,
    refreshToken,
    clearSession,
    notifyAuthChange,
    isTokenExpired,
} from '@/lib/auth-helpers';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const loadUser = useCallback(async () => {
        try {
            let currentUser = await getCurrentUser();

            if (!currentUser) {
                try {
                    await refreshToken();
                    currentUser = await getCurrentUser();
                } catch (error) {
                    console.error('Token refresh failed:', error);
                    clearSession();
                    currentUser = null;
                }
            }

            setUser(currentUser);

            return currentUser;
        } catch (error) {
            console.error('Failed to initialize authentication:', error);

            clearSession();
            setUser(null);

            return null;
        }
    }, []);

    const refreshUser = useCallback(async () => {
        return await loadUser();
    }, [loadUser]);

    const logout = useCallback(() => {
        clearSession();
        setUser(null);
        notifyAuthChange();
    }, []);

    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            if (!isMounted) return;

            setLoading(true);

            await loadUser();

            if (isMounted) {
                setLoading(false);
            }
        };

        initialize();

        return () => {
            isMounted = false;
        };
    }, [loadUser]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleAuthChange = () => {
            const token = localStorage.getItem('supabase_access_token');
            if (!token) {
                setUser(null);
            } else {
                loadUser();
            }
        };

        window.addEventListener('auth-change', handleAuthChange);
        return () => {
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, [loadUser]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkTokenExpiry = async () => {
            const token = localStorage.getItem('supabase_access_token');
            const storedUser = localStorage.getItem('supabase_user');

            if (!token || !storedUser) {
                if (user !== null) {
                    logout();
                }
                return;
            }

            if (isTokenExpired(token)) {
                try {
                    await refreshToken();
                } catch (error) {
                    console.error('Auto-refresh token failed on check:', error);
                    logout();
                }
            }
        };

        // Run check initially
        checkTokenExpiry();

        // Run check every 2 seconds
        const interval = setInterval(checkTokenExpiry, 2000);

        return () => clearInterval(interval);
    }, [logout, user]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleStorageChange = (e) => {
            if (e.key === 'supabase_access_token' || e.key === 'supabase_user') {
                if (!e.newValue) {
                    logout();
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [logout]);

    const value = useMemo(
        () => ({
            user,
            setUser,
            loading,
            refreshUser,
            logout,
            isAuthenticated: !!user,
        }),
        [user, loading, refreshUser, logout]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }

    return context;
}