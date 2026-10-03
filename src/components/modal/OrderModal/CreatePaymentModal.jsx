"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";

const CreatePaymentModal = ({ isOpen, onClose, order, onSuccess }) => {

    const [loading, setLoading] = useState(false);

    const [paymentMethods, setPaymentMethods] = useState([
        { value: "COD", label: "Cash on Delivery" },
        { value: "OnlinePayment", label: "Online Payment" },
        { value: "BankTransfer", label: "Bank Transfer" },
        { value: "Check", label: "Check" },
        { value: "Cash", label: "Cash" },
        { value: "EMI", label: "EMI" },
        { value: "Other", label: "Other" }
    ]);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors, isValid }
    } = useForm({
        mode: "onChange",
        defaultValues: {
            amount: "",
            paymentMethod: "COD",
            reference: "",
            notes: ""
        }
    });

    const paymentAmount = watch("amount");
    const dueAmount = parseFloat(order?.dueAmount || 0);

    useEffect(() => {
        if (order && isOpen) {
            reset({
                amount: "",
                paymentMethod: "COD",
                reference: "",
                notes: ""
            });
        }
    }, [order, isOpen, reset]);

    const onSubmit = async (data) => {
        if (!order) return;

        try {
            setLoading(true);

            const paymentData = {
                orderId: order.id,
                amount: parseFloat(data.amount),
                paymentMethod: data.paymentMethod,
                reference: data.reference || null,
                notes: data.notes || ""
            };

            await apiClient("/api/payments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(paymentData),
            });

            toast.success("Payment created successfully!");
            onSuccess();
            onClose();

        } catch (error) {
            console.error("Error creating payment:", error);
            toast.error(error.message || "Failed to create payment. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const validateAmount = (value) => {
        if (!value || value === "") {
            return "Payment amount is required";
        }
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
            return "Amount must be greater than 0";
        }
        if (amount > dueAmount) {
            return `Amount cannot exceed due amount (৳${dueAmount.toFixed(2)})`;
        }
        return true;
    };

    const handleFullPayment = () => {
        setValue("amount", dueAmount.toString(), { shouldValidate: true });
    };

    if (!order) return null;

    return (
        <BaseModal isOpen={isOpen} onClose={handleClose} title="Create Payment" size="xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Order Information */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                    <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Order #:</span>
                            <span className="font-medium">{order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Customer:</span>
                            <span className="font-medium">
                                {order.customer?.fullName} ({order.customer?.email})
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Grand Total:</span>
                            <span className="font-medium">৳{parseFloat(order.grandTotal || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Paid Amount:</span>
                            <span className="font-medium text-green-600">৳{parseFloat(order.paidAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-blue-200">
                            <span className="text-gray-700 font-semibold">Due Amount:</span>
                            <span className="font-bold text-red-600">৳{dueAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Payment Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Amount <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">৳</span>
                            <input
                                type="number"
                                step="0.01"
                                {...register("amount", {
                                    required: "Payment amount is required",
                                    validate: validateAmount
                                })}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                placeholder="0.00"
                            />
                        </div>
                        {errors.amount && (
                            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                        )}
                        {dueAmount > 0 && (
                            <button
                                type="button"
                                onClick={handleFullPayment}
                                className="mt-1 text-xs text-secound hover:text-secound-hover"
                            >
                                Pay Full Amount (৳{dueAmount.toFixed(2)})
                            </button>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method <span className="text-red-500">*</span>
                        </label>
                        <select
                            {...register("paymentMethod", { required: "Payment method is required" })}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                        >
                            {paymentMethods.map((method) => (
                                <option key={method.value} value={method.value}>
                                    {method.label}
                                </option>
                            ))}
                        </select>
                        {errors.paymentMethod && (
                            <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                        )}
                    </div>

                    {/* Reference Number */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reference Number
                        </label>
                        <input
                            type="text"
                            {...register("reference")}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                            placeholder="Transaction ID, Check number, etc."
                        />
                    </div>

                    {/* Notes */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            {...register("notes")}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                            placeholder="Additional notes about this payment..."
                        />
                    </div>
                </div>

                {/* Payment Summary */}
                {paymentAmount && !errors.amount && parseFloat(paymentAmount) > 0 && (
                    <div className="bg-gray-50 border border-gray-200 p-4 rounded">
                        <h4 className="font-semibold text-gray-800 mb-2">Payment Summary</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Previous Due:</span>
                                <span className="font-medium">৳{dueAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">This Payment:</span>
                                <span className="font-medium text-green-600">৳{parseFloat(paymentAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-gray-200">
                                <span className="text-gray-700 font-semibold">Remaining Due:</span>
                                <span className="font-bold text-red-600">
                                    ৳{Math.max(0, dueAmount - parseFloat(paymentAmount || 0)).toFixed(2)}
                                </span>
                            </div>
                            {dueAmount - parseFloat(paymentAmount || 0) <= 0 && (
                                <div className="mt-2 p-2 bg-green-100 text-green-700 rounded text-center text-sm font-medium">
                                    This payment will fully clear the order!
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-6 py-2.5 border border-gray-300 rounded bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={!isValid || loading}
                        className={`px-6 py-2.5 rounded font-medium transition-all ${!isValid || loading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-secound hover:bg-secound-hover text-white cursor-pointer"
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Processing...
                            </span>
                        ) : (
                            "Create Payment"
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default CreatePaymentModal;