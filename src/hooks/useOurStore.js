// hooks/useOurStore.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching all stores
export const useStores = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `${API_URL}/api/our-store`,
    fetcher
  );

  return {
    stores: data,
    error,
    isLoading,
    isValidating,
    mutate,
    isEmpty: !isLoading && !error && (!data || data.length === 0),
  };
};

// Hook for creating a store
export const useCreateStore = () => {
  const createStore = async (storeData) => {
    const response = await fetch(`${API_URL}/api/our-store`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(storeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create store');
    }

    return response.json();
  };

  return { createStore };
};

// Hook for updating a store
export const useUpdateStore = () => {
  const updateStore = async (id, storeData) => {
    const response = await fetch(`${API_URL}/api/our-store/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(storeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update store');
    }

    return response.json();
  };

  return { updateStore };
};

// Hook for deleting a store
export const useDeleteStore = () => {
  const deleteStore = async (id) => {
    const response = await fetch(`${API_URL}/api/our-store/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete store');
    }

    return response.json();
  };

  return { deleteStore };
};