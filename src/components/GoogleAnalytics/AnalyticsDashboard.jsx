// components/admin/AnalyticsDashboard.jsx
"use client";

import { useState } from 'react';
import {
    AlertCircle,
    RefreshCw,
    Activity
} from 'lucide-react';
import LoadingSpinner from '../LoadingSpinner/LoadingSpinner';
import StatsCards from './StatsCards';
import TrafficSources from './TrafficSources';
import EventsTable from './EventsTable';
import VisitorsChart from './VisitorsChart';
import CountryTable from './CountryTable';
import TopPages from './TopPages';
import { useAnalyticsData } from '@/hooks/useAnalyticsData';
import RealtimeVisitors from './RealtimeVisitors';
import { usePermission } from '@/context/PermissionProvider';

export default function AnalyticsDashboard() {
    const [dateRange, setDateRange] = useState({
        startDate: '7daysAgo',
        endDate: 'today',
    });

    const { data, loading, error, refetch, isRefetching } = useAnalyticsData(dateRange);
    const { hasPermission } = usePermission();

    // Check permission first
    if (!hasPermission('analytics.google_view')) {
        return (
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-amber-600 mx-auto mb-3" />
                <p className="text-amber-600 font-semibold text-lg">Access Restricted</p>
                <p className="text-amber-500 text-sm mt-1">
                    You don't have permission to view analytics data.
                </p>
            </div>
        );
    }

    // Show loading spinner while data is being fetched
    if (loading && !data) {
        return (
            <div>
                <LoadingSpinner />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200 rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
                <p className="text-red-600 font-semibold text-lg">Error loading data</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
                <button
                    onClick={() => refetch()}
                    className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition shadow-sm"
                >
                    Try Again
                </button>
            </div>
        );
    }

    // Ensure data exists before accessing properties
    if (!data) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <LoadingSpinner />
            </div>
        );
    }

    // Access data properties safely - matching your API response structure
    const stats = [
        {
            title: 'Active Users',
            value: data.totalVisitors || 0,
            change: 12.5
        },
        {
            title: 'Page Views',
            value: data.totalPageViews || 0,
            change: 8.3
        },
        {
            title: 'Bounce Rate',
            value: typeof data.bounceRate === 'number' ? (data.bounceRate * 100) : 0,
            change: -2.1
        },
        {
            title: 'Avg Session (sec)',
            value: Math.round(data.avgSessionDuration || 0),
            change: 5.7
        },
        {
            title: 'Event Count',
            value: data.eventCount || 0,
            change: 15.2
        },
        {
            title: 'Key Events',
            value: data.keyEvents || 0,
            change: 0
        },
        {
            title: 'New Users',
            value: data.newUsers || 0,
            change: 10.8
        },
        {
            title: 'Active (Last 30m)',
            value: data.activeUsersPerMinute?.[0]?.users || 0,
            change: -0.5
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-sky-50 to-indigo-50/50 p-6 rounded-2xl border border-blue-100/50">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2 font-philosopher">
                        <Activity className="w-6 h-6 text-primary" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Monitor your website performance in real-time
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex gap-1 p-1 bg-white rounded-xl shadow-sm">
                        {['7', '14', '30', '90'].map((days) => (
                            <button
                                key={days}
                                onClick={() => setDateRange({ startDate: `${days}daysAgo`, endDate: 'today' })}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                    dateRange.startDate === `${days}daysAgo`
                                        ? 'bg-primary text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 cursor-pointer'
                                }`}
                            >
                                {days}d
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => refetch()}
                        disabled={isRefetching}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white cursor-pointer text-gray-800 rounded-xl hover:bg-secondary/50 disabled:opacity-50 transition shadow-sm text-sm"
                    >
                        <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                        {isRefetching ? 'Refreshing' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <VisitorsChart data={data.pageViewsOverTime || []} />
                </div>
                <div>
                    <CountryTable data={data.visitorsByCountry || []} />
                </div>
            </div>

            {/* Traffic Sources & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrafficSources data={data.trafficSources || []} />
                <EventsTable
                    eventsByName={data.eventsByName || []}
                    eventsByPlatform={data.eventsByPlatform || []}
                />
            </div>

            {/* Realtime Visitors */}
            <RealtimeVisitors
                activeUsersPerMinute={data.activeUsersPerMinute || []}
            />

            {/* Top Pages */}
            <TopPages data={data.topPages || []} />
        </div>
    );
}