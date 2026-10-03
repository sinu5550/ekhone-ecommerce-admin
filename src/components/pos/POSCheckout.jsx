"use client";

import { useState, useMemo } from "react";
import { Banknote, CreditCard, Truck, CheckCircle2, Loader2, ArrowRight, Printer, FileText, Trash2 } from "lucide-react";

const POSCheckout = ({
    totals,
    discount,
    setDiscount,
    tax,
    setTax,
    shippingCost,
    setShippingCost,
    paidAmount,
    setPaidAmount,
    paymentMethod,
    setPaymentMethod,
    orderStatus,
    setOrderStatus,
    note,
    setNote,
    onSubmit,
    onClearCart,
    isSubmitting = false,
    itemCount = 0,
}) => {
    const { totalAmount = 0, grandTotal = 0, dueAmount = 0 } = totals || {};
    const [showOptions, setShowOptions] = useState(false);

    const changeAmount = useMemo(() => {
        const paid = parseFloat(paidAmount) || 0;
        return Math.max(0, paid - grandTotal);
    }, [paidAmount, grandTotal]);

    const handleExactCash = () => {
        setPaidAmount(grandTotal);
    };

    const handleAddCash = (amount) => {
        setPaidAmount((prev) => (parseFloat(prev) || 0) + amount);
    };

    return (
        <div className="bg-white rounded border border-gray-200 shadow-xs p-4 flex flex-col justify-between space-y-3.5">
            {/* Payment Summary Header */}
            <div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <h3 className="text-xs font-bold text-gray-800 tracking-tight uppercase">
                        Payment Summary
                    </h3>
                    <button
                        type="button"
                        onClick={() => setShowOptions(prev => !prev)}
                        className="text-[11px] font-semibold text-secound hover:underline cursor-pointer"
                    >
                        {showOptions ? "Hide Taxes & Fees" : "+ Adjust Discount/Tax"}
                    </button>
                </div>

                {/* Sub Total, Discount, Tax */}
                <div className="space-y-1.5 pt-2 text-xs text-gray-600">
                    <div className="flex justify-between">
                        <span>Sub Total:</span>
                        <span className="font-semibold text-gray-900">৳{totalAmount.toLocaleString()}</span>
                    </div>

                    {showOptions && (
                        <div className="space-y-1.5 p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                            <div className="flex items-center justify-between">
                                <span>Discount (%):</span>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discount}
                                    onChange={(e) => setDiscount(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                                    className="w-20 text-right px-1.5 py-0.5 border border-gray-300 rounded bg-white text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span>Tax / VAT (%):</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={tax}
                                    onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-20 text-right px-1.5 py-0.5 border border-gray-300 rounded bg-white text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span>Shipping / Delivery:</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={shippingCost}
                                    onChange={(e) => setShippingCost(Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-20 text-right px-1.5 py-0.5 border border-gray-300 rounded bg-white text-xs"
                                />
                            </div>
                        </div>
                    )}

                    {discount > 0 && (
                        <div className="flex justify-between text-rose-600">
                            <span>Discount ({discount}%):</span>
                            <span>-৳{((totalAmount * discount) / 100).toLocaleString()}</span>
                        </div>
                    )}

                    {tax > 0 && (
                        <div className="flex justify-between">
                            <span>Tax ({tax}%):</span>
                            <span>+৳{(((totalAmount - (totalAmount * discount) / 100) * tax) / 100).toLocaleString()}</span>
                        </div>
                    )}

                    {shippingCost > 0 && (
                        <div className="flex justify-between">
                            <span>Delivery Fee:</span>
                            <span>+৳{parseFloat(shippingCost).toLocaleString()}</span>
                        </div>
                    )}

                    {/* Amount to be Paid (Matching Reference Image) */}
                    <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
                        <span className="text-sm font-bold text-gray-900">Amount to be Paid:</span>
                        <span className="text-xl font-extrabold text-secound">
                            ৳{grandTotal.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* Payment Controls: Methods + Tendered Amount */}
            <div className="space-y-2.5 pt-1">
                {/* Method selector buttons */}
                <div className="grid grid-cols-3 gap-1.5">
                    {[
                        { id: "Cash", label: "Cash", icon: Banknote },
                        { id: "OnlinePayment", label: "bKash/Card", icon: CreditCard },
                        { id: "COD", label: "COD", icon: Truck },
                    ].map((m) => {
                        const Icon = m.icon;
                        const isSelected = paymentMethod === m.id;
                        return (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setPaymentMethod(m.id)}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-bold border transition cursor-pointer ${
                                    isSelected
                                        ? "bg-secound text-white border-secound shadow-xs"
                                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                                }`}
                            >
                                <Icon size={13} />
                                <span>{m.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Amount Tendered Input & Quick Presets */}
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <input
                            type="number"
                            min="0"
                            value={paidAmount || ""}
                            onChange={(e) => setPaidAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                            placeholder={`Tendered (Exact: ৳${grandTotal})`}
                            className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-300 rounded text-xs font-bold text-gray-900 focus:outline-none focus:border-secound focus:bg-white transition shadow-2xs"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleExactCash}
                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded border border-gray-200 transition cursor-pointer shrink-0"
                    >
                        Exact
                    </button>
                    {[500, 1000].map((amt) => (
                        <button
                            key={amt}
                            type="button"
                            onClick={() => handleAddCash(amt)}
                            className="px-2 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded border border-gray-200 transition cursor-pointer shrink-0"
                        >
                            +৳{amt}
                        </button>
                    ))}
                </div>

                {/* Change or Due Indicator */}
                <div className="p-2 rounded border flex items-center justify-between text-xs font-bold transition-all bg-gray-50 border-gray-200">
                    {changeAmount > 0 ? (
                        <>
                            <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                                <CheckCircle2 size={14} /> Change to Return:
                            </span>
                            <span className="text-emerald-700 text-sm font-extrabold">
                                ৳{changeAmount.toLocaleString()}
                            </span>
                        </>
                    ) : dueAmount > 0 ? (
                        <>
                            <span className="text-amber-700 font-semibold">Due Balance:</span>
                            <span className="text-amber-700 text-sm font-extrabold">
                                ৳{dueAmount.toLocaleString()}
                            </span>
                        </>
                    ) : (
                        <>
                            <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                                <CheckCircle2 size={14} /> Fully Paid
                            </span>
                            <span className="text-emerald-600 font-bold">৳0.00 Due</span>
                        </>
                    )}
                </div>
            </div>

            {/* Main Action Button (Matching Reference Image: Big Primary Button) */}
            <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting || itemCount === 0}
                className="w-full py-3 px-4 bg-secound hover:bg-secound-hover disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-extrabold text-sm rounded shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer select-none tracking-wide"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Placing Order...</span>
                    </>
                ) : (
                    <>
                        <span>Place an Order</span>
                        <ArrowRight size={16} />
                    </>
                )}
            </button>

            {/* Quick Action Buttons Row (Matching Reference Image) */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 text-xs">
                <button
                    type="button"
                    onClick={onClearCart}
                    disabled={isSubmitting || itemCount === 0}
                    className="py-1.5 px-2 rounded border border-gray-200 bg-gray-50 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 text-gray-600 font-medium transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                    <Trash2 size={13} />
                    <span>Clear / Void</span>
                </button>

                <div className="flex items-center justify-end gap-1.5 text-right">
                    <span className="text-[11px] text-gray-400">Shortcut:</span>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-[10px] font-mono font-bold text-gray-600">
                        F2
                    </kbd>
                </div>
            </div>
        </div>
    );
};

export default POSCheckout;
