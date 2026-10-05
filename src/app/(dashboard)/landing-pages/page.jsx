"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
    LayoutTemplate, 
    Plus, 
    Search, 
    ExternalLink, 
    Copy, 
    Eye, 
    Pencil, 
    Trash2, 
    Loader2, 
    Check, 
    Sparkles,
    AlertCircle,
    Package,
    RotateCcw
} from "lucide-react";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import { apiClient } from "@/lib/apiClient";

import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";

export default function LandingPagesListPage() {
    const [landingPages, setLandingPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedSlug, setCopiedSlug] = useState(null);

    const fetchLandingPages = async () => {
        setLoading(true);
        try {
            const res = await apiClient("/api/landing-page");
            if (res.success && Array.isArray(res.data)) {
                setLandingPages(res.data);
            }
        } catch (err) {
            console.error("Failed to load landing pages:", err);
            toast.error(err.message || "Could not fetch landing pages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLandingPages();
    }, []);

    const handleCopyUrl = (slug) => {
        const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";
        const fullUrl = `${frontendUrl}/landing/${slug}`;
        navigator.clipboard.writeText(fullUrl);
        setCopiedSlug(slug);
        toast.success("Landing page URL copied!");
        setTimeout(() => setCopiedSlug(null), 2000);
    };

    const handleDelete = async (id, title) => {
        const result = await Swal.fire({
            title: "Delete Landing Page?",
            text: `Are you sure you want to delete "${title}"? This cannot be undone.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel"
        });

        if (result.isConfirmed) {
            const toastId = toast.loading("Deleting landing page...");
            try {
                const res = await apiClient(`/api/landing-page/${id}`, {
                    method: "DELETE"
                });
                if (res.success) {
                    toast.success("Landing page deleted", { id: toastId });
                    setLandingPages(prev => prev.filter(p => p.id !== id));
                } else {
                    throw new Error(res.message);
                }
            } catch (err) {
                toast.error(err.message || "Failed to delete landing page", { id: toastId });
            }
        }
    };

    const filteredPages = landingPages.filter(p => {
        const q = searchQuery.toLowerCase();
        return (
            p.pageTitle?.toLowerCase().includes(q) ||
            p.slug?.toLowerCase().includes(q) ||
            p.product?.productName?.toLowerCase().includes(q) ||
            p.product?.sku?.toLowerCase().includes(q)
        );
    });

    const getProductImage = (product, lp) => {
        if (!product && !lp) return null;

        // 1. Direct array of images on product
        if (Array.isArray(product?.images) && product.images.length > 0) {
            const first = product.images[0];
            if (typeof first === "string" && first.trim()) return first.trim();
            if (first && typeof first === "object" && (first.url || first.secure_url)) return first.url || first.secure_url;
        }

        // 2. JSON string representation on product
        if (typeof product?.images === "string" && product.images.trim()) {
            try {
                const parsed = JSON.parse(product.images);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const first = parsed[0];
                    if (typeof first === "string" && first.trim()) return first.trim();
                    if (first && typeof first === "object" && (first.url || first.secure_url)) return first.url || first.secure_url;
                } else if (typeof parsed === "string" && parsed.trim()) {
                    return parsed.trim();
                }
            } catch {
                if (product.images.startsWith("http://") || product.images.startsWith("https://") || product.images.startsWith("/")) {
                    return product.images.trim();
                }
            }
        }

        // 3. Direct product.image
        if (product?.image && typeof product.image === "string" && product.image.trim()) {
            return product.image.trim();
        }

        // 4. Product variants image fallback
        if (Array.isArray(product?.productVariants) && product.productVariants.length > 0) {
            const variantWithImg = product.productVariants.find(v => v?.image && typeof v.image === "string" && v.image.trim());
            if (variantWithImg?.image) return variantWithImg.image.trim();
        }

        // 5. Landing page banner images fallback
        if (Array.isArray(lp?.bannerImages) && lp.bannerImages.length > 0) {
            const first = lp.bannerImages[0];
            if (typeof first === "string" && first.trim()) return first.trim();
            if (first && typeof first === "object" && (first.url || first.secure_url)) return first.url || first.secure_url;
        }

        return null;
    };

    return (
        <ProtectedRoute>
            <div className="space-y-6 text-gray-800">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold font-philosopher text-gray-900 flex items-center gap-2">
                            <span className="text-secound"><LayoutTemplate size={24} /></span>
                            Build Landing Page: ({landingPages.length})
                        </h1>
                        <p className="text-gray-600 text-sm">
                            Create and manage high-converting single-product dynamic landing pages
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            title="Refresh"
                            onClick={fetchLandingPages}
                            className="p-2 border border-stone-200 rounded shadow-xs bg-sky-50 text-sky-600 hover:bg-sky-200 cursor-pointer transition"
                            type="button"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <Link
                            href="/landing-pages/create"
                            className="flex items-center gap-2 px-4 py-2.5 bg-secound hover:bg-secound-hover text-white rounded font-medium text-sm transition cursor-pointer"
                        >
                            <Plus size={18} />
                            <span>Create Landing Page</span>
                        </Link>
                    </div>
                </div>

                {/* Filter / Search Bar */}
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by title, slug, or product..."
                            className="w-full pl-10 pr-4 py-2.5 rounded border border-stone-300 text-sm focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                        />
                    </div>
                </div>

            {/* List Table */}
            {loading ? (
                <div className="py-20 flex flex-col items-center justify-center text-secound gap-3">
                    <Loader2 size={32} className="animate-spin text-primary" />
                    <span className="text-xs font-semibold text-gray-500">Loading landing pages...</span>
                </div>
            ) : filteredPages.length === 0 ? (
                <div className="text-center py-16 bg-white border border-dashed border-gray-200 rounded-xl space-y-3">
                    <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto" />
                    <h3 className="text-sm font-bold text-gray-800">No landing pages found</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        {searchQuery ? "Try changing your search term" : "Click 'Create New Landing Page' to build your first product campaign."}
                    </p>
                    {!searchQuery && (
                        <div className="pt-2">
                            <Link
                                href="/landing-pages/create"
                                className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition"
                            >
                                <Plus size={14} />
                                <span>Create Landing Page</span>
                            </Link>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-gray-700">
                            <thead className="bg-gray-50 text-gray-800 border-b border-gray-200 font-semibold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="p-3.5">Product & Title</th>
                                    <th className="p-3.5">Landing Slug / URL</th>
                                    <th className="p-3.5 text-center">Delivery Charges</th>
                                    <th className="p-3.5 text-center">Views</th>
                                    <th className="p-3.5 text-center">Status</th>
                                    <th className="p-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredPages.map((lp) => {
                                    const product = lp.product;
                                    const pImg = getProductImage(product, lp);

                                    return (
                                        <tr key={lp.id} className="hover:bg-slate-50/70 transition-colors">
                                            {/* Product & Title */}
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {pImg ? (
                                                            <Image
                                                                src={pImg}
                                                                alt={product?.productName || "Product"}
                                                                width={48}
                                                                height={48}
                                                                className="object-cover w-full h-full"
                                                                unoptimized={typeof pImg === 'string' && pImg.startsWith('http')}
                                                            />
                                                        ) : (
                                                            <Package size={20} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 max-w-xs sm:max-w-sm">
                                                        <h4 className="font-bold text-gray-900 truncate text-sm">
                                                            {lp.pageTitle}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                                            Linked: <strong className="text-gray-700">{product?.productName}</strong>
                                                        </p>
                                                        <span className="text-[10px] font-hind bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded mt-1 inline-block">
                                                            SKU: {product?.sku || "N/A"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Slug & Copy Link */}
                                            <td className="p-3.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-hind text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded">
                                                        /landing/{lp.slug}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCopyUrl(lp.slug)}
                                                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition cursor-pointer"
                                                        title="Copy Full URL"
                                                    >
                                                        {copiedSlug === lp.slug ? (
                                                            <Check size={14} className="text-emerald-600" />
                                                        ) : (
                                                            <Copy size={14} />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>

                                            {/* Delivery Charges */}
                                            <td className="p-3.5 text-center whitespace-nowrap">
                                                <div className="text-[11px]">
                                                    <span className="text-gray-500">Dhaka:</span> <strong>৳{parseFloat(lp.insideDhakaDelivery || 70)}</strong>
                                                </div>
                                                <div className="text-[11px] mt-0.5">
                                                    <span className="text-gray-500">Outside:</span> <strong>৳{parseFloat(lp.outsideDhakaDelivery || 130)}</strong>
                                                </div>
                                            </td>

                                            {/* Views */}
                                            <td className="p-3.5 text-center font-bold font-hind text-gray-900">
                                                {lp.viewsCount || 0}
                                            </td>

                                            {/* Status */}
                                            <td className="p-3.5 text-center">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    lp.isPublished
                                                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                                        : "bg-gray-100 text-gray-600 border border-gray-200"
                                                }`}>
                                                    {lp.isPublished ? "Published" : "Draft"}
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="p-3.5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <a
                                                        href={`${process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000"}/landing/${lp.slug}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 text-gray-600 hover:text-secound hover:bg-slate-100 rounded-lg transition cursor-pointer"
                                                        title="Live Preview"
                                                    >
                                                        <ExternalLink size={15} />
                                                    </a>

                                                    <Link
                                                        href={`/landing-pages/${lp.id}`}
                                                        className="p-1.5 text-primary hover:bg-primary-light/60 rounded-lg transition cursor-pointer"
                                                        title="Edit Landing Page"
                                                    >
                                                        <Pencil size={15} />
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(lp.id, lp.pageTitle)}
                                                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    </ProtectedRoute>
    );
}
