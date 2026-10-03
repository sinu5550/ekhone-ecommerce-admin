"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { X, Loader2, User, Phone, Mail, MapPin, Search, Package, UserPlus } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { useCustomers, useProducts } from "@/lib/dataFetch";
import CustomerAddModal from "@/components/modal/CustomerModal/CustomerAddModal";

const OrderAddModal = ({ isOpen, onClose, onSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderItems, setOrderItems] = useState([]);
    const [shippingCost, setShippingCost] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [note, setNote] = useState("");
    const [selectedShippingAddress, setSelectedShippingAddress] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [productSearchQuery, setProductSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);

    const searchContainerRef = useRef(null);

    const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
    const [newlyAddedCustomers, setNewlyAddedCustomers] = useState([]);

    const { data: customerData = [], mutate: mutateCustomers } = useCustomers(1, 1000);

    const allCustomers = useMemo(() => {
        const list = [...newlyAddedCustomers, ...(Array.isArray(customerData) ? customerData : [])];
        const seen = new Set();
        return list.filter(c => {
            if (!c?.id || seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
        });
    }, [newlyAddedCustomers, customerData]);

    const { data: rawProductData = [] } = useProducts(1, 1000);
    const productData = useMemo(() => {
        if (Array.isArray(rawProductData)) return rawProductData;
        if (rawProductData?.products && Array.isArray(rawProductData.products)) return rawProductData.products;
        return [];
    }, [rawProductData]);

    const {
        register,
        handleSubmit,
        watch,
        reset: resetForm,
        setValue,
        getValues,
        clearErrors,
        formState: { errors },
    } = useForm({
        mode: "onChange",
        defaultValues: {
            customerId: "",
            shippingAddressId: "",
            orderDate: new Date().toISOString().split('T')[0]
        }
    });

    const selectedCustomerId = watch("customerId");
    const orderDate = watch("orderDate");
    const shippingAddressId = watch("shippingAddressId");

    // Helper function to safely extract product/variant images
    const getProductImage = useCallback((p, variant = null) => {
        if (variant?.image && typeof variant.image === 'string' && variant.image.trim()) {
            return variant.image.trim();
        }
        if (!p) return null;
        if (typeof p.image === 'string' && p.image.trim()) return p.image.trim();
        if (p.image?.url && typeof p.image.url === 'string') return p.image.url.trim();
        if (Array.isArray(p.images) && p.images.length > 0) {
            const first = p.images[0];
            if (typeof first === 'string' && first.trim()) return first.trim();
            if (first && typeof first === 'object' && first.url) return first.url;
        }
        if (typeof p.images === 'string' && p.images.trim()) {
            try {
                const parsed = JSON.parse(p.images);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const first = parsed[0];
                    if (typeof first === 'string' && first.trim()) return first.trim();
                    if (first && typeof first === 'object' && first.url) return first.url;
                } else if (typeof parsed === 'string' && parsed.trim()) {
                    return parsed.trim();
                }
            } catch {
                if (p.images.startsWith('http://') || p.images.startsWith('https://') || p.images.startsWith('/')) {
                    return p.images.trim();
                }
            }
        }
        if (Array.isArray(p.productVariants) && p.productVariants.length > 0) {
            const variantWithImg = p.productVariants.find(v => v?.image);
            if (variantWithImg?.image) return variantWithImg.image;
        }
        return null;
    }, []);

    // Get current customer addresses without side effects
    const customerAddresses = useMemo(() => {
        if (!selectedCustomerId) return [];
        const customer = allCustomers.find(c => c.id === parseInt(selectedCustomerId));
        return customer?.customerAddresses || [];
    }, [selectedCustomerId, allCustomers]);

    // Get selected customer without side effects
    const selectedCustomer = useMemo(() => {
        if (!selectedCustomerId) return null;
        return allCustomers.find(c => c.id === parseInt(selectedCustomerId));
    }, [selectedCustomerId, allCustomers]);

    // Get selected shipping address without side effects
    const currentShippingAddress = useMemo(() => {
        if (!shippingAddressId || !customerAddresses.length) return null;
        return customerAddresses.find(addr => addr.id === parseInt(shippingAddressId)) || null;
    }, [shippingAddressId, customerAddresses]);

    // Handle customer selection change
    const handleCustomerChange = useCallback((customerId) => {
        setValue("customerId", customerId);
        // Reset shipping address when customer changes
        setValue("shippingAddressId", "");
        setSelectedShippingAddress(null);

        // Find default address for this customer
        if (customerId) {
            const customer = allCustomers.find(c => c.id === parseInt(customerId));
            if (customer?.customerAddresses?.length) {
                const defaultAddress = customer.customerAddresses.find(addr => addr.isDefault) || customer.customerAddresses[0];
                if (defaultAddress) {
                    setValue("shippingAddressId", defaultAddress.id.toString());
                    setSelectedShippingAddress(defaultAddress);
                }
            }
        }
    }, [allCustomers, setValue]);

    // Handle shipping address selection change
    const handleShippingAddressChange = useCallback((addressId) => {
        setValue("shippingAddressId", addressId);
        if (addressId && customerAddresses.length) {
            const address = customerAddresses.find(addr => addr.id === parseInt(addressId));
            setSelectedShippingAddress(address || null);
        } else {
            setSelectedShippingAddress(null);
        }
    }, [customerAddresses, setValue]);

    // Handle newly added customer
    const handleCustomerAdded = useCallback(async (newCustomer) => {
        setIsAddCustomerOpen(false);
        toast.success("Customer added successfully!");

        if (newCustomer && newCustomer.id) {
            setNewlyAddedCustomers(prev => [newCustomer, ...prev]);
            const cId = String(newCustomer.id);
            setValue("customerId", cId);
            if (clearErrors) clearErrors("customerId");

            const defaultAddr = newCustomer.customerAddresses?.find(a => a.isDefault) || newCustomer.customerAddresses?.[0];
            if (defaultAddr?.id) {
                setValue("shippingAddressId", String(defaultAddr.id));
                setSelectedShippingAddress(defaultAddr);
                if (clearErrors) clearErrors("shippingAddressId");
            }
        }

        if (mutateCustomers) {
            await mutateCustomers();
        }
    }, [setValue, clearErrors, mutateCustomers]);

    // Reset function to clear form and state
    const reset = useCallback(() => {
        setOrderItems([]);
        setShippingCost(0);
        setPaidAmount(0);
        setDiscount(0);
        setNote("");
        setSelectedShippingAddress(null);
        setProductSearchQuery("");
        setSearchResults([]);
        setShowSearchResults(false);
        setIsAddCustomerOpen(false);
        resetForm({
            customerId: "",
            shippingAddressId: "",
            orderDate: new Date().toISOString().split('T')[0]
        });
        setIsSubmitting(false);
    }, [resetForm]);

    // Reset when modal closes
    useEffect(() => {
        if (!isOpen) {
            reset();
        }
    }, [isOpen, reset]);

    // Handle outside click to close search dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Helper function to safely parse prices
    const parsePrice = (price) => {
        if (price === null || price === undefined) return 0;
        const num = parseFloat(price);
        return isNaN(num) ? 0 : num;
    };

    const productDataRef = useRef(productData);
    useEffect(() => {
        productDataRef.current = productData;
    }, [productData]);

    // Search products (both local filtering and API fallback)
    const searchProducts = useCallback(async (query) => {
        const trimmed = query?.trim();
        if (!trimmed) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        setIsSearching(true);
        try {
            const searchTerm = trimmed.toLowerCase();
            const currentData = productDataRef.current || [];
            // Search in the local product data
            const localResults = currentData.filter(product => {
                const nameMatch = product.productName?.toLowerCase().includes(searchTerm);
                const skuMatch = product.sku?.toLowerCase().includes(searchTerm);
                const descMatch = product.description?.toLowerCase().includes(searchTerm);
                const catMatch = product.subCategory?.category?.name?.toLowerCase().includes(searchTerm) || product.subCategory?.name?.toLowerCase().includes(searchTerm);
                const brandMatch = product.brand?.name?.toLowerCase().includes(searchTerm);
                const variantMatch = product.productVariants?.some(v => v.sku?.toLowerCase().includes(searchTerm));
                return nameMatch || skuMatch || descMatch || catMatch || brandMatch || variantMatch;
            });

            setSearchResults(localResults.slice(0, 15));
            setShowSearchResults(true);

            // Fetch from API to find any products beyond local cache
            try {
                const res = await apiClient(`/api/products?search=${encodeURIComponent(trimmed)}&limit=20`);
                const apiProducts = Array.isArray(res) ? res : res?.products || res?.data?.products || res?.data || [];
                if (Array.isArray(apiProducts) && apiProducts.length > 0) {
                    setSearchResults(prev => {
                        const merged = [...localResults];
                        apiProducts.forEach(p => {
                            if (p && p.id && !merged.some(m => m.id === p.id)) {
                                merged.push(p);
                            }
                        });
                        return merged.slice(0, 15);
                    });
                }
            } catch (apiErr) {
                // If API search fails, local results remain
            }
        } catch (err) {
            console.error("Product search error:", err);
            setSearchResults([]);
            setShowSearchResults(false);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        if (!productSearchQuery.trim()) {
            setSearchResults(prev => prev.length > 0 ? [] : prev);
            setShowSearchResults(prev => prev ? false : prev);
            return;
        }

        const timer = setTimeout(() => {
            searchProducts(productSearchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [productSearchQuery, searchProducts]);

    const handleAddProduct = useCallback((product, variant = null) => {
        if (!product || !product.id) {
            console.error("Invalid product data");
            toast.error("Invalid product data");
            return;
        }

        const variantId = variant?.id || null;
        const itemKey = variantId ? `${product.id}-v${variantId}` : `${product.id}`;

        const exists = orderItems.find((p) => p.itemKey === itemKey);
        if (exists) {
            setOrderItems((prev) =>
                prev.map((item) =>
                    item.itemKey === itemKey
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            );
            const variantLabel = variant ? ` (${[variant.color, variant.size].filter(Boolean).join(", ")})` : "";
            toast.success(`Increased quantity for ${product.productName}${variantLabel}`);
        } else {
            const unitPrice = parsePrice(variant?.price || product.price || product.salePrice || product.unitPrice);
            const itemSku = variant?.sku || product.sku || "";
            const variantName = variant ? [variant.color, variant.size].filter(Boolean).join(" / ") : null;

            setOrderItems((prev) => [
                ...prev,
                {
                    ...product,
                    itemKey,
                    id: product.id,
                    productVariantId: variantId,
                    variantName,
                    productName: product.productName || "Unknown Product",
                    sku: itemSku,
                    quantity: 1,
                    discount: parseFloat(product.discountValue || product.discount || 0),
                    tax: parseFloat(product.tax || 0),
                    unitPrice: unitPrice,
                    image: getProductImage(product, variant),
                },
            ]);
            toast.success(`${product.productName}${variantName ? ` (${variantName})` : ''} added to order`);
        }

        // Clear search after adding
        setProductSearchQuery("");
        setSearchResults([]);
        setShowSearchResults(false);
    }, [orderItems, getProductImage]);

    const updateQuantity = useCallback((itemKey, value) => {
        const numericValue = parseInt(value);
        if (isNaN(numericValue) || numericValue < 1) {
            toast.error("Quantity must be at least 1");
            return;
        }

        setOrderItems((prev) =>
            prev.map((item) =>
                (item.itemKey === itemKey || item.id === itemKey)
                    ? { ...item, quantity: numericValue }
                    : item
            )
        );
    }, []);

    const updateItemField = useCallback((itemKey, field, value) => {
        const numericValue = parseFloat(value) || 0;
        if (field === 'discount' && (numericValue < 0 || numericValue > 100)) {
            toast.error("Discount must be between 0 and 100%");
            return;
        }

        if (field === 'unitPrice' && numericValue < 0) {
            toast.error("Price cannot be negative");
            return;
        }

        setOrderItems((prev) =>
            prev.map((item) =>
                (item.itemKey === itemKey || item.id === itemKey)
                    ? { ...item, [field]: numericValue }
                    : item
            )
        );
    }, []);

    const removeItem = useCallback((itemKey) => {
        setOrderItems((prev) => prev.filter((item) => item.itemKey !== itemKey && item.id !== itemKey));
        toast.success("Product removed from order");
    }, []);

    // Calculations without side effects
    const calculations = useMemo(() => {
        // Calculate item totals with safe parsing
        const itemsWithTotals = orderItems.map(item => {
            const unitPrice = parsePrice(item.unitPrice);
            const quantity = parseInt(item.quantity) || 1;
            const discountPercent = parseFloat(item.discount) || 0;
            const taxPercent = parseFloat(item.tax) || 0;

            const itemSubtotal = unitPrice * quantity;
            const itemDiscountAmount = (itemSubtotal * discountPercent) / 100;
            const itemSubtotalAfterDiscount = itemSubtotal - itemDiscountAmount;
            const itemTaxAmount = (itemSubtotalAfterDiscount * taxPercent) / 100;
            const itemTotal = itemSubtotalAfterDiscount + itemTaxAmount;

            return {
                ...item,
                unitPrice,
                quantity,
                discount: discountPercent,
                tax: taxPercent,
                itemSubtotal,
                itemDiscountAmount,
                itemSubtotalAfterDiscount,
                itemTaxAmount,
                itemTotal
            };
        });

        // Order totals
        const totalAmount = itemsWithTotals.reduce((acc, item) => acc + (item.itemSubtotal || 0), 0);
        const totalItemDiscount = itemsWithTotals.reduce((acc, item) => acc + (item.itemDiscountAmount || 0), 0);
        const subtotalAfterItemDiscount = totalAmount - totalItemDiscount;
        const discountPercent = parseFloat(discount) || 0;
        const orderDiscountAmount = (subtotalAfterItemDiscount * discountPercent) / 100;
        const subtotalAfterOrderDiscount = subtotalAfterItemDiscount - orderDiscountAmount;
        const totalTax = itemsWithTotals.reduce((acc, item) => acc + (item.itemTaxAmount || 0), 0);
        const shippingCostValue = parseFloat(shippingCost) || 0;
        const grandTotal = subtotalAfterOrderDiscount + totalTax + shippingCostValue;
        const paidAmountValue = parseFloat(paidAmount) || 0;
        const dueAmount = Math.max(0, grandTotal - paidAmountValue);

        return {
            itemsWithTotals,
            totalAmount,
            totalItemDiscount,
            subtotalAfterItemDiscount,
            orderDiscountAmount,
            subtotalAfterOrderDiscount,
            totalTax,
            grandTotal,
            dueAmount
        };
    }, [orderItems, discount, shippingCost, paidAmount]);

    const onSubmit = async (data) => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);

            if (!selectedCustomerId) {
                toast.error("Select a customer first");
                setIsSubmitting(false);
                return;
            }

            if (!shippingAddressId) {
                toast.error("Select a shipping address");
                setIsSubmitting(false);
                return;
            }

            if (orderItems.length === 0) {
                toast.error("Add at least one product");
                setIsSubmitting(false);
                return;
            }

            if (!orderDate) {
                toast.error("Order date is required");
                setIsSubmitting(false);
                return;
            }

            const formattedData = {
                customerId: parseInt(selectedCustomerId),
                shippingAddressId: parseInt(shippingAddressId),
                orderDate,
                totalAmount: calculations.totalAmount,
                discount: calculations.totalItemDiscount,
                tax: calculations.totalTax,
                shippingCost: parseFloat(shippingCost) || 0,
                grandTotal: calculations.grandTotal,
                paidAmount: parseFloat(paidAmount) || 0,
                dueAmount: calculations.dueAmount,
                status: "Pending",
                paymentStatus: calculations.dueAmount <= 0 && (parseFloat(paidAmount) || 0) > 0 ? "Paid" : ((parseFloat(paidAmount) || 0) > 0 ? "Partial" : "Unpaid"),
                note: note || "Manual order entry",
                items: calculations.itemsWithTotals.map((item) => ({
                    productId: item.id,
                    productVariantId: item.productVariantId || null,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount,
                    tax: item.tax,
                    lineTotal: item.itemTotal,
                })),
            };

            await apiClient("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });

            toast.success("Order added successfully!");
            reset();
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Order creation error:", err);
            toast.error(err.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-4 md:p-6">
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            onClick={isSubmitting ? undefined : onClose}
                        />

                        {/* Modal Window */}
                        <motion.div
                            className="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto border border-gray-200 z-10"
                            initial={{ scale: 0.96, opacity: 0, y: 8 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.96, opacity: 0, y: 8 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
                                <h2 className="text-2xl font-semibold text-gray-800 font-exo">Add New Order</h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition cursor-pointer"
                                    disabled={isSubmitting}
                                >
                                    <X size={22} />
                                </button>
                            </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
                    {/* Customer & Date & Shipping Address */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <label className="text-sm font-medium text-gray-700">
                                    Customer <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setIsAddCustomerOpen(true)}
                                    className="text-xs font-semibold text-secound hover:underline flex items-center gap-1 cursor-pointer transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <UserPlus size={14} />
                                    <span>Add Customer</span>
                                </button>
                            </div>
                            <select
                                {...register("customerId", { required: "Customer is required" })}
                                onChange={(e) => handleCustomerChange(e.target.value)}
                                value={selectedCustomerId}
                                className="w-full border border-gray-300 rounded p-2 text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                disabled={isSubmitting}
                            >
                                <option value="">Select Customer</option>
                                {allCustomers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.fullName} - {c.phone}
                                    </option>
                                ))}
                            </select>
                            {errors.customerId && (
                                <p className="text-red-500 text-xs mt-1">{errors.customerId.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                {...register("orderDate", { required: "Order date is required" })}
                                className="w-full border border-gray-300 rounded p-2 mt-1 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                disabled={isSubmitting}
                            />
                            {errors.orderDate && (
                                <p className="text-red-500 text-xs mt-1">{errors.orderDate.message}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700">
                                Shipping Address <span className="text-red-500">*</span>
                            </label>
                            <select
                                {...register("shippingAddressId", { required: "Shipping address is required" })}
                                onChange={(e) => handleShippingAddressChange(e.target.value)}
                                value={shippingAddressId}
                                className="w-full border border-gray-300 rounded p-2 mt-1 text-gray-700 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                disabled={!selectedCustomerId || customerAddresses.length === 0 || isSubmitting}
                            >
                                <option value="">Select Address</option>
                                {customerAddresses.map((address) => (
                                    <option key={address.id} value={address.id}>
                                        {address.type} {address.isDefault && "(Default)"} - {address.upazila}, {address.district}
                                    </option>
                                ))}
                            </select>
                            {errors.shippingAddressId && (
                                <p className="text-red-500 text-xs mt-1">{errors.shippingAddressId.message}</p>
                            )}
                            {selectedCustomerId && customerAddresses.length === 0 && (
                                <p className="text-yellow-600 text-xs mt-1">No addresses found for this customer</p>
                            )}
                        </div>
                    </div>

                    {/* Customer & Shipping Information */}
                    {(selectedCustomer || currentShippingAddress) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <User size={20} />
                                Customer & Shipping Information
                            </h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Customer Info */}
                                {selectedCustomer && (
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-gray-700">Customer Details</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <User size={16} className="text-gray-500" />
                                                <span className="font-medium">Name:</span>
                                                <span>{selectedCustomer.fullName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone size={16} className="text-gray-500" />
                                                <span className="font-medium">Phone:</span>
                                                <span>{selectedCustomer.phone}</span>
                                            </div>
                                            {selectedCustomer.email && (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail size={16} className="text-gray-500" />
                                                    <span className="font-medium">Email:</span>
                                                    <span>{selectedCustomer.email}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Shipping Address Info */}
                                {currentShippingAddress && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-gray-700">Shipping Address</h4>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 text-xs rounded-full ${currentShippingAddress.isDefault
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {currentShippingAddress.type} {currentShippingAddress.isDefault && "• Default"}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-start gap-2">
                                                <MapPin size={16} className="text-gray-500 mt-0.5" />
                                                <div>
                                                    <div className="font-medium">{currentShippingAddress.recipientName}</div>
                                                    <div className="text-gray-600">{currentShippingAddress.phoneNumber}</div>
                                                    <p className="text-gray-600 mt-1">{currentShippingAddress.address}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-gray-600">
                                                <div>
                                                    <span className="font-medium">Area:</span> {currentShippingAddress.upazila}
                                                </div>
                                                <div>
                                                    <span className="font-medium">City:</span> {currentShippingAddress.city}
                                                </div>
                                                <div>
                                                    <span className="font-medium">District:</span> {currentShippingAddress.district}
                                                </div>
                                                <div>
                                                    <span className="font-medium">Postal:</span> {currentShippingAddress.postalCode}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Product Search */}
                    <div className="product-search-container" ref={searchContainerRef}>
                        <label className="text-sm font-medium text-gray-700">Add Product</label>
                        <div className="relative mt-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search products by name, SKU, category, or description..."
                                value={productSearchQuery}
                                onChange={(e) => setProductSearchQuery(e.target.value)}
                                onFocus={() => productSearchQuery.trim() && setShowSearchResults(true)}
                                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition text-sm"
                                disabled={isSubmitting}
                            />
                            {isSearching && (
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                    <Loader2 className="animate-spin text-gray-400" size={18} />
                                </div>
                            )}

                            {/* Search Results Dropdown */}
                            {showSearchResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto divide-y divide-gray-100">
                                    {searchResults.map((product) => {
                                        const pImage = getProductImage(product);
                                        const priceVal = parsePrice(product.price || product.salePrice || product.unitPrice);
                                        const hasVariants = Array.isArray(product.productVariants) && product.productVariants.length > 0;

                                        return (
                                            <div key={product.id} className="p-3 hover:bg-slate-50 transition-colors">
                                                <div
                                                    className="flex items-center justify-between gap-3 cursor-pointer"
                                                    onClick={() => !hasVariants && handleAddProduct(product)}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                                        <div className="w-10 h-10 rounded border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                                                            {pImage ? (
                                                                <Image
                                                                    src={pImage}
                                                                    alt={product.productName || "Product"}
                                                                    width={40}
                                                                    height={40}
                                                                    className="object-cover w-full h-full"
                                                                    unoptimized={typeof pImage === 'string' && pImage.startsWith('http://')}
                                                                />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="font-medium text-gray-800 truncate" title={product.productName}>
                                                                {product.productName || "Unnamed Product"}
                                                            </div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                                                                <span className="font-mono">SKU: {product.sku || "N/A"}</span>
                                                                {product.subCategory?.name && <span>• {product.subCategory.name}</span>}
                                                                {product.brand?.name && <span>• {product.brand.name}</span>}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="text-right shrink-0">
                                                        <div className="font-bold text-gray-900">
                                                            ৳{priceVal.toFixed(2)}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            Stock: <span className={parseInt(product.quantity || 0) > 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
                                                                {parseInt(product.quantity || 0)}
                                                            </span>
                                                        </div>
                                                        {!hasVariants && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAddProduct(product);
                                                                }}
                                                                className="mt-1 px-2.5 py-0.5 text-xs bg-secound hover:bg-primary text-white rounded font-medium transition cursor-pointer"
                                                            >
                                                                + Add
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Variant Options Selection if Available */}
                                                {hasVariants && (
                                                    <div className="mt-2.5 pl-13 pt-2 border-t border-gray-100 flex flex-wrap gap-2 items-center">
                                                        <span className="text-xs text-gray-500 font-medium">Select Variant:</span>
                                                        {product.productVariants.map((v) => {
                                                            const vLabel = [v.color, v.size].filter(Boolean).join(" / ") || `Variant #${v.id}`;
                                                            const vPrice = parsePrice(v.price || product.price);
                                                            return (
                                                                <button
                                                                    key={v.id}
                                                                    type="button"
                                                                    onClick={() => handleAddProduct(product, v)}
                                                                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-secound hover:text-white border border-slate-200 rounded font-medium text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                                                                >
                                                                    <span>{vLabel}</span>
                                                                    <span className="font-bold">৳{vPrice.toFixed(2)}</span>
                                                                    <span className="text-[10px] opacity-75">({v.quantity || 0} in stock)</span>
                                                                </button>
                                                            );
                                                        })}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleAddProduct(product)}
                                                            className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-800 underline cursor-pointer"
                                                        >
                                                            Add Base Product
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* No Results */}
                            {showSearchResults && productSearchQuery.trim() && searchResults.length === 0 && !isSearching && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4">
                                    <div className="text-center text-gray-500 text-sm">
                                        No products found for "{productSearchQuery}"
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Type to search products. Click on a product or variant to add it to the order.
                        </p>

                        {/* Alternative: Manual product entry for quick add */}
                        <div className="mt-3 flex items-center gap-2">
                            <span className="text-xs text-gray-600 whitespace-nowrap">Quick add by SKU:</span>
                            <input
                                type="text"
                                placeholder="Enter SKU and press Enter"
                                onKeyDown={async (e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const sku = e.target.value.trim();
                                        if (sku) {
                                            let product = productData.find(p =>
                                                p.sku && p.sku.toLowerCase() === sku.toLowerCase()
                                            );
                                            let matchedVariant = null;

                                            if (!product) {
                                                for (const p of productData) {
                                                    const v = p.productVariants?.find(pv => pv.sku && pv.sku.toLowerCase() === sku.toLowerCase());
                                                    if (v) {
                                                        product = p;
                                                        matchedVariant = v;
                                                        break;
                                                    }
                                                }
                                            }

                                            if (!product) {
                                                try {
                                                    const res = await apiClient(`/api/products?search=${encodeURIComponent(sku)}&limit=5`);
                                                    const list = Array.isArray(res) ? res : res?.products || res?.data?.products || [];
                                                    if (list.length > 0) {
                                                        product = list.find(p => p.sku && p.sku.toLowerCase() === sku.toLowerCase()) || list[0];
                                                        matchedVariant = product.productVariants?.find(pv => pv.sku && pv.sku.toLowerCase() === sku.toLowerCase()) || null;
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                }
                                            }

                                            if (product) {
                                                handleAddProduct(product, matchedVariant);
                                                e.target.value = '';
                                            } else {
                                                toast.error(`Product with SKU "${sku}" not found`);
                                            }
                                        }
                                    }
                                }}
                                className="max-w-xs border border-gray-300 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    {/* Order Items */}
                    {orderItems.length > 0 && (
                        <div className="rounded-xl border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 p-3 border-b border-gray-200">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-semibold text-gray-800 text-sm">Order Items ({orderItems.length})</h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm("Clear all items from order?")) {
                                                setOrderItems([]);
                                                toast.success("All items removed");
                                            }
                                        }}
                                        className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded transition cursor-pointer font-medium"
                                        disabled={isSubmitting}
                                    >
                                        Clear All
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-gray-700 min-w-[800px]">
                                    <thead className="bg-gray-50 text-gray-800 border-b border-gray-200">
                                        <tr>
                                            <th className="p-3 text-left font-semibold">Product</th>
                                            <th className="p-3 text-center font-semibold">Qty</th>
                                            <th className="p-3 text-center font-semibold">Unit Price</th>
                                            <th className="p-3 text-center font-semibold">Discount %</th>
                                            <th className="p-3 text-center font-semibold">Tax/VAT %</th>
                                            <th className="p-3 text-right font-semibold">Total</th>
                                            <th className="p-3 text-center font-semibold">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {calculations.itemsWithTotals.map((item) => {
                                            const itemImg = item.image || getProductImage(item);
                                            return (
                                                <tr key={item.itemKey || item.id} className="hover:bg-gray-50">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                                                                {itemImg ? (
                                                                    <Image
                                                                        src={itemImg}
                                                                        alt={item.productName || "Product"}
                                                                        width={36}
                                                                        height={36}
                                                                        className="object-cover w-full h-full"
                                                                        unoptimized={typeof itemImg === 'string' && itemImg.startsWith('http://')}
                                                                    />
                                                                ) : (
                                                                    <Package className="w-4 h-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-800">{item.productName}</div>
                                                                <div className="text-[11px] text-gray-500 flex items-center gap-2">
                                                                    <span className="font-mono">SKU: {item.sku || "—"}</span>
                                                                    {item.variantName && (
                                                                        <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-medium border border-purple-200">
                                                                            {item.variantName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(item.itemKey || item.id, item.quantity - 1)}
                                                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                                disabled={item.quantity <= 1 || isSubmitting}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => updateQuantity(item.itemKey || item.id, e.target.value)}
                                                                className="w-14 text-center border border-gray-300 rounded p-1 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                                                disabled={isSubmitting}
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuantity(item.itemKey || item.id, item.quantity + 1)}
                                                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 cursor-pointer"
                                                                disabled={isSubmitting}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItemField(item.itemKey || item.id, "unitPrice", e.target.value)}
                                                            className="w-24 text-center border border-gray-300 rounded p-1 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                                            disabled={isSubmitting}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max={100}
                                                            value={item.discount}
                                                            onChange={(e) => updateItemField(item.itemKey || item.id, "discount", e.target.value)}
                                                            className="w-16 text-center border border-gray-300 rounded p-1 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                                            disabled={isSubmitting}
                                                        />
                                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                                            -৳{item.itemDiscountAmount.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            value={item.tax}
                                                            onChange={(e) => updateItemField(item.itemKey || item.id, "tax", e.target.value)}
                                                            className="w-16 text-center border border-gray-300 rounded p-1 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition"
                                                            disabled={isSubmitting}
                                                        />
                                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                                            +৳{item.itemTaxAmount.toFixed(2)}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-gray-900">
                                                        ৳{item.itemTotal.toFixed(2)}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(item.itemKey || item.id)}
                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition cursor-pointer"
                                                            disabled={isSubmitting}
                                                            title="Remove item"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Order Summary */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Adjustments */}
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-800">Order Adjustments</h3>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Order Discount (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={100}
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 mt-1 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition text-sm"
                                    disabled={isSubmitting}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Applied to subtotal after item discounts: ৳{calculations.orderDiscountAmount.toFixed(2)}
                                </p>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Shipping Cost (৳)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={shippingCost}
                                    onChange={(e) => setShippingCost(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 mt-1 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Paid Amount (৳)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max={calculations.grandTotal}
                                    value={paidAmount}
                                    onChange={(e) => setPaidAmount(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 mt-1 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition text-sm"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-gray-700">Note</label>
                                <textarea
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    className="w-full border border-gray-300 rounded p-2 mt-1 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25 transition text-sm"
                                    rows={3}
                                    placeholder="Add any notes for this order..."
                                    disabled={isSubmitting}
                                />
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                            <div className="bg-gray-100 p-4 border-b border-gray-200">
                                <h3 className="text-base font-semibold text-gray-800">Order Summary</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody>
                                    <SummaryRow label="Total Amount" value={calculations.totalAmount} />
                                    <SummaryRow label="Item Discounts" value={calculations.totalItemDiscount} />
                                    <SummaryRow label="Subtotal" value={calculations.subtotalAfterItemDiscount} />
                                    <SummaryRow label="Order Discount" value={calculations.orderDiscountAmount} />
                                    <SummaryRow label="Subtotal After Discount" value={calculations.subtotalAfterOrderDiscount} />
                                    <SummaryRow label="Tax/VAT" value={calculations.totalTax} />
                                    <SummaryRow label="Shipping Cost" value={parseFloat(shippingCost) || 0} />
                                    <SummaryRow label="Grand Total" value={calculations.grandTotal} highlight />
                                    <SummaryRow label="Paid Amount" value={parseFloat(paidAmount) || 0} />
                                    <SummaryRow
                                        label="Due Amount"
                                        value={calculations.dueAmount}
                                        highlight={calculations.dueAmount > 0}
                                    />
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition font-medium cursor-pointer"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || orderItems.length === 0 || !selectedCustomerId || !orderDate || !shippingAddressId}
                            className="px-6 py-2.5 rounded bg-secound text-white hover:bg-secound-hover disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition font-medium cursor-pointer"
                        >
                            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                            {isSubmitting ? "Creating Order..." : "Confirm Order"}
                        </button>
                    </div>
                    </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        {/* Customer Add Modal */}
        <CustomerAddModal
            isOpen={isAddCustomerOpen}
            onClose={() => setIsAddCustomerOpen(false)}
            onSuccess={handleCustomerAdded}
            zIndex="z-[60]"
        />
    </>
    );
};

const SummaryRow = ({ label, value, highlight = false }) => (
    <tr className={highlight ? "bg-yellow-50 font-semibold border-t border-gray-200" : ""}>
        <td className="p-3 text-gray-700">{label}</td>
        <td className="p-3 text-right font-medium text-gray-800">
            ৳ {typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2)}
        </td>
    </tr>
);

export default OrderAddModal;