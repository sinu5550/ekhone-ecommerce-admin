// hooks/useTopPick.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching all top picks
export const useTopPicks = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/top-picks`,
    fetcher
  );

  return {
    topPicks: data?.data || [],
    error,
    isLoading,
    mutate
  };
};

// Hook for creating a top pick
export const useCreateTopPick = () => {
  const createTopPick = async (topPickData) => {
    const response = await fetch(`${API_URL}/api/top-picks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(topPickData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create top pick');
    }

    return response.json();
  };

  return { createTopPick };
};

// Hook for updating a top pick
export const useUpdateTopPick = () => {
  const updateTopPick = async (id, topPickData) => {
    const response = await fetch(`${API_URL}/api/top-picks/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(topPickData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update top pick');
    }

    return response.json();
  };

  return { updateTopPick };
};

// Hook for deleting a top pick
export const useDeleteTopPick = () => {
  const deleteTopPick = async (id) => {
    const response = await fetch(`${API_URL}/api/top-picks/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete top pick');
    }

    return response.json();
  };

  return { deleteTopPick };
};