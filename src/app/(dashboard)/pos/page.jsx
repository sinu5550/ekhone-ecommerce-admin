"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { 
    Store, 
    RotateCcw, 
    Maximize2, 
    Minimize2, 
    Clock, 
    Calendar,
    ShoppingCart,
    Tag,
    AlertTriangle,
    ShieldAlert
} from "lucide-react";
import { useProducts, useCategories, useCustomers } from "@/lib/dataFetch";
import { apiClient } from "@/lib/apiClient";
import { usePermission } from "@/context/PermissionProvider";
import POSProductGrid from "@/components/pos/POSProductGrid";
import POSCart from "@/components/pos/POSCart";
import POSCheckout from "@/components/pos/POSCheckout";
import POSReceiptModal from "@/components/pos/POSReceiptModal";

const POSPage = () => {
    const { hasPermission } = usePermission();

    // Data hooks
    const { data: rawProducts = [], isLoading: isLoadingProducts, mutate: mutateProducts } = useProducts(1, 1000);
    const { data: categories = [] } = useCategories();
    const { data: customerData = [], mutate: mutateCustomers } = useCustomers(1, 1000);

    const [newlyAddedCustomers, setNewlyAddedCustomers] = useState([]);
    const [currentTime, setCurrentTime] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Live clock
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        };
        updateTime();
        const timer = setInterval(updateTime, 1000);
        return () => clearInterval(timer);
    }, []);

    // Normalized Products
    const products = useMemo(() => {
        if (Array.isArray(rawProducts)) return rawProducts;
        if (rawProducts?.products && Array.isArray(rawProducts.products)) return rawProducts.products;
        return [];
    }, [rawProducts]);

    // Normalized Customers
    const allCustomers = useMemo(() => {
        const list = [...newlyAddedCustomers, ...(Array.isArray(customerData) ? customerData : [])];
        const seen = new Set();
        return list.filter(c => {
            if (!c?.id || seen.has(c.id)) return false;
            seen.add(c.id);
            return true;
        });
    }, [newlyAddedCustomers, customerData]);

    // Cart and Order State
    const [cartItems, setCartItems] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [isWalkIn, setIsWalkIn] = useState(true);
    const [orderType, setOrderType] = useState("counter");
    const [discount, setDiscount] = useState(0); // Order-level discount %
    const [tax, setTax] = useState(0); // Tax %
    const [shippingCost, setShippingCost] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [orderStatus, setOrderStatus] = useState("Delivered");
    const [note, setNote] = useState("In-Store POS Sale");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Completed Order for Receipt Modal
    const [completedOrder, setCompletedOrder] = useState(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

    // Helper: Find or Auto-Create Walk-In Customer
    const ensureWalkInCustomer = useCallback(async () => {
        // Look in cached customers for "Walk-in"
        let walkIn = allCustomers.find(c => 
            c.fullName?.toLowerCase().includes("walk-in") || 
            c.phone === "01000000000"
        );

        if (walkIn && walkIn.customerAddresses?.length > 0) {
            return walkIn;
        }

        // If customer exists but has no address, add default address
        if (walkIn && (!walkIn.customerAddresses || walkIn.customerAddresses.length === 0)) {
            try {
                await apiClient(`/api/customer/${walkIn.id}/addresses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        recipientName: "Walk-in Customer",
                        phoneNumber: walkIn.phone || "01700000000",
                        address: "Jigatola, Dhaka",
                        upazila: "Jigatola",
                        district: "Dhaka",
                        division: "Dhaka",
                        postalCode: "1209",
                        city: "Dhaka",
                        isDefault: true
                    })
                });
                if (mutateCustomers) await mutateCustomers();
            } catch (err) {
                console.error("Failed to add walk-in address:", err);
            }
            return walkIn;
        }

        // Create Walk-in customer if not present
        try {
            const res = await apiClient("/api/customer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: "Walk-in Customer",
                    phone: "01700000000",
                    email: null,
                    address: "Jigatola, Dhaka",
                    division: "Dhaka",
                    district: "Dhaka",
                    upazila: "Jigatola",
                    postalCode: "1209",
                    city: "Dhaka",
                    isDefault: true
                })
            });

            const created = res?.data || res;
            if (created && created.id) {
                setNewlyAddedCustomers(prev => [created, ...prev]);
                if (mutateCustomers) await mutateCustomers();
                return created;
            }
        } catch (err) {
            console.error("Error creating walk-in customer:", err);
        }

        // Fallback to first customer in list if creation failed
        return allCustomers[0] || null;
    }, [allCustomers, mutateCustomers]);

    // Initialize with walk-in customer once customers load
    useEffect(() => {
        if (!selectedCustomer && allCustomers.length > 0 && isWalkIn) {
            const walkIn = allCustomers.find(c => 
                c.fullName?.toLowerCase().includes("walk-in") || 
                c.phone === "01000000000"
            );
            if (walkIn) {
                setSelectedCustomer(walkIn);
            } else {
                // If not found yet, select the first available as default
                setSelectedCustomer(allCustomers[0]);
            }
        }
    }, [allCustomers, selectedCustomer, isWalkIn]);

    // Handle Walk-in Selection
    const handleSelectWalkIn = useCallback(async () => {
        setIsWalkIn(true);
        const walkIn = await ensureWalkInCustomer();
        if (walkIn) {
            setSelectedCustomer(walkIn);
            toast.success("Walk-in customer selected");
        }
    }, [ensureWalkInCustomer]);

    // Handle Registered Customer Selection
    const handleSelectCustomer = useCallback((customer) => {
        if (customer) {
            setIsWalkIn(false);
            setSelectedCustomer(customer);
            toast.success(`Customer: ${customer.fullName}`);
        } else {
            handleSelectWalkIn();
        }
    }, [handleSelectWalkIn]);

    // Handle newly added customer from modal
    const handleCustomerAdded = useCallback((newCustomer) => {
        if (newCustomer?.id) {
            setNewlyAddedCustomers(prev => [newCustomer, ...prev]);
            setIsWalkIn(false);
            setSelectedCustomer(newCustomer);
            if (mutateCustomers) mutateCustomers();
            toast.success(`Added & selected: ${newCustomer.fullName}`);
        }
    }, [mutateCustomers]);

    // Add product / variant to cart
    const handleAddToCart = useCallback((product, variant = null) => {
        if (!product || !product.id) return;

        const variantId = variant?.id || null;
        const itemKey = variantId ? `${product.id}-v${variantId}` : `${product.id}`;
        const itemStock = variant ? (parseInt(variant.quantity) || 0) : (parseInt(product.quantity) || 0);

        setCartItems((prev) => {
            const existing = prev.find(item => item.itemKey === itemKey);

            if (existing) {
                if (existing.quantity >= itemStock && product.productType !== 'service') {
                    toast.error(`Only ${itemStock} items available in stock`);
                    return prev;
                }
                toast.success(`Increased ${product.productName}`);
                return prev.map(item =>
                    item.itemKey === itemKey
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            if (itemStock <= 0 && product.productType !== 'service') {
                toast.error("Item is out of stock");
                return prev;
            }

            const unitPrice = parseFloat(variant?.price || product.salePrice || product.price || 0);
            const variantName = variant ? [variant.color, variant.size].filter(Boolean).join(" / ") : null;
            const itemSku = variant?.sku || product.sku || "";

            toast.success(`Added ${product.productName}`);
            return [
                ...prev,
                {
                    itemKey,
                    id: product.id,
                    productVariantId: variantId,
                    productName: product.productName,
                    variantName,
                    sku: itemSku,
                    unitPrice,
                    quantity: 1,
                    discount: parseFloat(product.discountValue || product.discount || 0),
                    tax: parseFloat(product.tax || 0),
                    image: variant?.image || product.image || (Array.isArray(product.images) ? product.images[0] : null),
                    maxStock: itemStock,
                }
            ];
        });
    }, []);

    // Update quantity
    const handleUpdateQuantity = useCallback((itemKey, newQty) => {
        if (newQty < 1) return;

        setCartItems(prev => prev.map(item => {
            if (item.itemKey === itemKey) {
                if (item.maxStock && newQty > item.maxStock) {
                    toast.error(`Only ${item.maxStock} items available in stock`);
                    return { ...item, quantity: item.maxStock };
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    }, []);

    // Remove item
    const handleRemoveItem = useCallback((itemKey) => {
        setCartItems(prev => prev.filter(item => item.itemKey !== itemKey));
        toast.success("Item removed");
    }, []);

    // Clear cart
    const handleClearCart = useCallback(() => {
        if (cartItems.length === 0) return;
        Swal.fire({
            title: "Clear current cart?",
            text: "All items in the current POS ticket will be removed.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#f59e0b",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, clear it!",
        }).then((result) => {
            if (result.isConfirmed) {
                setCartItems([]);
                setPaidAmount(0);
                toast.success("Cart cleared");
            }
        });
    }, [cartItems.length]);

    // Financial calculations
    const calculations = useMemo(() => {
        const itemsWithTotals = cartItems.map(item => {
            const unitPrice = parseFloat(item.unitPrice) || 0;
            const quantity = parseInt(item.quantity) || 1;
            const discountPercent = parseFloat(item.discount) || 0;
            const itemSubtotal = unitPrice * quantity;
            const itemDiscountAmount = (itemSubtotal * discountPercent) / 100;
            const itemTotal = itemSubtotal - itemDiscountAmount;

            return {
                ...item,
                unitPrice,
                quantity,
                itemSubtotal,
                itemDiscountAmount,
                itemTotal,
            };
        });

        const totalAmount = itemsWithTotals.reduce((acc, i) => acc + i.itemSubtotal, 0);
        const totalItemDiscount = itemsWithTotals.reduce((acc, i) => acc + i.itemDiscountAmount, 0);
        const subtotalAfterItemDiscount = totalAmount - totalItemDiscount;

        const orderDiscountPercent = parseFloat(discount) || 0;
        const orderDiscountAmount = (subtotalAfterItemDiscount * orderDiscountPercent) / 100;
        const subtotalAfterOrderDiscount = subtotalAfterItemDiscount - orderDiscountAmount;

        const taxPercent = parseFloat(tax) || 0;
        const totalTax = (subtotalAfterOrderDiscount * taxPercent) / 100;

        const shipping = parseFloat(shippingCost) || 0;
        const grandTotal = Math.round(subtotalAfterOrderDiscount + totalTax + shipping);

        const paid = parseFloat(paidAmount) || 0;
        const dueAmount = Math.max(0, grandTotal - paid);

        return {
            itemsWithTotals,
            totalAmount,
            totalItemDiscount,
            orderDiscountAmount,
            totalDiscount: totalItemDiscount + orderDiscountAmount,
            totalTax,
            grandTotal,
            dueAmount,
        };
    }, [cartItems, discount, tax, shippingCost, paidAmount]);

    // Auto-update paidAmount when total changes and method is Cash & fully tendered previously
    useEffect(() => {
        if (cartItems.length > 0 && paidAmount === 0 && paymentMethod === "Cash") {
            setPaidAmount(calculations.grandTotal);
        }
    }, [calculations.grandTotal, cartItems.length, paymentMethod]);

    // Submit Order
    const handleSubmitOrder = async () => {
        if (isSubmitting) return;

        if (cartItems.length === 0) {
            toast.error("Cart is empty! Add products first.");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Processing POS order...");

        try {
            // Ensure valid customer & shipping address
            let customerToUse = selectedCustomer;
            if (!customerToUse) {
                customerToUse = await ensureWalkInCustomer();
            }

            if (!customerToUse) {
                toast.error("Customer information required", { id: toastId });
                setIsSubmitting(false);
                return;
            }

            // Find address
            let addressId = customerToUse.customerAddresses?.find(a => a.isDefault)?.id || 
                            customerToUse.customerAddresses?.[0]?.id;

            // If no address exists, add one immediately
            if (!addressId) {
                const addRes = await apiClient(`/api/customer/${customerToUse.id}/addresses`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        recipientName: customerToUse.fullName || "Customer",
                        phoneNumber: customerToUse.phone || "01700000000",
                        address: "Jigatola, Dhaka",
                        upazila: "Jigatola",
                        district: "Dhaka",
                        division: "Dhaka",
                        postalCode: "1209",
                        city: "Dhaka",
                        isDefault: true
                    })
                });
                addressId = addRes?.data?.id || addRes?.id;
            }

            if (!addressId) {
                toast.error("Unable to resolve customer address for order", { id: toastId });
                setIsSubmitting(false);
                return;
            }

            const numPaid = parseFloat(paidAmount) || 0;
            const finalPaymentStatus = calculations.dueAmount <= 0 && numPaid > 0 
                ? "Paid" 
                : (numPaid > 0 ? "Partial" : (paymentMethod === "COD" ? "COD" : "Unpaid"));

            const orderPayload = {
                customerId: parseInt(customerToUse.id),
                shippingAddressId: parseInt(addressId),
                orderDate: new Date().toISOString().split('T')[0],
                totalAmount: calculations.totalAmount,
                discount: calculations.totalDiscount,
                tax: calculations.totalTax,
                shippingCost: parseFloat(shippingCost) || 0,
                grandTotal: calculations.grandTotal,
                paidAmount: numPaid,
                dueAmount: calculations.dueAmount,
                status: orderStatus, // "Delivered"
                paymentStatus: finalPaymentStatus,
                paymentMethod: paymentMethod, // "Cash", "OnlinePayment", "COD"
                note: note || "POS Sale",
                items: calculations.itemsWithTotals.map(item => ({
                    productId: item.id,
                    productVariantId: item.productVariantId || null,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discount || 0,
                    tax: item.tax || 0,
                    lineTotal: item.itemTotal,
                }))
            };

            const response = await apiClient("/api/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload),
            });

            const createdOrder = response?.data || response?.order || response;

            toast.success("Sale completed successfully!", { id: toastId });

            // Refresh products stock
            if (mutateProducts) mutateProducts();

            // Set completed order for receipt modal
            setCompletedOrder({
                ...createdOrder,
                customer: customerToUse,
                items: calculations.itemsWithTotals,
                paidAmount: numPaid,
                grandTotal: calculations.grandTotal,
                dueAmount: calculations.dueAmount,
                paymentMethod: paymentMethod,
            });
            setIsReceiptModalOpen(true);

            // Reset cart
            setCartItems([]);
            setDiscount(0);
            setTax(0);
            setShippingCost(0);
            setPaidAmount(0);

        } catch (err) {
            console.error("POS Order error:", err);
            toast.error(err.message || "Failed to create order", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Keyboard Shortcuts (F2 / Ctrl+Enter = complete order)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "F2" || (e.ctrlKey && e.key === "Enter")) {
                e.preventDefault();
                if (cartItems.length > 0 && !isSubmitting) {
                    handleSubmitOrder();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [cartItems.length, isSubmitting, handleSubmitOrder]);

    const handleNewSale = () => {
        setIsReceiptModalOpen(false);
        setCompletedOrder(null);
        setCartItems([]);
        setPaidAmount(0);
        setDiscount(0);
        setTax(0);
        setShippingCost(0);
        handleSelectWalkIn();
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(() => {});
                setIsFullscreen(false);
            }
        }
    };

    // Permission guard
    if (hasPermission && !hasPermission('order.view') && !hasPermission('order.create')) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 bg-white rounded border border-gray-200 shadow-xs">
                <ShieldAlert size={48} className="text-rose-500 mb-3" />
                <h2 className="text-xl font-bold text-gray-800">Access Restricted</h2>
                <p className="text-sm text-gray-500 mt-1 max-w-md">
                    You do not have permission to access the Point of Sale system. Please contact your administrator.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Top Bar / Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded border border-gray-200 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-secound/10 text-secound flex items-center justify-center shadow-inner">
                        <Store size={22} className="stroke-[2.5]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">
                                Point of Sale (POS)
                            </h1>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Live Terminal
                            </span>
                        </div>
                        <p className="text-xs text-gray-500">
                            Fast in-store sales, barcode scanning & instant receipts
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Time & Date Display */}
                    <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded bg-gray-50 border border-gray-200 text-xs text-gray-600 font-medium">
                        <div className="flex items-center gap-1">
                            <Calendar size={13} className="text-gray-400" />
                            <span>{new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="w-px h-3.5 bg-gray-300"></div>
                        <div className="flex items-center gap-1 font-mono font-bold text-gray-800">
                            <Clock size={13} className="text-secound" />
                            <span>{currentTime || "00:00:00"}</span>
                        </div>
                    </div>

                    {/* Fullscreen Toggle */}
                    <button
                        type="button"
                        onClick={toggleFullscreen}
                        className="p-2 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 transition cursor-pointer"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Main 2-Column POS Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[calc(100vh-175px)]">
                {/* Left Column: Product Catalog & Scanner */}
                <div className="lg:col-span-7 xl:col-span-7 h-[calc(100vh-190px)] min-h-[600px]">
                    <POSProductGrid
                        products={products}
                        categories={categories}
                        isLoading={isLoadingProducts}
                        onAddToCart={handleAddToCart}
                        onUpdateQuantity={handleUpdateQuantity}
                        cartItems={cartItems}
                    />
                </div>

                {/* Right Column: Cart & Checkout Summary */}
                <div className="lg:col-span-5 xl:col-span-5 flex flex-col gap-4 h-[calc(100vh-190px)] min-h-[600px]">
                    {/* Cart Items Panel (Flexible height) */}
                    <div className="flex-1 min-h-[280px]">
                        <POSCart
                            cartItems={cartItems}
                            selectedCustomer={selectedCustomer}
                            customers={allCustomers}
                            onSelectCustomer={handleSelectCustomer}
                            onSelectWalkIn={handleSelectWalkIn}
                            isWalkIn={isWalkIn}
                            onUpdateQuantity={handleUpdateQuantity}
                            onRemoveItem={handleRemoveItem}
                            onClearCart={handleClearCart}
                            onCustomerAdded={handleCustomerAdded}
                            isSubmitting={isSubmitting}
                            orderType={orderType}
                            setOrderType={setOrderType}
                        />
                    </div>

                    {/* Checkout & Tender Panel (Pinned at bottom) */}
                    <div className="shrink-0">
                        <POSCheckout
                            totals={calculations}
                            discount={discount}
                            setDiscount={setDiscount}
                            tax={tax}
                            setTax={setTax}
                            shippingCost={shippingCost}
                            setShippingCost={setShippingCost}
                            paidAmount={paidAmount}
                            setPaidAmount={setPaidAmount}
                            paymentMethod={paymentMethod}
                            setPaymentMethod={setPaymentMethod}
                            orderStatus={orderStatus}
                            setOrderStatus={setOrderStatus}
                            note={note}
                            setNote={setNote}
                            onSubmit={handleSubmitOrder}
                            onClearCart={handleClearCart}
                            isSubmitting={isSubmitting}
                            itemCount={cartItems.length}
                        />
                    </div>
                </div>
            </div>

            {/* Post-Sale Receipt Modal */}
            <POSReceiptModal
                isOpen={isReceiptModalOpen}
                order={completedOrder}
                onClose={() => setIsReceiptModalOpen(false)}
                onNewSale={handleNewSale}
            />
        </div>
    );
};

export default POSPage;