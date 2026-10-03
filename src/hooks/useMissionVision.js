// hooks/useMissionVision.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching mission & vision data
export const useMissionVision = () => {
    const { data, error, isLoading, mutate } = useSWR(
        `${API_URL}/api/mission-vision`,
        fetcher
    );

    return {
        missionVision: data?.data || [],
        error,
        isLoading,
        mutate
    };
};

// Hook for creating mission & vision item
export const useCreateMissionVision = () => {
    const createMissionVision = async (itemData) => {
        const response = await fetch(`${API_URL}/api/mission-vision`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(itemData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create item');
        }

        return response.json();
    };

    return { createMissionVision };
};

// Hook for updating mission & vision item
export const useUpdateMissionVision = () => {
    const updateMissionVision = async (id, itemData) => {
        const response = await fetch(`${API_URL}/api/mission-vision/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(itemData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update item');
        }

        return response.json();
    };

    return { updateMissionVision };
};

// Hook for deleting mission & vision item
export const useDeleteMissionVision = () => {
    const deleteMissionVision = async (id) => {
        const response = await fetch(`${API_URL}/api/mission-vision/${id}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeader(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete item');
        }

        return response.json();
    };

    return { deleteMissionVision };
};