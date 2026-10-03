import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Format a number as currency string for PDF (using "Tk. " for standard font compatibility)
 */
function formatCurrency(amount) {
    const num = parseFloat(amount || 0);
    const isNeg = num < 0;
    const absVal = Math.abs(num).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return isNeg ? `(Tk. ${absVal})` : `Tk. ${absVal}`;
}

function formatDateDisplay(dateStr) {
    if (!dateStr) return "N/A";
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return String(dateStr);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
    } catch {
        return String(dateStr);
    }
}

export function generatePnLPDF({
    pnlData = {},
    filter = {},
    companyInfo = {
        name: "Ekhone",
        address: "Jigatola, Dhaka, Bangladesh",
        phone: "+880 1700000000",
        email: "support@ekhone.com",
    },
}) {
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pw = doc.internal.pageSize.getWidth(); // 210mm
    const ph = doc.internal.pageSize.getHeight(); // 297mm
    const mx = 14;
    const cw = pw - mx * 2; // 182mm

    const isYearly = filter?.period === "this_year" || filter?.period === "last_year";
    const title = isYearly
        ? "YEARLY PROFIT AND LOSS STATEMENT"
        : "PROFIT AND LOSS STATEMENT";

    // 1. Title Banner
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(24, 24, 27); // slate-900
    doc.text(title, pw / 2, 18, { align: "center" });

    // Divider under Title
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.4);
    doc.line(mx, 22, pw - mx, 22);

    // 2. Company Info & Metadata Section
    const blockTop = 27;

    // Left: Company & Address
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text("COMPANY NAME:", mx, blockTop);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(70, 70, 70);
    doc.text(companyInfo.name || "Ekhone", mx, blockTop + 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text("ADDRESS:", mx, blockTop + 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    const addrLines = doc.splitTextToSize(
        companyInfo.address || "Dhaka, Bangladesh",
        55
    );
    doc.text(addrLines, mx, blockTop + 16);

    // Middle: Contacts
    const midX = 76;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text("CONTACTS:", midX, blockTop);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(`Phone: ${companyInfo.phone || "+880 1700-000000"}`, midX, blockTop + 5);
    doc.text(`Email: ${companyInfo.email || "support@ekhone.com"}`, midX, blockTop + 10);

    // Right: Date Table Box
    const boxX = 136;
    const boxW = 60;
    const boxY = blockTop - 1;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(80, 80, 80);
    doc.text(title, boxX + boxW, boxY - 1.5, { align: "right" });

    // Table rows for metadata
    const todayStr = formatDateDisplay(new Date());
    const startStr = formatDateDisplay(pnlData?.period?.startDate || filter?.startDate) || "Beginning";
    const endStr = formatDateDisplay(pnlData?.period?.endDate || filter?.endDate) || "Present";

    const metaRows = [
        ["DATE PREPARED", todayStr],
        [isYearly ? "START YEAR" : "START DATE", startStr],
        [isYearly ? "END YEAR" : "END DATE", endStr],
    ];

    autoTable(doc, {
        body: metaRows,
        startY: boxY,
        margin: { left: boxX },
        tableWidth: boxW,
        theme: "plain",
        styles: {
            fontSize: 7.5,
            cellPadding: 1.5,
            lineColor: [220, 220, 225],
            lineWidth: 0.2,
        },
        columnStyles: {
            0: { fontStyle: "bold", textColor: [60, 60, 60], cellWidth: 32 },
            1: { halign: "center", fontStyle: "bold", textColor: [20, 20, 20], fillColor: [245, 245, 245], cellWidth: 28 },
        },
    });

    const afterHeaderY = 48;
    doc.setDrawColor(220, 220, 225);
    doc.setLineWidth(0.4);
    doc.line(mx, afterHeaderY, pw - mx, afterHeaderY);

    // 3. Body Data
    const revenue = pnlData?.revenue || {};
    const grossProfit = pnlData?.grossProfit || {};
    const expenses = pnlData?.operatingExpenses || {};
    const returns = pnlData?.returnsAndLosses || {};
    const netProfit = pnlData?.netProfit || {};
    const shippingCostVal = pnlData?.shippingCost?.totalShippingCost || 0;

    const totalRev = parseFloat(revenue.totalRevenue || 0);

    const calcPercent = (val) => {
        if (!totalRev || totalRev === 0) return "0.0%";
        const p = ((parseFloat(val || 0) / totalRev) * 100).toFixed(1);
        return `${p}%`;
    };

    const tableBody = [];

    // --- REVENUE SECTION ---
    tableBody.push([
        { content: "REVENUE", colSpan: 2, styles: { fontStyle: "bold", fillColor: [240, 240, 242], textColor: [20, 20, 20] } },
        { content: "% REV", styles: { fontStyle: "bold", fillColor: [240, 240, 242], textColor: [80, 80, 80], halign: "right" } },
    ]);
    tableBody.push([
        "Gross Sales (Delivered Orders)",
        formatCurrency(revenue.totalSales || 0),
        calcPercent(revenue.totalSales),
    ]);
    if (returns.directRefunds > 0) {
        tableBody.push([
            "- Less Sales Returns and Allowances",
            `(${formatCurrency(returns.directRefunds)})`,
            calcPercent(returns.directRefunds),
        ]);
    }
    if (revenue.otherIncome > 0) {
        tableBody.push([
            "Other Operating Income (Account Heads)",
            formatCurrency(revenue.otherIncome || 0),
            calcPercent(revenue.otherIncome),
        ]);
    }
    tableBody.push([
        { content: "NET SALES / TOTAL REVENUE", styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
        { content: formatCurrency(revenue.totalRevenue || 0), styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
        { content: "100.0%", styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
    ]);

    // Space row
    tableBody.push([{ content: "", colSpan: 3, styles: { cellPadding: 1, minCellHeight: 2 } }]);

    // --- COST OF SALES SECTION ---
    tableBody.push([
        { content: "COST OF SALES", colSpan: 2, styles: { fontStyle: "bold", fillColor: [240, 240, 242], textColor: [20, 20, 20] } },
        { content: "", styles: { fillColor: [240, 240, 242] } },
    ]);
    tableBody.push([
        "- Dedicated Shipping Cost (Order Delivery Charges)",
        formatCurrency(shippingCostVal),
        calcPercent(shippingCostVal),
    ]);
    tableBody.push([
        { content: "TOTAL DIRECT SHIPPING COST", styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
        { content: formatCurrency(shippingCostVal), styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
        { content: calcPercent(shippingCostVal), styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
    ]);
    tableBody.push([
        {
            content: `GROSS PROFIT (LOSS)  [Margin: ${grossProfit.marginPercent || 0}%]`,
            styles: { fontStyle: "bold", textColor: [180, 83, 9] },
        },
        {
            content: formatCurrency(grossProfit.amount || 0),
            styles: { fontStyle: "bold", textColor: [180, 83, 9] },
        },
        {
            content: calcPercent(grossProfit.amount),
            styles: { fontStyle: "bold", textColor: [180, 83, 9] },
        },
    ]);

    // Space row
    tableBody.push([{ content: "", colSpan: 3, styles: { cellPadding: 1, minCellHeight: 2 } }]);

    // --- OPERATING EXPENSES SECTION ---
    tableBody.push([
        { content: "OPERATING EXPENSES", colSpan: 2, styles: { fontStyle: "bold", fillColor: [240, 240, 242], textColor: [20, 20, 20] } },
        { content: "", styles: { fillColor: [240, 240, 242] } },
    ]);

    const breakdown = expenses.breakdown || [];
    if (breakdown.length > 0) {
        breakdown.forEach((exp) => {
            tableBody.push([
                `- ${exp.head}`,
                formatCurrency(exp.amount),
                calcPercent(exp.amount),
            ]);
        });
    } else {
        tableBody.push([
            "- General Operating Expenses",
            formatCurrency(expenses.accountHeadExpenses || 0),
            calcPercent(expenses.accountHeadExpenses),
        ]);
    }

    tableBody.push([
        { content: "TOTAL OPERATING EXPENSES", styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
        { content: formatCurrency(expenses.total || 0), styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
        { content: calcPercent(expenses.total), styles: { fontStyle: "bold", textColor: [15, 23, 42] } },
    ]);

    // Space row
    tableBody.push([{ content: "", colSpan: 3, styles: { cellPadding: 1, minCellHeight: 2 } }]);

    // --- NET PROFIT (LOSS) FINAL SUMMARY ---
    const netProfitAmt = parseFloat(netProfit.amount || 0);
    const isProfitable = netProfitAmt >= 0;
    tableBody.push([
        {
            content: `NET PROFIT (LOSS)  [Net Margin: ${netProfit.marginPercent || 0}%]`,
            styles: {
                fontStyle: "bold",
                fontSize: 9.5,
                fillColor: isProfitable ? [240, 253, 244] : [254, 242, 242],
                textColor: isProfitable ? [22, 101, 52] : [153, 27, 27],
            },
        },
        {
            content: formatCurrency(netProfitAmt),
            styles: {
                fontStyle: "bold",
                fontSize: 9.5,
                fillColor: isProfitable ? [240, 253, 244] : [254, 242, 242],
                textColor: isProfitable ? [22, 101, 52] : [153, 27, 27],
            },
        },
        {
            content: calcPercent(netProfitAmt),
            styles: {
                fontStyle: "bold",
                fontSize: 9.5,
                fillColor: isProfitable ? [240, 253, 244] : [254, 242, 242],
                textColor: isProfitable ? [22, 101, 52] : [153, 27, 27],
            },
        },
    ]);

    autoTable(doc, {
        body: tableBody,
        startY: afterHeaderY + 4,
        margin: { left: mx, right: mx },
        theme: "plain",
        styles: {
            font: "helvetica",
            fontSize: 8.5,
            cellPadding: { top: 2.2, bottom: 2.2, left: 3, right: 3 },
            textColor: [51, 65, 85],
            lineColor: [235, 235, 240],
            lineWidth: 0.1,
        },
        columnStyles: {
            0: { cellWidth: cw - 65, halign: "left" },
            1: { cellWidth: 42, halign: "right" },
            2: { cellWidth: 23, halign: "right" },
        },
        didDrawPage: (data) => {
            // Footer
            const str = `Page ${doc.internal.getNumberOfPages()}`;
            doc.setFontSize(7.5);
            doc.setTextColor(140, 140, 140);
            doc.setFont("helvetica", "normal");
            doc.text(
                `Generated by Ekhone Accounting System  |  Confidential Financial Record`,
                mx,
                ph - 8
            );
            doc.text(str, pw - mx, ph - 8, { align: "right" });
        },
    });

    const dateStamp = new Date().toISOString().slice(0, 10);
    doc.save(`Profit-and-Loss-Statement-${dateStamp}.pdf`);
}
