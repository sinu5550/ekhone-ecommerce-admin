"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import {
    X,
    Loader2,
    User,
    Phone,
    Mail,
    MapPin,
    Search,
    Package,
    UserPlus,
    Calendar,
    ShoppingBag,
    Trash2,
    Check,
    AlertCircle,
    CheckCircle2,
    DollarSign,
    Tag,
    Clock,
    FileText,
    ChevronDown
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { useCustomers, useProducts } from "@/lib/dataFetch";
import CustomerAddModal from "@/components/modal/CustomerModal/CustomerAddModal";

const OrderAddDrawer = ({ isOpen, onClose, onSuccess }) => {
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

    // Customer search states & refs
    const [customerSearchQuery, setCustomerSearchQuery] = useState("");
    const [isCustomerSearchOpen, setIsCustomerSearchOpen] = useState(false);
    const customerSearchRef = useRef(null);
    const customerInputRef = useRef(null);

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

    // Filter customers by name, phone, or email
    const filteredCustomers = useMemo(() => {
        const q = customerSearchQuery.trim().toLowerCase();
        if (!q) return allCustomers.slice(0, 50);
        return allCustomers.filter(c =>
            c.fullName?.toLowerCase().includes(q) ||
            c.phone?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q)
        ).slice(0, 50);
    }, [customerSearchQuery, allCustomers]);

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
        const cIdStr = customerId ? String(customerId) : "";
        setValue("customerId", cIdStr, { shouldValidate: true });
        setValue("shippingAddressId", "");
        setSelectedShippingAddress(null);
        setIsCustomerSearchOpen(false);
        setCustomerSearchQuery("");

        if (cIdStr) {
            if (clearErrors) clearErrors("customerId");
            const customer = allCustomers.find(c => c.id === parseInt(cIdStr));
            if (customer?.customerAddresses?.length) {
                const defaultAddress = customer.customerAddresses.find(addr => addr.isDefault) || customer.customerAddresses[0];
                if (defaultAddress) {
                    setValue("shippingAddressId", defaultAddress.id.toString(), { shouldValidate: true });
                    setSelectedShippingAddress(defaultAddress);
                    if (clearErrors) clearErrors("shippingAddressId");
                }
            }
        }
    }, [allCustomers, setValue, clearErrors]);

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
            setValue("customerId", cId, { shouldValidate: true });
            if (clearErrors) clearErrors("customerId");
            setIsCustomerSearchOpen(false);
            setCustomerSearchQuery("");

            const defaultAddr = newCustomer.customerAddresses?.find(a => a.isDefault) || newCustomer.customerAddresses?.[0];
            if (defaultAddr?.id) {
                setValue("shippingAddressId", String(defaultAddr.id), { shouldValidate: true });
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
        setCustomerSearchQuery("");
        setIsCustomerSearchOpen(false);
        setIsAddCustomerOpen(false);
        resetForm({
            customerId: "",
            shippingAddressId: "",
            orderDate: new Date().toISOString().split('T')[0]
        });
        setIsSubmitting(false);
    }, [resetForm]);

    // Reset and body scroll lock / escape handler
    useEffect(() => {
        if (!isOpen) {
            reset();
            return;
        }

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                if (isAddCustomerOpen) {
                    setIsAddCustomerOpen(false);
                } else if (!isSubmitting) {
                    onClose();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen, isAddCustomerOpen, isSubmitting, onClose, reset]);

    // Handle outside click to close search dropdowns
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
                setShowSearchResults(false);
            }
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target)) {
                setIsCustomerSearchOpen(false);
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

            const localResults = productData.filter(product => {
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
    }, [productData]);

    // Debounced search
    useEffect(() => {
        if (!productSearchQuery.trim()) {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const timer = setTimeout(() => {
            searchProducts(productSearchQuery);
        }, 300);

        return () => clearTimeout(timer);
    }, [productSearchQuery, searchProducts]);

    const handleAddProduct = useCallback((product, variant = null) => {
        if (!product || !product.id) {
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

    // Calculations
    const calculations = useMemo(() => {
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
                toast.error("Please select a customer");
                setIsSubmitting(false);
                return;
            }

            if (!shippingAddressId) {
                toast.error("Please select a shipping address");
                setIsSubmitting(false);
                return;
            }

            if (orderItems.length === 0) {
                toast.error("Please add at least one product to the order");
                setIsSubmitting(false);
                return;
            }

            if (!orderDate) {
                toast.error("Order date is required");
                setIsSubmitting(false);
                return;
            }

            const mappedItems = calculations.itemsWithTotals.map((item) => {
                const qty = parseInt(item.quantity) || 1;
                const unitPrice = parseFloat(item.unitPrice) || 0;
                const discount = parseFloat(item.discount) || 0;
                const tax = parseFloat(item.tax) || 0;
                const lineTotal = parseFloat(item.itemTotal) || 0;

                return {
                    productId: parseInt(item.productId || item.id),
                    productVariantId: item.productVariantId ? parseInt(item.productVariantId) : null,
                    sku: item.sku || null,
                    quantity: qty,
                    unitPrice: unitPrice,
                    discount: discount,
                    tax: tax,
                    lineTotal: lineTotal,
                    total: lineTotal
                };
            });

            let finalOrderDate = new Date().toISOString();
            if (orderDate) {
                const now = new Date();
                const d = new Date(orderDate);
                d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
                finalOrderDate = isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
            }

            const formattedData = {
                customerId: parseInt(selectedCustomerId),
                shippingAddressId: parseInt(shippingAddressId),
                orderDate: finalOrderDate,
                totalAmount: calculations.totalAmount,
                discount: calculations.totalItemDiscount,
                subtotal: calculations.subtotalAfterItemDiscount,
                orderDiscount: calculations.orderDiscountAmount,
                subtotalAfterOrderDiscount: calculations.subtotalAfterOrderDiscount,
                tax: calculations.totalTax,
                shippingCost: parseFloat(shippingCost) || 0,
                grandTotal: calculations.grandTotal,
                paidAmount: parseFloat(paidAmount) || 0,
                dueAmount: calculations.dueAmount,
                paymentStatus: parseFloat(paidAmount) >= calculations.grandTotal ? "Paid" : (parseFloat(paidAmount) > 0 ? "Partial" : "Unpaid"),
                status: "Pending",
                orderStatus: "Pending",
                paymentMethod: "COD",
                source: "Manual",
                note: note.trim(),
                items: mappedItems,
                orderItems: mappedItems,
            };

            const response = await apiClient("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formattedData),
            });

            const isSuccess = response?.success !== false && (Boolean(response?.id) || Boolean(response?.orderNumber) || Boolean(response?.success) || Boolean(response?.data));

            if (isSuccess) {
                const orderNum = response?.orderNumber || response?.data?.orderNumber;
                toast.success(
                    response?.message || (orderNum ? `Order #${orderNum} created successfully!` : "Order created successfully!")
                );
                reset();
                onSuccess?.();
                onClose();
            } else {
                throw new Error(response?.message || "Failed to create order");
            }
        } catch (err) {
            console.error("Order creation error:", err);
            toast.error(err.message || "Something went wrong creating the order");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 overflow-hidden">
                        {/* Backdrop Overlay */}
                        <motion.div
                            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={isSubmitting ? undefined : onClose}
                        />

                        {/* Sliding Drawer Panel (Right Side) */}
                        <motion.div
                            className="fixed inset-y-0 right-0 w-full sm:w-[92vw] md:w-[85vw] lg:w-[75vw] xl:w-[65vw] max-w-6xl bg-white shadow-2xl flex flex-col h-full border-l border-gray-200 z-50 overflow-hidden"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 28, stiffness: 280 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Fixed Drawer Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-20 shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-md bg-secound/10 border border-secound/20 flex items-center justify-center text-secound shadow-xs shrink-0">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 font-exo">Add New Order (Manual)</h2>
                                        <p className="text-xs text-gray-500 font-sans">
                                            Create a manual order for in-store, phone, or custom orders
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-1.5 text-gray-500 hover:text-gray-800 rounded-md hover:bg-gray-100 transition cursor-pointer"
                                    disabled={isSubmitting}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Scrollable Form Body */}
                            <form
                                id="manual-order-form"
                                onSubmit={handleSubmit(onSubmit)}
                                className="flex flex-col flex-1 overflow-hidden"
                            >
                                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                    {/* Section 1: Customer & Order Destination Card */}
                                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-md p-5 shadow-xs space-y-4">
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 flex-wrap gap-2">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-md bg-secound/10 text-secound flex items-center justify-center text-xs font-semibold">
                                                    <User size={15} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                                        Customer & Delivery Information
                                                    </h3>
                                                    <p className="text-[11px] text-gray-500">Select customer, order date, and shipping destination</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddCustomerOpen(true)}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-md bg-secound/10 text-secound border border-secound/20 hover:bg-secound hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                                disabled={isSubmitting}
                                            >
                                                <UserPlus size={14} />
                                                <span>+ Add New Customer</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Customer Selector with Search */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                    Customer <span className="text-red-500">*</span>
                                                </label>
                                                {/* Hidden input to register customerId with react-hook-form */}
                                                <input
                                                    type="hidden"
                                                    {...register("customerId", { required: "Customer is required" })}
                                                />
                                                {selectedCustomer ? (
                                                    <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/70 border border-emerald-300 rounded-md min-h-[42px] shadow-2xs">
                                                        <div className="flex items-center gap-2.5 min-w-0">
                                                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                                                <User size={14} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="text-xs font-bold text-gray-900 truncate">
                                                                    {selectedCustomer.fullName}
                                                                </div>
                                                                <div className="text-[11px] font-mono text-emerald-700 truncate">
                                                                    {selectedCustomer.phone || "No phone"}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleCustomerChange("");
                                                                setTimeout(() => customerInputRef.current?.focus(), 50);
                                                            }}
                                                            className="text-xs font-semibold text-gray-500 hover:text-red-600 px-2 py-1 rounded hover:bg-white border border-transparent hover:border-gray-200 transition shrink-0 flex items-center gap-1 cursor-pointer"
                                                            title="Change customer"
                                                        >
                                                            <X size={12} />
                                                            <span>Change</span>
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div ref={customerSearchRef} className="relative">
                                                        <div className="relative">
                                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                                                            <input
                                                                ref={customerInputRef}
                                                                type="text"
                                                                value={customerSearchQuery}
                                                                onChange={(e) => {
                                                                    setCustomerSearchQuery(e.target.value);
                                                                    setIsCustomerSearchOpen(true);
                                                                }}
                                                                onFocus={() => setIsCustomerSearchOpen(true)}
                                                                placeholder="Search by name, phone, email..."
                                                                className={`w-full pl-9 pr-8 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 bg-white text-gray-800 placeholder:text-gray-400 placeholder:opacity-100 ${
                                                                    errors.customerId
                                                                        ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                                        : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                                }`}
                                                                disabled={isSubmitting}
                                                            />
                                                            {customerSearchQuery ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setCustomerSearchQuery("")}
                                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 cursor-pointer"
                                                                >
                                                                    <X size={14} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setIsCustomerSearchOpen((prev) => !prev)}
                                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 rounded cursor-pointer"
                                                                >
                                                                    <ChevronDown size={15} />
                                                                </button>
                                                            )}
                                                        </div>

                                                        {/* Dropdown Results */}
                                                        {isCustomerSearchOpen && (
                                                            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-gray-100">
                                                                <div className="p-2 bg-gray-50/80 text-[11px] font-semibold text-gray-500 flex items-center justify-between sticky top-0 border-b border-gray-100 backdrop-blur-xs">
                                                                    <span>{filteredCustomers.length} customer{filteredCustomers.length === 1 ? "" : "s"} found</span>
                                                                    {customerSearchQuery && (
                                                                        <span className="text-[10px] text-gray-400">Filtering by &quot;{customerSearchQuery}&quot;</span>
                                                                    )}
                                                                </div>
                                                                {filteredCustomers.length > 0 ? (
                                                                    filteredCustomers.map((c) => (
                                                                        <div
                                                                            key={c.id}
                                                                            onClick={() => handleCustomerChange(c.id.toString())}
                                                                            className="p-2.5 hover:bg-secound/10 cursor-pointer transition flex items-center justify-between gap-2"
                                                                        >
                                                                            <div className="min-w-0">
                                                                                <p className="text-xs font-bold text-gray-900 truncate">
                                                                                    {c.fullName}
                                                                                </p>
                                                                                <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                                                                                    {c.phone || "No phone"} {c.email ? `• ${c.email}` : ""}
                                                                                </p>
                                                                            </div>
                                                                            {c.customerAddresses?.[0] && (
                                                                                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0 max-w-[110px] truncate">
                                                                                    {c.customerAddresses[0].district || c.customerAddresses[0].city}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="p-4 text-center">
                                                                        <p className="text-xs text-gray-500 mb-2">
                                                                            No customers found matching &quot;{customerSearchQuery}&quot;
                                                                        </p>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setIsCustomerSearchOpen(false);
                                                                                setIsAddCustomerOpen(true);
                                                                            }}
                                                                            className="px-2.5 py-1 text-xs font-semibold rounded-md bg-secound text-white hover:opacity-90 transition inline-flex items-center gap-1 cursor-pointer"
                                                                        >
                                                                            <UserPlus size={12} />
                                                                            <span>+ Add New Customer</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {errors.customerId && (
                                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                        <AlertCircle size={12} /> {errors.customerId.message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Order Date */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                    Order Date <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="date"
                                                        {...register("orderDate", { required: "Order date is required" })}
                                                        className={`w-full px-3 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 bg-white text-gray-800 ${
                                                            errors.orderDate
                                                                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                                : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                        }`}
                                                        disabled={isSubmitting}
                                                    />
                                                </div>
                                                {errors.orderDate && (
                                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                        <AlertCircle size={12} /> {errors.orderDate.message}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Shipping Address */}
                                            <div>
                                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                                    Shipping Address <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <select
                                                        {...register("shippingAddressId", { required: "Shipping address is required" })}
                                                        onChange={(e) => handleShippingAddressChange(e.target.value)}
                                                        value={shippingAddressId}
                                                        className={`w-full px-3 py-2.5 rounded-md border text-sm transition focus:outline-none focus:ring-2 bg-white text-gray-800 ${
                                                            !selectedCustomerId || customerAddresses.length === 0
                                                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                                                : ""
                                                        } ${
                                                            errors.shippingAddressId
                                                                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                                                : "border-gray-300 focus:border-secound focus:ring-secound/20 hover:border-gray-400"
                                                        }`}
                                                        disabled={!selectedCustomerId || customerAddresses.length === 0 || isSubmitting}
                                                    >
                                                        <option value="">
                                                            {!selectedCustomerId
                                                                ? "Select customer first"
                                                                : customerAddresses.length === 0
                                                                ? "No address found for customer"
                                                                : "Select Shipping Address..."}
                                                        </option>
                                                        {customerAddresses.map((address) => (
                                                            <option key={address.id} value={address.id}>
                                                                {address.type} {address.isDefault && "(Default)"} - {address.upazila || address.city}, {address.district}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                {errors.shippingAddressId && (
                                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                        <AlertCircle size={12} /> {errors.shippingAddressId.message}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Selected Customer & Shipping Preview Card */}
                                        {(selectedCustomer || currentShippingAddress) && (
                                            <div className="bg-white border border-slate-200/90 rounded-md p-4 shadow-2xs">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                                                    {/* Customer Info */}
                                                    {selectedCustomer && (
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                                                                <User size={13} className="text-secound" /> Customer Details
                                                            </div>
                                                            <div className="text-sm font-bold text-gray-900">{selectedCustomer.fullName}</div>
                                                            <div className="text-xs text-gray-600 flex items-center gap-2">
                                                                <Phone size={13} className="text-gray-400" />
                                                                <span className="font-mono">{selectedCustomer.phone}</span>
                                                            </div>
                                                            {selectedCustomer.email && (
                                                                <div className="text-xs text-gray-600 flex items-center gap-2">
                                                                    <Mail size={13} className="text-gray-400" />
                                                                    <span>{selectedCustomer.email}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Shipping Info */}
                                                    {currentShippingAddress ? (
                                                        <div className="space-y-2 md:pl-4 pt-3 md:pt-0">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                                                                    <MapPin size={13} className="text-sky-600" /> Delivery Destination
                                                                </span>
                                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                                    {currentShippingAddress.type} {currentShippingAddress.isDefault && "• Default"}
                                                                </span>
                                                            </div>
                                                            <div className="text-xs text-gray-700">
                                                                <span className="font-semibold text-gray-900">{currentShippingAddress.recipientName || selectedCustomer?.fullName}</span>
                                                                {currentShippingAddress.phoneNumber && (
                                                                    <span className="text-gray-500 font-mono ml-2">({currentShippingAddress.phoneNumber})</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                                {currentShippingAddress.address}
                                                            </p>
                                                            <div className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap">
                                                                {currentShippingAddress.upazila && <span>{currentShippingAddress.upazila},</span>}
                                                                {currentShippingAddress.district && <span>{currentShippingAddress.district}</span>}
                                                                {currentShippingAddress.postalCode && <span className="font-mono">({currentShippingAddress.postalCode})</span>}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="md:pl-4 pt-3 md:pt-0 flex items-center justify-center text-xs text-amber-600 font-medium">
                                                            Select a shipping address from the dropdown above
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Section 2: Search Products Card */}
                                    <div className="bg-slate-50/80 border border-slate-200/80 rounded-md p-5 shadow-xs space-y-4" ref={searchContainerRef}>
                                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xs font-semibold">
                                                    <Package size={15} />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                                        Add Products to Order
                                                    </h3>
                                                    <p className="text-[11px] text-gray-500">Search catalog by product name, SKU, or brand</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="relative">
                                            <div className="relative">
                                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="text"
                                                    placeholder="Search products by title, SKU, brand, or category..."
                                                    value={productSearchQuery}
                                                    onChange={(e) => setProductSearchQuery(e.target.value)}
                                                    onFocus={() => productSearchQuery.trim() && setShowSearchResults(true)}
                                                    className="w-full pl-10 pr-10 py-2.5 rounded-md border border-gray-300 text-sm transition focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800 placeholder:text-gray-400 placeholder:opacity-100 hover:border-gray-400 shadow-2xs"
                                                    disabled={isSubmitting}
                                                />
                                                {isSearching && (
                                                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                                                        <Loader2 className="animate-spin text-secound" size={18} />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Search Results Dropdown */}
                                            {showSearchResults && searchResults.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-md shadow-2xl z-30 max-h-80 overflow-y-auto divide-y divide-gray-100">
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
                                                                        <div className="w-10 h-10 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
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
                                                                            <div className="font-semibold text-gray-900 truncate text-sm" title={product.productName}>
                                                                                {product.productName || "Unnamed Product"}
                                                                            </div>
                                                                            <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap mt-0.5">
                                                                                <span className="font-mono bg-gray-100 px-1.5 py-0.2 rounded-md text-[11px]">
                                                                                    SKU: {product.sku || "N/A"}
                                                                                </span>
                                                                                {product.subCategory?.name && <span>• {product.subCategory.name}</span>}
                                                                                {product.brand?.name && <span>• {product.brand.name}</span>}
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <div className="text-right shrink-0">
                                                                        <div className="font-bold text-gray-900 text-sm">
                                                                            ৳ {priceVal.toFixed(2)}
                                                                        </div>
                                                                        <div className="text-[11px] text-gray-500 mt-0.5">
                                                                            Stock:{" "}
                                                                            <span className={parseInt(product.quantity || 0) > 0 ? "text-emerald-600 font-semibold" : "text-red-500 font-semibold"}>
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
                                                                                className="mt-1 px-2.5 py-0.5 text-xs bg-secound hover:bg-secound-hover text-white rounded-md font-medium transition cursor-pointer shadow-2xs"
                                                                            >
                                                                                + Add
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Variant Options Selection */}
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
                                                                                    className="px-2.5 py-1 text-xs bg-white hover:bg-secound hover:text-white border border-slate-200 rounded-md font-medium text-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                                                                >
                                                                                    <span>{vLabel}</span>
                                                                                    <span className="font-bold">৳{vPrice.toFixed(2)}</span>
                                                                                    <span className="text-[10px] opacity-75">({v.quantity || 0})</span>
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
                                                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-md shadow-lg z-30 p-4">
                                                    <div className="text-center text-gray-500 text-sm">
                                                        No products found for "{productSearchQuery}"
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quick add by SKU */}
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                                                Quick Add by SKU:
                                            </span>
                                            <input
                                                type="text"
                                                placeholder="Type SKU and press Enter"
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
                                                className="max-w-xs border border-gray-300 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800 placeholder:text-gray-400 placeholder:opacity-100 transition hover:border-gray-400"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>

                                    {/* Section 3: Order Items Table */}
                                    {orderItems.length === 0 ? (
                                        <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-md bg-slate-50/50">
                                            <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                            <p className="text-sm font-semibold text-gray-700">No products added to this order yet</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Search products above or use quick SKU entry to add items</p>
                                        </div>
                                    ) : (
                                        <div className="rounded-md border border-gray-200 overflow-hidden bg-white shadow-xs">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-900 text-sm">Order Items</span>
                                                    <span className="bg-secound/10 text-secound font-bold text-xs px-2 py-0.5 rounded-md">
                                                        {orderItems.length}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window.confirm("Clear all items from this order?")) {
                                                            setOrderItems([]);
                                                            toast.success("All items cleared");
                                                        }
                                                    }}
                                                    className="text-xs text-red-600 hover:text-red-800 hover:bg-red-50 px-2.5 py-1 rounded-md transition cursor-pointer font-medium"
                                                    disabled={isSubmitting}
                                                >
                                                    Clear All
                                                </button>
                                            </div>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-gray-700 min-w-[760px]">
                                                    <thead className="bg-gray-50 text-gray-800 border-b border-gray-200">
                                                        <tr>
                                                            <th className="p-3 text-left font-semibold">Product</th>
                                                            <th className="p-3 text-center font-semibold">Qty</th>
                                                            <th className="p-3 text-center font-semibold">Unit Price</th>
                                                            <th className="p-3 text-center font-semibold">Discount %</th>
                                                            <th className="p-3 text-center font-semibold">Tax %</th>
                                                            <th className="p-3 text-right font-semibold">Total</th>
                                                            <th className="p-3 text-center font-semibold w-12">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {calculations.itemsWithTotals.map((item) => {
                                                            const itemImg = item.image || getProductImage(item);
                                                            return (
                                                                <tr key={item.itemKey || item.id} className="hover:bg-slate-50/60 transition-colors">
                                                                    <td className="p-3">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-9 h-9 rounded-md border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
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
                                                                                <div className="font-semibold text-gray-900">{item.productName}</div>
                                                                                <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                                                                    <span className="font-mono bg-gray-100 px-1 rounded-md text-[10px]">
                                                                                        SKU: {item.sku || "—"}
                                                                                    </span>
                                                                                    {item.variantName && (
                                                                                        <span className="bg-purple-50 text-purple-700 px-1.5 py-0.2 rounded-md text-[10px] font-medium border border-purple-200">
                                                                                            {item.variantName}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <div className="flex items-center justify-center gap-1">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateQuantity(item.itemKey || item.id, item.quantity - 1)}
                                                                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                                                disabled={item.quantity <= 1 || isSubmitting}
                                                                            >
                                                                                -
                                                                            </button>
                                                                            <input
                                                                                type="number"
                                                                                min="1"
                                                                                value={item.quantity}
                                                                                onChange={(e) => updateQuantity(item.itemKey || item.id, e.target.value)}
                                                                                className="w-12 text-center border border-gray-300 rounded-md p-1 focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800 font-semibold"
                                                                                disabled={isSubmitting}
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => updateQuantity(item.itemKey || item.id, item.quantity + 1)}
                                                                                className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer"
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
                                                                            className="w-20 text-center border border-gray-300 rounded-md p-1 focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800"
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
                                                                            className="w-14 text-center border border-gray-300 rounded-md p-1 focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800"
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
                                                                            className="w-14 text-center border border-gray-300 rounded-md p-1 focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800"
                                                                            disabled={isSubmitting}
                                                                        />
                                                                        <div className="text-[10px] text-gray-500 mt-0.5">
                                                                            +৳{item.itemTaxAmount.toFixed(2)}
                                                                        </div>
                                                                    </td>
                                                                    <td className="p-3 text-right font-bold text-gray-900 text-sm">
                                                                        ৳ {item.itemTotal.toFixed(2)}
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeItem(item.itemKey || item.id)}
                                                                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition cursor-pointer"
                                                                            disabled={isSubmitting}
                                                                            title="Remove item"
                                                                        >
                                                                            <Trash2 size={15} />
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

                                    {/* Section 4: Adjustments & Order Bill Summary */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        {/* Order Adjustments Card */}
                                        <div className="bg-slate-50/80 border border-slate-200/80 rounded-md p-5 shadow-xs space-y-3.5">
                                            <div className="flex items-center gap-2 pb-2 border-b border-slate-200/70">
                                                <div className="w-6 h-6 rounded-md bg-secound/10 text-secound flex items-center justify-center text-xs font-semibold">
                                                    <Tag size={13} />
                                                </div>
                                                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                                    Order Adjustments
                                                </h3>
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <label className="text-xs font-semibold text-gray-700">Order Discount (%)</label>
                                                    <span className="text-xs font-bold text-secound">
                                                        - ৳ {calculations.orderDiscountAmount.toFixed(2)}
                                                    </span>
                                                </div>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={100}
                                                    value={discount}
                                                    onChange={(e) => setDiscount(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800 text-sm"
                                                    disabled={isSubmitting}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-700">Shipping Cost (৳)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={shippingCost}
                                                    onChange={(e) => setShippingCost(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800 text-sm"
                                                    disabled={isSubmitting}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-700">Paid Amount (৳)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={calculations.grandTotal}
                                                    value={paidAmount}
                                                    onChange={(e) => setPaidAmount(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800 text-sm"
                                                    disabled={isSubmitting}
                                                />
                                            </div>

                                            <div>
                                                <label className="text-xs font-semibold text-gray-700">Note / Instructions</label>
                                                <textarea
                                                    value={note}
                                                    onChange={(e) => setNote(e.target.value)}
                                                    className="w-full border border-gray-300 rounded-md p-2 mt-1 focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white text-gray-800 text-sm placeholder:text-gray-400 placeholder:opacity-100"
                                                    rows={2}
                                                    placeholder="Add special delivery instructions or customer requests..."
                                                    disabled={isSubmitting}
                                                />
                                            </div>
                                        </div>

                                        {/* Order Summary Card */}
                                        <div className="rounded-md border border-gray-200 bg-white shadow-xs overflow-hidden flex flex-col justify-between">
                                            <div>
                                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                                    <h3 className="text-sm font-bold text-gray-900 font-exo">Order Bill Summary</h3>
                                                    <span className="text-xs text-gray-500 font-medium">BDT Currency</span>
                                                </div>
                                                <table className="w-full text-xs">
                                                    <tbody className="divide-y divide-gray-100">
                                                        <SummaryRow label="Items Total Amount" value={calculations.totalAmount} />
                                                        <SummaryRow label="Item Discounts" value={calculations.totalItemDiscount} isNegative />
                                                        <SummaryRow label="Subtotal (Items)" value={calculations.subtotalAfterItemDiscount} />
                                                        <SummaryRow label="Order Discount" value={calculations.orderDiscountAmount} isNegative />
                                                        <SummaryRow label="Subtotal After Discount" value={calculations.subtotalAfterOrderDiscount} />
                                                        <SummaryRow label="Tax / VAT" value={calculations.totalTax} />
                                                        <SummaryRow label="Shipping Cost" value={parseFloat(shippingCost) || 0} />
                                                        <SummaryRow label="Grand Total" value={calculations.grandTotal} isBold highlight />
                                                        <SummaryRow label="Paid Amount" value={parseFloat(paidAmount) || 0} />
                                                        <SummaryRow
                                                            label="Due Amount"
                                                            value={calculations.dueAmount}
                                                            isBold
                                                            highlight={calculations.dueAmount > 0}
                                                            isWarning={calculations.dueAmount > 0}
                                                        />
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fixed Drawer Action Buttons Footer */}
                                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between gap-4 shrink-0 z-20">
                                    <div className="text-xs text-gray-600 flex items-center gap-3 flex-wrap">
                                        <div>
                                            <span className="text-gray-500">Items:</span>{" "}
                                            <span className="font-bold text-gray-900">{calculations.itemsWithTotals?.length || 0}</span>
                                        </div>
                                        <span className="text-gray-300">•</span>
                                        <div>
                                            <span className="text-gray-500">Grand Total:</span>{" "}
                                            <span className="text-sm font-bold text-secound">৳ {calculations.grandTotal.toFixed(2)}</span>
                                        </div>
                                        {calculations.dueAmount > 0 && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <div className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-semibold text-[11px] border border-amber-200">
                                                    Due: ৳ {calculations.dueAmount.toFixed(2)}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-5 py-2.5 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition font-medium text-sm cursor-pointer disabled:opacity-50"
                                            disabled={isSubmitting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting || orderItems.length === 0 || !selectedCustomerId || !orderDate || !shippingAddressId}
                                            className="px-7 py-2.5 rounded-md bg-secound text-white hover:bg-secound-hover disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition font-medium text-sm cursor-pointer"
                                        >
                                            {isSubmitting && <Loader2 className="animate-spin" size={16} />}
                                            {isSubmitting ? "Creating Order..." : "Confirm Order"}
                                        </button>
                                    </div>
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
                zIndex="z-[99999]"
            />
        </>
    );
};

const SummaryRow = ({ label, value, highlight = false, isBold = false, isNegative = false, isWarning = false }) => (
    <tr className={highlight ? (isWarning ? "bg-amber-50/70 font-semibold" : "bg-emerald-50/60 font-semibold") : ""}>
        <td className={`p-2.5 px-4 text-gray-700 ${isBold ? "font-bold text-gray-900" : ""}`}>{label}</td>
        <td className={`p-2.5 px-4 text-right ${isBold ? "font-bold text-sm" : "font-medium"} ${isWarning ? "text-amber-700" : (isBold ? "text-gray-900" : "text-gray-800")}`}>
            {isNegative && Number(value) > 0 ? "- " : ""}৳ {typeof value === 'number' ? value.toFixed(2) : parseFloat(value || 0).toFixed(2)}
        </td>
    </tr>
);

export default OrderAddDrawer;
