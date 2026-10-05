"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import {
  LayoutTemplate,
  ArrowLeft,
  Search,
  Plus,
  Trash2,
  Loader2,
  Check,
  Package,
  Sparkles,
  Star,
  Layers,
  Truck,
  AlertCircle,
  Info,
  Flame,
  RotateCcw,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { apiClient } from "@/lib/apiClient";
import { useProducts } from "@/lib/dataFetch";
import { useCloudinaryUpload } from "@/hooks/useCloudinaryUpload";

export default function CreateLandingPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Products fetch for selection
  const { data: rawProductData = [] } = useProducts(1, 1000);
  const productList = Array.isArray(rawProductData)
    ? rawProductData
    : rawProductData?.products || [];

  // React Hook Form for validation & inline error messaging
  const {
    register,
    setValue,
    watch,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm({
    mode: "onChange",
    defaultValues: {
      slug: "",
    },
  });

  const watchedSlug = watch("slug");
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null); // true | false | null

  // Check slug uniqueness with debouncing
  useEffect(() => {
    if (!watchedSlug || !watchedSlug.trim()) {
      setCheckingSlug(false);
      setSlugAvailable(null);
      clearErrors("slug");
      return;
    }

    const cleanSlug = watchedSlug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    setCheckingSlug(true);

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient(`/api/landing-page/slug/${cleanSlug}`);
        // If it returns a 200 with success: true and data, slug already exists!
        if (res && res.success && res.data) {
          setError("slug", {
            type: "manual",
            message:
              "এই স্লাগ দিয়ে ইতিমধ্যে একটি ল্যান্ডিং পেজ তৈরি করা আছে! অন্য স্লাগ ব্যবহার করুন।",
          });
          setSlugAvailable(false);
        } else {
          clearErrors("slug");
          setSlugAvailable(true);
        }
      } catch (err) {
        // If 404 is thrown by apiClient, it means slug is available
        clearErrors("slug");
        setSlugAvailable(true);
      } finally {
        setCheckingSlug(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [watchedSlug, setError, clearErrors]);

  // Form states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productSearch, setProductSearch] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [badgeText, setBadgeText] = useState("১০০% জেনুইন ও অফিশিয়াল গ্যাজেট");
  const [videoUrl, setVideoUrl] = useState("");
  const [offerPrice, setOfferPrice] = useState("");
  const [urgencyText, setUrgencyText] = useState(
    "সীমিত সময়ের মেগা অফার! স্টক শেষ হওয়ার আগেই ক্যাশ অন ডেলিভারিতে অর্ডার করুন",
  );
  const [insideDhakaDelivery, setInsideDhakaDelivery] = useState(80);
  const [outsideDhakaDelivery, setOutsideDhakaDelivery] = useState(150);
  const [fakeOrderCounter, setFakeOrderCounter] = useState(128);

  // Order Bump Add-on Product states
  const [enableOrderBump, setEnableOrderBump] = useState(false);
  const [orderBumpProduct, setOrderBumpProduct] = useState(null);
  const [orderBumpSearch, setOrderBumpSearch] = useState("");
  const [orderBumpTitle, setOrderBumpTitle] = useState(
    "স্পেশাল অ্যাড-অন অফার! সাথে নিন আমাদের এই বিশেষ গ্যাজেট এক্সেসরিজ",
  );
  const [orderBumpSubtitle, setOrderBumpSubtitle] = useState(
    "মূল পণ্যের সাথে একই পার্সেল ডেলিভারিতে পাচ্ছেন আকর্ষণীয় অতিরিক্ত ছাড়!",
  );
  const [orderBumpDiscount, setOrderBumpDiscount] = useState(100);
  const [orderBumpPrice, setOrderBumpPrice] = useState("");

  // Per-Variant Discount Map: { [variantId]: discountAmount }
  const [variantDiscounts, setVariantDiscounts] = useState({});
  const updateVariantDiscount = (variantId, amount) => {
    setVariantDiscounts((prev) => ({ ...prev, [variantId]: amount }));
  };

  // Key Trust Points / Product Checklist (Hero section)
  const [trustPoints, setTrustPoints] = useState([
    {
      title: "১০০% অরিজিনাল ও ইনট্যাক্ট বক্স",
      desc: "অথেনটিক ব্র্যান্ডেড প্রিমিয়াম গ্যাজেট নিশ্চয়তা",
    },
    {
      title: "অফিশিয়াল ব্র্যান্ড ওয়ারেন্টি",
      desc: "দ্রুত রিপ্লেসমেন্ট ও টেকনিক্যাল সার্ভিসিং সুবিধা",
    },
    {
      title: "হাতে পেয়ে চেক করে পেমেন্ট",
      desc: "ডেলিভারি ম্যানের সামনে অনবক্স ও চেক করার সুবিধা",
    },
    {
      title: "সারা বাংলাদেশে ফাস্ট ক্যাশ অন ডেলিভারি",
      desc: "কোন অগ্রিম টাকা ছাড়াই নিশ্চিন্তে অর্ডার করুন",
    },
  ]);

  const addTrustPoint = () => {
    setTrustPoints((prev) => [...prev, { title: "", desc: "" }]);
  };
  const updateTrustPoint = (idx, field, val) => {
    setTrustPoints((prev) =>
      prev.map((pt, i) => (i === idx ? { ...pt, [field]: val } : pt)),
    );
  };
  const removeTrustPoint = (idx) => {
    setTrustPoints((prev) => prev.filter((_, i) => i !== idx));
  };

  // Dynamic Reasons / Features
  const [whyChooseUsTitle, setWhyChooseUsTitle] = useState(
    "কেন আমাদের থেকে অর্ডার করবেন?",
  );
  const [features, setFeatures] = useState([
    {
      title: "১০০% অরিজিনাল প্রোডাক্ট",
      desc: "সরাসরি অথরাইজড চ্যানেল থেকে সংগৃহীত জেনুইন গ্যাজেট",
      icon: "shield",
    },
    {
      title: "লেটেস্ট টেকনোলজি ও প্রিমিয়াম বিল্ড",
      desc: "স্মার্ট ফিচার, টেকসই পারফর্মেন্স ও প্রিমিয়াম ডিজাইন",
      icon: "sparkles",
    },
    {
      title: "দ্রুততম হোম ডেলিভারি",
      desc: "সারাদেশে নিরাপদ ও দ্রুততম ক্যাশ অন ডেলিভারি সুবিধা",
      icon: "truck",
    },
    {
      title: "ওয়ারেন্টি ও চেক করার সুযোগ",
      desc: "ডেলিভারি ম্যানের সামনে চেক করে নেওয়ার পূর্ণ নিশ্চয়তা",
      icon: "check",
    },
  ]);

  // Dynamic Highlights (Gallery cards)
  const [highlightsTitle, setHighlightsTitle] = useState(
    "পণ্যটির আকর্ষণীয় ব্যবহার ও স্পেসিফিকেশন",
  );
  const [highlights, setHighlights] = useState([
    {
      title: "স্মার্ট পারফরম্যান্স ও লং ব্যাটারি ব্যাকআপ",
      desc: "দৈনন্দিন কাজে নির্বিঘ্ন ব্যবহারের জন্য আধুনিক চিপসেট ও দীর্ঘস্থায়ী পাওয়ার ব্যাকআপ",
      image: "",
    },
    {
      title: "প্রিমিয়াম বিল্ড কোয়ালিটি ও এলিগ্যান্ট ডিজাইন",
      desc: "টেকসই মেটেরিয়াল এবং আকর্ষণীয় প্রিমিয়াম ফিনিশিং যা সবার নজর কাড়বে",
      image: "",
    },
  ]);

  // Customer Reviews
  const [reviews, setReviews] = useState([
    {
      name: "আহমেদ সিয়ান",
      rating: 5,
      comment:
        "প্রোডাক্টটি ১০০% অরিজিনাল ছিল। বিল্ড কোয়ালিটি এবং পারফরম্যান্স দারুণ। ডেলিভারিও খুব দ্রুত পেয়েছি।",
    },
    {
      name: "তানজিনা আক্তার",
      rating: 5,
      comment:
        "খুব সুন্দর প্যাকেজিং এবং অথেনটিক গ্যাজেট। যেমন চেয়েছিলাম ঠিক তেমনই পেয়েছি। ধন্যবাদ!",
    },
  ]);

  // Auto-fill values when a product is picked
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    const generatedSlug = (product.productName || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    setValue("slug", generatedSlug, {
      shouldValidate: true,
      shouldDirty: true,
    });
    setPageTitle(product.productName || "");
    setSubTitle(
      product.description?.replace(/<[^>]+>/g, "").slice(0, 160) || "",
    );
    setOfferPrice(product.salePrice || product.price || "");
  };

  // Features handlers
  const addFeature = () => {
    setFeatures((prev) => [...prev, { title: "", desc: "", icon: "check" }]);
  };
  const updateFeature = (idx, field, val) => {
    setFeatures((prev) =>
      prev.map((f, i) => (i === idx ? { ...f, [field]: val } : f)),
    );
  };
  const removeFeature = (idx) => {
    setFeatures((prev) => prev.filter((_, i) => i !== idx));
  };

  // Highlights handlers
  const { uploadImage: uploadHighlightImage, uploading: uploadingHighlight } =
    useCloudinaryUpload();
  const [uploadingHighlightIdx, setUploadingHighlightIdx] = useState(null);

  const addHighlight = () => {
    setHighlights((prev) => [...prev, { title: "", desc: "", image: "" }]);
  };
  const updateHighlight = (idx, field, val) => {
    setHighlights((prev) =>
      prev.map((h, i) => (i === idx ? { ...h, [field]: val } : h)),
    );
  };
  const removeHighlight = (idx) => {
    setHighlights((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleHighlightImageUpload = async (idx, file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP files are allowed");
      return;
    }

    setUploadingHighlightIdx(idx);
    const toastId = toast.loading("Uploading photo card image...");
    try {
      const url = await uploadHighlightImage(file);
      if (url) {
        updateHighlight(idx, "image", url);
        toast.success("Image uploaded successfully!", { id: toastId });
      } else {
        toast.error("Failed to upload image", { id: toastId });
      }
    } catch (err) {
      toast.error("Failed to upload image", { id: toastId });
    } finally {
      setUploadingHighlightIdx(null);
    }
  };

  // Reviews handlers
  const addReview = () => {
    setReviews((prev) => [...prev, { name: "", rating: 5, comment: "" }]);
  };
  const updateReview = (idx, field, val) => {
    setReviews((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)),
    );
  };
  const removeReview = (idx) => {
    setReviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) {
      toast.error("Please select a product");
      return;
    }
    if (!watchedSlug || !watchedSlug.trim()) {
      setError("slug", { type: "manual", message: "স্লাগ প্রদান করা আবশ্যক" });
      toast.error("Please provide a valid slug for the landing page");
      return;
    }
    if (errors.slug || slugAvailable === false) {
      toast.error(
        errors.slug?.message ||
          "এই স্লাগ দিয়ে ইতিমধ্যে একটি পেজ বিদ্যমান! দয়া করে অন্য স্লাগ দিন।",
      );
      return;
    }
    if (!pageTitle.trim()) {
      toast.error("Please provide a landing page headline");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Creating landing page...");

    try {
      const cleanSlug = watchedSlug
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-_]/g, "-");
      const payload = {
        productId: selectedProduct.id,
        slug: cleanSlug,
        pageTitle: pageTitle.trim(),
        subTitle: subTitle.trim(),
        badgeText: badgeText.trim(),
        videoUrl: videoUrl.trim(),
        bannerImages: Array.isArray(selectedProduct.images)
          ? selectedProduct.images
          : [],
        whyChooseUsTitle: whyChooseUsTitle.trim(),
        trustPoints,
        features,
        highlightsTitle: highlightsTitle.trim(),
        highlights,
        reviews,
        insideDhakaDelivery: parseFloat(insideDhakaDelivery) || 80,
        outsideDhakaDelivery: parseFloat(outsideDhakaDelivery) || 150,
        offerPrice: offerPrice ? parseFloat(offerPrice) : null,
        urgencyText: urgencyText.trim(),
        fakeOrderCounter: parseInt(fakeOrderCounter) || 120,
        // Order Bump
        orderBumpProductId:
          enableOrderBump && orderBumpProduct ? orderBumpProduct.id : null,
        orderBumpTitle:
          enableOrderBump && orderBumpProduct ? orderBumpTitle.trim() : null,
        orderBumpSubtitle:
          enableOrderBump && orderBumpProduct ? orderBumpSubtitle.trim() : null,
        orderBumpDiscount:
          enableOrderBump && orderBumpProduct
            ? parseFloat(orderBumpDiscount) || 0
            : 0,
        orderBumpPrice:
          enableOrderBump && orderBumpProduct && orderBumpPrice
            ? parseFloat(orderBumpPrice)
            : null,
        isPublished: true,
        variantDiscounts: variantDiscounts,
      };

      const res = await apiClient("/api/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.success) {
        toast.success("Landing page created successfully!", { id: toastId });
        router.push("/landing-pages");
      } else {
        throw new Error(res.message);
      }
    } catch (err) {
      toast.error(err.message || "Failed to create landing page", {
        id: toastId,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProductList = productList.filter(
    (p) =>
      p.productName?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase()),
  );

  const handleResetForm = () => {
    setSelectedProduct(null);
    setValue("slug", "");
    setPageTitle("");
    setSubTitle("");
    clearErrors();
  };

  const getProductImage = (product) => {
    if (!product) return null;

    // 1. Direct array of images
    if (Array.isArray(product.images) && product.images.length > 0) {
      const first = product.images[0];
      if (typeof first === "string" && first.trim()) return first.trim();
      if (first && typeof first === "object" && (first.url || first.secure_url))
        return first.url || first.secure_url;
    }

    // 2. JSON string representation of images
    if (typeof product.images === "string" && product.images.trim()) {
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0];
          if (typeof first === "string" && first.trim()) return first.trim();
          if (
            first &&
            typeof first === "object" &&
            (first.url || first.secure_url)
          )
            return first.url || first.secure_url;
        } else if (typeof parsed === "string" && parsed.trim()) {
          return parsed.trim();
        }
      } catch {
        if (
          product.images.startsWith("http://") ||
          product.images.startsWith("https://") ||
          product.images.startsWith("/")
        ) {
          return product.images.trim();
        }
      }
    }

    // 3. Direct product.image
    if (
      product.image &&
      typeof product.image === "string" &&
      product.image.trim()
    ) {
      return product.image.trim();
    }

    // 4. Product variants image fallback
    if (
      Array.isArray(product.productVariants) &&
      product.productVariants.length > 0
    ) {
      const variantWithImg = product.productVariants.find(
        (v) => v?.image && typeof v.image === "string" && v.image.trim(),
      );
      if (variantWithImg?.image) return variantWithImg.image.trim();
    }

    return null;
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6 text-gray-800">
        {/* Admin Standard Header */}
        <div className="md:flex justify-between items-start gap-4">
          <div className="mb-4 md:mb-0">
            <h2 className="text-2xl font-bold font-philosopher text-gray-900 flex items-center gap-2">
              <span className="text-secound">
                <LayoutTemplate size={24} />
              </span>
              Build Landing Page
            </h2>
            <p className="text-sm text-gray-500">
              Create and customize high-converting single product landing page
              with COD checkout
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              title="Reset Form"
              onClick={handleResetForm}
              className="p-2.5 border border-stone-200 rounded shadow-xs bg-sky-50 text-sky-600 hover:bg-sky-200 cursor-pointer transition"
              type="button"
            >
              <RotateCcw size={18} />
            </button>
            <Link
              href="/landing-pages"
              className="flex items-center gap-2 px-4 py-2.5 rounded bg-secound text-white hover:bg-secound-hover font-medium text-sm transition cursor-pointer"
            >
              <ArrowLeft size={18} /> Back to Landing Pages
            </Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Select Product */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded bg-secound/10 text-secound font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Select Product
                  </h3>
                  <p className="text-xs text-gray-500">
                    Pick the main product for this campaign
                  </p>
                </div>
              </div>
              {selectedProduct && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded border border-emerald-200 flex items-center gap-1.5">
                  <Check size={14} /> Product Linked
                </span>
              )}
            </div>

            {!selectedProduct ? (
              <div className="space-y-3">
                <div className="relative">
                  <Search
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search catalog by product name or SKU..."
                    className="w-full pl-10 pr-4 py-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {filteredProductList.slice(0, 10).map((p) => {
                    const pImg = getProductImage(p);
                    return (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        className="p-3 hover:bg-primary-light/30 transition flex items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                            {pImg ? (
                              <Image
                                src={pImg}
                                alt={p.productName}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                                unoptimized={
                                  typeof pImg === "string" &&
                                  pImg.startsWith("http")
                                }
                              />
                            ) : (
                              <Package size={18} className="text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 text-xs truncate font-hind">
                              {p.productName}
                            </p>
                            <p className="text-[11px] text-gray-500 font-hind mt-0.5">
                              SKU: {p.sku || "N/A"}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-gray-900 shrink-0 font-hind">
                          ৳{parseFloat(p.price || 0).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                    {getProductImage(selectedProduct) ? (
                      <Image
                        src={getProductImage(selectedProduct)}
                        alt={selectedProduct.productName}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <Package size={20} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 font-hind">
                      {selectedProduct.productName}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-hind">
                      SKU: {selectedProduct.sku} • Price: ৳
                      {parseFloat(selectedProduct.price || 0)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="text-xs font-semibold text-red-600 hover:underline cursor-pointer font-hind"
                >
                  Change Product
                </button>
              </div>
            )}
          </div>

          {/* Step 2: URL Slug & Basic Bengali Headlines */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-200">
              <span className="w-7 h-7 rounded bg-secound/10 text-secound font-bold text-xs flex items-center justify-center">
                2
              </span>
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Landing Page Headlines & Slug
                </h3>
                <p className="text-xs text-gray-500">
                  Configure public URL path and Bengali attention-grabbing
                  titles
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Slug */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 font-hind">
                    Landing Page URL Slug{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  {checkingSlug && (
                    <span className="text-xs text-gray-500 flex items-center gap-1 font-hind">
                      <Loader2
                        size={13}
                        className="animate-spin text-secound"
                      />{" "}
                      স্লাগ যাচাই করা হচ্ছে...
                    </span>
                  )}
                  {!checkingSlug && slugAvailable === true && watchedSlug && (
                    <span className="text-xs text-emerald-600 flex items-center gap-1 font-hind font-medium">
                      <Check size={13} /> স্লাগটি ব্যবহারযোগ্য
                    </span>
                  )}
                </div>
                <div
                  className={`flex items-center rounded border bg-gray-50 overflow-hidden transition ${
                    errors.slug
                      ? "border-red-500 ring-2 ring-red-500/20"
                      : "border-stone-300 focus-within:border-secound focus-within:ring-2 focus-within:ring-secound/20"
                  }`}
                >
                  <span className="px-3.5 py-2 text-xs font-semibold text-gray-500 font-hind border-r border-stone-300 bg-stone-100">
                    /landing/
                  </span>
                  <input
                    type="text"
                    {...register("slug", {
                      required: "স্লাগ প্রদান করা আবশ্যক",
                    })}
                    placeholder="e.g. smart-watch-ultra"
                    className="w-full px-3 py-2 text-sm font-hind bg-white text-gray-900 outline-none"
                  />
                </div>
                {errors.slug && (
                  <p className="text-xs text-red-600 font-hind mt-1.5 flex items-center gap-1 font-medium">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{errors.slug.message}</span>
                  </p>
                )}
              </div>

              {/* Page Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                  Catchy Bangla Headline (Main Title){" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  placeholder="e.g. স্মার্ট লাইফস্টাইলের সেরা প্রিমিয়াম স্মার্টওয়াচ"
                  className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                  required
                />
              </div>

              {/* Subtitle / Hook */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                  Sub-headline / Product Summary (Bangla)
                </label>
                <textarea
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  rows={2}
                  placeholder="e.g. প্রিমিয়াম মেটালিক বিল্ড, লং লাস্টিং ব্যাটারি ও ওয়াটারপ্রুফ ডিজাইন নিয়ে এলো আপনার পছন্দের স্মার্টওয়াচ।"
                  className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                />
              </div>

              {/* Badge Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                  Top Highlight Badge
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  placeholder="e.g. ১০০% অরিজিনাল ও অফিসিয়াল গ্যাজেট"
                  className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                  YouTube / Video Embed URL (Optional)
                </label>
                <input
                  type="text"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                />
              </div>

              {/* Special Offer Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                  Special Campaign Price (৳) (Optional)
                </label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  placeholder="Leave blank to use regular product price"
                  className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                />
              </div>

              {/* Urgency Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                  Urgency / Countdown Tagline
                </label>
                <input
                  type="text"
                  value={urgencyText}
                  onChange={(e) => setUrgencyText(e.target.value)}
                  placeholder="e.g. অফারটি সীমিত সময়ের জন্য! এখনই অর্ডার করুন"
                  className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                />
              </div>

              {/* Hero Trust Points / Key Checklist */}
              <div className="md:col-span-2 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 font-hind">
                      Hero Checklist / Trust Points (হেডারের বুলেট পয়েন্টসমূহ)
                    </label>
                    <p className="text-xs text-gray-500 font-hind">
                      এই পয়েন্টগুলো হেডারে সবুজ টিক চিহ্ন সহকারে ভ্যারিয়েন্ট
                      সিলেক্টরের নিচে প্রদর্শিত হবে
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addTrustPoint}
                    className="px-3 py-1.5 bg-secound/10 text-secound hover:bg-secound/20 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer font-hind"
                  >
                    <Plus size={14} />
                    <span>Add Point</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {trustPoints.map((pt, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 text-xs font-bold">
                        ✓
                      </div>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        <div>
                          <input
                            type="text"
                            value={pt.title}
                            onChange={(e) =>
                              updateTrustPoint(idx, "title", e.target.value)
                            }
                            placeholder="পয়েন্ট টাইটেল (যেমন: ১০০% অরিজিনাল পণ্য)"
                            className="w-full p-2 rounded border border-stone-300 text-xs font-hind focus:outline-none focus:border-secound bg-white font-semibold"
                          />
                        </div>
                        <div>
                          <input
                            type="text"
                            value={pt.desc}
                            onChange={(e) =>
                              updateTrustPoint(idx, "desc", e.target.value)
                            }
                            placeholder="সংক্ষিপ্ত বিবরণ (যেমন: যাচাইকৃত ও প্রিমিয়াম কোয়ালিটি নিশ্চিত)"
                            className="w-full p-2 rounded border border-stone-300 text-xs font-hind focus:outline-none focus:border-secound bg-white"
                          />
                        </div>
                      </div>
                      {trustPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTrustPoint(idx)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50 transition cursor-pointer shrink-0"
                          title="Remove point"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Delivery Charges */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex items-center gap-2.5 pb-4 border-b border-gray-200">
              <span className="w-7 h-7 rounded bg-secound/10 text-secound font-bold text-xs flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  COD Delivery Fees
                </h3>
                <p className="text-xs text-gray-500">
                  Shipping charges applied on Cash on Delivery checkout
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                  Inside Dhaka Delivery Charge (৳)
                </label>
                <input
                  type="number"
                  value={insideDhakaDelivery}
                  onChange={(e) => setInsideDhakaDelivery(e.target.value)}
                  className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                  Outside Dhaka Delivery Charge (৳)
                </label>
                <input
                  type="number"
                  value={outsideDhakaDelivery}
                  onChange={(e) => setOutsideDhakaDelivery(e.target.value)}
                  className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* ─── Variant Discounts (only when product has variants) ───── */}
          {selectedProduct &&
            Array.isArray(selectedProduct.productVariants) &&
            selectedProduct.productVariants.length > 0 && (
              <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
                <div className="flex items-center gap-2.5 pb-4 border-b border-gray-200">
                  <span className="w-7 h-7 rounded bg-amber-100 text-amber-600 font-bold text-xs flex items-center justify-center">
                    <Layers size={14} />
                  </span>
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">
                      Per-Variant Discount (৳)
                    </h3>
                    <p className="text-xs text-gray-500 font-hind">
                      Set a fixed ৳ discount for each variant. The frontend will show the discounted price when that variant is selected.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedProduct.productVariants.map((v) => {
                    const label = (() => {
                      if (v.attributes && typeof v.attributes === "object") {
                        const vals = Object.values(v.attributes).filter(Boolean);
                        if (vals.length > 0) return vals.join(" - ");
                      }
                      return [v.color, v.size].filter(Boolean).join(" - ") || `Variant #${v.id}`;
                    })();
                    const rawPrice = parseFloat(v.price || 0);
                    const discAmt = parseFloat(variantDiscounts[v.id] || 0);
                    const effectivePrice = Math.max(0, rawPrice - discAmt);

                    return (
                      <div key={v.id} className="flex items-center gap-4 p-3 bg-amber-50/40 border border-amber-200/60 rounded-xl">
                        {v.image && (
                          <div className="w-10 h-10 rounded-lg border border-amber-200 bg-white overflow-hidden relative shrink-0">
                            <Image src={v.image} alt={label} fill className="object-contain p-0.5" unoptimized={v.image.startsWith("http")} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-900 font-hind">{label}</p>
                          <p className="text-[11px] text-gray-500 font-hind">
                            Variant Price: ৳{rawPrice.toLocaleString()}
                            {discAmt > 0 && (
                              <span className="ml-2 text-emerald-600 font-semibold">
                                → Effective: ৳{effectivePrice.toLocaleString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-500 font-hind font-semibold">Discount (৳):</span>
                          <input
                            type="number"
                            min="0"
                            max={rawPrice}
                            value={variantDiscounts[v.id] || ""}
                            onChange={(e) => updateVariantDiscount(v.id, e.target.value)}
                            placeholder="0"
                            className="w-24 p-2 rounded-lg border border-stone-300 text-sm font-hind text-right focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700 font-hind font-medium flex items-center gap-1.5">
                    <Info size={13} />
                    Leave blank or 0 to use the variant's base price. Discounts are shown as strikethrough on the frontend.
                  </p>
                </div>
              </div>
            )}

          {/* Step 4: Order Bump Product (Upsell / Add-on Product) */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded bg-secound/10 text-secound font-bold text-xs flex items-center justify-center">
                  4
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Order Bump Product (Check-Out Upsell)
                  </h3>
                  <p className="text-xs text-gray-500 font-hind">
                    Allow customers to 1-click add a complementary product in
                    the checkout box with special discount
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableOrderBump}
                  onChange={(e) => setEnableOrderBump(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secound"></div>
              </label>
            </div>

            {enableOrderBump && (
              <div className="space-y-4 pt-2">
                {/* Product Selector for Order Bump */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                    Select Order Bump Product{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  {orderBumpProduct ? (
                    <div className="flex items-center justify-between p-3.5 border border-emerald-300 bg-emerald-50/50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white rounded-lg border border-emerald-200 overflow-hidden relative shrink-0">
                          {getProductImage(orderBumpProduct) ? (
                            <Image
                              src={getProductImage(orderBumpProduct)}
                              alt={orderBumpProduct.productName}
                              fill
                              className="object-contain p-1"
                              unoptimized
                            />
                          ) : (
                            <Package
                              size={24}
                              className="text-emerald-500 m-auto mt-2"
                            />
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 font-hind">
                            {orderBumpProduct.productName}
                          </h4>
                          <p className="text-[11px] text-gray-500 font-hind">
                            Regular: ৳{orderBumpProduct.price} | Sale: ৳
                            {orderBumpProduct.salePrice ||
                              orderBumpProduct.price}
                          </p>
                          {orderBumpProduct.productVariants?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                {orderBumpProduct.productVariants.length} Variants Available
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOrderBumpProduct(null)}
                        className="text-xs text-red-600 hover:underline font-semibold cursor-pointer font-hind"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative">
                        <Search
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={15}
                        />
                        <input
                          type="text"
                          value={orderBumpSearch}
                          onChange={(e) => setOrderBumpSearch(e.target.value)}
                          placeholder="Search complementary product for bump..."
                          className="w-full pl-9 pr-4 py-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                        {productList
                          .filter(
                            (p) =>
                              !selectedProduct || p.id !== selectedProduct.id,
                          )
                          .filter(
                            (p) =>
                              !orderBumpSearch ||
                              p.productName
                                ?.toLowerCase()
                                .includes(orderBumpSearch.toLowerCase()) ||
                              p.sku
                                ?.toLowerCase()
                                .includes(orderBumpSearch.toLowerCase()),
                          )
                          .slice(0, 10)
                          .map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setOrderBumpProduct(p)}
                              className="w-full p-2.5 text-left flex items-center justify-between hover:bg-gray-50 transition cursor-pointer text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800 font-hind">
                                  {p.productName}
                                </span>
                                <span className="text-[10px] text-gray-400 font-hind">
                                  ({p.sku || "No SKU"})
                                </span>
                              </div>
                              <span className="font-bold text-secound font-hind">
                                ৳{p.salePrice || p.price}
                              </span>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Order Bump Promotional Text */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                      Order Bump Box Headline (Bangla)
                    </label>
                    <input
                      type="text"
                      value={orderBumpTitle}
                      onChange={(e) => setOrderBumpTitle(e.target.value)}
                      placeholder="e.g. স্পেশাল অফার! সাথে নিন আমাদের প্রিমিয়াম পণ্য"
                      className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                      Order Bump Persuasion Subtitle / Benefit (Bangla)
                    </label>
                    <input
                      type="text"
                      value={orderBumpSubtitle}
                      onChange={(e) => setOrderBumpSubtitle(e.target.value)}
                      placeholder="e.g. মূল পণ্যের সাথে এক ডেলিভারিতে পাচ্ছেন অতিরিক্ত ১০০ টাকা বিশেষ ছাড়!"
                      className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                      Extra Bundle Discount on Full Checkout (৳)
                    </label>
                    <input
                      type="number"
                      value={orderBumpDiscount}
                      onChange={(e) => setOrderBumpDiscount(e.target.value)}
                      placeholder="e.g. 100"
                      className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                    />
                    <span className="text-xs text-gray-500 font-hind mt-1 block">
                      This discount is deducted from the grand total when user
                      checks the bump product.
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                      Custom Bump Product Price (৳) (Optional)
                    </label>
                    <input
                      type="number"
                      value={orderBumpPrice}
                      onChange={(e) => setOrderBumpPrice(e.target.value)}
                      placeholder="Leave blank to use its standard sale price"
                      className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step 5: "কেন আমাদের পণ্য সেরা?" (Value Props / Reasons) */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded bg-secound/10 text-secound font-bold text-xs flex items-center justify-center">
                  5
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    "কেন আমাদের পণ্য সেরা?" (Value Props)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Key reasons and trust badges highlighting your product
                    quality
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addFeature}
                className="px-3 py-1.5 text-xs font-semibold text-secound bg-secound/10 hover:bg-secound/20 rounded flex items-center gap-1.5 cursor-pointer transition font-hind"
              >
                <Plus size={14} /> Add Card
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-secound uppercase tracking-wider">
                      Feature Card #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFeature(idx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition"
                      title="Remove card"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={feat.title}
                    onChange={(e) =>
                      updateFeature(idx, "title", e.target.value)
                    }
                    placeholder="Card title (e.g. ১০০% অফিশিয়াল ওয়ারেন্টি)"
                    className="w-full p-2 rounded border border-stone-300 text-sm bg-white font-semibold font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20"
                  />
                  <textarea
                    value={feat.desc}
                    onChange={(e) => updateFeature(idx, "desc", e.target.value)}
                    rows={2}
                    placeholder="Card description (e.g. অথেনটিক ব্র্যান্ড রিপ্লেসমেন্ট গ্যারান্টি সহ নিশ্চিন্তে ব্যবহার করুন)..."
                    className="w-full p-2 rounded border border-stone-300 text-sm bg-white font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Step 6: Highlights / Usage Gallery */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded bg-secound/10 text-secound font-bold text-xs flex items-center justify-center">
                  6
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Product Highlights & Usage (Photo Cards)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Photo cards with benefits and usage demonstration
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addHighlight}
                className="px-3 py-1.5 text-xs font-semibold text-secound bg-secound/10 hover:bg-secound/20 rounded flex items-center gap-1.5 cursor-pointer transition font-hind"
              >
                <Plus size={14} /> Add Highlight
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {highlights.map((hl, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-secound uppercase tracking-wider">
                      Highlight Item #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeHighlight(idx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={hl.title}
                    onChange={(e) =>
                      updateHighlight(idx, "title", e.target.value)
                    }
                    placeholder="Title (e.g. লং-লাস্টিং ব্যাটারি ব্যাকআপ)"
                    className="w-full p-2 rounded border border-stone-300 text-sm bg-white font-semibold font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20"
                  />
                  {/* Optional Image Upload with Preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-600 font-hind">
                        Highlight Image (Optional)
                      </label>
                      <span className="text-[10px] text-gray-400 font-hind">
                        Max 5MB • JPG/PNG/WebP
                      </span>
                    </div>

                    {hl.image ? (
                      <div className="relative group w-full h-32 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 flex items-center justify-center">
                        <Image
                          src={hl.image}
                          alt={hl.title || "Highlight"}
                          fill
                          className="object-cover"
                          unoptimized={hl.image.startsWith("http")}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-2.5 py-1 text-xs font-semibold bg-white text-gray-800 rounded-md cursor-pointer hover:bg-stone-100 transition shadow-xs flex items-center gap-1 font-hind">
                            <Upload size={12} /> Change
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/jpg,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleHighlightImageUpload(idx, file);
                              }}
                              className="hidden"
                              disabled={uploadingHighlightIdx === idx}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => updateHighlight(idx, "image", "")}
                            className="px-2.5 py-1 text-xs font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition shadow-xs flex items-center gap-1 font-hind cursor-pointer"
                          >
                            <Trash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        className={`w-full py-3 px-3 rounded-lg border-2 border-dashed border-stone-300 hover:border-secound hover:bg-secound/5 bg-white transition flex flex-col sm:flex-row items-center justify-center gap-2 cursor-pointer ${uploadingHighlightIdx === idx ? "opacity-60 cursor-wait" : ""}`}
                      >
                        {uploadingHighlightIdx === idx ? (
                          <>
                            <Loader2
                              size={18}
                              className="animate-spin text-secound"
                            />
                            <span className="text-xs text-secound font-hind font-medium">
                              Uploading image...
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                              <ImageIcon size={14} />
                            </div>
                            <div className="text-center sm:text-left">
                              <span className="text-xs font-semibold text-secound font-hind block">
                                Click to upload photo
                              </span>
                              <span className="text-[10px] text-gray-400 font-hind">
                                Leave empty if no photo is needed
                              </span>
                            </div>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/jpg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleHighlightImageUpload(idx, file);
                          }}
                          className="hidden"
                          disabled={uploadingHighlightIdx === idx}
                        />
                      </label>
                    )}
                  </div>
                  <textarea
                    value={hl.desc}
                    onChange={(e) =>
                      updateHighlight(idx, "desc", e.target.value)
                    }
                    rows={2}
                    placeholder="Short description (e.g. একবার ফুল চার্জে নিশ্চিন্তে ৩-৫ দিন একটানা ব্যাকআপ)..."
                    className="w-full p-2 rounded border border-stone-300 text-sm bg-white font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Step 7: Customer Reviews */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded bg-secound/10 text-secound font-bold text-xs flex items-center justify-center">
                  7
                </span>
                <div>
                  <h3 className="text-base font-semibold text-gray-800">
                    Customer Reviews (Social Proof)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Testimonials showing customer satisfaction
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={addReview}
                className="px-3 py-1.5 text-xs font-semibold text-secound bg-secound/10 hover:bg-secound/20 rounded flex items-center gap-1.5 cursor-pointer transition font-hind"
              >
                <Plus size={14} /> Add Review
              </button>
            </div>

            <div className="space-y-3.5">
              {reviews.map((rev, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-secound uppercase tracking-wider">
                      Review #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeReview(idx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={rev.name}
                      onChange={(e) =>
                        updateReview(idx, "name", e.target.value)
                      }
                      placeholder="Customer Name (e.g. তানভির আহমেদ)"
                      className="p-2 rounded border border-stone-300 text-sm bg-white font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20"
                    />
                    <select
                      value={rev.rating}
                      onChange={(e) =>
                        updateReview(idx, "rating", parseInt(e.target.value))
                      }
                      className="p-2 rounded border border-stone-300 text-sm bg-white font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20"
                    >
                      <option value={5}>★★★★★ (5 Stars)</option>
                      <option value={4}>★★★★☆ (4 Stars)</option>
                    </select>
                  </div>
                  <textarea
                    value={rev.comment}
                    onChange={(e) =>
                      updateReview(idx, "comment", e.target.value)
                    }
                    rows={2}
                    placeholder="Customer review comment (e.g. গ্যাজেটটির সাউন্ড ও ব্যাটারি ব্যাকআপ এক কথায় দুর্দান্ত!)..."
                    className="w-full p-2 rounded border border-stone-300 text-sm bg-white font-hind focus:outline-none focus:border-secound focus:ring-2 focus:ring-secound/20"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Link
              href="/landing-pages"
              className="px-5 py-2.5 rounded border border-stone-300 text-gray-700 bg-white hover:bg-gray-100 font-medium text-sm transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || !selectedProduct}
              className="px-6 py-2.5 rounded bg-secound hover:bg-secound-hover text-white font-medium text-sm transition shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  <span>Publishing Landing Page...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Create & Publish Landing Page</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
