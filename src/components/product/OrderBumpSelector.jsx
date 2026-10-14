"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Search, Package, Zap } from "lucide-react";

export default function OrderBumpSelector({
  enableOrderBump,
  setEnableOrderBump,
  orderBumpProduct,
  setOrderBumpProduct,
  orderBumpTitle,
  setOrderBumpTitle,
  orderBumpSubtitle,
  setOrderBumpSubtitle,
  orderBumpDiscount,
  setOrderBumpDiscount,
  orderBumpPrice,
  setOrderBumpPrice,
  allProducts = [],
  currentProductId = null,
}) {
  const [search, setSearch] = useState("");

  const getProductImage = (p) => {
    if (!p) return null;
    if (Array.isArray(p.images) && p.images.length > 0) return p.images[0];
    if (typeof p.images === "string") return p.images;
    if (p.image) return p.image;
    return null;
  };

  const filteredProducts = allProducts
    .filter((p) => !currentProductId || p.id !== currentProductId)
    .filter((p) => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        p.productName?.toLowerCase().includes(s) ||
        p.sku?.toLowerCase().includes(s)
      );
    });

  return (
    <div className="bg-white p-6 rounded-xl shadow-xs border border-gray-200 space-y-4">
      {/* Header with Switch */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-lg bg-orange-100 text-[#F45116] font-bold text-sm flex items-center justify-center">
            <Zap size={16} />
          </span>
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              Order Bump Product (Checkout Upsell / স্পেশাল অফার)
            </h3>
            <p className="text-xs text-gray-500 font-hind">
              চেকআউট পেজে অর্ডারের সাথে ১-ক্লিকে অ্যাড করার জন্য এই পণ্যের সাথে একটি অর্ডার বাম্প পণ্য ও ছাড় অফার করুন
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={enableOrderBump}
            onChange={(e) => {
              setEnableOrderBump(e.target.checked);
              if (!e.target.checked) {
                setOrderBumpProduct(null);
              }
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F45116]"></div>
        </label>
      </div>

      {enableOrderBump && (
        <div className="space-y-4 pt-2">
          {/* Select Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
              Select Order Bump Product <span className="text-red-500">*</span>
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
                      <Package size={24} className="text-emerald-500 m-auto mt-2" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 font-hind">
                      {orderBumpProduct.productName}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-hind">
                      Regular: ৳{orderBumpProduct.price} | Sale: ৳
                      {orderBumpProduct.salePrice || orderBumpProduct.price}
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
                  Change / Remove
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
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search product for order bump by name or SKU..."
                    className="w-full pl-9 pr-4 py-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/20 bg-white"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white">
                  {filteredProducts.slice(0, 10).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setOrderBumpProduct(p);
                        setSearch("");
                      }}
                      className="w-full p-2.5 text-left flex items-center justify-between hover:bg-orange-50/50 transition cursor-pointer text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800 font-hind">
                          {p.productName}
                        </span>
                        <span className="text-[10px] text-gray-400 font-hind">
                          ({p.sku || "No SKU"})
                        </span>
                      </div>
                      <span className="font-bold text-[#F45116] font-hind">
                        ৳{p.salePrice || p.price}
                      </span>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="p-3 text-xs text-gray-400 text-center">
                      No matching products found
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Texts and Discount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                Order Bump Headline (Bangla)
              </label>
              <input
                type="text"
                value={orderBumpTitle}
                onChange={(e) => setOrderBumpTitle(e.target.value)}
                placeholder="e.g. স্পেশাল অফার! সাথে নিন আমাদের এই বিশেষ পণ্য"
                className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/20 bg-white"
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
                placeholder="e.g. মূল পণ্যের সাথে একই পার্সেল ডেলিভারিতে পাচ্ছেন আকর্ষণীয় অতিরিক্ত ছাড়!"
                className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/20 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-hind">
                Extra Discount on Checkout (৳)
              </label>
              <input
                type="number"
                value={orderBumpDiscount}
                onChange={(e) => setOrderBumpDiscount(e.target.value)}
                placeholder="e.g. 100"
                className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/20 bg-white"
              />
              <span className="text-[11px] text-gray-500 font-hind mt-1 block">
                This discount is subtracted from the grand total when customer checks the bump box.
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
                placeholder="Leave blank to use product standard sale price"
                className="w-full p-2.5 rounded border border-stone-300 text-sm font-hind focus:outline-none focus:border-[#F45116] focus:ring-2 focus:ring-[#F45116]/20 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
