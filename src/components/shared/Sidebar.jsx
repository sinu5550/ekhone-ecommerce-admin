"use client";

import {
  Activity,
  Award,
  BadgePercent,
  BaggageClaim,
  BarChart3,
  Boxes,
  Briefcase,
  ChartColumn,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  GitBranch,
  Key,
  Landmark,
  Layers,
  Layers3,
  LayoutDashboard,
  LayoutTemplate,
  ListTree,
  ListTreeIcon,
  MailQuestion,
  Package,
  PenLine,
  Phone,
  PlusSquare,
  Receipt,
  RefreshCcw,
  Ruler,
  Scale,
  Scissors,
  Settings,
  Settings2,
  Shield,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Store,
  TrendingUp,
  Truck,
  User,
  Users,
  UsersRound,
  Calendar,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";
import brandLogo from "../../../public/ekhone.png";
import "./style.css";

const NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    category: "main"
  },
  {
    id: "products",
    name: "Products",
    icon: Package,
    category: "management",
    subItems: [
      { name: "All Products", href: "/products", icon: Package },
      { name: "Create Product", href: "/create-product", icon: PlusSquare },
    ]
  },
  {
    id: "categories",
    name: "Categories",
    icon: Layers3,
    category: "management",
    subItems: [
      { name: "Main Category", href: "/main-category", icon: Layers3 },
      { name: "Category", href: "/category", icon: ListTree },
      { name: "Sub Category", href: "/sub-category", icon: GitBranch },
    ]
  },
  {
    id: "collections",
    name: "Collections",
    href: "/collections",
    icon: Sparkles,
    category: "management"
  },
  {
    id: "brands",
    name: "Brands",
    href: "/brands",
    icon: Award,
    category: "management"
  },
  {
    id: "units",
    name: "Units",
    href: "/unit",
    icon: Ruler,
    category: "management"
  },
  {
    id: "variants",
    name: "Variant Attributes",
    href: "/variant-attributes",
    icon: Settings2,
    category: "management"
  },
  {
    id: "warranties",
    name: "Warranties",
    href: "/warranties",
    icon: ShieldCheck,
    category: "management"
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: Boxes,
    category: "inventory",
    subItems: [
      { name: "Manage Stock", href: "/manage-stock", icon: Boxes },
      { name: "Stock Adjustment", href: "/stock-adjustment", icon: RefreshCcw },
    ]
  },
  {
    id: "sales",
    name: "Sales",
    icon: ShoppingCart,
    category: "sales",
    subItems: [
      { name: "Online Orders", href: "/online-order", icon: ShoppingCart },
      // { name: "POS System", href: "/pos", icon: Store },
      { name: "Invoices", href: "/invoice", icon: FileSpreadsheet },
    ]
  },
  {
    id: "accounting",
    name: "Accounting",
    icon: Landmark,
    category: "accounting",
    subItems: [
      { name: "Accounting Dashboard", href: "/accounting", icon: LayoutDashboard },
      { name: "Account Heads", href: "/accounting/heads", icon: ListTree },
      { name: "Income & Expense", href: "/accounting/transactions", icon: Receipt },
      { name: "Head-wise Expenses", href: "/accounting/head-wise-expenses", icon: BarChart3 },
      { name: "Sales & Collection", href: "/accounting/sales-collection", icon: FileSpreadsheet },
      { name: "Profit & Loss (P&L)", href: "/accounting/profit-and-loss", icon: Scale },
      { name: "Product-wise Sales", href: "/accounting/product-sales", icon: Package },
      { name: "Date-wise Report", href: "/accounting/date-wise-report", icon: Calendar },
      { name: "Courier-wise Sales", href: "/accounting/courier-report", icon: Truck },
    ]
  },
  {
    id: "courier",
    name: "Courier",
    icon: BaggageClaim,
    category: "management",
    subItems: [
      { name: "SteadFast", href: "/steadfast", icon: Truck },
      { name: "Pathao", href: "/pathao", icon: Truck },
    ]
  },
  {
    id: "marketing",
    name: "Marketing",
    icon: BadgePercent,
    category: "marketing",
    subItems: [
      // { name: "Coupons", href: "/coupon", icon: BadgePercent },
      { name: "Discounts", href: "/discount", icon: Scissors },
      // { name: "Bundles", href: "/bundle-product", icon: Layers },
    ]
  },
  {
    id: "landing-page",
    name: "Build Landing Page",
    icon: LayoutTemplate,
    category: "marketing",
    subItems: [
      { name: "All Landing Pages", href: "/landing-pages", icon: LayoutTemplate },
      { name: "Create Landing Page", href: "/landing-pages/create", icon: PlusSquare },
    ]
  },
  {
    id: "customers",
    name: "Customers",
    href: "/customers",
    icon: Users,
    category: "people"
  },
  {
    id: "cms",
    name: "CMS",
    icon: FileText,
    category: "content",
    subItems: [
      { name: "Hero Section", href: "/hero", icon: FileText },
      { name: "Landing Page", href: "/landing-page", icon: LayoutDashboard },
      // { name: "About Us", href: "/about-us", icon: Users },
      // { name: "Blogs", href: "/blogs", icon: PenLine },
      // { name: "Our Clients", href: "/our-client", icon: Briefcase },
      { name: "Testimonials", href: "/testimonials", icon: UsersRound },
      { name: "Our Stores", href: "/our-store", icon: Store },
      { name: "Contact", href: "/contact", icon: Phone },
      { name: "Enquiries", href: "/enquiry-us", icon: MailQuestion },
    ]
  },
  {
    id: "acl",
    name: "Access Control",
    icon: Shield,
    category: "admin",
    subItems: [
      { name: "All Users", href: "/admin-management", icon: User },
      { name: "Role Manage", href: "/role-management", icon: Shield },
      { name: "Role Create", href: "/create-role", icon: Key },
      { name: "Permissions", href: "/create-permissions", icon: Key },
    ]
  },
  {
    id: "analytics",
    name: "Analytics & Tracking",
    icon: ChartColumn,
    category: "admin",
    subItems: [
      { name: "Google Analytics", href: "/google-analytics", icon: BarChart3 },
      // { name: "Meta Pixel", href: "/meta-pixel", icon: Activity },
      // { name: "Microsoft Clarity", href: "/microsoft-clarity", icon: Key }
    ]
  },
  {
    id: "settings",
    name: "Settings",
    href: "/settings",
    icon: Settings,
    category: "admin"
  },
];

