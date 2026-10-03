// app/dashboard/page.jsx
"use client";

import { useMemo, useState } from "react";

import {
  ShoppingCart,
  Package,
  Users,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  TrendingUp,
  XCircle,
  Layers3,
  ListTree,
  GitBranch,
  Award,
  ShieldCheck,
  AlertTriangle,
  UserCheck,
  RotateCcw,
  Tag,
  Send,
  Boxes,
  HelpCircle,
  Sparkles,
  Ban,
  Trash2,
  PauseCircle,
  CalendarClock,
  Calendar,
  Info,
} from "lucide-react";

import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
} from "recharts";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner/LoadingSpinner";
import { ProtectedRoute } from "@/ProtectedRoute/ProtectedRoute";
import {
  useDashboardSummary,
  useMainCategories,
  useCategories,
  useSubCategories,
  useBrands,
  useWarranties,
  useProducts,
  useOrders,
} from "@/lib/dataFetch";
import { useAdminUsers } from "@/hooks/useRBAC";

export const ORDER_STATUS_CONFIG = {
  Pending: { label: "Pending", bg: "bg-amber-50 text-amber-700 ring-amber-600/20", chart: "#f59e0b", icon: Clock },
  Confirmed: { label: "Confirmed", bg: "bg-sky-50 text-sky-700 ring-sky-600/20", chart: "#0ea5e9", icon: CheckCircle2 },
  Processing: { label: "Processing", bg: "bg-purple-50 text-purple-700 ring-purple-600/20", chart: "#a855f7", icon: AlertCircle },
  ReadyToShip: { label: "Ready To Ship", bg: "bg-teal-50 text-teal-700 ring-teal-600/20", chart: "#14b8a6", icon: Boxes },
  InCourier: { label: "In-Courier", bg: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", chart: "#6366f1", icon: Truck },
  Shipped: { label: "Shipped", bg: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", chart: "#4f46e5", icon: Truck },
  ShipLater: { label: "Ship Later", bg: "bg-blue-50 text-blue-700 ring-blue-600/20", chart: "#3b82f6", icon: CalendarClock },
  Hold: { label: "Hold", bg: "bg-amber-50 text-amber-700 ring-amber-600/20", chart: "#eab308", icon: PauseCircle },
  Returned: { label: "Returned", bg: "bg-rose-50 text-rose-700 ring-rose-600/20", chart: "#f43f5e", icon: RotateCcw },
  PreOrder: { label: "Pre-order", bg: "bg-purple-50 text-purple-700 ring-purple-600/20", chart: "#9333ea", icon: Sparkles },
  Delivered: { label: "Delivered", bg: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", chart: "#10b981", icon: CheckCircle2 },
  Cancelled: { label: "Cancelled", bg: "bg-red-50 text-red-700 ring-red-600/20", chart: "#ef4444", icon: XCircle },
  Missing: { label: "Missing", bg: "bg-pink-50 text-pink-700 ring-pink-600/20", chart: "#ec4899", icon: HelpCircle },
  Lost: { label: "Lost", bg: "bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20", chart: "#d946ef", icon: AlertTriangle },
  Fake: { label: "Fake", bg: "bg-stone-100 text-stone-700 ring-stone-600/20", chart: "#78716c", icon: Ban },
  Trash: { label: "Trash", bg: "bg-gray-100 text-gray-700 ring-gray-600/20", chart: "#6b7280", icon: Trash2 },
};

export const normalizeOrderStatus = (status) => {
  if (!status) return "Pending";
  const s = String(status).toLowerCase().replace(/[\s\-_]/g, '');
  const map = {
    pending: "Pending",
    confirmed: "Confirmed",
    processing: "Processing",
    readytoship: "ReadyToShip",
    incourier: "InCourier",
    shiplater: "ShipLater",
    hold: "Hold",
    returned: "Returned",
    preorder: "PreOrder",
    shipped: "Shipped",
    shipping: "Shipped",
    delivered: "Delivered",
    cancelled: "Cancelled",
    cancel: "Cancelled",
    missing: "Missing",
    lost: "Lost",
    fake: "Fake",
    trash: "Trash"
  };
  return map[s] || status;
};

export const getStatusDetails = (status) => {
  const norm = normalizeOrderStatus(status);
  return ORDER_STATUS_CONFIG[norm] || {
    label: status || "Pending",
    bg: "bg-slate-100 text-slate-700 ring-slate-600/20",
    chart: "#64748b",
    icon: Clock
  };
};

export const isCancelledOrInvalid = (status) => {
  const s = String(status || '').toLowerCase().replace(/[\s\-_]/g, '');
  return ['cancelled', 'cancel', 'fake', 'trash'].includes(s);
};

export const isRevenueStatus = (status) => {
  const s = String(status || '').toLowerCase().replace(/[\s\-_]/g, '');
  return s === 'delivered';
};

export const isSalesMetricStatus = (status) => {
  const s = String(status || '').toLowerCase().replace(/[\s\-_]/g, '');
  return ['pending', 'confirmed', 'processing', 'hold', 'readytoship', 'incourier', 'shiplater', 'preorder', 'shipped', 'delivered'].includes(s);
};

export default function Dashboard() {
  const { data: dashboardData, isLoading: summaryLoading } = useDashboardSummary();
  const [ordersByHourPeriod, setOrdersByHourPeriod] = useState("all");
  const [revenueTrendPeriod, setRevenueTrendPeriod] = useState("monthly");
  const [orderTrendsMonths, setOrderTrendsMonths] = useState(6);
  const [cityPeriod, setCityPeriod] = useState("all");
  const [ratioPeriod, setRatioPeriod] = useState("all");
  const [statsPeriod, setStatsPeriod] = useState("all");
  const [topProductsPeriod, setTopProductsPeriod] = useState("all");
  const [courierPeriod, setCourierPeriod] = useState("all");
  const [courierStartDate, setCourierStartDate] = useState("");
  const [courierEndDate, setCourierEndDate] = useState("");
  const { data: mainCategories, isLoading: mainCatLoading } = useMainCategories();
  const { data: categories, isLoading: catLoading } = useCategories();
  const { data: subCategories, isLoading: subCatLoading } = useSubCategories();
  const { data: brands, isLoading: brandsLoading } = useBrands();
  const { data: warranties, isLoading: warrantiesLoading } = useWarranties();
  const { data: products, isLoading: productsLoading } = useProducts(1, 1000);
  const { users: adminUsers, isLoading: adminLoading } = useAdminUsers();
  const { data: allOrders = [], isLoading: ordersLoading } = useOrders(1, 10000);
  const revenueByCity = useMemo(() => {
    const citiesMap = {};
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = thisMonthStart;

    allOrders.forEach(o => {
      if (!isRevenueStatus(o.status)) return;

      const dateStr = o.orderDate || o.createdAt;
      if (!dateStr) return;
      const date = new Date(dateStr);

      if (cityPeriod === "thismonth" && date < thisMonthStart) return;
      if (cityPeriod === "lastmonth" && (date < lastMonthStart || date >= lastMonthEnd)) return;

      let city = o.shippingAddress?.district || o.shippingAddress?.city || o.shippingAddress?.division || o.shippingAddress?.state || "Dhaka";
      city = city.trim();
      if (!city) city = "Dhaka";
      // Capitalize first letter
      city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

      const amt = parseFloat(o.grandTotal || 0);
      citiesMap[city] = (citiesMap[city] || 0) + amt;
    });

    return Object.entries(citiesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [allOrders, cityPeriod]);

  const filteredStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(todayStart);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let totalRevenue = 0;
    let orderCount = 0;
    const uniqueCustomers = new Set();

    allOrders.forEach(o => {
      if (!isRevenueStatus(o.status)) return;
      const dateStr = o.createdAt || o.orderDate;
      if (!dateStr) return;
      try {
        const date = new Date(dateStr);
        if (statsPeriod === "today" && date < todayStart) return;
        if (statsPeriod === "yesterday" && (date < yesterdayStart || date >= todayStart)) return;
        if (statsPeriod === "weekly" && date < weekAgo) return;
        if (statsPeriod === "monthly" && date < monthAgo) return;

        totalRevenue += parseFloat(o.grandTotal || 0);
        orderCount++;
        const customerId = o.customer?.id || o.customer?._id || o.customerId;
        if (customerId) uniqueCustomers.add(customerId);
      } catch (err) {
        console.error(err);
      }
    });

    const avgOrderValue = orderCount > 0 ? (totalRevenue / orderCount) : 0;
    const activeCustomers = uniqueCustomers.size;
    const conversionRate = orderCount > 0 ? ((activeCustomers / orderCount) * 100).toFixed(1) : "0.0";

    return {
      avgOrderValue,
      activeCustomers,
      conversionRate
    };
  }, [allOrders, statsPeriod]);

  const filteredTopProducts = useMemo(() => {
    const productLookup = new Map();
    (products || []).forEach(p => {
      productLookup.set(p.id, p);
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(todayStart);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const productSales = {};

    if (allOrders && allOrders.length > 0) {
      allOrders.forEach(o => {
        if (!isSalesMetricStatus(o.status)) return;
        const dateStr = o.createdAt || o.orderDate;
        if (!dateStr) return;
        try {
          const date = new Date(dateStr);
          if (topProductsPeriod === "today" && date < todayStart) return;
          if (topProductsPeriod === "yesterday" && (date < yesterdayStart || date >= todayStart)) return;
          if (topProductsPeriod === "weekly" && date < weekAgo) return;
          if (topProductsPeriod === "monthly" && date < monthAgo) return;

          o.orderItems?.forEach(item => {
            const pid = item.productId || item.product?.id;
            const matchedProd = pid ? productLookup.get(pid) : null;
            const name = item.product?.productName || item.productName || item.product?.name || item.product?.title || matchedProd?.productName || matchedProd?.name || (pid ? `Product #${pid}` : "Product Item");
            
            // Extract thumbnail from item.product or matched product images
            let thumbnail = item.product?.productThumbnail || null;
            const imgSource = item.product?.images || matchedProd?.images;
            if (!thumbnail && imgSource) {
              if (Array.isArray(imgSource) && imgSource.length > 0) {
                thumbnail = typeof imgSource[0] === 'string' ? imgSource[0] : (imgSource[0]?.url || imgSource[0]?.thumbnail || null);
              } else if (typeof imgSource === 'string') {
                thumbnail = imgSource;
              } else if (imgSource?.url || imgSource?.thumbnail) {
                thumbnail = imgSource.url || imgSource.thumbnail;
              }
            }
            if (!thumbnail && matchedProd?.productThumbnail) {
              thumbnail = matchedProd.productThumbnail;
            }

            const key = pid || name;

            if (!productSales[key]) {
              productSales[key] = { id: pid, name, thumbnail, sales: 0, revenue: 0 };
            }
            const qty = item.quantity || 1;
            const rev = parseFloat(item.lineTotal || (item.unitPrice ? item.unitPrice * qty : 0) || (item.price ? item.price * qty : 0) || 0);
            productSales[key].sales += qty;
            productSales[key].revenue += rev;
            if ((!productSales[key].name || productSales[key].name.startsWith("Product #") || productSales[key].name === "Unknown Product") && name && name !== "Unknown Product") {
              productSales[key].name = name;
            }
            if (!productSales[key].thumbnail && thumbnail) {
              productSales[key].thumbnail = thumbnail;
            }
          });
        } catch (err) {
          console.error(err);
        }
      });
    }

    const liveList = Object.values(productSales)
      .filter(item => item.sales > 0 || item.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    if (liveList.length > 0) return liveList;

    if (dashboardData?.topProducts?.length > 0) {
      return dashboardData.topProducts.map(tp => {
        const matched = (tp.id || tp.productId) ? productLookup.get(tp.id || tp.productId) : null;
        let thumbnail = tp.thumbnail || null;
        if (!thumbnail && matched?.images) {
          const imgSource = matched.images;
          if (Array.isArray(imgSource) && imgSource.length > 0) {
            thumbnail = typeof imgSource[0] === 'string' ? imgSource[0] : (imgSource[0]?.url || imgSource[0]?.thumbnail || null);
          } else if (typeof imgSource === 'string') {
            thumbnail = imgSource;
          }
        }
        return {
          id: tp.id || tp.productId,
          name: matched?.productName || (tp.name && tp.name !== "Unknown Product" && !tp.name.startsWith("Product #") ? tp.name : (matched?.productName || tp.name || "Product")),
          thumbnail: thumbnail || matched?.productThumbnail || null,
          sales: tp.sales || 0,
          revenue: tp.revenue || 0
        };
      });
    }

    return [];
  }, [allOrders, dashboardData, topProductsPeriod, products]);

  const totalCityRevenue = useMemo(() => {
    return revenueByCity.reduce((sum, item) => sum + item.value, 0);
  }, [revenueByCity]);


  const ordersByHour = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => {
      const displayHour = i === 0 ? "12 AM" : i === 12 ? "12 PM" : i > 12 ? `${i - 12} PM` : `${i} AM`;
      return {
        hourKey: i,
        hour: displayHour,
        count: 0
      };
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(todayStart);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    allOrders.forEach(o => {
      const dateStr = o.createdAt || o.orderDate;
      if (!dateStr) return;
      try {
        const date = new Date(dateStr);

        if (ordersByHourPeriod === "today" && date < todayStart) return;
        if (ordersByHourPeriod === "yesterday" && (date < yesterdayStart || date >= todayStart)) return;
        if (ordersByHourPeriod === "weekly" && date < weekAgo) return;
        if (ordersByHourPeriod === "monthly" && date < monthAgo) return;

        const hour = date.getHours();
        if (hour >= 0 && hour < 24) {
          hours[hour].count += 1;
        }
      } catch (err) {
        console.error("Failed to parse order hour:", err);
      }
    });

    return hours;
  }, [allOrders, ordersByHourPeriod]);

  const revenueTrendData = useMemo(() => {
    if (!dashboardData) return [];
    if (revenueTrendPeriod === "monthly") {
      return dashboardData.charts?.monthlyRevenue || [];
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysToCount = revenueTrendPeriod === "daily7" ? 7 : 30;

    const dataMap = {};
    for (let i = daysToCount - 1; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dataMap[dateStr] = 0;
    }

    allOrders.forEach(o => {
      if (!isRevenueStatus(o.status)) return;
      const dateStr = o.orderDate || o.createdAt;
      if (!dateStr) return;
      const d = new Date(dateStr);
      const diffTime = Math.abs(todayStart - new Date(d.getFullYear(), d.getMonth(), d.getDate()));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < daysToCount) {
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (dataMap[label] !== undefined) {
          dataMap[label] += parseFloat(o.grandTotal || 0);
        }
      }
    });

    return Object.entries(dataMap).map(([date, revenue]) => ({
      month: date,
      revenue
    }));
  }, [allOrders, dashboardData, revenueTrendPeriod]);

  const orderTrendsData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonth = new Date().getMonth();

    const getDefaultMonthObj = (monthName) => {
      const obj = { month: monthName };
      Object.keys(ORDER_STATUS_CONFIG).forEach(status => {
        obj[status] = 0;
      });
      return obj;
    };

    // If allOrders is available, compute live monthly breakdown with all 16 statuses
    if (allOrders && allOrders.length > 0) {
      const monthlyStats = {};
      allOrders.forEach(o => {
        const dateStr = o.createdAt || o.orderDate;
        if (!dateStr) return;
        const d = new Date(dateStr);
        const monthName = months[d.getMonth()];
        if (!monthlyStats[monthName]) {
          monthlyStats[monthName] = getDefaultMonthObj(monthName);
        }
        const norm = normalizeOrderStatus(o.status || "Pending");
        if (monthlyStats[monthName][norm] !== undefined) {
          monthlyStats[monthName][norm] += 1;
        } else {
          monthlyStats[monthName][norm] = 1;
        }
      });

      const result = [];
      for (let i = orderTrendsMonths - 1; i >= 0; i--) {
        const monthName = months[(currentMonth - i + 12) % 12];
        result.push(monthlyStats[monthName] || getDefaultMonthObj(monthName));
      }
      return result;
    }

    // Fallback: derive from dashboardData API if allOrders is empty
    if (dashboardData?.charts?.monthlyOrderStatus?.length) {
      return dashboardData.charts.monthlyOrderStatus.slice(-orderTrendsMonths).map(m => {
        const fullMonthObj = getDefaultMonthObj(m.month);
        Object.entries(m).forEach(([k, v]) => {
          if (k !== 'month') {
            const norm = normalizeOrderStatus(k);
            fullMonthObj[norm] = (fullMonthObj[norm] || 0) + (Number(v) || 0);
          }
        });
        return fullMonthObj;
      });
    }

    const result = [];
    for (let i = orderTrendsMonths - 1; i >= 0; i--) {
      const monthName = months[(currentMonth - i + 12) % 12];
      result.push(getDefaultMonthObj(monthName));
    }
    return result;
  }, [dashboardData, orderTrendsMonths, allOrders]);

  const orderTrendsSummary = useMemo(() => {
    let total = 0;
    let delivered = 0;
    (orderTrendsData || []).forEach(month => {
      Object.entries(month).forEach(([key, val]) => {
        if (key !== 'month' && typeof val === 'number') {
          total += val;
          if (key === 'Delivered') delivered += val;
        }
      });
    });
    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, deliveryRate };
  }, [orderTrendsData]);

  const orderStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = todayStart;

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = thisMonthStart;

    let todayVal = 0, todayCount = 0;
    let yesterdayVal = 0, yesterdayCount = 0;
    let thisMonthVal = 0, thisMonthCount = 0;
    let lastMonthVal = 0, lastMonthCount = 0;
    let allTimeVal = 0, allTimeCount = 0;

    allOrders.forEach(o => {
      if (!isSalesMetricStatus(o.status)) return;

      const dateStr = o.orderDate || o.createdAt;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const val = parseFloat(o.grandTotal || 0);

      allTimeVal += val;
      allTimeCount += 1;

      if (date >= todayStart) {
        todayVal += val;
        todayCount += 1;
      } else if (date >= yesterdayStart && date < yesterdayEnd) {
        yesterdayVal += val;
        yesterdayCount += 1;
      }

      if (date >= thisMonthStart) {
        thisMonthVal += val;
        thisMonthCount += 1;
      } else if (date >= lastMonthStart && date < lastMonthEnd) {
        lastMonthVal += val;
        lastMonthCount += 1;
      }
    });

    return {
      today: { val: todayVal, count: todayCount },
      yesterday: { val: yesterdayVal, count: yesterdayCount },
      thisMonth: { val: thisMonthVal, count: thisMonthCount },
      lastMonth: { val: lastMonthVal, count: lastMonthCount },
      allTime: { val: allTimeVal, count: allTimeCount }
    };
  }, [allOrders]);

  const excludedStats = useMemo(() => {
    let count = 0;
    let val = 0;
    const breakdown = {
      Cancelled: { count: 0, val: 0 },
      Returned: { count: 0, val: 0 },
      Missing: { count: 0, val: 0 },
      Lost: { count: 0, val: 0 },
      Fake: { count: 0, val: 0 },
      Trash: { count: 0, val: 0 },
    };

    (allOrders || []).forEach(o => {
      if (!isSalesMetricStatus(o.status)) {
        const grandTotal = parseFloat(o.grandTotal || 0);
        count += 1;
        val += grandTotal;
        const norm = normalizeOrderStatus(o.status);
        if (breakdown[norm]) {
          breakdown[norm].count += 1;
          breakdown[norm].val += grandTotal;
        }
      }
    });

    return { count, val, breakdown };
  }, [allOrders]);

  const revenueStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const day = now.getDay();
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = thisMonthStart;
    const thisYearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
    const lastYearEnd = thisYearStart;

    let todayRev = 0, todayCount = 0;
    let thisWeekRev = 0, thisWeekCount = 0;
    let thisMonthRev = 0, thisMonthCount = 0;
    let lastMonthRev = 0, lastMonthCount = 0;
    let thisYearRev = 0, thisYearCount = 0;
    let lastYearRev = 0, lastYearCount = 0;
    let allTimeRev = 0, allTimeCount = 0;

    (allOrders || []).forEach(o => {
      if (!isRevenueStatus(o.status)) return;

      const dateStr = o.orderDate || o.createdAt;
      if (!dateStr) return;
      const date = new Date(dateStr);
      const val = parseFloat(o.grandTotal || 0);

      allTimeRev += val;
      allTimeCount += 1;

      if (date >= todayStart) {
        todayRev += val;
        todayCount += 1;
      }
      if (date >= thisWeekStart) {
        thisWeekRev += val;
        thisWeekCount += 1;
      }
      if (date >= thisMonthStart) {
        thisMonthRev += val;
        thisMonthCount += 1;
      } else if (date >= lastMonthStart && date < lastMonthEnd) {
        lastMonthRev += val;
        lastMonthCount += 1;
      }
      if (date >= thisYearStart) {
        thisYearRev += val;
        thisYearCount += 1;
      } else if (date >= lastYearStart && date < lastYearEnd) {
        lastYearRev += val;
        lastYearCount += 1;
      }
    });

    return {
      today: { val: todayRev, count: todayCount },
      thisWeek: { val: thisWeekRev, count: thisWeekCount },
      thisMonth: { val: thisMonthRev, count: thisMonthCount },
      lastMonth: { val: lastMonthRev, count: lastMonthCount },
      thisYear: { val: thisYearRev, count: thisYearCount },
      lastYear: { val: lastYearRev, count: lastYearCount },
      allTime: { val: allTimeRev, count: allTimeCount },
    };
  }, [allOrders]);

  // Prepare category data dynamically for pie chart based on selected period
  const categoryData = useMemo(() => {
    const counts = {};
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekAgo = new Date(todayStart);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(todayStart);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let total = 0;
    if (allOrders?.length > 0) {
      allOrders.forEach(o => {
        const dateStr = o.createdAt || o.orderDate;
        if (!dateStr) return;
        try {
          const date = new Date(dateStr);
          if (ratioPeriod === "today" && date < todayStart) return;
          if (ratioPeriod === "yesterday" && (date < yesterdayStart || date >= todayStart)) return;
          if (ratioPeriod === "weekly" && date < weekAgo) return;
          if (ratioPeriod === "monthly" && date < monthAgo) return;

          const status = normalizeOrderStatus(o.status || "Pending");
          counts[status] = (counts[status] || 0) + 1;
          total++;
        } catch (err) {
          console.error(err);
        }
      });
    } else if (dashboardData?.charts?.statusDistribution?.length > 0 && ratioPeriod === "all") {
      dashboardData.charts.statusDistribution.forEach(item => {
        const norm = normalizeOrderStatus(item.name);
        counts[norm] = (counts[norm] || 0) + item.count;
        total += item.count;
      });
    }

    if (total === 0) return [];

    return Object.entries(counts).map(([name, count]) => {
      const details = getStatusDetails(name);
      return {
        name: details.label,
        rawStatus: name,
        value: Math.round((count / total) * 100),
        count,
        color: details.chart
      };
    }).filter(item => item.count > 0);
  }, [allOrders, dashboardData, ratioPeriod]);

  // Prepare courier operations and financial summary with date range filter
  const courierStats = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const day = now.getDay();
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day, 0, 0, 0, 0);

    const last7DaysStart = new Date(todayStart);
    last7DaysStart.setDate(last7DaysStart.getDate() - 7);

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const thisYearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    const thisYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

    let customStart = null;
    let customEnd = null;
    if (courierStartDate) {
      customStart = new Date(courierStartDate);
      customStart.setHours(0, 0, 0, 0);
    }
    if (courierEndDate) {
      customEnd = new Date(courierEndDate);
      customEnd.setHours(23, 59, 59, 999);
    }

    let totalShipments = 0;
    let inTransitCount = 0;
    let deliveredCount = 0;
    let returnedCount = 0;
    let restoredCount = 0;
    let totalCod = 0;
    let collectedCod = 0;
    let pendingCod = 0;
    let returnedCod = 0;
    let steadfast = { total: 0, inTransit: 0, delivered: 0, returned: 0, totalCod: 0, collectedCod: 0, pendingCod: 0 };
    let pathao = { total: 0, inTransit: 0, delivered: 0, returned: 0, totalCod: 0, collectedCod: 0, pendingCod: 0 };

    (allOrders || []).forEach(o => {
      const sh = o.shipment;
      if (!sh) return;

      const dateStr = sh.createdAt || o.orderDate || o.createdAt;
      if (dateStr) {
        const d = new Date(dateStr);
        if (courierPeriod === "today" && (d < todayStart || d > todayEnd)) return;
        if (courierPeriod === "yesterday" && (d < yesterdayStart || d > yesterdayEnd)) return;
        if (courierPeriod === "this_week" && d < thisWeekStart) return;
        if (courierPeriod === "last_7_days" && d < last7DaysStart) return;
        if (courierPeriod === "this_month" && (d < thisMonthStart || d > thisMonthEnd)) return;
        if (courierPeriod === "last_month" && (d < lastMonthStart || d > lastMonthEnd)) return;
        if (courierPeriod === "this_year" && (d < thisYearStart || d > thisYearEnd)) return;
        if (courierPeriod === "custom") {
          if (customStart && d < customStart) return;
          if (customEnd && d > customEnd) return;
        }
      }

      totalShipments++;

      const codAmt = parseFloat(sh.codAmount || o.dueAmount || (o.paymentMethod === 'COD' ? o.grandTotal : 0) || 0);
      totalCod += codAmt;

      const isDelivered = sh.status === "Delivered";
      const isReturned = sh.status === "Returned" || sh.status === "Cancelled";
      const isInTransit = !isDelivered && !isReturned;

      if (isDelivered) {
        deliveredCount++;
        collectedCod += codAmt;
      } else if (isReturned) {
        returnedCount++;
        returnedCod += codAmt;
      } else {
        inTransitCount++;
        pendingCod += codAmt;
      }

      if (sh.isStockRestored) restoredCount++;

      if (sh.courier === "PATHAO") {
        pathao.total++;
        pathao.totalCod += codAmt;
        if (isDelivered) {
          pathao.delivered++;
          pathao.collectedCod += codAmt;
        } else if (isReturned) {
          pathao.returned++;
        } else {
          pathao.inTransit++;
          pathao.pendingCod += codAmt;
        }
      } else {
        steadfast.total++;
        steadfast.totalCod += codAmt;
        if (isDelivered) {
          steadfast.delivered++;
          steadfast.collectedCod += codAmt;
        } else if (isReturned) {
          steadfast.returned++;
        } else {
          steadfast.inTransit++;
          steadfast.pendingCod += codAmt;
        }
      }
    });

    if (totalShipments === 0 && courierPeriod === "all" && dashboardData?.courierSummary?.totalShipments > 0) {
      const apiSummary = dashboardData.courierSummary;
      return {
        totalShipments: apiSummary.totalShipments || 0,
        inTransitCount: apiSummary.inTransitCount || 0,
        deliveredCount: apiSummary.deliveredCount || 0,
        returnedCount: apiSummary.returnedCount || 0,
        restoredCount: apiSummary.restoredCount || 0,
        financials: {
          totalCod: apiSummary.financials?.totalCod || 0,
          collectedCod: apiSummary.financials?.collectedCod || 0,
          pendingCod: apiSummary.financials?.pendingCod || 0,
          returnedCod: apiSummary.financials?.returnedCod || 0,
          collectionRate: apiSummary.financials?.collectionRate || 0,
        },
        steadfast: apiSummary.steadfast || steadfast,
        pathao: apiSummary.pathao || pathao,
      };
    }

    return {
      totalShipments,
      inTransitCount,
      deliveredCount,
      returnedCount,
      restoredCount,
      financials: {
        totalCod,
        collectedCod,
        pendingCod,
        returnedCod,
        collectionRate: totalCod > 0 ? Math.round((collectedCod / totalCod) * 100) : 0,
      },
      steadfast,
      pathao
    };
  }, [dashboardData, allOrders, courierPeriod, courierStartDate, courierEndDate]);

  // Prepare order status data for badges (must be before early returns)
  const orderStatusData = useMemo(() => {
    const liveCounts = {};
    if (allOrders?.length > 0) {
      allOrders.forEach(o => {
        const norm = normalizeOrderStatus(o.status || "Pending");
        liveCounts[norm] = (liveCounts[norm] || 0) + 1;
      });
    }
    const apiCounts = dashboardData?.orderStatusCounts || {};

    return Object.keys(ORDER_STATUS_CONFIG).map((key) => {
      const config = ORDER_STATUS_CONFIG[key];
      const count = allOrders?.length > 0
        ? (liveCounts[key] || 0)
        : (apiCounts[key] !== undefined ? apiCounts[key] : (liveCounts[key] || 0));
      return {
        key,
        name: config.label,
        icon: config.icon,
        bg: config.bg,
        color: config.chart,
        value: count
      };
    });
  }, [dashboardData?.orderStatusCounts, allOrders]);

  const isInitialLoading = (ordersLoading && (!allOrders || allOrders.length === 0)) && summaryLoading;

  const summary = useMemo(() => {
    const rawSummary = dashboardData?.summary || {};
    const totalOrdersCount = allOrders?.length || rawSummary.totalOrders || 0;
    const totalRev = (allOrders && allOrders.length > 0)
      ? allOrders.filter(o => isRevenueStatus(o.status)).reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0)
      : (rawSummary.totalRevenue || 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeCustSet = new Set(
      (allOrders || [])
        .filter(o => new Date(o.orderDate || o.createdAt) >= thirtyDaysAgo)
        .map(o => o.customer?.id || o.customerId)
        .filter(Boolean)
    );

    return {
      totalRevenue: totalRev,
      totalOrders: totalOrdersCount,
      totalProducts: products?.length || rawSummary.totalProducts || 0,
      totalCustomers: rawSummary.totalCustomers || activeCustSet.size || 0,
      totalBundles: rawSummary.totalBundles || 0,
      activeCustomers: activeCustSet.size || rawSummary.activeCustomers || 0,
      avgOrderValue: totalOrdersCount > 0 ? totalRev / totalOrdersCount : (rawSummary.avgOrderValue || 0),
      conversionRate: rawSummary.conversionRate || "0.0",
      orderGrowth: rawSummary.orderGrowth || "+0%",
      revenueGrowth: rawSummary.revenueGrowth || "+0%"
    };
  }, [dashboardData?.summary, allOrders, products]);

  const recentOrders = useMemo(() => {
    if (dashboardData?.recentOrders?.length) return dashboardData.recentOrders;
    if (allOrders?.length) {
      return allOrders.slice(0, 5).map(order => ({
        id: order.orderNumber || `#ORD-${order.id}`,
        customer: order.customer?.fullName || order.shippingAddress?.fullName || 'Guest Customer',
        product: order.orderItems?.[0]?.product?.productName || order.orderItems?.[0]?.productName || 'Multiple Items',
        amount: parseFloat(order.grandTotal) || 0,
        status: order.status || 'Pending',
        date: new Date(order.orderDate || order.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }));
    }
    return [];
  }, [dashboardData?.recentOrders, allOrders]);

  const topProducts = dashboardData?.topProducts || [];
  const orderStatusCounts = dashboardData?.orderStatusCounts || {};


  // Calculate active & inactive warranties
  const activeWarrantiesCount = warranties?.filter(w => w.status).length || 0;
  const inactiveWarrantiesCount = warranties?.filter(w => !w.status).length || 0;

  // Calculate active/inactive counts for categories, subcategories, brands, customers
  const activeMainCategoriesCount = mainCategories?.filter(c => c.status).length || 0;
  const inactiveMainCategoriesCount = mainCategories?.filter(c => !c.status).length || 0;

  const activeCategoriesCount = categories?.filter(c => c.status).length || 0;
  const inactiveCategoriesCount = categories?.filter(c => !c.status).length || 0;

  const activeSubCategoriesCount = subCategories?.filter(c => c.status).length || 0;
  const inactiveSubCategoriesCount = subCategories?.filter(c => !c.status).length || 0;

  const activeBrandsCount = brands?.filter(b => b.status).length || 0;
  const inactiveBrandsCount = brands?.filter(b => !b.status).length || 0;

  const activeCustomersCount = summary?.activeCustomers || 0;
  const inactiveCustomersCount = Math.max(0, (summary?.totalCustomers || 0) - activeCustomersCount);

  // Calculate low stock products
  const lowStockCount = products?.filter(product => {
    if (product.productType === "variant") {
      const totalStock = product.productVariants?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0;
      return totalStock > 0 && totalStock <= 10;
    } else {
      const stock = product.quantity || 0;
      return stock > 0 && stock <= (product.quantityAlert || 10);
    }
  }).length || 0;

  const totalRevenueValue = (allOrders && allOrders.length > 0)
    ? allOrders.filter(o => isRevenueStatus(o.status)).reduce((sum, o) => sum + (parseFloat(o.grandTotal) || 0), 0)
    : (summary?.totalRevenue || 0);

  // Calculate published & unpublished products count
  const publishedProductsCount = products?.filter(p => p.visibility === "public" || !p.visibility).length || 0;
  const unpublishedProductsCount = products?.filter(p => p.visibility === "unpublish").length || 0;
  const totalProductsCount = products?.length || summary?.totalProducts || 0;

  // Create stats array from summary data
  const stats = [
    // {
    //   title: "Total Revenue",
    //   value: `৳ ${totalRevenueValue.toLocaleString()}`,
    //   change: summary.revenueGrowth,
    //   trend: summary.revenueGrowth.startsWith('+') ? "up" : "down",
    //   icon: DollarSign,
    //   bgColor: "bg-slate-100 text-slate-700",
    //   description: `Avg: ৳ ${summary.avgOrderValue.toFixed(0)} / order`,
    //   link: "/online-order",
    // },
    {
      title: "Total Orders",
      value: (summary.totalOrders ?? allOrders?.length ?? 0).toString(),
      change: summary.orderGrowth || "+0%",
      trend: summary.orderGrowth?.startsWith('+') ? "up" : "down",
      icon: ShoppingCart,
      bgColor: "bg-indigo-50 text-indigo-600",
      description: `Active volume log`,
      link: "/online-order",
    },
    {
      title: "Total Products",
      value: `${publishedProductsCount}`,
      change: null,
      trend: "stable",
      icon: Package,
      bgColor: "bg-sky-50 text-sky-600",
      // description: `${summary.totalBundles} active bundles`,
      description: `${unpublishedProductsCount} Unpublished`,
      link: "/products",
    },
    {
      title: "Total Customers",
      value: `${activeCustomersCount}`,
      change: "+0%",
      trend: "stable",
      icon: Users,
      bgColor: "bg-emerald-50 text-emerald-600",
      description: `${inactiveCustomersCount} Inactive`,
      link: "/customers",
    },
    {
      title: "Total Main Category",
      value: `${activeMainCategoriesCount}`,
      change: null,
      trend: "stable",
      icon: Layers3,
      bgColor: "bg-rose-50 text-rose-600",
      description: `${inactiveMainCategoriesCount} Inactive`,
      link: "/main-category",
    },
    {
      title: "Category",
      value: `${activeCategoriesCount}`,
      change: null,
      trend: "stable",
      icon: ListTree,
      bgColor: "bg-amber-50 text-amber-600",
      description: `${inactiveCategoriesCount} Inactive`,
      link: "/category",
    },
    {
      title: "Sub Category",
      value: `${activeSubCategoriesCount}`,
      change: null,
      trend: "stable",
      icon: GitBranch,
      bgColor: "bg-yellow-50 text-yellow-600",
      description: `${inactiveSubCategoriesCount} Inactive`,
      link: "/sub-category",
    },
    {
      title: "Brands",
      value: `${activeBrandsCount || brands?.length || 0}`,
      change: null,
      trend: "stable",
      icon: Award,
      bgColor: "bg-purple-50 text-purple-600",
      description: `${inactiveBrandsCount} Inactive`,
      link: "/brands",
    },
    {
      title: "Active Warranties",
      value: `${activeWarrantiesCount}`,
      change: null,
      trend: "stable",
      icon: ShieldCheck,
      bgColor: "bg-teal-50 text-teal-600",
      description: `${inactiveWarrantiesCount} Inactive`,
      link: "/warranties",
    },
    {
      title: "Low Stock Products",
      value: lowStockCount.toString(),
      change: null,
      trend: "stable",
      icon: AlertTriangle,
      bgColor: "bg-red-50 text-red-600",
      description: "Products running out of stock",
      link: "/manage-stock",
    },
    {
      title: "Admin Users",
      value: (adminUsers?.length || 0).toString(),
      change: null,
      trend: "stable",
      icon: UserCheck,
      bgColor: "bg-blue-50 text-blue-600",
      description: "System managers & staff",
      link: "/admin-management",
    },
  ];

  if (isInitialLoading) return <LoadingSpinner />;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 text-slate-800">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-800 font-philosopher">Admin Dashboard</h1>
              <p className="text-sm text-slate-500 mt-1">Overview of orders, sales performance, and operations.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Live Sync
              </span>
            </div>
          </div>

          {/* Sales Performance Header & Excluded Orders Info */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Sales Performance</h3>
              <div className="relative group">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-800 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>{excludedStats.count} Excluded / Missed</span>
                </button>

                {/* Excluded Orders Info Card / Popover */}
                <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 p-4 bg-slate-900/95 backdrop-blur-md text-white text-xs rounded-2xl shadow-xl ring-1 ring-white/10 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-700/80">
                    <span className="font-bold text-slate-100 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      Uncalculated / Excluded Orders
                    </span>
                    <span className="font-bold text-amber-300">৳{excludedStats.val.toLocaleString()}</span>
                  </div>

                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                    These orders are excluded from active sales performance metrics and revenue calculations:
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                    <div className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400">Cancelled:</span>
                      <span className="font-bold text-rose-300">{excludedStats.breakdown.Cancelled.count} (৳{excludedStats.breakdown.Cancelled.val.toLocaleString()})</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400">Returned:</span>
                      <span className="font-bold text-rose-300">{excludedStats.breakdown.Returned.count} (৳{excludedStats.breakdown.Returned.val.toLocaleString()})</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400">Missing:</span>
                      <span className="font-bold text-pink-300">{excludedStats.breakdown.Missing.count} (৳{excludedStats.breakdown.Missing.val.toLocaleString()})</span>
                    </div>
                    <div className="flex justify-between items-center bg-slate-800/80 px-2.5 py-1.5 rounded-lg border border-slate-700/50">
                      <span className="text-slate-400">Lost / Trash / Fake:</span>
                      <span className="font-bold text-slate-300">
                        {excludedStats.breakdown.Lost.count + excludedStats.breakdown.Trash.count + excludedStats.breakdown.Fake.count}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                    <p><span className="text-emerald-400 font-semibold">✓ Sales Cards:</span> Pending, Confirmed, Processing, Hold, Ready To Ship, In-Courier, Shipped, Ship Later, Pre-order & Delivered.</p>
                    <p><span className="text-indigo-400 font-semibold">✓ Total Revenue:</span> Delivered orders only.</p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Active Pipeline Orders · Revenue based on Delivered
            </p>
          </div>

          {/* Sales Performance Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Today Orders */}
            <div className="rounded-2xl p-5 border border-blue-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-blue-100/90 via-blue-50/50 to-blue-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{orderStats.today.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-blue-600 rounded-full shadow-xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Today Orders</p>
                <span className="text-[10px] text-blue-700 font-bold block mt-1">{orderStats.today.count} Order(s)</span>
              </div>
            </div>

            {/* Yesterday Orders */}
            <div className="rounded-2xl p-5 border border-emerald-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-emerald-100/90 via-emerald-50/50 to-emerald-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{orderStats.yesterday.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-emerald-600 rounded-full shadow-xs">
                  <RotateCcw className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Yesterday Orders</p>
                <span className="text-[10px] text-emerald-700 font-bold block mt-1">{orderStats.yesterday.count} Order(s)</span>
              </div>
            </div>

            {/* This Month */}
            <div className="rounded-2xl p-5 border border-rose-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-rose-100/90 via-rose-50/50 to-purple-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{orderStats.thisMonth.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-rose-600 rounded-full shadow-xs">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">This Month</p>
                <span className="text-[10px] text-rose-700 font-bold block mt-1">{orderStats.thisMonth.count} Order(s)</span>
              </div>
            </div>

            {/* Last Month */}
            <div className="rounded-2xl p-5 border border-cyan-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-cyan-100/90 via-cyan-50/50 to-teal-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{orderStats.lastMonth.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-cyan-600 rounded-full shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Last Month</p>
                <span className="text-[10px] text-cyan-700 font-bold block mt-1">{orderStats.lastMonth.count} Order(s)</span>
              </div>
            </div>

            {/* All-Time Sales */}
            <div className="rounded-2xl p-5 border border-purple-200/50 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-purple-100/90 via-purple-50/50 to-pink-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{orderStats.allTime.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-purple-600 rounded-full shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">All-Time Sales</p>
                <span className="text-[10px] text-purple-700 font-bold block mt-1">{orderStats.allTime.count} Order(s)</span>
              </div>
            </div>
          </div>

          {/* Delivered Revenue KPI Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase">Delivered Revenue Overview</h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                Delivered Orders Only
              </span>
            </div>
            <Link
              href="/accounting"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              Accounting Details <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Delivered Revenue KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* This Week Revenue */}
            <div className="rounded-2xl p-5 border border-emerald-200/60 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-emerald-100/90 via-emerald-50/50 to-teal-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{revenueStats.thisWeek.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-emerald-600 rounded-full shadow-xs">
                  <CalendarClock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">This Week Revenue</p>
                <span className="text-[10px] text-emerald-700 font-bold block mt-1">{revenueStats.thisWeek.count} Delivered Order(s)</span>
              </div>
            </div>

            {/* This Month Revenue */}
            <div className="rounded-2xl p-5 border border-teal-200/60 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-teal-100/90 via-teal-50/50 to-cyan-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{revenueStats.thisMonth.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-teal-600 rounded-full shadow-xs">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">This Month Revenue</p>
                <span className="text-[10px] text-teal-700 font-bold block mt-1">{revenueStats.thisMonth.count} Delivered Order(s)</span>
              </div>
            </div>

            {/* Last Month Revenue */}
            <div className="rounded-2xl p-5 border border-sky-200/60 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-sky-100/90 via-sky-50/50 to-blue-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{revenueStats.lastMonth.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-sky-600 rounded-full shadow-xs">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Last Month Revenue</p>
                <span className="text-[10px] text-sky-700 font-bold block mt-1">{revenueStats.lastMonth.count} Delivered Order(s)</span>
              </div>
            </div>

            {/* This Year Revenue */}
            <div className="rounded-2xl p-5 border border-indigo-200/60 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-indigo-100/90 via-indigo-50/50 to-purple-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{revenueStats.thisYear.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-indigo-600 rounded-full shadow-xs">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">This Year Revenue</p>
                <span className="text-[10px] text-indigo-700 font-bold block mt-1">{revenueStats.thisYear.count} Delivered Order(s)</span>
              </div>
            </div>

            {/* All-Time Revenue */}
            <div className="rounded-2xl p-5 border border-amber-200/60 shadow-sm flex flex-col justify-between bg-gradient-to-tr from-amber-100/90 via-emerald-50/50 to-emerald-200/60 transition-all hover:shadow-md h-[135px]">
              <div className="flex items-center justify-between">
                <h4 className="text-xl font-bold text-slate-800">৳{revenueStats.allTime.val.toLocaleString()}</h4>
                <div className="p-2 bg-white/90 text-amber-600 rounded-full shadow-xs">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">All-Time Revenue</p>
                <span className="text-[10px] text-emerald-700 font-bold block mt-1">{revenueStats.allTime.count} Delivered Order(s)</span>
              </div>
            </div>
          </div>

          {/* Metric Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={index}
                  href={stat.link}
                  className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 hover:shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2.5 rounded-lg ${stat.bgColor}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      {stat.change !== null && (
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-md ${stat.trend === "up"
                            ? "text-emerald-700 bg-emerald-50"
                            : stat.trend === "down"
                              ? "text-rose-700 bg-rose-50"
                              : "text-slate-600 bg-slate-100"
                            }`}
                        >
                          {stat.trend === "up" && <ArrowUpRight className="w-3.5 h-3.5" />}
                          {stat.trend === "down" && <ArrowDownRight className="w-3.5 h-3.5" />}
                          {stat.change}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider group-hover:text-slate-700 transition-colors">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 font-normal">{stat.description}</p>
                </Link>
              );
            })}
          </div>

          {/* Order Status Badges Bar */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Status Overview</h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                </span>
              </div>
              <Link href="/online-order" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Manage Orders <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {orderStatusData.map((status, index) => {
                const StatusIcon = status.icon;
                return (
                  <Link
                    key={index}
                    href={`/online-order?status=${status.key}`}
                    className="bg-white rounded-xl p-3 border border-slate-200/80 flex items-center gap-3 shadow-2xs hover:border-slate-300 hover:shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
                    title={`Click to filter orders by ${status.name}`}
                  >
                    <div className={`p-2 rounded-lg ring-1 ring-inset ${status.bg} group-hover:scale-105 transition-transform flex-shrink-0`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-slate-500 truncate group-hover:text-slate-800 transition-colors">{status.name}</p>
                      <p className="text-lg font-bold text-slate-900 leading-none mt-0.5">{status.value}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Courier Operations & Financial Summary */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
            {/* Section Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Courier Financial & Logistics Summary</h3>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Tracking & Cash Flow
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Cash on Delivery (COD) cash flow, receivables, realization rates, and courier dispatches
                </p>
              </div>

              {/* Direct Links to Courier Pages */}
              <div className="flex items-center gap-2">
                <Link
                  href="/steadfast"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Steadfast Portal</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
                <Link
                  href="/pathao"
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Pathao Portal</span>
                  <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            {/* Courier Date Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 text-slate-500 mr-1 text-xs font-semibold">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Period:</span>
                </div>
                {[
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "this_week", label: "This Week" },
                  { id: "last_7_days", label: "Last 7 Days" },
                  { id: "this_month", label: "This Month" },
                  { id: "last_month", label: "Last Month" },
                  { id: "this_year", label: "This Year" },
                ].map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setCourierPeriod(p.id);
                      setCourierStartDate("");
                      setCourierEndDate("");
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                      courierPeriod === p.id && !courierStartDate && !courierEndDate
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range Picker */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                  <span className="text-xs text-slate-500 font-medium">Custom:</span>
                  <input
                    type="date"
                    value={courierStartDate}
                    onChange={(e) => {
                      setCourierStartDate(e.target.value);
                      setCourierPeriod("custom");
                    }}
                    className="text-xs text-slate-700 bg-transparent border-none outline-none cursor-pointer"
                    placeholder="Start date"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="date"
                    value={courierEndDate}
                    onChange={(e) => {
                      setCourierEndDate(e.target.value);
                      setCourierPeriod("custom");
                    }}
                    className="text-xs text-slate-700 bg-transparent border-none outline-none cursor-pointer"
                    placeholder="End date"
                  />
                </div>

                {(courierPeriod !== "all" || courierStartDate || courierEndDate) && (
                  <button
                    onClick={() => {
                      setCourierPeriod("all");
                      setCourierStartDate("");
                      setCourierEndDate("");
                    }}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs transition-colors cursor-pointer"
                    title="Reset date filter"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Courier Financial KPI Cards */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Courier Financial Performance (COD)</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Total Booked Courier COD */}
                <div className="rounded-xl p-4 border border-indigo-200/70 bg-gradient-to-tr from-indigo-50/70 to-blue-50/30 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Total Booked COD</span>
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-2xl font-bold text-slate-900">
                      ৳{Number(courierStats.financials.totalCod || 0).toLocaleString()}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Across {courierStats.totalShipments} total dispatched parcel(s)
                    </p>
                  </div>
                </div>

                {/* KPI 2: Collected / Realized COD */}
                <div className="rounded-xl p-4 border border-emerald-200/70 bg-gradient-to-tr from-emerald-50/70 to-teal-50/30 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Collected / Realized COD</span>
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-emerald-700">
                        ৳{Number(courierStats.financials.collectedCod || 0).toLocaleString()}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {courierStats.financials.collectionRate}% Realized
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {courierStats.deliveredCount} parcel(s) successfully delivered
                    </p>
                  </div>
                </div>

                {/* KPI 3: In-Transit / Pending COD */}
                <div className="rounded-xl p-4 border border-amber-200/70 bg-gradient-to-tr from-amber-50/70 to-orange-50/30 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Pending / In-Transit COD</span>
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-amber-700">
                        ৳{Number(courierStats.financials.pendingCod || 0).toLocaleString()}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                        {courierStats.inTransitCount} In Transit
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Cash receivable currently with courier riders
                    </p>
                  </div>
                </div>

                {/* KPI 4: Returned COD (Stock Restored) */}
                <div className="rounded-xl p-4 border border-rose-200/70 bg-gradient-to-tr from-rose-50/70 to-pink-50/30 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600">Returned COD Value</span>
                    <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-rose-700">
                        ৳{Number(courierStats.financials.returnedCod || 0).toLocaleString()}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                        {courierStats.restoredCount} Restocked
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Uncollected cash; inventory returned to stock
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courier Operational & Financial Breakdown */}
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Courier Breakdown & Cash Flow</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: All Couriers Overview */}
                <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">All Couriers</span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                        {courierStats.totalShipments} Parcels
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center my-2">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                        <p className="text-[10px] text-slate-500 font-medium">In Transit</p>
                        <p className="text-base font-bold text-blue-600 mt-0.5">{courierStats.inTransitCount}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                        <p className="text-[10px] text-slate-500 font-medium">Delivered</p>
                        <p className="text-base font-bold text-emerald-600 mt-0.5">{courierStats.deliveredCount}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-2xs">
                        <p className="text-[10px] text-slate-500 font-medium">Returns</p>
                        <p className="text-base font-bold text-rose-600 mt-0.5">{courierStats.returnedCount}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 pt-3 border-t border-slate-200/60 mt-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Total Booked COD:</span>
                      <strong className="text-slate-800">৳{Number(courierStats.financials.totalCod || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-medium">
                      <span>Realized COD:</span>
                      <strong>৳{Number(courierStats.financials.collectedCod || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between text-amber-700 font-medium">
                      <span>Receivable COD:</span>
                      <strong>৳{Number(courierStats.financials.pendingCod || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Card 2: Steadfast Courier */}
                <div className="bg-emerald-50/40 rounded-xl p-4 border border-emerald-200/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center">
                          <Truck className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-bold text-emerald-900">Steadfast Courier</span>
                      </div>
                      <Link
                        href="/steadfast"
                        className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5"
                      >
                        View Portal <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center my-2">
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                        <p className="text-[10px] text-slate-500 font-medium">In Transit</p>
                        <p className="text-base font-bold text-blue-600 mt-0.5">{courierStats.steadfast.inTransit}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                        <p className="text-[10px] text-slate-500 font-medium">Delivered</p>
                        <p className="text-base font-bold text-emerald-600 mt-0.5">{courierStats.steadfast.delivered}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-emerald-100 shadow-2xs">
                        <p className="text-[10px] text-slate-500 font-medium">Returned</p>
                        <p className="text-base font-bold text-rose-600 mt-0.5">{courierStats.steadfast.returned}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 pt-3 border-t border-emerald-200/50 mt-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Total Booked COD:</span>
                      <strong className="text-slate-800">৳{Number(courierStats.steadfast.totalCod || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-medium">
                      <span>Realized COD:</span>
                      <strong>৳{Number(courierStats.steadfast.collectedCod || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between text-amber-700 font-medium">
                      <span>Receivable COD:</span>
                      <strong>৳{Number(courierStats.steadfast.pendingCod || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                {/* Card 3: Pathao Courier */}
                <div className="bg-rose-50/40 rounded-xl p-4 border border-rose-200/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-rose-600 text-white flex items-center justify-center">
                          <Send className="w-3 h-3" />
                        </div>
                        <span className="text-xs font-bold text-rose-900">Pathao Courier</span>
                      </div>
                      <Link
                        href="/pathao"
                        className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-0.5"
                      >
                        View Portal <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center my-2">
                      <div className="bg-white p-2.5 rounded-lg border border-rose-100 shadow-2xs">
                        <p className="text-[10px] text-slate-500 font-medium">In Transit</p>
                        <p className="text-base font-bold text-blue-600 mt-0.5">{courierStats.pathao.inTransit}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-rose-100 shadow-2xs">
                        <p className="text-[10px] text-slate-500 font-medium">Delivered</p>
                        <p className="text-base font-bold text-emerald-600 mt-0.5">{courierStats.pathao.delivered}</p>
                      </div>
                      <div className="bg-white p-2.5 rounded-lg border border-rose-100 shadow-2xs">
                        <p className="text-[10px] text-slate-500 font-medium">Returned</p>
                        <p className="text-base font-bold text-rose-600 mt-0.5">{courierStats.pathao.returned}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 pt-3 border-t border-rose-200/50 mt-2 text-xs">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Total Booked COD:</span>
                      <strong className="text-slate-800">৳{Number(courierStats.pathao.totalCod || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-medium">
                      <span>Realized COD:</span>
                      <strong>৳{Number(courierStats.pathao.collectedCod || 0).toLocaleString()}</strong>
                    </div>
                    <div className="flex items-center justify-between text-amber-700 font-medium">
                      <span>Receivable COD:</span>
                      <strong>৳{Number(courierStats.pathao.pendingCod || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Core Analytics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Order Status Stacked Bar */}
            <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">Order Trends</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monthly breakdown by order state ({orderTrendsSummary.deliveryRate}% Delivered)
                    </p>
                  </div>
                  <select
                    value={orderTrendsMonths}
                    onChange={(e) => setOrderTrendsMonths(parseInt(e.target.value))}
                    className="text-xs font-semibold px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                  >
                    <option value={3}>Last 3 Months</option>
                    <option value={6}>Last 6 Months</option>
                    <option value={12}>Last 12 Months</option>
                  </select>
                </div>

                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={orderTrendsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} fontSize={12} />
                    <YAxis stroke="#94a3b8" tickLine={false} fontSize={12} />
                    <Tooltip
                      cursor={{ fill: "rgba(241, 245, 249, 0.4)", radius: 4 }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
                          const activeEntries = payload.filter(entry => Number(entry.value) > 0);
                          return (
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-xl text-xs text-white min-w-[190px]">
                              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                                <span className="font-bold text-slate-100">{label}</span>
                                <span className="text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-800/60 px-1.5 py-0.5 rounded text-[11px]">{total} Orders</span>
                              </div>
                              {activeEntries.length > 0 ? (
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {activeEntries.map((entry, idx) => (
                                    <div key={idx} className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.fill }} />
                                        <span className="text-slate-300 font-medium truncate">{entry.name || entry.dataKey}:</span>
                                      </div>
                                      <span className="font-bold text-slate-100">{entry.value}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-slate-400 text-[11px]">No orders recorded</p>
                              )}
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="Delivered" name="Delivered" stackId="a" fill={ORDER_STATUS_CONFIG.Delivered.chart} />
                    <Bar dataKey="InCourier" name="In-Courier" stackId="a" fill={ORDER_STATUS_CONFIG.InCourier.chart} />
                    <Bar dataKey="ReadyToShip" name="Ready To Ship" stackId="a" fill={ORDER_STATUS_CONFIG.ReadyToShip.chart} />
                    <Bar dataKey="Shipped" name="Shipped" stackId="a" fill={ORDER_STATUS_CONFIG.Shipped.chart} />
                    <Bar dataKey="Processing" name="Processing" stackId="a" fill={ORDER_STATUS_CONFIG.Processing.chart} />
                    <Bar dataKey="Confirmed" name="Confirmed" stackId="a" fill={ORDER_STATUS_CONFIG.Confirmed.chart} />
                    <Bar dataKey="Pending" name="Pending" stackId="a" fill={ORDER_STATUS_CONFIG.Pending.chart} />
                    <Bar dataKey="PreOrder" name="Pre-order" stackId="a" fill={ORDER_STATUS_CONFIG.PreOrder.chart} />
                    <Bar dataKey="ShipLater" name="Ship Later" stackId="a" fill={ORDER_STATUS_CONFIG.ShipLater.chart} />
                    <Bar dataKey="Hold" name="Hold" stackId="a" fill={ORDER_STATUS_CONFIG.Hold.chart} />
                    <Bar dataKey="Returned" name="Returned" stackId="a" fill={ORDER_STATUS_CONFIG.Returned.chart} />
                    <Bar dataKey="Missing" name="Missing" stackId="a" fill={ORDER_STATUS_CONFIG.Missing.chart} />
                    <Bar dataKey="Lost" name="Lost" stackId="a" fill={ORDER_STATUS_CONFIG.Lost.chart} />
                    <Bar dataKey="Fake" name="Fake" stackId="a" fill={ORDER_STATUS_CONFIG.Fake.chart} />
                    <Bar dataKey="Trash" name="Trash" stackId="a" fill={ORDER_STATUS_CONFIG.Trash.chart} />
                    <Bar dataKey="Cancelled" name="Cancelled" stackId="a" fill={ORDER_STATUS_CONFIG.Cancelled.chart} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-slate-100">
                {Object.entries(ORDER_STATUS_CONFIG)
                  .map(([statusKey, cfg]) => {
                    const countInPeriod = (orderTrendsData || []).reduce((sum, m) => sum + (Number(m[statusKey]) || 0), 0);
                    return { statusKey, cfg, countInPeriod };
                  })
                  .filter(item => item.countInPeriod > 0)
                  .map(({ statusKey, cfg, countInPeriod }) => (
                    <Link
                      key={statusKey}
                      href={`/online-order?status=${statusKey}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200/80 text-[11px] text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors shadow-2xs"
                      title={`Filter ${cfg.label} orders`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cfg.chart }} />
                      <span className="font-medium">{cfg.label}</span>
                      <span className="text-[10px] font-bold text-slate-700 bg-white px-1.5 py-0.2 rounded border border-slate-200/60">
                        {countInPeriod}
                      </span>
                    </Link>
                  ))}
              </div>
            </div>

            {/* Revenue Trend Area Chart */}
            <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Revenue Stream</h3>
                  <p className="text-xs text-slate-500">Gross income trajectory analysis</p>
                </div>
                <select
                  value={revenueTrendPeriod}
                  onChange={(e) => setRevenueTrendPeriod(e.target.value)}
                  className="text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="monthly">Monthly View</option>
                  <option value="daily30">Daily (Last 30 Days)</option>
                  <option value="daily7">Daily (Last 7 Days)</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} fontSize={12} />
                  <YAxis stroke="#94a3b8" tickLine={false} fontSize={12} formatter={(val) => `৳${val.toLocaleString()}`} />
                  <Tooltip
                    formatter={(val) => [`৳ ${val.toLocaleString()}`, "Gross Revenue"]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-600">
                <span>Total Accumulated: <strong className="text-slate-900">৳{totalRevenueValue.toLocaleString()}</strong></span>
                <span className="text-indigo-600 font-medium">Updated live</span>
              </div>
            </div>
          </div>

          {/* Dashboard Timeline Analytics: Orders by Hour & City Contributions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Orders by Hour</h3>
                  <p className="text-xs text-slate-500">Order traffic peak time analysis throughout the day</p>
                </div>
                <select
                  value={ordersByHourPeriod}
                  onChange={(e) => setOrdersByHourPeriod(e.target.value)}
                  className="text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="all">All-Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="weekly">Last 7 Days</option>
                  <option value="monthly">Last 30 Days</option>
                </select>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={ordersByHour} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorHour" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="hour" stroke="#94a3b8" tickLine={false} fontSize={11} interval={1} />
                  <YAxis stroke="#94a3b8" tickLine={false} fontSize={11} allowDecimals={false} />
                  <Tooltip
                    formatter={(val) => [`${val} orders`, "Orders Placed"]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#1e293b",
                      borderRadius: "8px",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#colorHour)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900">City Contributions</h3>
                  <select
                    value={cityPeriod}
                    onChange={(e) => setCityPeriod(e.target.value)}
                    className="text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="all">All-Time</option>
                    <option value="thismonth">This Month</option>
                    <option value="lastmonth">Last Month</option>
                  </select>
                </div>
                <div className="space-y-4">
                  {revenueByCity.map((city, idx) => {
                    const percent = totalCityRevenue > 0 ? ((city.value / totalCityRevenue) * 100).toFixed(0) : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{city.name}</span>
                          <span>৳{city.value.toLocaleString()} ({percent}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 mt-4 pt-4 border-t border-slate-100">
                Shows top performing delivery locations.
              </div>
            </div>
          </div>

          {/* Distribution & Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Status Distribution Pie */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-slate-900">Order Ratio Distribution</h3>
                <select
                  value={ratioPeriod}
                  onChange={(e) => setRatioPeriod(e.target.value)}
                  className="text-xs font-semibold px-2 py-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="all">All-Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="weekly">Last 7 Days</option>
                  <option value="monthly">Last 30 Days</option>
                </select>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="w-52 h-52 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [`${value}% (${props.payload.count})`, name]}
                        contentStyle={{ backgroundColor: "#0f172a", borderRadius: "6px", color: "#fff", fontSize: "12px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {categoryData.map((cat, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200/60 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="text-xs font-medium text-slate-700">{cat.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-slate-900">{cat.value}%</span>
                        <p className="text-[10px] text-slate-400">{cat.count} orders</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="bg-white rounded-xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Key Statistics</h3>
                <select
                  value={statsPeriod}
                  onChange={(e) => setStatsPeriod(e.target.value)}
                  className="text-xs font-semibold px-2 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="all">All-Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="weekly">Last 7 Days</option>
                  <option value="monthly">Last 30 Days</option>
                </select>
              </div>
              <div className="space-y-3">
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Avg. Order Value</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">৳{filteredStats.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <ShoppingCart className="w-5 h-5 text-slate-400" />
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Active Customers</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{filteredStats.activeCustomers}</p>
                  </div>
                  <Users className="w-5 h-5 text-slate-400" />
                </div>
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Conversion Rate</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{filteredStats.conversionRate}%</p>
                  </div>
                  <TrendingUp className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Tables: Recent Orders & Top Selling Products */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12">
            {/* Recent Orders Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Recent Transactions</h3>
                  <p className="text-xs text-slate-500">Latest customer orders processed</p>
                </div>
                <Link href="/online-order" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                  View All &rarr;
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                      <th className="p-3.5 pl-5">Order ID</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 pr-5 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {recentOrders.map((order, i) => {
                      const details = getStatusDetails(order.status);
                      return (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 pl-5 font-semibold text-slate-900">{order.id}</td>
                          <td className="p-3.5">{order.customer}</td>
                          <td className="p-3.5 font-medium">৳{order.amount.toFixed(2)}</td>
                          <td className="p-3.5">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${details.bg}`}>
                              {details.label}
                            </span>
                          </td>
                          <td className="p-3.5 pr-5 text-right text-slate-400">{order.date}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Performing Products */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Top Products</h3>
                    <p className="text-xs text-slate-500">Highest grossing items</p>
                  </div>
                  <select
                    value={topProductsPeriod}
                    onChange={(e) => setTopProductsPeriod(e.target.value)}
                    className="text-xs font-semibold px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                  >
                    <option value="all">All-Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="weekly">Last 7 Days</option>
                    <option value="monthly">Last 30 Days</option>
                  </select>
                </div>
                <div className="space-y-2.5">
                  {filteredTopProducts.length > 0 ? (
                    filteredTopProducts.map((prod, i) => (
                      <div key={i} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                            i === 0 ? "bg-amber-100 text-amber-800" :
                            i === 1 ? "bg-slate-200 text-slate-700" :
                            i === 2 ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            "bg-slate-100 text-slate-500"
                          }`}>
                            {i + 1}
                          </span>

                          <div className="w-9 h-9 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {prod.thumbnail ? (
                              <img src={prod.thumbnail} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-4 h-4 text-slate-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-slate-800 truncate" title={prod.name}>
                              {prod.name}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{prod.sales} Sold</p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <span className="text-xs font-bold text-slate-900 block">
                            ৳{Number(prod.revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">No product sales in this period</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}