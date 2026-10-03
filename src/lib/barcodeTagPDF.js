// lib/barcodeTagPDF.js — Barcode & Product Tag PDF and Direct Print Generator
import jsPDF from "jspdf";
import JsBarcode from "jsbarcode";

export const LABEL_SIZES = {
    "50x30": {
        id: "50x30",
        name: "50mm × 30mm (Standard Thermal Sticker)",
        width: 50,
        height: 30,
        orientation: "landscape",
        description: "Standard thermal sticker roll (Xprinter, Zebra, TSC, POS)"
    },
    "40x25": {
        id: "40x25",
        name: "40mm × 25mm (Compact Retail Sticker)",
        width: 40,
        height: 25,
        orientation: "landscape",
        description: "Compact tag for cosmetics, accessories & small retail items"
    },
    "50x20": {
        id: "50x20",
        name: "50mm × 20mm (Slim Jewelry / Accessory Tag)",
        width: 50,
        height: 20,
        orientation: "landscape",
        description: "Slim strip tag for jewelry, eyewear, and narrow items"
    },
    "38x25": {
        id: "38x25",
        name: "38mm × 25mm (1.5\" × 1\" Mini)",
        width: 38,
        height: 25,
        orientation: "landscape",
        description: "Mini sticker label for compact merchandise"
    },
    "80x50": {
        id: "80x50",
        name: "80mm × 50mm (Large Product / Box Tag)",
        width: 80,
        height: 50,
        orientation: "landscape",
        description: "Large format label for apparel, boxes, and packages"
    },
    "roll_80": {
        id: "roll_80",
        name: "80mm POS Continuous Roll",
        width: 72,
        height: 40,
        orientation: "landscape",
        description: "Standard 80mm thermal receipt continuous paper"
    }
};

/**
 * Extract only the last 6 numbers from an SKU to generate barcode.
 * If SKU has digits, extracts the last 6 digits (padded with leading zeros if fewer than 6).
 * Fallback to '000000' if no digits found.
 */
export const extractBarcodeFromSKU = (sku, fallbackId = null) => {
    const str = String(sku || '').trim();
    const digits = str.replace(/\D/g, '');
    if (digits.length >= 6) {
        return digits.slice(-6);
    }
    if (digits.length > 0) {
        return digits.padStart(6, '0');
    }
    if (fallbackId !== null && fallbackId !== undefined) {
        const idDigits = String(fallbackId).replace(/\D/g, '');
        if (idDigits.length >= 6) return idDigits.slice(-6);
        if (idDigits.length > 0) return idDigits.padStart(6, '0');
    }
    return "000000";
};

/**
 * Generate a Barcode image Data URL from SKU or string using JsBarcode (using last 6 numbers)
 */
export const generateBarcodeDataURL = (text, options = {}) => {
    if (typeof window === "undefined") return "";
    const cleanText = extractBarcodeFromSKU(text);

    try {
        const canvas = document.createElement("canvas");
        JsBarcode(canvas, cleanText, {
            format: options.format || "CODE128",
            width: options.width || 2,
            height: options.height || 45,
            displayValue: false,
            margin: 0,
            background: "#ffffff",
            lineColor: "#000000"
        });
        return canvas.toDataURL("image/png");
    } catch (e) {
        console.warn("JsBarcode generation fallback:", e);
        try {
            const canvas = document.createElement("canvas");
            JsBarcode(canvas, cleanText.replace(/[^A-Z0-9\- ]/gi, "-"), {
                format: "CODE128",
                width: 2,
                height: 40,
                displayValue: false,
                margin: 0
            });
            return canvas.toDataURL("image/png");
        } catch (err) {
            console.error("Barcode fallback failed:", err);
            return "";
        }
    }
};

/**
 * Format Currency for BD Taka
 */
export const formatPrice = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return "0.00";
    return num.toLocaleString("en-BD", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
};

/**
 * Calculate effective price and discount
 */
export const getProductPriceInfo = (product, variant) => {
    let regularPrice = 0;
    let salePrice = 0;
    let hasDiscount = false;
    let discountPercent = 0;

    const basePrice = parseFloat(variant?.price ?? product?.price ?? 0);
    regularPrice = basePrice;
    salePrice = basePrice;

    // Check discount from product
    const discountType = product?.discountType;
    const discountValue = parseFloat(product?.discountValue || 0);

    if (discountValue > 0 && discountType) {
        hasDiscount = true;
        if (discountType === "Percentage") {
            salePrice = basePrice - (basePrice * discountValue) / 100;
            discountPercent = discountValue;
        } else {
            salePrice = Math.max(0, basePrice - discountValue);
            discountPercent = Math.round((discountValue / basePrice) * 100);
        }
    }

    return {
        regularPrice,
        salePrice,
        hasDiscount,
        discountPercent
    };
};