const Sidebar = ({ 
  sidebarCollapsed = false,
  mobileOpen: controlledMobileOpen,
  onCloseMobile: controlledCloseMobile,
}) => {
  const [internalMobileOpen, setInternalMobileOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState({
    products: true,
    categories: false,
    inventory: false,
    sales: false,
    marketing: false,
    cms: false,
    acl: false,
  });

  const isMobileOpen = controlledCloseMobile !== undefined ? controlledMobileOpen : internalMobileOpen;

  const closeMobileSidebar = useCallback(() => {
    if (controlledCloseMobile) {
      controlledCloseMobile();
    } else {
      setInternalMobileOpen(false);
    }
  }, [controlledCloseMobile]);

  const toggleItem = useCallback((itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  const contentProps = {
    navigationItems: NAVIGATION_ITEMS,
    expandedItems,
    toggleItem,
    sidebarCollapsed,
  };

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={closeMobileSidebar}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] p-3 flex flex-col">
            <SidebarContent
              {...contentProps}
              isMobile
              onCloseMobile={closeMobileSidebar}
            />
          </div>
        </div>
      )}

      <aside
        className={` hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:flex-col  transition-all duration-300 ease-in-out  m-4  rounded-xl  bg-white  border border-gray-100/50 shadow-[0_8px_20px_rgb(0,0,0,0.1)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)]
          ${sidebarCollapsed ? "lg:w-20" : "lg:w-68"}`}
        aria-label="Sidebar navigation"
      >
        <SidebarContent {...contentProps} />
      </aside>
    </>
  );
};

