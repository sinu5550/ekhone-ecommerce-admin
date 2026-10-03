// hooks/useContact.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching contact data
export const useContact = () => {
    const { data, error, isLoading, mutate } = useSWR(
        `${API_URL}/api/contact`,
        fetcher
    );

    return {
        contactData: data?.data || {},
        error,
        isLoading,
        mutate
    };
};

// Hook for creating contact data
export const useCreateContact = () => {
    const createContact = async (contactData) => {
        const response = await fetch(`${API_URL}/api/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(contactData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create contact data');
        }

        return response.json();
    };

    return { createContact };
};


// Hook for updating contact data
export const useUpdateContact = () => {
    const updateContact = async (id, contactData) => {
        const response = await fetch(`${API_URL}/api/contact/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(contactData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update contact data');
        }

        return response.json();
    };

    return { updateContact };
};


// Hook for deleting contact data
export const useDeleteContact = () => {
    const deleteContact = async (id) => {
        const response = await fetch(`${API_URL}/api/contact/${id}`, {
            method: 'DELETE',
            headers: {
                ...getAuthHeader(),
            },
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete contact data');
        }

        return response.json();
    };

    return { deleteContact };
};