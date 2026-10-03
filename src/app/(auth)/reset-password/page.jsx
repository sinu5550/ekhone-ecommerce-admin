'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { updatePassword } from '@/lib/auth-helpers';
import { Eye, EyeOff } from "lucide-react";
import Swal from 'sweetalert2';

const ResetPassword = () => {

    const router = useRouter();
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const password = watch('password');

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const result = await updatePassword(data.password);

            if (result.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Your password has been reset successfully.',
                    confirmButtonColor: '#14b8a6'
                });

                router.push('/');
            }
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Failed',
                text: error.message || 'Failed to reset password. Please try again.',
                confirmButtonColor: '#14b8a6'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded border border-gray-300 bg-stone-100 text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition pr-12";

    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4"
            style={{
                backgroundImage: "url('https://res.cloudinary.com/du04p5ikw/image/upload/v1772426765/julissa-santana-Im8ms9HJLd0-unsplash_tdusqu.jpg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}>
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 max-w-md w-full">
                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 font-philosopher">
                        Reset Password
                    </h1>
                    <p className="text-gray-600 text-sm">
                        Create a new password for your account
                    </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-gray-800">
                    {/* New Password */}
                    <div>
                        <div className="relative">
                            <input
                                {...register("password", {
                                    required: "Password is required",
                                    minLength: {
                                        value: 6,
                                        message: "Password must be at least 6 characters"
                                    },
                                    pattern: {
                                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                                        message: "Password must contain uppercase, lowercase, and number"
                                    }
                                })}
                                type={showPassword ? "text" : "password"}
                                placeholder="New Password"
                                disabled={isLoading}
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-secound"
                                disabled={isLoading}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <div className="relative">
                            <input
                                {...register("confirmPassword", {
                                    required: "Please confirm your password",
                                    validate: (value) =>
                                        value === password || "Passwords do not match"
                                })}
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm Password"
                                disabled={isLoading}
                                className={inputClass}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-secound"
                                disabled={isLoading}
                            >
                                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-gray-600 font-medium mb-2">Password must contain:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>• At least 6 characters</li>
                            <li>• One uppercase letter</li>
                            <li>• One lowercase letter</li>
                            <li>• One number</li>
                        </ul>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary-hover px-4 py-2 text-white w-full cursor-pointer font-medium rounded transition duration-150 ease-in-out disabled:bg-teal-300 disabled:cursor-not-allowed uppercase"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;