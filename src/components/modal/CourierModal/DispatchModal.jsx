"use client";

import React, { useState, useEffect } from "react";
import BaseModal from "../BaseModal";
import { apiClient } from "@/lib/apiClient";
import toast from "react-hot-toast";
import { Truck, AlertCircle, CheckCircle, Package, MapPin, Phone, User, DollarSign, Send, Weight } from "lucide-react";

export default function DispatchModal({
    isOpen,
    onClose,
    order,
    onDispatchSuccess,
    defaultCourier = "STEADFAST"
}) {
    const [selectedCourier, setSelectedCourier] = useState(defaultCourier);
    const [recipientName, setRecipientName] = useState("");
    const [recipientPhone, setRecipientPhone] = useState("");
    const [recipientAddress, setRecipientAddress] = useState("");
    const [codAmount, setCodAmount] = useState(0);
    const [deliveryType, setDeliveryType] = useState(0);
    const [itemWeight, setItemWeight] = useState(0.5);
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (defaultCourier) {
            setSelectedCourier(defaultCourier.toUpperCase());
        }
    }, [defaultCourier, isOpen]);

    useEffect(() => {
        if (order) {
            const name = order.shippingAddress?.recipientName || order.customer?.fullName || "";
            const phone = order.shippingAddress?.phoneNumber || order.customer?.phone || "";

            // Format address
            let fullAddress = "";
            if (order.shippingAddress) {
                const parts = [
                    order.shippingAddress.address,
                    order.shippingAddress.upazila,
                    order.shippingAddress.district,
                    order.shippingAddress.division
                ].filter(Boolean);
                fullAddress = parts.join(", ");
            }

            // Calculate default COD amount
            let defaultCod = 0;
            if (order.paymentMethod === "COD") {
                defaultCod = order.dueAmount !== null && order.dueAmount !== undefined
                    ? Number(order.dueAmount)
                    : Number(order.grandTotal || 0);
            } else {
                defaultCod = order.dueAmount ? Number(order.dueAmount) : 0;
            }

            setRecipientName(name);
            setRecipientPhone(phone);
            setRecipientAddress(fullAddress);
            setCodAmount(defaultCod);
            setDeliveryType(selectedCourier === "PATHAO" ? 48 : 0);
            setItemWeight(0.5);
            setNote(order.note || "");
        }
    }, [order, selectedCourier]);

    if (!order) return null;

    const isSteadfast = selectedCourier === "STEADFAST";

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!recipientPhone || recipientPhone.trim().length < 11) {
            toast.error("Please enter a valid 11-digit mobile number.");
            return;
        }

        if (!recipientAddress || recipientAddress.trim().length < 5) {
            toast.error("Please provide a complete delivery address.");
            return;
        }

        try {
            setLoading(true);

            const payload = {
                orderId: order.id,
                courier: selectedCourier,
                deliveryType: Number(deliveryType),
                note: note.trim(),
                codAmountOverride: Number(codAmount),
                ...(selectedCourier === "PATHAO" ? { itemWeight: Number(itemWeight) || 0.5 } : {})
            };

            const response = await apiClient("/api/shipments/create", {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const courierDisplayName = isSteadfast ? "Steadfast" : "Pathao";
            const tracking = response.data?.trackingCode || response.data?.consignmentId || response.trackingCode || "Created";

            toast.success(`Dispatched via ${courierDisplayName}! Tracking/CID: ${tracking}`);

            if (onDispatchSuccess) {
                onDispatchSuccess(response.data || response);
            }

            onClose();
        } catch (error) {
            console.error("Failed to dispatch shipment:", error);
            toast.error(error.message || `Failed to dispatch order to ${isSteadfast ? "Steadfast" : "Pathao"}.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            title={`Dispatch Order #${order.orderNumber} to Courier`}
            size="2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Courier Selection Tabs */}
                <div className="flex items-center gap-3 p-1.5 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCourier("STEADFAST");
                            setDeliveryType(0);
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isSteadfast
                                ? "bg-emerald-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                        }`}
                    >
                        <Truck className="w-4 h-4" />
                        <span>Steadfast Courier</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSteadfast ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-600"}`}>
                            Active
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCourier("PATHAO");
                            setDeliveryType(48);
                        }}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            !isSteadfast
                                ? "bg-rose-600 text-white shadow-sm"
                                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200"
                        }`}
                    >
                        <Send className="w-4 h-4" />
                        <span>Pathao Courier</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${!isSteadfast ? "bg-rose-700 text-white" : "bg-slate-200 text-slate-600"}`}>
                            Connected
                        </span>
                    </button>
                </div>

                {/* Order Summary Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm flex flex-wrap justify-between items-center gap-2">
                    <div>
                        <span className="text-xs text-slate-500 font-semibold uppercase">Order Number:</span>
                        <p className="font-bold text-slate-800">#{order.orderNumber}</p>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-semibold uppercase">Payment Method:</span>
                        <p>
                            <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                                order.paymentMethod === "COD" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                            }`}>
                                {order.paymentMethod}
                            </span>
                        </p>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-semibold uppercase">Grand Total:</span>
                        <p className="font-bold text-slate-800">৳{Number(order.grandTotal || 0).toLocaleString()}</p>
                    </div>
                    <div>
                        <span className="text-xs text-slate-500 font-semibold uppercase">Due Amount:</span>
                        <p className="font-bold text-emerald-600">৳{Number(order.dueAmount || 0).toLocaleString()}</p>
                    </div>
                </div>

                {/* Recipient Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" /> Recipient Name *
                        </label>
                        <input
                            type="text"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            required
                            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Full Name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" /> Recipient Phone (11 digits) *
                        </label>
                        <input
                            type="text"
                            value={recipientPhone}
                            onChange={(e) => setRecipientPhone(e.target.value)}
                            required
                            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                            placeholder="01XXXXXXXXX"
                        />
                    </div>
                </div>

                {/* Delivery Address */}
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> Full Delivery Address *
                    </label>
                    <textarea
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        required
                        rows={2}
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="House, Road, Area, Upazila, District"
                    />
                </div>

                {/* COD & Delivery Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" /> COD Collection Amount (৳) *
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="any"
                            value={codAmount}
                            onChange={(e) => setCodAmount(e.target.value)}
                            required
                            className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                        />
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                            {order.paymentMethod === "COD"
                                ? "Cash on Delivery: Courier will collect this amount."
                                : "Prepaid order: Set to 0 if fully paid."}
                        </span>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                            <Truck className="w-3.5 h-3.5 text-slate-400" /> Service / Delivery Type
                        </label>
                        {isSteadfast ? (
                            <select
                                value={deliveryType}
                                onChange={(e) => setDeliveryType(Number(e.target.value))}
                                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            >
                                <option value={0}>Home Delivery (Standard)</option>
                                <option value={1}>Hub / Point Pickup</option>
                            </select>
                        ) : (
                            <select
                                value={deliveryType}
                                onChange={(e) => setDeliveryType(Number(e.target.value))}
                                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                            >
                                <option value={48}>Normal Delivery (24-48 Hours)</option>
                                <option value={12}>On-Demand / Express (Same Day / 12 Hours)</option>
                            </select>
                        )}
                    </div>
                </div>

                {/* Pathao Weight (only for Pathao) */}
                {!isSteadfast && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center gap-1">
                                <Weight className="w-3.5 h-3.5 text-slate-400" /> Parcel Weight (kg)
                            </label>
                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={itemWeight}
                                onChange={(e) => setItemWeight(e.target.value)}
                                className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
                                placeholder="0.5"
                            />
                        </div>
                        <div className="flex items-center">
                            <span className="text-xs text-slate-500 mt-4">
                                Standard clothing parcels typically weigh between 0.5kg - 1.0kg.
                            </span>
                        </div>
                    </div>
                )}

                {/* Delivery Note */}
                <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                        Delivery Instructions / Note for Courier (Optional)
                    </label>
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="e.g. Handle with care, Call customer before delivery"
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* Security info callout */}
                <div className={`border rounded-lg p-2.5 text-xs flex items-start gap-2 ${
                    isSteadfast
                        ? "bg-emerald-50/70 border-emerald-100 text-emerald-800"
                        : "bg-rose-50/70 border-rose-100 text-rose-800"
                }`}>
                    <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${isSteadfast ? "text-emerald-600" : "text-rose-600"}`} />
                    <span>
                        {isSteadfast
                            ? "This parcel will be registered under the official Steadfast merchant account. Consignment ID and Tracking Code will be attached automatically and shown on the Steadfast Courier page."
                            : "This parcel will be registered through the Pathao Courier API. Consignment ID and tracking info will be attached automatically and shown on the Pathao Courier page."}
                    </span>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-5 py-2 text-sm font-semibold text-white rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                            isSteadfast
                                ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400"
                                : "bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400"
                        }`}
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                Dispatching to {isSteadfast ? "Steadfast" : "Pathao"}...
                            </>
                        ) : (
                            <>
                                {isSteadfast ? <Truck className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                Confirm & Dispatch to {isSteadfast ? "Steadfast" : "Pathao"}
                            </>
                        )}
                    </button>
                </div>
            </form>
        </BaseModal>
    );
}
