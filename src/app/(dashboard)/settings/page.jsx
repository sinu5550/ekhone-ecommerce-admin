'use client';

import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { updatePassword } from "@/lib/auth-helpers";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { Lock, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";



const MyAccount = () => {
    return (
        <ProtectedRoute
            redirectTo="/"
            loadingComponent={<LoadingSpinner />}
        >
            {(user) => <AccountContent user={user} />}
        </ProtectedRoute>
    );
};

// Separate component for the actual content
const AccountContent = ({ user }) => {
    // Profile form state
    const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
    const [email, setEmail] = useState(user?.email || "");

    // Password form state
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);


    // Handle password change
    const handlePasswordChange = async (e) => {
        e.preventDefault();

        // Validation
        if (!currentPassword) {
            toast.error("Current password is required");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match!");
            return;
        }

        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long");
            return;
        }

        // Password strength validation
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
        if (!passwordRegex.test(newPassword)) {
            toast.error("Password must contain at least one uppercase letter, one lowercase letter, and one number");
            return;
        }

        setIsPasswordLoading(true);
        try {
            // Call the update password function
            const result = await updatePassword(newPassword);

            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Your password has been updated successfully.',
                    confirmButtonColor: '#000000',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'rounded-none',
                    }
                });

                // Reset form
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                throw new Error(result.message || 'Failed to update password');
            }
        } catch (error) {
            console.error("Password change error:", error);
            toast.error(error.message || "Failed to update password. Please try again.");
        } finally {
            setIsPasswordLoading(false);
        }
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper function to get user display name
    const getDisplayName = () => {
        if (!user) return 'Loading...';
        return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
    };

    const displayName = getDisplayName ? getDisplayName() : 'User';

    return (
        <div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Profile Information Section - Editable Form */}
                <div className="border border-gray-200 bg-white p-6 shadow-sm rounded-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-sky-50 rounded-lg">
                            <User className="h-5 w-5 text-sky-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-900">
                                Profile Information
                            </h2>
                            <p className="text-xs text-gray-500">Update your personal details</p>
                        </div>
                    </div>

                    <form className="space-y-5">
                        {/* Full Name */}
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded"
                                placeholder="Enter your full name"
                                disabled

                            />
                        </div>

                        {/* Email Address */}
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-stone-50 border border-stone-100 rounded"
                                disabled
                            />
                        </div>

                        {/* Read-only Account Info */}
                        <div className="pt-4 border-t border-gray-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Account Created</p>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {user?.created_at ? formatDate(user.created_at) : "N/A"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Last Sign In</p>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {user?.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Password Section */}
                <div className="border border-gray-200 bg-white p-6 shadow-sm rounded-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-sky-50 rounded-lg">
                            <Lock className="h-5 w-5 text-sky-600" strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-900">
                                Change Password
                            </h2>
                            <p className="text-xs text-gray-500">Update your password</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-5">
                        {/* Current Password */}
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                Current Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 rounded placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Enter current password"
                                    required
                                    disabled={isPasswordLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={isPasswordLoading}
                                >
                                    {showCurrentPassword ? (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                New Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="w-full border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 rounded placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Enter new password rounded"
                                    required
                                    minLength={6}
                                    disabled={isPasswordLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={isPasswordLoading}
                                >
                                    {showNewPassword ? (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Must be at least 6 characters with uppercase, lowercase, and number
                            </p>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="mb-2 block text-xs font-medium text-gray-700">
                                Confirm New Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-800 rounded placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                    placeholder="Confirm new password rounded"
                                    required
                                    minLength={6}
                                    disabled={isPasswordLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    disabled={isPasswordLoading}
                                >
                                    {showConfirmPassword ? (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isPasswordLoading}
                            className="mt-4 w-full border border-secound bg-secound py-2.5 text-md  font-medium font-exo tracking-[0.2em] text-white transition-colors hover:bg-white hover:text-secound disabled:bg-gray-400 disabled:cursor-not-allowed rounded"
                        >
                            {isPasswordLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Updating...
                                </span>
                            ) : 'Update Password'}
                        </button>
                    </form>

                    {/* Reset Password Link */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            Forgot your password?{' '}
                            <Link
                                href="/reset-password"
                                className="underline hover:text-gray-900 transition-colors"
                            >
                                Reset it here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyAccount;