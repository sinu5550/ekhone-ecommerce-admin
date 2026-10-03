// hooks/useTeamMemberStatus.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching member status data
export const useMemberStatus = () => {
    const { data, error, isLoading, mutate } = useSWR(`${API_URL}/api/member-Status`, fetcher);
    const memberStatus = data?.[0] || null;

    return {
        memberStatus,
        error,
        isLoading,
        mutate
    };
};

// Hook for updating member status data (using PATCH)
export const useUpdateMemberStatus = () => {
    const updateMemberStatus = async (id, memberData) => {
        const response = await fetch(`${API_URL}/api/member-Status/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(memberData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update member status data');
        }

        return response.json();
    };

    return { updateMemberStatus };
};