const SidebarContent = ({
  navigationItems,
  expandedItems,
  toggleItem,
  sidebarCollapsed,
  isMobile = false,
  onCloseMobile,
}) => {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden">
      <div className="flex-shrink-0 p-5 border-b border-gray-100">
        <div className="relative flex items-center justify-center w-full min-h-[40px]">
          {isMobile && (
            <button
              onClick={onCloseMobile}
              className="absolute right-0 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {sidebarCollapsed && !isMobile ? (
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">E</span>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Image
                src={brandLogo}
                alt="Ekhone Logo"
                width={160}
                height={40}
                className="object-contain"
                priority
              />
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-5 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <div className="space-y-1.5">
          {navigationItems.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isExpanded={expandedItems[item.id] || false}
              onToggle={() => toggleItem(item.id)}
              isCurrent={pathname === item.href}
              isCollapsed={sidebarCollapsed && !isMobile}
              pathname={pathname}
              isMobile={isMobile}
              onCloseMobile={onCloseMobile}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};


//  Nav Items
const NavItem = ({
  item,
  isExpanded,
  onToggle,
  isCurrent,
  isCollapsed,
  pathname,
  isMobile,
  onCloseMobile,
}) => {
  const hasSubItems = item.subItems && item.subItems.length > 0;
  const Icon = item.icon;

  const hasActiveSubItem = hasSubItems && item.subItems.some(
    sub => sub.href === pathname
  );

  const isMainItem = !hasSubItems;

  const handleLinkClick = () => {
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  if (isCollapsed && hasSubItems) {
    return (
      <div className="relative group py-0.5">
        <div
          className={`
            flex items-center justify-center p-3 rounded-xl
            transition-all duration-200 cursor-pointer
            ${hasActiveSubItem || isCurrent
              ? "bg-primary/10 text-primary"
              : "text-gray-600 hover:bg-gray-50"
            }
          `}
          onClick={onToggle}
          title={item.name}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          {item.name}
        </div>
      </div>
    );
  }

  if (isCollapsed && isMainItem) {
    return (
      <Link
        href={item.href}
        onClick={handleLinkClick}
        className={`
          flex items-center justify-center p-3 rounded-xl
          transition-all duration-200 relative group
          ${isCurrent
            ? "bg-primary/10 text-primary"
            : "text-gray-600 hover:bg-gray-50"
          }
        `}
        title={item.name}
      >
        <Icon className="w-5 h-5" />
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-lg">
          {item.name}
        </div>
      </Link>
    );
  }

  return (
    <div className="mb-1.5">
      {hasSubItems ? (
        <div
          className={`
            flex items-center gap-3 px-3.5 py-3 rounded-xl
            transition-all duration-200 cursor-pointer
            ${hasActiveSubItem || isCurrent
              ? "bg-primary/10 text-primary font-medium"
              : "text-gray-700 hover:bg-gray-50"
            }
          `}
          onClick={onToggle}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Icon className={`w-5 h-5 flex-shrink-0 ${hasActiveSubItem || isCurrent ? "text-primary" : "text-gray-500"}`} />
            <span className="text-sm font-medium truncate">{item.name}</span>
          </div>

          <ChevronDown
            className={`
              w-4 h-4 flex-shrink-0 transition-transform duration-200
              ${isExpanded ? "rotate-180" : ""}
              ${hasActiveSubItem || isCurrent ? "text-primary" : "text-gray-400"}
            `}
          />
        </div>
      ) : (
        <Link
          href={item.href}
          onClick={handleLinkClick}
          className={`
            flex items-center gap-3 px-3.5 py-3 rounded-lg
            transition-all duration-200
            ${isCurrent
              ? "bg-primary/10 text-secound font-medium"
              : "text-gray-700 hover:bg-gray-50"
            }
          `}
        >
          <Icon className={`w-5 h-5 flex-shrink-0 ${isCurrent ? "text-primary" : "text-gray-500"}`} />
          <span className="text-sm font-medium truncate">{item.name}</span>
        </Link>
      )}

      {hasSubItems && isExpanded && !isCollapsed && (
        <div className="ml-10 mt-2 space-y-1.5 border-l-2 border-gray-100 pl-3">
          {item.subItems.map((subItem) => {
            const SubIcon = subItem.icon;
            const isSubActive = pathname === subItem.href;

            return (
              <Link
                key={subItem.href}
                href={subItem.href}
                onClick={handleLinkClick}
                className={`
                  flex items-center gap-3 px-3.5 py-2.5 rounded-md
                  transition-all duration-200 text-sm
                  ${isSubActive
                    ? "bg-primary/5 text-primary font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }
                `}
              >
                <SubIcon className={`w-4 h-4 flex-shrink-0 ${isSubActive ? "text-primary" : "text-gray-400"}`} />
                <span className="truncate">{subItem.name}</span>

                {isSubActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-secound flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Sidebar;