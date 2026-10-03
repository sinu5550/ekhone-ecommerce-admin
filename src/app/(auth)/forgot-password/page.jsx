'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { requestPasswordReset } from '@/lib/auth-helpers';
import Swal from 'sweetalert2';
import Link from 'next/link';

const ForgotPassword = () => {
    
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const result = await requestPasswordReset(data.email);

            if (result.success) {
                // Store email for OTP verification
                sessionStorage.setItem('verificationEmail', data.email);
                sessionStorage.setItem('isPasswordReset', 'true');

                await Swal.fire({
                    icon: 'success',
                    title: 'Email Sent!',
                    text: 'Password reset code has been sent to your email.',
                    confirmButtonColor: '#14b8a6'
                });

                router.push('/verify-otp');
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.message || 'Failed to send reset code. Please try again.',
                confirmButtonColor: '#14b8a6'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] p-4">
            <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(16,45,80,0.08)] border border-gray-100 p-8 md:p-10 max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-[#102D50] mb-2 font-inter">
                        Forgot Password?
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Enter your email address and we'll send you a code to reset your password
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 text-gray-800">
                    {/* Email Input */}
                    <div>
                        <input
                            {...register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                    message: "Invalid email address"
                                }
                            })}
                            type="email"
                            placeholder="admin@ekhone.com"
                            disabled={isLoading}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#F45116]/30 focus:border-[#F45116] transition text-[#102D50]"
                        />
                        {errors.email && (
                            <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email.message}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#F45116] hover:bg-[#D9400B] px-4 py-3 text-white w-full cursor-pointer font-semibold rounded-xl transition duration-200 shadow-md shadow-[#F45116]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-500 text-sm">
                        Remember your password?{' '}
                        <Link href="/" className="text-[#F45116] hover:text-[#D9400B] hover:underline font-semibold">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;