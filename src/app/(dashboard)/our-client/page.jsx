import ClientManagement from "@/components/OurClient/Client";
import OurClientStatus from "@/components/OurClient/OurClientStatus";
import React from 'react';

const page = () => {
    return (
        <div className="space-y-20">
            <OurClientStatus />
            <ClientManagement />
        </div>
    );
};

export default page;