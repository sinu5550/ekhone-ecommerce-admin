// hooks/useTeamMember.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching team members data
export const useTeamMembers = () => {
    const { data, error, isLoading, mutate } = useSWR(
        `${API_URL}/api/team-member`,
        fetcher
    );

    return {
        teamMembers: data || [],
        error,
        isLoading,
        mutate
    };
};

// Hook for creating team member
export const useCreateTeamMember = () => {
    const createTeamMember = async (memberData) => {
        const response = await fetch(`${API_URL}/api/team-member`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(memberData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create team member');
        }

        return response.json();
    };

    return { createTeamMember };
};

// Hook for updating team member
export const useUpdateTeamMember = () => {
    const updateTeamMember = async (id, memberData) => {
        const response = await fetch(`${API_URL}/api/team-member/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(memberData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update team member');
        }

        return response.json();
    };

    return { updateTeamMember };
};

// Hook for deleting team member
export const useDeleteTeamMember = () => {
    const deleteTeamMember = async (id) => {
        const response = await fetch(`${API_URL}/api/team-member/${id}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeader(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete team member');
        }

        return response.json();
    };

    return { deleteTeamMember };
};