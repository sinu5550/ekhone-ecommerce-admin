'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const sizeMap = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'w-full',
};

const BaseModal = ({ isOpen, onClose, title, children, size = '2xl', zIndex = 'z-[9999]' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed inset-0 ${zIndex} overflow-y-auto flex items-center justify-center p-3 sm:p-4 md:p-6`}>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        onClick={onClose}
                    />

                    {/* Modal Window */}
                    <motion.div
                        className={`relative w-full ${sizeMap[size] || sizeMap['2xl']} bg-white rounded shadow-2xl p-6 flex flex-col max-h-[90vh] overflow-y-auto border border-gray-200 z-10`}
                        initial={{ scale: 0.96, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 8 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 transition cursor-pointer p-1 rounded-md hover:bg-gray-100 z-20"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        {title && <h2 className="text-xl font-semibold mb-4 font-exo text-gray-900 pr-8">{title}</h2>}
                        {children}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default BaseModal;

