// hooks/useOurClientStatus.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const useClientStatus = () => {
    const { data, error, isLoading, mutate } = useSWR(
        `${API_URL}/api/client-status`,
        fetcher
    );

    const clientStatus = data?.[0] || null;
    return {
        clientStatus,
        error,
        isLoading,
        mutate
    };
};

export const useUpdateClientStatus = () => {
    const updateClientStatus = async (id, clientData) => {
        const response = await fetch(`${API_URL}/api/client-status/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(clientData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update client status data');
        }

        return response.json();
    };

    return { updateClientStatus };
};