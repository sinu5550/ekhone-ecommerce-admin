// hooks/useBentoImageCard.js
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const fetcher = async (url) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

// Hook for fetching all bento image cards
export const useBentoImageCards = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/bento-gallery`,
    fetcher
  );

  return {
    bentoImageCards: data || [],
    error,
    isLoading,
    mutate
  };
};

// Hook for creating a bento image card
export const useCreateBentoImageCard = () => {
  const createBentoImageCard = async (cardData) => {
    const response = await fetch(`${API_URL}/api/bento-gallery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cardData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create bento image card');
    }

    return response.json();
  };

  return { createBentoImageCard };
};

// Hook for updating a bento image card (using PATCH)
export const useUpdateBentoImageCard = () => {
  const updateBentoImageCard = async (id, cardData) => {
    const response = await fetch(`${API_URL}/api/bento-gallery/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cardData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update bento image card');
    }

    return response.json();
  };

  return { updateBentoImageCard };
};

// Hook for deleting a bento image card
export const useDeleteBentoImageCard = () => {
  const deleteBentoImageCard = async (id) => {
    const response = await fetch(`${API_URL}/api/bento-gallery/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete bento image card');
    }

    return response.json();
  };

  return { deleteBentoImageCard };
};