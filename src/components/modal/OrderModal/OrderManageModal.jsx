"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";

import { ORDER_STATUS_OPTIONS, normalizeOrderStatus, formatOrderStatusDisplay } from "@/app/(dashboard)/online-order/page";

const OrderManageModal = ({ isOpen, onClose, order, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        formState: { isValid }
    } = useForm({
        mode: "onChange",
        defaultValues: {
            status: "Pending"
        }
    });

    // Reset form when order changes
    useEffect(() => {
        if (order) {
            reset({
                status: normalizeOrderStatus(order.status) || "Pending"
            });
        }
    }, [order, reset]);

    const onSubmit = async (data) => {
        if (!order) return;

        try {
            setLoading(true);

            await apiClient(`/api/order/${order.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: data.status
                }),
            });

            const isRestored = ["Returned", "Cancelled"].includes(normalizeOrderStatus(data.status));
            toast.success(`Order status updated successfully!${isRestored ? " (Inventory stock restored)" : ""}`);
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error updating order status:", error);
            toast.error(error.message || "Failed to update order status. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const getStatusColor = (status) => {
        const s = String(status || '').toLowerCase().replace(/[\s\-_]/g, '');
        switch (s) {
            case 'pending':
                return "text-yellow-700 bg-yellow-50 border-yellow-200";
            case 'confirmed':
                return "text-sky-700 bg-sky-50 border-sky-200";
            case 'readytoship':
                return "text-teal-700 bg-teal-50 border-teal-200";
            case 'incourier':
            case 'shipped':
            case 'shipping':
                return "text-indigo-700 bg-indigo-50 border-indigo-200";
            case 'shiplater':
                return "text-blue-700 bg-blue-50 border-blue-200";
            case 'hold':
                return "text-amber-700 bg-amber-50 border-amber-200";
            case 'returned':
                return "text-rose-700 bg-rose-50 border-rose-200";
            case 'preorder':
                return "text-purple-700 bg-purple-50 border-purple-200";
            case 'delivered':
                return "text-emerald-700 bg-emerald-50 border-emerald-200";
            case 'cancelled':
            case 'cancel':
                return "text-red-700 bg-red-50 border-red-200";
            case 'missing':
                return "text-pink-700 bg-pink-50 border-pink-200";
            case 'lost':
                return "text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200";
            case 'fake':
                return "text-stone-700 bg-stone-100 border-stone-300";
            case 'trash':
                return "text-gray-700 bg-gray-100 border-gray-300";
            case 'processing':
                return "text-purple-700 bg-purple-50 border-purple-200";
            default:
                return "text-gray-600 bg-gray-50 border-gray-200";
        }
    };

    const currentStatus = watch("status");
    const normalizedCurrent = normalizeOrderStatus(currentStatus);

    if (!order) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Update Order Status"
            size="md"
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Order Information */}
                <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-lg">
                    <h3 className="font-semibold text-cyan-900 mb-2">Order Information</h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-cyan-700">Order ID:</span>
                            <span className="font-medium">#{order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-cyan-700">Customer:</span>
                            <span className="font-medium">
                                {order.customer?.fullName}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-cyan-700">Phone:</span>
                            <span className="font-medium">{order.customer?.phone || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-cyan-700">Current Order Status:</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                                {formatOrderStatusDisplay(order.status)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Update Order Status <span className="text-rose-500">*</span>
                    </label>
                    <select
                        {...register("status", { required: true })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition cursor-pointer text-sm"
                    >
                        {ORDER_STATUS_OPTIONS.map((status) => (
                            <option key={status.value} value={status.value}>
                                {status.label}
                            </option>
                        ))}
                    </select>

                    {/* Status Description */}
                    {normalizedCurrent && (
                        <div className="mt-2.5 p-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
                            {normalizedCurrent === "Pending" && "Order has been placed and is waiting for confirmation."}
                            {normalizedCurrent === "Confirmed" && "Order has been confirmed and approved for fulfillment."}
                            {normalizedCurrent === "ReadyToShip" && "Order is packed, labeled, and ready for courier pickup."}
                            {normalizedCurrent === "InCourier" && "Order has been handed over to the courier partner and is in transit."}
                            {normalizedCurrent === "ShipLater" && "Order delivery is scheduled for a future date per customer request."}
                            {normalizedCurrent === "Hold" && "Order is temporarily on hold pending customer response or inventory check."}
                            {normalizedCurrent === "Returned" && "Parcel could not be delivered and has been returned. Product stock will be automatically restored to inventory."}
                            {normalizedCurrent === "PreOrder" && "Order is for advance booking/pre-order items."}
                            {normalizedCurrent === "Delivered" && "Order has been successfully delivered to the customer."}
                            {normalizedCurrent === "Cancelled" && "Order has been cancelled. Product stock will be automatically restored to inventory."}
                            {normalizedCurrent === "Missing" && "Parcel or order items reported missing during transit."}
                            {normalizedCurrent === "Lost" && "Parcel has been confirmed lost by the courier service."}
                            {normalizedCurrent === "Fake" && "Order flagged as fraudulent, fake, or spam."}
                            {normalizedCurrent === "Trash" && "Order moved to trash."}
                            {normalizedCurrent === "Processing" && "Order is being processed in warehouse."}
                            {normalizedCurrent === "Shipped" && "Order is shipped."}
                        </div>
                    )}
                </div>

                {/* Warning for Cancelled, Returned, Fake, or Trash status */}
                {["Cancelled", "Returned", "Fake", "Trash", "Lost"].includes(normalizedCurrent) && (
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded">
                        <p className="text-xs text-amber-800">
                            <strong>Notice:</strong> Marking this order as <strong>{formatOrderStatusDisplay(normalizedCurrent)}</strong> will update order metrics{["Cancelled", "Returned"].includes(normalizedCurrent) ? " and automatically restore product items to available inventory stock." : "."}
                        </p>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-6 py-2.5 border border-gray-300 rounded bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={!isValid || loading}
                        className={`px-6 py-2.5 rounded font-medium transition-all duration-200 ${!isValid || loading
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-secound hover:bg-secound-hover text-white cursor-pointer"
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Updating...
                            </span>
                        ) : (
                            "Update Status"
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
};

export default OrderManageModal;