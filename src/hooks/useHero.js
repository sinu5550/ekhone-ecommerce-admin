// hooks/useHero.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching all heros
export const useHeros = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/hero`,
    fetcher
  );

  return {
    heros: data || [],
    error,
    isLoading,
    mutate
  };
};

// Hook for creating a hero
export const useCreateHero = () => {
  const createHero = async (heroData) => {
    const response = await fetch(`${API_URL}/api/hero`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(heroData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create hero');
    }

    return response.json();
  };

  return { createHero };
};

// Hook for updating a hero
export const useUpdateHero = () => {
  const updateHero = async (id, heroData) => {
    const response = await fetch(`${API_URL}/api/hero/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(heroData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update hero');
    }

    return response.json();
  };

  return { updateHero };
};

// Hook for deleting a hero
export const useDeleteHero = () => {
  const deleteHero = async (id) => {
    const response = await fetch(`${API_URL}/api/hero/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete hero');
    }

    return response.json();
  };

  return { deleteHero };
};