'use client'

import Link from "next/link";
import { FiUser, FiChevronRight } from "react-icons/fi";

const SettingsSidebar = () => {
    return (
        <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Preferences</h2>

                <nav className="space-y-2">
                    {[
                        { id: '/settings', label: 'Profile', icon: <FiUser /> }

                    ].map((item, index) => (
                        <Link
                            key={index}
                            href={item.id}
                            className="flex items-center justify-between w-full p-3 text-left rounded-lg hover:bg-gray-50 text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-gray-500">{item.icon}</span>
                                <span>{item.label}</span>
                            </div>
                            <FiChevronRight className="text-gray-400" />
                        </Link>
                    ))}
                </nav>

                {/* <div className="mt-8 pt-6 border-t border-gray-200">
                    <Link
                        href='/sign-up'
                        className="btn w-full bg-secound hover:bg-secound-hover text-white px-4 py-2 rounded text-md  font-medium font-exo tracking-[0.2em] flex items-center justify-center gap-2 transition-colors"
                    >
                        <FiUser />
                        Account Create
                    </Link>
                </div> */}
            </div>
        </div>
    );
};

export default SettingsSidebar;