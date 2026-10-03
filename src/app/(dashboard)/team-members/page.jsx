import OurMember from "@/components/TeamMember/OurMember";
import TeamMemberStatus from "@/components/TeamMember/TeamMemberStatus";
import React from 'react';

const page = () => {
    return (
        <div className="space-y-20">
            <TeamMemberStatus />
            <OurMember />
        </div>
    );
};

export default page;