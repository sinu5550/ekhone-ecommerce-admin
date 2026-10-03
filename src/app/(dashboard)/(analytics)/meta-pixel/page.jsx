import { AlertCircle } from 'lucide-react';
import React from 'react'

const MetaPixel = () => {
    return (
        <div>
            <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 border border-sky-200 rounded-2xl p-8 text-center">
                <AlertCircle className="w-12 h-12 text-sky-600 mx-auto mb-3" />
                <p className="text-sky-600 font-semibold text-lg">Access Restricted</p>
                <p className="text-sky-500 text-sm mt-1">
                    You don't have permission to view analytics data.
                </p>
            </div>
        </div>
    )
}

export default MetaPixel;