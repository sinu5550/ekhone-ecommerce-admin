// hooks/useHeroSlider.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// Hook for fetching all hero sliders
export const useHeroSliders = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/hero-sliders`,
    fetcher
  );

  return {
    heroSliders: data || [],
    error,
    isLoading,
    mutate
  };
};


// Hook for creating a hero slider
export const useCreateHeroSlider = () => {
  const createHeroSlider = async (heroSliderData) => {
    const response = await fetch(`${API_URL}/api/hero-sliders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(heroSliderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create hero slider');
    }

    return response.json();
  };

  return { createHeroSlider };
};


// Hook for updating a hero slider
export const useUpdateHeroSlider = () => {
  const updateHeroSlider = async (id, heroSliderData) => {
    const response = await fetch(`${API_URL}/api/hero-sliders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(heroSliderData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update hero slider');
    }

    return response.json();
  };

  return { updateHeroSlider };
};



// Hook for deleting a hero slider
export const useDeleteHeroSlider = () => {
  const deleteHeroSlider = async (id) => {
    const response = await fetch(`${API_URL}/api/hero-sliders/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete hero slider');
    }

    return response.json();
  };

  return { deleteHeroSlider };
};