/**
 * Build flat list of individual tags to print based on user quantities
 */
export const buildTagItemsList = (product, variantSelections = []) => {
    const list = [];
    if (!product) return list;

    const isVariant = product.productType === "variant" && Array.isArray(product.productVariants) && product.productVariants.length > 0;

    if (isVariant) {
        variantSelections.forEach(item => {
            const qty = parseInt(item.printQuantity || 0);
            if (qty > 0) {
                const variant = product.productVariants?.find(v => v.id === item.id) || item;
                const priceInfo = getProductPriceInfo(product, variant);

                // Format attributes string
                let attrStr = "";
                if (variant.attributes) {
                    if (typeof variant.attributes === "object") {
                        attrStr = Object.entries(variant.attributes)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(" | ");
                    } else {
                        attrStr = String(variant.attributes);
                    }
                } else if (variant.color || variant.size) {
                    attrStr = [variant.color, variant.size].filter(Boolean).join(" | ");
                }

                const itemSku = variant.sku || product.sku || "N/A";
                const barcodeNum = extractBarcodeFromSKU(itemSku, variant.id || product.id);

                for (let i = 0; i < qty; i++) {
                    list.push({
                        productId: product.id,
                        variantId: variant.id,
                        productName: product.productName || "Product",
                        sku: itemSku,
                        barcodeNumber: barcodeNum,
                        categoryName: product.subCategory?.name || product.subCategory?.category?.name || "",
                        brandName: product.brand?.name || "Ekhone",
                        attributesText: attrStr,
                        ...priceInfo,
                        tagIndex: i + 1,
                        totalForVariant: qty
                    });
                }
            }
        });
    } else {
        const qty = parseInt(variantSelections[0]?.printQuantity || 1);
        const priceInfo = getProductPriceInfo(product, null);
        const itemSku = product.sku || "N/A";
        const barcodeNum = extractBarcodeFromSKU(itemSku, product.id);

        for (let i = 0; i < qty; i++) {
            list.push({
                productId: product.id,
                variantId: null,
                productName: product.productName || "Product",
                sku: itemSku,
                barcodeNumber: barcodeNum,
                categoryName: product.subCategory?.name || product.subCategory?.category?.name || "",
                brandName: product.brand?.name || "Ekhone",
                attributesText: "",
                ...priceInfo,
                tagIndex: i + 1,
                totalForVariant: qty
            });
        }
    }

    return list;
};

/**
 * Generate PDF Document for Product Tags (1 sticker per page for roll printers)
 */
export const generateProductTagsPDF = async (tagsList, settings = {}) => {
    if (!tagsList || tagsList.length === 0) {
        throw new Error("No product tags selected for printing.");
    }

    const sizeConfig = LABEL_SIZES[settings.labelSize || "50x30"] || LABEL_SIZES["50x30"];
    const showStoreName = settings.showStoreName !== false;
    const storeName = settings.storeName || "EKHONE";
    const showProductName = settings.showProductName !== false;
    const showAttributes = settings.showAttributes !== false;
    const showPrice = settings.showPrice !== false;
    const showMRP = settings.showMRP !== false;
    const showSKUText = settings.showSKUText !== false;
    const customNote = settings.customNote || "";

    // Pre-cache barcodes
    const barcodeCache = {};
    for (const tag of tagsList) {
        if (!barcodeCache[tag.sku]) {
            barcodeCache[tag.sku] = generateBarcodeDataURL(tag.sku, { width: 2, height: 40 });
        }
    }

    const doc = new jsPDF({
        orientation: sizeConfig.orientation || "landscape",
        unit: "mm",
        format: [sizeConfig.width, sizeConfig.height]
    });

    tagsList.forEach((tag, idx) => {
        if (idx > 0) {
            doc.addPage([sizeConfig.width, sizeConfig.height], sizeConfig.orientation || "landscape");
        }

        drawSingleLabel(doc, 0, 0, sizeConfig.width, sizeConfig.height, tag, barcodeCache[tag.sku], {
            showStoreName,
            storeName,
            showProductName,
            showAttributes,
            showPrice,
            showMRP,
            showSKUText,
            customNote
        });
    });

    return doc;
};

