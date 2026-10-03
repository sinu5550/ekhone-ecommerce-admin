"use client";

import useSWR from "swr";
import { fetcher } from "@/utils/authHeader";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const swrConfig = {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
    keepPreviousData: true,
};

function buildQuery(params = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "" && val !== "all") {
            searchParams.set(key, val);
        }
    });
    const str = searchParams.toString();
    return str ? `?${str}` : "";
}

// 1. Account Heads Hook
export const useAccountingHeads = (params = {}) => {
    const query = buildQuery(params);
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/accounting/heads${query}`,
        fetcher,
        swrConfig
    );

    return {
        heads: data?.data || [],
        summary: data?.summary || null,
        error,
        isLoading,
        isValidating,
        mutate
    };
};

// 2. Accounting Dashboard Hook (KPIs, Expense Breakdown, Trend)
export const useAccountingDashboard = (filter = {}) => {
    const query = buildQuery(filter);

    const { data: kpiData, error: kpiError, isLoading: kpiLoading, mutate: mutateKPIs } = useSWR(
        `${API_URL}/api/accounting/dashboard-kpis${query}`,
        fetcher,
        swrConfig
    );

    const { data: headData, error: headError, isLoading: headLoading, mutate: mutateHead } = useSWR(
        `${API_URL}/api/accounting/reports/head-wise-expenses${query}`,
        fetcher,
        swrConfig
    );

    const { data: dateWiseData, error: dateError, isLoading: dateLoading, mutate: mutateDate } = useSWR(
        `${API_URL}/api/accounting/reports/date-wise${query}`,
        fetcher,
        swrConfig
    );

    const mutateAll = async () => {
        await Promise.all([mutateKPIs(), mutateHead(), mutateDate()]);
    };

    return {
        kpiData: kpiData?.data || null,
        headBreakdown: headData?.data?.breakdown || [],
        dateWiseData: (dateWiseData?.data?.records || []).slice(0, 14).reverse(),
        isLoading: kpiLoading && !kpiData,
        error: kpiError || headError || dateError,
        mutate: mutateAll
    };
};

// 3. Transactions Hook
export const useAccountingTransactions = (params = {}) => {
    const query = buildQuery(params);
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/accounting/transactions${query}`,
        fetcher,
        swrConfig
    );

    return {
        transactions: data?.data?.transactions || [],
        summary: data?.data?.summary || { totalIncome: 0, totalExpense: 0, netBalance: 0 },
        pagination: data?.data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1, limit: 20 },
        error,
        isLoading,
        isValidating,
        mutate
    };
};

// 4. Courier Financial Report Hook
export const useCourierReport = (params = {}) => {
    const query = buildQuery(params);
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/accounting/reports/courier-wise${query}`,
        fetcher,
        swrConfig
    );

    return {
        courierStats: data?.data?.couriers || { STEADFAST: {}, PATHAO: {} },
        shipments: data?.data?.shipments || [],
        error,
        isLoading: isLoading && !data,
        isValidating,
        mutate
    };
};

// 5. Profit & Loss Hook
export const useProfitAndLoss = (params = {}) => {
    const query = buildQuery(params);
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/accounting/reports/profit-and-loss${query}`,
        fetcher,
        swrConfig
    );

    return {
        pnlData: data?.data || null,
        error,
        isLoading: isLoading && !data,
        isValidating,
        mutate
    };
};

// 6. Head-Wise Expenses Report Hook
export const useHeadWiseExpenses = (params = {}) => {
    const query = buildQuery(params);
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/accounting/reports/head-wise-expenses${query}`,
        fetcher,
        swrConfig
    );

    return {
        breakdown: data?.data?.breakdown || [],
        totalExpenses: data?.data?.totalExpenses || 0,
        error,
        isLoading: isLoading && !data,
        isValidating,
        mutate
    };
};

// 7. Product-Wise Sales Report Hook
export const useProductSalesReport = (params = {}) => {
    const query = buildQuery(params);
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/accounting/reports/product-wise-sales${query}`,
        fetcher,
        swrConfig
    );

    return {
        products: data?.data?.products || [],
        summary: data?.data?.summary || { totalRevenue: 0, totalGrossProfit: 0, totalUnitsSold: 0, totalProducts: 0 },
        pagination: data?.data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1, limit: 20 },
        error,
        isLoading: isLoading && !data,
        isValidating,
        mutate
    };
};

// 8. Date-Wise Report Hook
export const useDateWiseReport = (params = {}) => {
    const query = buildQuery(params);
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/accounting/reports/date-wise${query}`,
        fetcher,
        swrConfig
    );

    return {
        records: data?.data?.records || [],
        summary: data?.data?.summary || { totalSales: 0, totalCollections: 0, totalExpenses: 0, netCashFlow: 0 },
        error,
        isLoading: isLoading && !data,
        isValidating,
        mutate
    };
};

// 9. Sales & Collection Report Hook
export const useSalesCollectionReport = (params = {}) => {
    const query = buildQuery(params);
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/accounting/reports/sales-collection${query}`,
        fetcher,
        swrConfig
    );

    return {
        orders: data?.data?.orders || [],
        summary: data?.data?.summary || { totalSales: 0, totalCollected: 0, totalDue: 0 },
        pagination: data?.data?.pagination || { totalItems: 0, totalPages: 1, currentPage: 1, limit: 20 },
        error,
        isLoading: isLoading && !data,
        isValidating,
        mutate
    };
};
