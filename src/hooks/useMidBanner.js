// hooks/useMidBanner.js
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

// Hook for fetching all mid banners
export const useMidBanners = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/mid-banner`,
    fetcher
  );

  return {
    midBanners: data || [],
    error,
    isLoading,
    mutate
  };
};

// Hook for creating a mid banner
export const useCreateMidBanner = () => {
  const createMidBanner = async (bannerData) => {
    const response = await fetch(`${API_URL}/api/mid-banner`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bannerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create mid banner');
    }

    return response.json();
  };

  return { createMidBanner };
};

// Hook for updating a mid banner (using PATCH)
export const useUpdateMidBanner = () => {
  const updateMidBanner = async (id, bannerData) => {
    const response = await fetch(`${API_URL}/api/mid-banner/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bannerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update mid banner');
    }

    return response.json();
  };

  return { updateMidBanner };
};

// Hook for deleting a mid banner
export const useDeleteMidBanner = () => {
  const deleteMidBanner = async (id) => {
    const response = await fetch(`${API_URL}/api/mid-banner/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete mid banner');
    }

    return response.json();
  };

  return { deleteMidBanner };
};