/**
 * Draw a single label on PDF canvas
 */
const drawSingleLabel = (doc, x, y, w, h, tag, barcodeDataUrl, options) => {
    const isSmall = h <= 22 || w <= 40;
    const padding = isSmall ? 1.5 : 2;
    const contentW = w - padding * 2;
    const centerX = x + w / 2;
    let curY = y + padding;

    // 1. Store Brand Name
    if (options.showStoreName) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(isSmall ? 6.5 : (h >= 45 ? 9 : 8));
        doc.setTextColor(20, 20, 20);
        doc.text(options.storeName || "EKHONE", centerX, curY + (isSmall ? 2 : 2.5), { align: "center" });
        curY += isSmall ? 3 : (h >= 45 ? 4.5 : 3.8);
    }

    // 2. Product Name
    if (options.showProductName) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(isSmall ? 6 : (h >= 45 ? 8 : 7));
        doc.setTextColor(40, 40, 40);
        const maxChars = isSmall ? 22 : (w >= 70 ? 36 : 28);
        let title = tag.productName || "Product";
        if (title.length > maxChars) {
            title = title.substring(0, maxChars - 2) + "...";
        }
        doc.text(title, centerX, curY + (isSmall ? 1.8 : 2.2), { align: "center" });
        curY += isSmall ? 2.8 : (h >= 45 ? 4 : 3.2);
    }

    // 3. Variant Attributes (e.g. Color: Red | Size: L)
    if (options.showAttributes && tag.attributesText) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(isSmall ? 5 : (h >= 45 ? 7 : 6));
        doc.setTextColor(80, 80, 80);
        let attr = tag.attributesText;
        if (attr.length > 32) attr = attr.substring(0, 30) + "...";
        doc.text(attr, centerX, curY + 1.8, { align: "center" });
        curY += isSmall ? 2.5 : (h >= 45 ? 3.8 : 3.0);
    }

    // 4. Barcode Image
    const barcodeH = isSmall ? 7 : (h <= 25 ? 8.5 : (h >= 45 ? 14 : 10));
    const barcodeW = Math.min(contentW * 0.92, w >= 70 ? 55 : 44);
    const barcodeX = centerX - barcodeW / 2;

    if (barcodeDataUrl) {
        try {
            doc.addImage(barcodeDataUrl, "PNG", barcodeX, curY + 0.5, barcodeW, barcodeH);
            curY += barcodeH + 0.8;
        } catch (e) {
            console.error("Failed to add barcode image to PDF:", e);
        }
    }

    // 5. SKU Text
    if (options.showSKUText) {
        doc.setFont("courier", "bold");
        doc.setFontSize(isSmall ? 5.5 : (h >= 45 ? 7.5 : 6.5));
        doc.setTextColor(30, 30, 30);
        doc.text(tag.sku || "N/A", centerX, curY + (isSmall ? 1.5 : 2), { align: "center" });
        curY += isSmall ? 2.5 : (h >= 45 ? 3.8 : 3.0);
    }

    // 6. Price Section
    if (options.showPrice) {
        const bottomY = y + h - padding - (isSmall ? 1.5 : 2);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(isSmall ? 7 : (h >= 45 ? 9.5 : 8.5));
        doc.setTextColor(0, 0, 0);

        if (tag.hasDiscount && options.showMRP) {
            const saleStr = `Tk ${formatPrice(tag.salePrice)}`;
            const mrpStr = `MRP: ${formatPrice(tag.regularPrice)}`;

            doc.setFontSize(isSmall ? 6.5 : 8);
            doc.text(saleStr, centerX - 6, bottomY, { align: "center" });

            doc.setFont("helvetica", "normal");
            doc.setFontSize(isSmall ? 5 : 6);
            doc.setTextColor(120, 120, 120);
            doc.text(mrpStr, centerX + 12, bottomY, { align: "center" });

            // Strike line
            const mrpW = doc.getTextWidth(mrpStr);
            const strikeX = centerX + 12 - mrpW / 2;
            doc.setDrawColor(150, 150, 150);
            doc.setLineWidth(0.2);
            doc.line(strikeX, bottomY - 0.8, strikeX + mrpW, bottomY - 0.8);
        } else {
            const priceStr = `Price: Tk ${formatPrice(tag.salePrice || tag.regularPrice)}`;
            doc.text(priceStr, centerX, bottomY, { align: "center" });
        }
    }
};

/**
 * Direct Print Barcode Tags via hidden browser iframe (100% Thermal Printer Optimized)
 */
