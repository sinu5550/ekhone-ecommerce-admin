// lib/auth-helper

import { createClient } from '@/utils/supabase/client.js';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
let cachedUser = null;

export function notifyAuthChange() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-change'));
    }
}

export function isTokenExpired(token) {
    if (!token) return true;
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return true;
        
        let jsonPayload;
        if (typeof window === 'undefined') {
            jsonPayload = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8');
        } else {
            const base64Url = parts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            jsonPayload = decodeURIComponent(
                window.atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
        }
        const payload = JSON.parse(jsonPayload);
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp ? (payload.exp < currentTime + 10) : true;
    } catch (e) {
        return true;
    }
}

export function clearSession() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase_access_token');
        localStorage.removeItem('supabase_refresh_token');
        localStorage.removeItem('supabase_user');
        sessionStorage.clear();
    }
    cachedUser = null;
}


// Sign Up
export async function signUp(email, password, name) {
    try {
        const response = await axios.post(`${API_URL}/api/admin-auth/signup`, {
            email,
            password,
            name
        });

        console.log('✅ Sign up response:', response.data);
        return response.data;
    } catch (error) {
        console.error('❌ Sign up error:', error.response?.data);
        throw new Error(error.response?.data?.error || 'Sign up failed');
    }
}


// In your auth-helpers.js
export async function resendOtp(email) {
    try {
        const response = await axios.post(`${API_URL}/api/admin-auth/resend-otp`, {
            email
        });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.error || 'Failed to resend OTP');
    }
}


// Verify OTP
export async function verifyOtp(email, otp, isPasswordReset = false) {
    try {
        const response = await axios.post(`${API_URL}/api/admin-auth/verify-otp`, {
            email,
            otp,
            isPasswordReset
        });

        if (response.data.success && response.data.data.session) {
            // Store session in localStorage
            localStorage.setItem('supabase_access_token', response.data.data.session.access_token);
            localStorage.setItem('supabase_refresh_token', response.data.data.session.refresh_token);

            // Store user data
            localStorage.setItem('supabase_user', JSON.stringify(response.data.data.user));

            // Update cache
            cachedUser = response.data.data.user;
            notifyAuthChange();
        }

        return response.data;
    } catch (error) {
        console.error('❌ OTP verification error:', error.response?.data);
        throw new Error(error.response?.data?.error || 'OTP verification failed');
    }
}

// Login with Email/Password
export async function login(email, password) {
    try {
        const response = await axios.post(`${API_URL}/api/admin-auth/login`, {
            email,
            password
        });

        if (response.data.success && response.data.data.session) {
            // Store session in localStorage
            localStorage.setItem('supabase_access_token', response.data.data.session.access_token);
            localStorage.setItem('supabase_refresh_token', response.data.data.session.refresh_token);

            // Store user data
            localStorage.setItem('supabase_user', JSON.stringify(response.data.data.user));

            // Update cache
            cachedUser = response.data.data.user;
            notifyAuthChange();
        }

        return response.data;
    } catch (error) {
        console.error('❌ Login error:', error.response?.data);
        throw new Error(error.response?.data?.error || 'Login failed');
    }
}


// Request Password Reset
export async function requestPasswordReset(email) {
    try {
        const response = await axios.post(`${API_URL}/api/admin-auth/request-password-reset`, {
            email
        });

        return response.data;
    } catch (error) {
        console.error('❌ Password reset request error:', error.response?.data);
        throw new Error(error.response?.data?.error || 'Password reset request failed');
    }
}

// Update Password
export async function updatePassword(newPassword) {
    try {
        const token = localStorage.getItem('supabase_access_token');

        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await axios.put(
            `${API_URL}/api/admin-auth/update-password`,
            { newPassword },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        return response.data;
    } catch (error) {
        console.error('❌ Password update error:', error.response?.data);
        throw new Error(error.response?.data?.error || 'Password update failed');
    }
}

// Logout
export async function logout() {
    try {
        const token = localStorage.getItem('supabase_access_token');

        if (token) {
            await axios.post(
                `${API_URL}/api/admin-auth/logout`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        }

        // Clear all auth data
        clearSession();
        notifyAuthChange();

        return { success: true };
    } catch (error) {
        // Clear local storage even if request fails
        clearSession();
        notifyAuthChange();

        console.error('❌ Logout error:', error.response?.data);
        throw new Error(error.response?.data?.error || 'Logout failed');
    }
}

// Get Current User
export async function getCurrentUser() {
    const token = localStorage.getItem('supabase_access_token');
    if (!token) {
        cachedUser = null;
        return null;
    }

    let currentToken = token;
    if (isTokenExpired(currentToken)) {
        cachedUser = null;
        try {
            await refreshToken();
            currentToken = localStorage.getItem('supabase_access_token');
        } catch (error) {
            clearSession();
            notifyAuthChange();
            return null;
        }
    }

    if (cachedUser) return cachedUser;

    try {
        const res = await axios.get(`${API_URL}/api/admin-auth/me`, {
            headers: { Authorization: `Bearer ${currentToken}` }
        });

        cachedUser = res.data.data.user;
        return cachedUser;

    } catch (error) {
        if (error.response?.status === 401) {
            clearSession();
            notifyAuthChange();
        }
        return null;
    }
}

// Refresh Token
export async function refreshToken() {
    try {
        const refresh_token = localStorage.getItem('supabase_refresh_token');

        if (!refresh_token) {
            throw new Error('No refresh token found');
        }

        const response = await axios.post(`${API_URL}/api/admin-auth/refresh-token`, {
            refreshToken: refresh_token
        });

        if (response.data.success && response.data.data.session) {
            localStorage.setItem('supabase_access_token', response.data.data.session.access_token);
            localStorage.setItem('supabase_refresh_token', response.data.data.session.refresh_token);
        }

        return response.data;
    } catch (error) {
        console.error('❌ Token refresh error:', error.response?.data);
        clearSession();
        notifyAuthChange();
        throw new Error(error.response?.data?.error || 'Token refresh failed');
    }
}


// Check if user is authenticated
export function isAuthenticated() {
    const token = localStorage.getItem('supabase_access_token');
    const user = localStorage.getItem('supabase_user');
    return !!(token && user);
}


// Get stored user data
export function getStoredUser() {
    try {
        const userStr = localStorage.getItem('supabase_user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
        console.error('Error parsing stored user:', error);
        return null;
    }
}



// Get Current Admin Profile (RBAC)
export async function getCurrentAdminProfile() {
    try {
        let token = localStorage.getItem("supabase_access_token");

        if (!token) return null;

        if (isTokenExpired(token)) {
            try {
                await refreshToken();
                token = localStorage.getItem("supabase_access_token");
            } catch (err) {
                clearSession();
                notifyAuthChange();
                return null;
            }
        }

        const res = await axios.get(`${API_URL}/api/admin-user/profile`, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        return res.data;

    } catch (error) {
        if (error.response?.status === 401) {
            clearSession();
            notifyAuthChange();
        }

        return null;
    }
}