import { Loader2 } from "lucide-react";
import React from 'react';

const LoadingSpinner = () => {
    return (
        <div>
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2">Loading...</span>
            </div>
        </div>
    );
};

export default LoadingSpinner;