"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { User, Phone, MapPin, UserPlus, Trash2, Plus, Minus, ShoppingBag, Package, Store, Search, X, Check, Utensils, ShoppingCart, Truck } from "lucide-react";
import CustomerAddModal from "@/components/modal/CustomerModal/CustomerAddModal";

const POSCart = ({
    cartItems = [],
    selectedCustomer = null,
    customers = [],
    onSelectCustomer,
    onSelectWalkIn,
    isWalkIn = false,
    onUpdateQuantity,
    onRemoveItem,
    onClearCart,
    onCustomerAdded,
    isSubmitting = false,
    orderType = "counter",
    setOrderType,
}) => {
    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchContainerRef = useRef(null);

    // Filter customers based on search query
    const filteredCustomers = useMemo(() => {
        const q = customerSearchQuery.trim().toLowerCase();
        if (!q) return [];
        return customers.filter(c => {
            const nameMatch = c.fullName?.toLowerCase().includes(q);
            const phoneMatch = c.phone?.toLowerCase().includes(q);
            const codeMatch = c.customerCode?.toLowerCase().includes(q);
            return nameMatch || phoneMatch || codeMatch;
        }).slice(0, 8);
    }, [customerSearchQuery, customers]);

    // Handle outside click for customer search dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
                setIsSearchOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectSearchResult = (c) => {
        onSelectCustomer(c);
        setCustomerSearchQuery("");
        setIsSearchOpen(false);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded border border-gray-200 shadow-xs overflow-hidden">
            {/* Header: Order Mode + Customer Search & Walk-in Bar */}
            <div className="p-3.5 border-b border-gray-100 bg-white space-y-3">
                {/* Order Type Tabs (Counter, Take Away, Delivery) */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-gray-100 rounded">
                    {[
                        { id: "counter", label: "Counter / Store", icon: Store },
                        { id: "takeaway", label: "Take Away", icon: ShoppingBag },
                        { id: "delivery", label: "Delivery", icon: Truck },
                    ].map((mode) => {
                        const Icon = mode.icon;
                        const isSelected = orderType === mode.id;
                        return (
                            <button
                                key={mode.id}
                                type="button"
                                onClick={() => setOrderType && setOrderType(mode.id)}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded text-xs font-bold transition cursor-pointer ${
                                    isSelected
                                        ? "bg-secound text-white shadow-xs"
                                        : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                                }`}
                            >
                                <Icon size={13} />
                                <span>{mode.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Customer Search & Quick Walk-in Button Area (User Specified) */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                        {/* 1-Click Walk-in Customer Button */}
                        <button
                            type="button"
                            onClick={onSelectWalkIn}
                            className={`px-3 py-2 text-xs font-bold rounded border transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                                isWalkIn
                                    ? "bg-secound text-white border-secound shadow-xs"
                                    : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                            title="Set Walk-in Customer"
                        >
                            <Store size={14} />
                            <span>Walk-in Customer</span>
                        </button>

                        {/* Customer Search Input */}
                        <div ref={searchContainerRef} className="relative flex-1 min-w-0">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                <input
                                    type="text"
                                    value={customerSearchQuery}
                                    onChange={(e) => {
                                        setCustomerSearchQuery(e.target.value);
                                        setIsSearchOpen(true);
                                    }}
                                    onFocus={() => {
                                        if (customerSearchQuery.trim()) setIsSearchOpen(true);
                                    }}
                                    placeholder={selectedCustomer && !isWalkIn ? selectedCustomer.fullName : "Search customer name or phone..."}
                                    className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-secound focus:bg-white transition shadow-2xs font-medium"
                                />
                                {customerSearchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setCustomerSearchQuery("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200"
                                    >
                                        <X size={12} />
                                    </button>
                                )}
                            </div>

                            {/* Dropdown Search Results */}
                            {isSearchOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded shadow-xl z-30 max-h-56 overflow-y-auto divide-y divide-gray-100">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map((c) => (
                                            <div
                                                key={c.id}
                                                onClick={() => handleSelectSearchResult(c)}
                                                className="p-2.5 hover:bg-secound/5 cursor-pointer transition flex items-center justify-between"
                                            >
                                                <div>
                                                    <p className="text-xs font-bold text-gray-900 leading-tight">
                                                        {c.fullName}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                                                        {c.phone || "No phone"}
                                                    </p>
                                                </div>
                                                {c.customerAddresses?.[0] && (
                                                    <span className="text-[10px] text-gray-400 max-w-[120px] truncate">
                                                        {c.customerAddresses[0].district}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-3 text-center text-xs text-gray-400">
                                            No customers matching &quot;{customerSearchQuery}&quot;
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Add Customer Button (+) */}
                        <button
                            type="button"
                            onClick={() => setIsAddCustomerOpen(true)}
                            className="p-2 text-white bg-secound hover:bg-secound-hover rounded transition cursor-pointer shrink-0 shadow-xs"
                            title="Register new customer"
                        >
                            <Plus size={16} className="stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Active Selected Customer Pill */}
                    {selectedCustomer && (
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded bg-secound/5 border border-secound/20 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-5 h-5 rounded bg-secound text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {isWalkIn ? <Store size={11} /> : (selectedCustomer.fullName?.charAt(0)?.toUpperCase() || "C")}
                                </div>
                                <div className="truncate">
                                    <span className="font-bold text-gray-900 truncate">
                                        {isWalkIn ? "Walk-in Customer" : selectedCustomer.fullName}
                                    </span>
                                    {selectedCustomer.phone && !isWalkIn && (
                                        <span className="text-[11px] text-gray-500 font-mono ml-1.5">
                                            ({selectedCustomer.phone})
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {selectedCustomer.customerAddresses?.[0] && (
                                    <span className="text-[10px] text-gray-500 flex items-center gap-0.5 max-w-[110px] truncate">
                                        <MapPin size={10} className="text-secound shrink-0" />
                                        <span className="truncate">{selectedCustomer.customerAddresses[0].district}</span>
                                    </span>
                                )}
                                {!isWalkIn && (
                                    <button
                                        type="button"
                                        onClick={onSelectWalkIn}
                                        className="text-[11px] text-gray-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                                        title="Switch back to Walk-in"
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Cart Header Section */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50/70 border-b border-gray-100 text-xs">
                <span className="font-bold text-gray-800 tracking-tight">
                    Ordered Items
                </span>
                <div className="flex items-center gap-3">
                    <span className="text-gray-500 font-medium">
                        Total Items: <strong className="text-gray-900">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</strong>
                    </span>
                    {cartItems.length > 0 && (
                        <button
                            type="button"
                            onClick={onClearCart}
                            disabled={isSubmitting}
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer hover:underline flex items-center gap-1"
                        >
                            <Trash2 size={13} />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Cart Items List (Matching Reference Image) */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {cartItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <ShoppingBag size={38} className="stroke-[1.5] text-gray-300 mb-2" />
                        <p className="text-xs font-bold text-gray-600">Your cart is empty</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">Click on menu items or scan barcode to add</p>
                    </div>
                ) : (
                    cartItems.map((item) => (
                        <div
                            key={item.itemKey}
                            className="p-3 bg-white rounded border border-gray-200 hover:border-gray-300 transition-all shadow-2xs space-y-2"
                        >
                            {/* Top Row: Thumbnail + Name/Variant + Qty & Delete */}
                            <div className="flex items-start justify-between gap-2.5">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-11 h-11 rounded bg-gray-50 border border-gray-100 overflow-hidden relative shrink-0 flex items-center justify-center">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.productName}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <Package size={20} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="text-xs font-bold text-gray-900 truncate" title={item.productName}>
                                            {item.productName}
                                        </h4>
                                        {item.variantName && (
                                            <p className="text-[10px] text-gray-500 font-medium truncate">
                                                {item.variantName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Quantity Controller & Delete */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center bg-gray-50 border border-gray-200 rounded overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQuantity(item.itemKey, item.quantity - 1)}
                                            className="px-1.5 py-0.5 text-gray-600 hover:text-rose-600 hover:bg-gray-200 transition cursor-pointer"
                                            disabled={isSubmitting}
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="px-2 text-xs font-bold text-gray-900 min-w-[20px] text-center">
                                            {item.quantity}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => onUpdateQuantity(item.itemKey, item.quantity + 1)}
                                            className="px-1.5 py-0.5 text-gray-600 hover:text-secound hover:bg-gray-200 transition cursor-pointer"
                                            disabled={isSubmitting}
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onRemoveItem(item.itemKey)}
                                        className="p-1 text-gray-300 hover:text-rose-600 rounded transition cursor-pointer"
                                        title="Delete item"
                                        disabled={isSubmitting}
                                    >
                                        <X size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* Bottom Breakdown Row: Item Rate, Qty, Total */}
                            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-gray-100 text-gray-500">
                                <div>
                                    <span>Rate: </span>
                                    <strong className="text-gray-800">৳{parseFloat(item.unitPrice).toLocaleString()}</strong>
                                </div>
                                <div>
                                    <span>Qty: </span>
                                    <strong className="text-gray-800">{item.quantity}</strong>
                                </div>
                                <div>
                                    <span>Total: </span>
                                    <strong className="text-secound font-bold text-xs">
                                        ৳{((item.unitPrice || 0) * (item.quantity || 1)).toLocaleString()}
                                    </strong>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Customer Modal */}
            <CustomerAddModal
                isOpen={isAddCustomerOpen}
                onClose={() => setIsAddCustomerOpen(false)}
                onSuccess={(newCustomer) => {
                    setIsAddCustomerOpen(false);
                    if (onCustomerAdded) onCustomerAdded(newCustomer);
                }}
            />
        </div>
    );
};

export default POSCart;
