import { fetcher } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


// ---------------------- MAIN CATEGORY --------------------------
export const useMainCategories = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/main-categories`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};


// ---------------------- CATEGORY --------------------------
export const useCategories = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/categories`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};


// ---------------------- SUB-CATEGORY --------------------------
export const useSubCategories = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/sub-categories`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};


// ---------------------- BRAND --------------------------
export const useBrands = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/brands`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};



// ---------------------- UNITS --------------------------
export const useUnits = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/unit`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};


// ---------------------- VARIANT ATTRIBUTES --------------------------
export const useVariantAttributes = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/variant-attributes`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};



// ---------------------- WARRANTY --------------------------
export const useWarranties = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/warranty`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};


// ---------------------- DASHBOARD SUMMARY --------------------------
export const useDashboardSummary = () => {
    const { data, error, isLoading, mutate } = useSWR(
        `${API_URL}/api/dashboard/summary`,
        fetcher
    );

    // The API returns the summary object directly; no nested `data` field.
    // Return the raw data to the component so that `dashboardData` contains the expected fields.
    return {
        data,
        isLoading,
        error,
        mutate,
        isEmpty: !isLoading && !error && (!data || Object.keys(data).length === 0)
    };
};

// ---------------------- PRODUCT --------------------------
export const useProducts = (page = 1, limit = 20, search = '', filters = {}) => {
    let url = `${API_URL}/api/products?page=${page}&limit=${limit}`;

    if (search) url += `&search=${encodeURIComponent(search)}`;

    // data filters
    if (filters.mainCategoryId && filters.mainCategoryId !== 'all') url += `&mainCategoryId=${filters.mainCategoryId}`;
    if (filters.categoryId && filters.categoryId !== 'all') url += `&categoryId=${filters.categoryId}`;
    if (filters.subCategoryId && filters.subCategoryId !== 'all') url += `&subCategoryId=${filters.subCategoryId}`;
    if (filters.brandId && filters.brandId !== 'all') url += `&brandId=${filters.brandId}`;
    if (filters.productType && filters.productType !== 'all') url += `&productType=${filters.productType}`;
    if (filters.collectionId && filters.collectionId !== 'all') url += `&collectionId=${filters.collectionId}`;
    if (filters.visibility && filters.visibility !== 'all') url += `&visibility=${filters.visibility}`;
    if (filters.stockStatus && filters.stockStatus !== 'all') url += `&stockStatus=${filters.stockStatus}`;
    if (filters.sortBy) url += `&sortBy=${filters.sortBy}`;
    if (filters.sortOrder) url += `&sortOrder=${filters.sortOrder}`;

    const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher);

    return {
        data: data?.products || [],
        pagination: data?.pagination || {
            currentPage: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 1,
        },
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && !data?.products?.length,
    };
};

// ---------------------- COLLECTIONS --------------------------
export const useCollections = (status) => {
    let url = `${API_URL}/api/collections`;
    if (status !== undefined && status !== 'all') {
        url += `?status=${status}`;
    }

    const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher);

    return {
        data: data || [],
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && (!data || data.length === 0),
    };
};


// ---------------------- CUSTOMER --------------------------
export const useCustomers = (page = 1, limit = 20, search = '', status = 'all') => {
    let url = `${API_URL}/api/customer?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status !== 'all') url += `&status=${status === 'active' ? 'true' : 'false'}`;

    const { data, error, isLoading, mutate } = useSWR(url, fetcher);

    return {
        data: data?.customers || [],
        pagination: data?.pagination || {
            currentPage: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 1,
        },
        isLoading,
        error,
        mutate,
        isEmpty: !isLoading && !error && !data?.customers?.length,
    };
};

// ---------------------- ORDER --------------------------
export const useOrders = (page = 1, limit = 20, search = '', status = '', paymentStatus = '') => {
    let url = `${API_URL}/api/order?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (paymentStatus && paymentStatus !== 'all') url += `&paymentStatus=${paymentStatus}`;

    const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher);

    return {
        data: data?.orders || [],
        pagination: data?.pagination || {
            currentPage: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 1,
        },
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && !data?.orders?.length,
    };
};

// ---------------------- INVOICE --------------------------
export const useInvoices = (page = 1, limit = 20, search = '', paymentStatus = '') => {
    let url = `${API_URL}/api/invoice?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (paymentStatus && paymentStatus !== 'all') url += `&paymentStatus=${paymentStatus}`;

    const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher);

    return {
        data: data?.invoices || [],
        pagination: data?.pagination || {
            currentPage: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 1,
        },
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && !data?.invoices?.length,
    };
};

// ---------------------- ORDER WITHOUT INVOICE --------------------------
export const useOrdersWithoutInvoices = (page = 1, limit = 20, search = '') => {
    let url = `${API_URL}/api/order/without-invoice?page=${page}&limit=${limit}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;

    const { data, error, isLoading, isValidating, mutate } = useSWR(url, fetcher);

    return {
        data: data?.orders || [],
        pagination: data?.pagination || {
            currentPage: 1,
            limit: 20,
            totalItems: 0,
            totalPages: 1,
        },
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && !data?.orders?.length,
    };
};


// ---------------------- COUPON --------------------------
export const useCoupons = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/coupon`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};


// ---------------------- DISCOUNT CAMPAIGN --------------------------
export const useDiscountCampaign = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/discount-campaign`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};


// ---------------------- BUNDLE PRODUCT --------------------------
export const useBundleProducts = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/bundle-product`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};



// ---------------------- ENQUIRY US --------------------------
export const useEnquiryUs = () => {
    const { data, error, isLoading, isValidating, mutate } = useSWR(
        `${API_URL}/api/enquiry-us`, fetcher);

    return {
        data,
        error,
        isLoading,
        isValidating,
        mutate,
        isEmpty: !isLoading && !error && data?.length === 0,
    };
};


