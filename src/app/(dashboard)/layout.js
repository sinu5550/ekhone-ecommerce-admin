'use client';

import React, { useState, useCallback } from 'react';
import Topbar from "@/components/shared/Topbar";
import Sidebar from "@/components/shared/Sidebar";
import { AuthProvider } from "@/context/AuthContext";


const Layout = ({ children }) => {

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const toggleSidebar = useCallback(() => {
        setSidebarCollapsed(prev => !prev);
    }, []);

    const toggleMobileSidebar = useCallback(() => {
        setMobileOpen(prev => !prev);
    }, []);

    const closeMobileSidebar = useCallback(() => {
        setMobileOpen(false);
    }, []);

    const toggleUserMenu = useCallback(() => {
        setUserMenuOpen(prev => !prev);
    }, []);

    // Close user menu when clicking outside
    const closeUserMenu = useCallback(() => {
        if (userMenuOpen) {
            setUserMenuOpen(false);
        }
    }, [userMenuOpen]);

    return (
        <div className="min-h-screen bg-[#F5F7FA] font-sans">
            <Sidebar 
                sidebarCollapsed={sidebarCollapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={closeMobileSidebar}
            />
            <div
                className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
                    }`}
                onClick={closeUserMenu}>
                <Topbar
                    sidebarCollapsed={sidebarCollapsed}
                    onToggleSidebar={toggleSidebar}
                    onToggleMobileSidebar={toggleMobileSidebar}
                    userMenuOpen={userMenuOpen}
                    onToggleUserMenu={toggleUserMenu}
                />

                <AuthProvider>
                    <main className="py-6 px-4 sm:px-6 lg:px-8 text-gray-800">
                        {children}
                    </main>
                </AuthProvider>
            </div>
        </div>
    );
};

export default Layout;