export const printProductTagsDirect = (tagsList, settings = {}) => {
    if (!tagsList || tagsList.length === 0) return;

    const sizeConfig = LABEL_SIZES[settings.labelSize || "50x30"] || LABEL_SIZES["50x30"];
    const showStoreName = settings.showStoreName !== false;
    const storeName = settings.storeName || "EKHONE";
    const showProductName = settings.showProductName !== false;
    const showAttributes = settings.showAttributes !== false;
    const showPrice = settings.showPrice !== false;
    const showMRP = settings.showMRP !== false;
    const showSKUText = settings.showSKUText !== false;
    const customNote = settings.customNote || "";

    const barcodeCache = {};
    for (const tag of tagsList) {
        if (!barcodeCache[tag.sku]) {
            barcodeCache[tag.sku] = generateBarcodeDataURL(tag.sku, { width: 2, height: 40 });
        }
    }

    const wMm = sizeConfig.width;
    const hMm = sizeConfig.height;

    const labelsHtml = tagsList.map((tag) => {
        const barcodeSrc = barcodeCache[tag.sku] || "";
        return `
            <div class="thermal-tag" style="width: ${wMm}mm; height: ${hMm}mm;">
                <div class="tag-inner">
                    ${showStoreName ? `<div class="store-name">${escapeHtml(storeName)}</div>` : ""}
                    ${showProductName ? `<div class="product-name">${escapeHtml(tag.productName)}</div>` : ""}
                    ${showAttributes && tag.attributesText ? `<div class="attributes-text">${escapeHtml(tag.attributesText)}</div>` : ""}
                    <div class="barcode-container">
                        <img src="${barcodeSrc}" alt="${escapeHtml(tag.sku)}" class="barcode-img" />
                    </div>
                    ${showSKUText ? `<div class="sku-text">${escapeHtml(tag.sku)}</div>` : ""}
                    ${showPrice ? `
                        <div class="price-container">
                            <span class="sale-price">৳ ${formatPrice(tag.salePrice)}</span>
                            ${tag.hasDiscount && showMRP ? `<span class="mrp-price">MRP: ৳ ${formatPrice(tag.regularPrice)}</span>` : ""}
                        </div>
                    ` : ""}
                    ${customNote ? `<div class="custom-note">${escapeHtml(customNote)}</div>` : ""}
                </div>
            </div>
        `;
    }).join("");

    const printCss = `
        @page {
            size: ${wMm}mm ${hMm}mm;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        html, body {
            margin: 0;
            padding: 0;
            background: #fff;
            color: #000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .thermal-tag {
            width: ${wMm}mm;
            height: ${hMm}mm;
            page-break-after: always;
            break-after: page;
            page-break-inside: avoid;
            break-inside: avoid;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #fff;
        }
        .tag-inner {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: 1.5mm;
            text-align: center;
            line-height: 1.1;
        }
        .store-name {
            font-size: 8pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #111;
        }
        .product-name {
            font-size: 7pt;
            font-weight: 600;
            color: #333;
            max-width: 95%;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .attributes-text {
            font-size: 6pt;
            color: #555;
            font-weight: 500;
        }
        .barcode-container {
            width: 95%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0.5mm 0;
        }
        .barcode-img {
            max-width: 100%;
            height: auto;
            max-height: ${hMm <= 25 ? "8mm" : (hMm >= 45 ? "14mm" : "10.5mm")};
            object-fit: contain;
            image-rendering: pixelated;
        }
        .sku-text {
            font-family: monospace;
            font-size: 6.5pt;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #111;
        }
        .price-container {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            margin-top: 0.5mm;
        }
        .sale-price {
            font-size: 8pt;
            font-weight: 800;
            color: #000;
        }
        .mrp-price {
            font-size: 6pt;
            color: #777;
            text-decoration: line-through;
        }
        .custom-note {
            font-size: 5pt;
            color: #666;
            margin-top: 0.3mm;
        }
    `;

    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8" />
            <title>Barcode Tags - ${escapeHtml(storeName)}</title>
            <style>${printCss}</style>
        </head>
        <body>
            ${labelsHtml}
        </body>
        </html>
    `;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(fullHtml);
    doc.close();

    iframe.onload = () => {
        setTimeout(() => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
            } catch (e) {
                console.error("Iframe direct print failed:", e);
            }
            setTimeout(() => {
                try {
                    document.body.removeChild(iframe);
                } catch (err) {}
            }, 60000);
        }, 300);
    };
};

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
