// hooks/usePromo.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching all promos
export const usePromos = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/promos`,
    fetcher
  );

  return {
    promos: data || [],
    error,
    isLoading,
    mutate
  };
};

// Hook for creating a promo
export const useCreatePromo = () => {
  const createPromo = async (promoData) => {
    const response = await fetch(`${API_URL}/api/promos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(promoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create promo');
    }

    return response.json();
  };

  return { createPromo };
};

// Hook for updating a promo
export const useUpdatePromo = () => {
  const updatePromo = async (id, promoData) => {
    const response = await fetch(`${API_URL}/api/promos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(promoData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update promo');
    }

    return response.json();
  };

  return { updatePromo };
};

// Hook for deleting a promo
export const useDeletePromo = () => {
  const deletePromo = async (id) => {
    const response = await fetch(`${API_URL}/api/promos/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete promo');
    }

    return response.json();
  };

  return { deletePromo };
};