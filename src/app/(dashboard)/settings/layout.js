'use client';

import SettingsSidebar from "@/components/shared/SettingsSidebar";

const Layout = ({ children }) => {

    return (
        <div className="min-h-screen bg-gray-50 font-poppins">
            {/* Header */}
            <div className="mb-8 bg-white p-4 rounded-lg shadow border border-stone-200">
                <h1 className="text-3xl font-bold text-gray-800 font-philosopher">Settings</h1>
                <p className="text-gray-600 mt-2">Manage your account preferences and store settings</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <SettingsSidebar />
                <div className="lg:col-span-3">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Layout;