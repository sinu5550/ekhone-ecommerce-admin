// components/GoogleAnalyticsDashboard/RealtimeVisitors.jsx
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Users, TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';

export default function RealtimeVisitors({ 
    activeUsersPerMinute = [],  // Changed from initialCount
    onRealtimeUpdate 
}) {
    const [count, setCount] = useState(0);
    const [history, setHistory] = useState([]);
    const [trend, setTrend] = useState('stable');
    const [isLive, setIsLive] = useState(true);
    const intervalRef = useRef(null);
    const dataIndexRef = useRef(0);

    // Update with actual data from API
    useEffect(() => {
        if (activeUsersPerMinute && activeUsersPerMinute.length > 0) {
            // Set initial count from the latest data point
            const latestCount = activeUsersPerMinute[activeUsersPerMinute.length - 1]?.users || 0;
            setCount(latestCount);
            
            // Initialize history with API data
            const apiHistory = activeUsersPerMinute.map(item => ({
                time: item.time,
                count: item.users
            }));
            setHistory(apiHistory);
        }
    }, [activeUsersPerMinute]);

    // Real-time visitor updates (now based on actual data)
    useEffect(() => {
        if (!isLive || !activeUsersPerMinute || activeUsersPerMinute.length === 0) return;

        const updateInterval = setInterval(() => {
            // Cycle through the actual data
            dataIndexRef.current = (dataIndexRef.current + 1) % activeUsersPerMinute.length;
            const newCount = activeUsersPerMinute[dataIndexRef.current]?.users || 0;
            
            // Calculate trend based on actual data
            const prevCount = count;
            if (newCount > prevCount) setTrend('up');
            else if (newCount < prevCount) setTrend('down');
            else setTrend('stable');
            
            setCount(newCount);
            
            if (onRealtimeUpdate) {
                onRealtimeUpdate(newCount);
            }
        }, 5000); // Update every 5 seconds

        intervalRef.current = updateInterval;

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isLive, onRealtimeUpdate, activeUsersPerMinute, count]);

    // Track visitor history
    useEffect(() => {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        setHistory(prev => {
            const newHistory = [...prev, { time: timeString, count }];
            return newHistory.slice(-20);
        });
    }, [count]);

    // Calculate visitor status based on actual data
    const getStatusColor = () => {
        const maxCount = Math.max(...activeUsersPerMinute.map(item => item.users), 1);
        const percentage = count / maxCount;
        if (percentage > 0.7) return 'text-emerald-600';
        if (percentage > 0.3) return 'text-amber-600';
        return 'text-gray-600';
    };

    const getStatusText = () => {
        const maxCount = Math.max(...activeUsersPerMinute.map(item => item.users), 1);
        const percentage = count / maxCount;
        if (percentage > 0.7) return 'High Traffic';
        if (percentage > 0.3) return 'Moderate Traffic';
        if (count > 0) return 'Low Traffic';
        return 'No Visitors';
    };

    // Calculate peak from actual data
    const getPeakToday = () => {
        return Math.max(...activeUsersPerMinute.map(item => item.users), 0);
    };

    // Calculate average from actual data
    const getAverageVisitors = () => {
        if (activeUsersPerMinute.length === 0) return 0;
        const sum = activeUsersPerMinute.reduce((acc, item) => acc + item.users, 0);
        return Math.round(sum / activeUsersPerMinute.length);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-full">
            <div>
                {/* Header Section */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-500" />
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                            Realtime Visitors
                        </h3>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                            <span className="text-xs font-medium text-gray-500">
                                {isLive ? 'Live' : 'Paused'}
                            </span>
                        </div>
                        <button
                            onClick={() => setIsLive(!isLive)}
                            className={`text-xs px-2.5 py-1 rounded border transition font-medium ${
                                isLive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                            {isLive ? 'Pause' : 'Resume'}
                        </button>
                    </div>
                </div>

                {/* Main Content Body */}
                <div className="p-6">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold text-gray-900 tracking-tight">
                                    {count.toLocaleString()}
                                </span>
                                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                                    active now
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2">
                                <span className={`text-xs font-semibold ${getStatusColor()}`}>
                                    {getStatusText()}
                                </span>
                                {trend === 'up' && (
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                )}
                                {trend === 'down' && (
                                    <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                )}
                                {trend === 'stable' && (
                                    <Activity className="w-3.5 h-3.5 text-amber-500" />
                                )}
                            </div>
                        </div>

                        {/* Mini Sparkline Bar Chart */}
                        <div className="flex items-end gap-1 h-12">
                            {history.map((point, index) => {
                                const maxValue = Math.max(...history.map(p => p.count), 1);
                                const height = (point.count / maxValue) * 100;
                                const isLatest = index === history.length - 1;

                                return (
                                    <div
                                        key={index}
                                        className={`w-1.5 rounded-t transition-all duration-300 ${
                                            isLatest
                                                ? 'bg-[#249D8F]'
                                                : 'bg-teal-100'
                                        }`}
                                        style={{ height: `${Math.max(height, 8)}%` }}
                                        title={`${point.time}: ${point.count} visitors`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats Metric Cards Grid */}
                    <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-center">
                        <div className="bg-gray-50/60 p-2.5 rounded-lg border border-gray-100">
                            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Peak Today</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">
                                {getPeakToday().toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50/60 p-2.5 rounded-lg border border-gray-100">
                            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Avg Visitors</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">
                                {getAverageVisitors().toLocaleString()}
                            </p>
                        </div>
                        <div className="bg-gray-50/60 p-2.5 rounded-lg border border-gray-100">
                            <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Data Points</p>
                            <p className="text-sm font-bold text-gray-900 mt-0.5">
                                {activeUsersPerMinute.length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Connection Footer */}
            <div className="px-6 py-2.5 bg-gray-50/50 border-t border-gray-100 rounded-b-xl flex items-center justify-between text-[11px] text-gray-400">
                <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    <span>
                        {isLive
                            ? `Real-time data from ${activeUsersPerMinute.length} active sessions`
                            : 'Stream paused'
                        }
                    </span>
                </div>
                <span className="text-[10px]">
                    Last {activeUsersPerMinute.length} min
                </span>
            </div>
        </div>
    );
}