// hooks/useAnalyticsData.js
import { useState, useEffect, useCallback, useRef } from 'react';

const defaultDateRange = {
    startDate: '7daysAgo',
    endDate: 'today',
};

export function useAnalyticsData(dateRange = defaultDateRange) {

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRefetching, setIsRefetching] = useState(false);
    const [error, setError] = useState(null);
    const [realtimeData, setRealtimeData] = useState(null);
    const [realtimeLoading, setRealtimeLoading] = useState(false);

    const abortControllerRef = useRef(null);
    const isMountedRef = useRef(true);

    const fetchData = useCallback(async (isRefetch = false) => {
        try {
            if (isRefetch) {
                setIsRefetching(true);
            } else {
                setLoading(true);
            }

            setError(null);

            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            const controller = new AbortController();
            abortControllerRef.current = controller;

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch analytics data');
            }

            const result = await response.json();

            if (!isMountedRef.current) return;

            if (result.success) {
                setData(result.data);
                setError(null);
            } else {
                throw new Error(result.message || 'Failed to fetch analytics data');
            }
        } catch (err) {
            if (!isMountedRef.current) return;

            if (err.name === 'AbortError') {
                return;
            }

            setError(err.message || 'An error occurred while fetching data');
        } finally {
            if (isMountedRef.current) {
                setLoading(false);
                setIsRefetching(false);
            }
        }
    }, [dateRange.startDate, dateRange.endDate]);

    const fetchRealtime = useCallback(async () => {
        try {
            setRealtimeLoading(true);

            const url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/realtime`;

            const response = await fetch(url, {
                headers: {
                    'Cache-Control': 'no-cache',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch realtime data');
            }

            const result = await response.json();
            if (result.success) {
                setRealtimeData(result.data);
            }
        } catch (err) {
            console.error('Realtime fetch error:', err);
        } finally {
            setRealtimeLoading(false);
        }
    }, []);

    useEffect(() => {
        isMountedRef.current = true;

        fetchData(false);
        fetchRealtime();

        const interval = setInterval(() => {
            fetchRealtime();
        }, 30000);

        return () => {
            isMountedRef.current = false;
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            clearInterval(interval);
        };
    }, [fetchData, fetchRealtime]);

    const refetch = useCallback(async () => {
        await fetchData(true);
    }, [fetchData]);

    const refreshRealtime = useCallback(async () => {
        await fetchRealtime();
    }, [fetchRealtime]);

    return {
        data,
        loading,
        error,
        refetch,
        isRefetching,
        realtimeData,
        realtimeLoading,
        refreshRealtime,
    };
}