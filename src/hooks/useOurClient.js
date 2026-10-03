// hooks/useOurClient.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching all clients
export const useClients = (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const url = `${API_URL}/api/our-client${queryParams ? `?${queryParams}` : ''}`;

    const { data, error, isLoading, mutate } = useSWR(url, fetcher);

    return {
        clients: data || [],
        error,
        isLoading,
        mutate
    };
};

// Hook for fetching single client by ID
export const useClientById = (id) => {
    const { data, error, isLoading, mutate } = useSWR(
        id ? `${API_URL}/api/our-client/id/${id}` : null,
        fetcher
    );

    return {
        client: data?.data || null,
        error,
        isLoading,
        mutate
    };
};

// Hook for fetching client by slug
export const useClientBySlug = (slug) => {
    const { data, error, isLoading, mutate } = useSWR(
        slug ? `${API_URL}/api/our-client/${slug}` : null,
        fetcher
    );

    return {
        client: data?.data || null,
        error,
        isLoading,
        mutate
    };
};

// Hook for creating client
export const useCreateClient = () => {
    const createClient = async (clientData) => {
        const response = await fetch(`${API_URL}/api/our-client`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(clientData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to create client');
        }

        return result;
    };

    return { createClient };
};

// Hook for updating client
export const useUpdateClient = () => {
    const updateClient = async (id, clientData) => {
        const response = await fetch(`${API_URL}/api/our-client/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(clientData),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to update client');
        }

        return result;
    };

    return { updateClient };
};

// Hook for deleting client
export const useDeleteClient = () => {
    const deleteClient = async (id) => {
        const response = await fetch(`${API_URL}/api/our-client/${id}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeader(),
            },
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to delete client');
        }

        return result;
    };

    return { deleteClient };
};