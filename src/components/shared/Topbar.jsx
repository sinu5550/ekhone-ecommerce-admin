'use client';

import { logout, getCurrentUser } from "@/lib/auth-helpers";
import {
  ChevronDown,
  LogOut,
  Menu,
  UserPlus
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import Link from "next/link";
import Marquee from 'react-fast-marquee';
import { usePermission } from "@/context/PermissionProvider";

const Topbar = ({ onToggleSidebar, onToggleMobileSidebar, userMenuOpen, onToggleUserMenu }) => {

  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          const userWithInitials = {
            ...currentUser,
            initials: getInitials(
              currentUser?.user_metadata?.full_name ||
              currentUser?.email ||
              ''
            )
          };
          setUser(userWithInitials);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#14b8a6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        setIsLoggingOut(true);
        await logout();
        toast.success('You have been successfully logged out');
        router.push('/');
      } catch (error) {
        console.error('Logout error:', error);
        toast.error('Failed to logout. Please try again.');
        setIsLoggingOut(false);
      }
    }
  };

  const getDisplayName = () => {
    if (!user) return 'Loading...';
    return user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  };

  const getInitials = (name) => {
    if (!name) return 'K';
    if (name.includes('@')) {
      return name.charAt(0).toUpperCase();
    }
    const names = name.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };

  // User Menu Component
  const UserMenu = ({
    userMenuOpen,
    onToggleUserMenu,
    user,
    onLogout,
    isLoggingOut,
    getDisplayName
  }) => {
    const displayName = getDisplayName ? getDisplayName() : 'User';
    const { hasPermission } = usePermission();

    return (
      <div className="relative">
        <button
          onClick={onToggleUserMenu}
          className="flex items-center gap-2 h-10 px-3 rounded text-gray-700 hover:bg-gray-100 transition-all duration-200 disabled:opacity-50 cursor-pointer"
          aria-expanded={userMenuOpen}
          aria-haspopup="true"
          disabled={isLoggingOut}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-secound rounded flex items-center justify-center shadow-sm">
            <span className="text-white font-semibold text-sm">
              {user?.initials || 'U'}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
        </button>

        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={onToggleUserMenu}
              aria-hidden="true"
            />
            <div className="absolute right-0 mt-2 w-64 rounded shadow-2xl bg-white border border-gray-200 z-50 overflow-hidden">
              {/* User Info Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-stone-100 to-neutral-100 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-secound to-primary rounded flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold text-sm">
                      {user?.initials || 'HR'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate text-sm">
                      {displayName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              {/* Create Admin Button */}
              {hasPermission("role_management.create") && (
                <>
                  <Link
                    href='/sign-up'
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-600 hover:bg-green-500 hover:text-white transition-colors duration-500"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Create Admin</span>
                  </Link>
                  <div className="border-t border-gray-200"></div>
                </>
              )}

              {/* Sign Out Button */}
              <button
                onClick={onLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-500 hover:text-white cursor-pointer transition-colors duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? 'Logging out...' : 'Sign out'}</span>
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Main Topbar */}
      <div className="sticky top-0 z-30 bg-white border border-stone-200 shadow-sm mx-7 my-3 rounded-xl">
        <div className="flex h-14 items-center justify-between px-4">
          {/* Left Section */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={onToggleSidebar}
              className="hidden lg:inline-flex h-10 w-10 items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 cursor-pointer"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <Link
                href="https://ekhone.com"
                target="_blank"
                className="group flex items-center gap-2 px-4 py-2 rounded-lg border border-primary/20 text-primary hover:bg-primary hover:text-white transition-all duration-300 text-xs font-bold tracking-wide uppercase shadow-sm shadow-primary/5 whitespace-nowrap"
              >
                <span className="relative flex h-1.5 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 group-hover:bg-white"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary group-hover:bg-white"></span>
                </span>
                Website Live
              </Link>
            </div>
            <button
              onClick={onToggleMobileSidebar || onToggleSidebar}
              className="lg:hidden inline-flex h-10 w-10 items-center justify-center text-gray-800 hover:bg-gray-100 rounded-lg cursor-pointer transition-all duration-200"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Marquee Notice */}
          <div className="hidden md:flex flex-1 justify-center mx-4 overflow-hidden">
            <div className="w-full max-w-5xl">
              <Marquee
                pauseOnHover={true}
                speed={60}
                gradient={true}
                gradientColor="white"
                gradientWidth={50}
              >
                <div className="flex items-center gap-8">
                  <h2 className="text-md text-orange-600 whitespace-nowrap font-exo">
                    ⚡ Notice: Updates made from the admin panel may take a few moments to reflect on the website. Thank you for your patience.
                  </h2>
                </div>
              </Marquee>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {!loading && user && (
              <UserMenu
                userMenuOpen={userMenuOpen}
                onToggleUserMenu={onToggleUserMenu}
                user={user}
                onLogout={handleLogout}
                isLoggingOut={isLoggingOut}
                getDisplayName={getDisplayName}
              />
            )}
            {loading && (
              <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Topbar;