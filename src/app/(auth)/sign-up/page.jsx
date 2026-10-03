'use client';

import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from 'react-hook-form';
import { Eye, EyeOff } from "lucide-react";
import Swal from 'sweetalert2';
import toast from "react-hot-toast";
import { signUp } from "@/lib/auth-helpers";
import { apiClient } from "@/lib/apiClient";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import { useRoles } from "@/hooks/useRBAC";
import { FaSpinner } from "react-icons/fa";


const SignUp = () => {

    const { register, handleSubmit, formState: { errors }, reset } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter()
    const { roles } = useRoles();


    const filteredRoles = useMemo(() => {
        return roles.filter(
            (role) => role.name?.toLowerCase() !== "system_admin"
        );
    }, [roles]);

    // Function to create customer in database
    const createAdminUserInDatabase = async (userData, authId) => {
        try {
            const customerData = {
                name: userData.name,
                email: userData.email,
                authId: authId,
                roleId: userData.roleId,
                status: "Active",
            };

            const response = await apiClient("/api/admin-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(customerData),
            });

            if (response.success) {
                toast.success(response.message || "user added successfully!");
                reset();

            } else {
                throw new Error(response.message || "Failed to add user");
            }
        } catch (error) {
            console.error("Error adding user:", error);
            toast.error(error.message || "Failed to add user");
        }
    };


    // Main onSubmit function
    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Step 1: Create auth account in Supabase
            const authResult = await signUp(
                data.email,
                data.password,
                data.name
            );

            if (authResult.success) {
                // Step 2: Create admin in database
                try {
                    await createAdminUserInDatabase(data, authResult.data?.user?.id);

                    // Store email for verification
                    sessionStorage.setItem('verificationEmail', data.email);
                    sessionStorage.setItem('isPasswordReset', 'false');

                    // Success message
                    await Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'Account created! Please check email for verification code.',
                        confirmButtonColor: '#14b8a6',
                        showConfirmButton: true
                    });

                    // Redirect to OTP verification
                    router.push('/verify-otp');

                } catch (dbError) {
                    // If database fails but auth succeeded, show specific error
                    await Swal.fire({
                        icon: 'warning',
                        title: 'Partial Success',
                        html: `
                            <div class="text-left">
                                <p>Authentication successful but profile creation failed.</p>
                                <p class="text-sm mt-2">Please verify your email first, then contact support to complete your profile.</p>
                            </div>
                        `,
                        confirmButtonColor: '#14b8a6'
                    });

                    // Still allow verification
                    sessionStorage.setItem('verificationEmail', data.email);
                    sessionStorage.setItem('isPasswordReset', 'false');
                    router.push('/verify-otp');
                }
            }
        } catch (error) {
            // Handle auth errors
            let errorMessage = error.message || 'Failed to create account';

            if (errorMessage.includes('already registered')) {
                errorMessage = 'This email is already registered. Please login instead.';
            }

            await Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: errorMessage,
                confirmButtonColor: '#14b8a6',
                footer: errorMessage.includes('already registered')
                    ? '<a href="/" style="color: #14b8a6">Go to Login</a>'
                    : ''
            });
        } finally {
            setIsLoading(false);
        }
    };




    // Consistent styling classes
    const inputClass = "w-full px-4 py-2  border border-gray-300 bg-white text-sm rounded md:text-base placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700";
    const errorClass = "mt-1.5 text-sm text-red-500 font-medium";


    return (
        <ProtectedRoute>
            <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] p-4">
                <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(16,45,80,0.08)] bg-white border border-gray-100">

                    <div className="w-full p-6 md:p-8 lg:p-12">
                        <div className="max-w-md mx-auto">
                            {/* Header */}
                            <div className="text-center mb-8">
                                <h2 className="text-2xl md:text-3xl font-bold text-[#102D50] mb-2 font-inter">
                                    Create Admin Account
                                </h2>
                                <p className="text-gray-500 text-sm">
                                    Please provide admin details to assign access
                                </p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#102D50] mb-1.5">
                                        Full Name
                                    </label>
                                    <input
                                        {...register("name", {
                                            required: "Full name is required",
                                            minLength: {
                                                value: 2,
                                                message: "Name must be at least 2 characters"
                                            }
                                        })}
                                        type="text"
                                        placeholder="Full Name"
                                        className={inputClass}
                                        disabled={isLoading}
                                    />
                                    {errors.name && (
                                        <p className={errorClass}>{errors.name.message}</p>
                                    )}
                                </div>

                                {/* Email Input */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#102D50] mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        {...register("email", {
                                            required: "Email is required",
                                            pattern: {
                                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                                message: "Please enter a valid email address"
                                            }
                                        })}
                                        type="email"
                                        placeholder="admin@ekhone.com"
                                        className={inputClass}
                                        disabled={isLoading}
                                    />
                                    {errors.email && (
                                        <p className={errorClass}>{errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#102D50] mb-1.5">
                                        Assign Role
                                    </label>
                                    <select
                                        {...register("roleId", {
                                            required: "Role is required",
                                        })}
                                        className={inputClass}
                                        disabled={isLoading}
                                    >
                                        <option value=""> - - - Select Role - - - </option>

                                        {filteredRoles.map((role) => (
                                            <option
                                                key={role.id}
                                                value={role.id}
                                            >
                                                {role.name}
                                            </option>
                                        ))}
                                    </select>

                                    {errors.roleId && (
                                        <p className={errorClass}>
                                            {errors.roleId.message}
                                        </p>
                                    )}
                                </div>

                                {/* Password Input */}
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#102D50] mb-1.5">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            {...register("password", {
                                                required: "Password is required",
                                                minLength: {
                                                    value: 6,
                                                    message: "Password must be at least 6 characters"
                                                },
                                                pattern: {
                                                    value: /^(?=.*[A-Za-z])(?=.*\d)/,
                                                    message: "Password must contain at least one letter and one number"
                                                }
                                            })}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className={inputClass + " pr-12"}
                                            disabled={isLoading}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#102D50] transition-colors disabled:opacity-50"
                                            disabled={isLoading}
                                        >
                                            {showPassword ?
                                                <EyeOff size={18} strokeWidth={1.5} /> :
                                                <Eye size={18} strokeWidth={1.5} />
                                            }
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className={errorClass}>{errors.password.message}</p>
                                    )}
                                    <p className="mt-1.5 text-xs text-gray-400">
                                        Must be at least 6 characters with letters and numbers
                                    </p>
                                </div>
                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="bg-[#F45116] hover:bg-[#D9400B] px-4 py-3 rounded-xl font-semibold text-white w-full cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-[#F45116]/20 transition-all duration-300 disabled:opacity-50"
                                >
                                    {isLoading ? (
                                        <>
                                            <FaSpinner className="animate-spin text-white" />
                                            <span>Creating Account...</span>
                                        </>
                                    ) : 'Sign Up Admin'}
                                </button>
                            </form>

                            {/* Login Link */}
                            <div className="pt-6">
                                <p className="text-center text-gray-500 text-xs">
                                    Already have an account?{' '}
                                    <Link
                                        href="/"
                                        className="text-[#F45116] hover:text-[#D9400B] font-semibold hover:underline transition-colors"
                                    >
                                        Sign in
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default SignUp;