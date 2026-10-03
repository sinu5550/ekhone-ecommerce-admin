
import { clearSession, notifyAuthChange, isTokenExpired, refreshToken } from './auth-helpers';

export async function apiClient(endpoint, options = {}) {
    const baseURL = process.env.NEXT_PUBLIC_API_URL;

    let token =
        typeof window !== "undefined"
            ? localStorage.getItem("supabase_access_token")
            : null;

    if (token && isTokenExpired(token)) {
        try {
            await refreshToken();
            token = localStorage.getItem("supabase_access_token");
        } catch (e) {
            token = null;
        }
    }

    const res = await fetch(`${baseURL}${endpoint}`, {
        ...options,

        headers: {
            "Content-Type": "application/json",

            ...(token && {
                Authorization: `Bearer ${token}`,
            }),

            ...(options.headers || {}),
        },

        cache: "no-store",
        next: { revalidate: 10 },
    });

    if (res.status === 401) {
        clearSession();
        notifyAuthChange();
    }

    const data = await res.json();

    if (!res.ok) {
        throw new Error(
            data?.message ||
            data?.error ||
            `API Error (${res.status})`
        );
    }

    return data;
}