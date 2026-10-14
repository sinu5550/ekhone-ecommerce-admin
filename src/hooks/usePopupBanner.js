// src/hooks/usePopupBanner.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from "swr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const usePopupBanners = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/popup-banner`,
    fetcher
  );

  return {
    banners: data?.data || data || [],
    error,
    isLoading,
    mutate,
  };
};

export const useSavePopupBanner = () => {
  const saveBanner = async (bannerData) => {
    const response = await fetch(`${API_URL}/api/popup-banner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(bannerData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to save popup banner");
    }

    return response.json();
  };

  return { saveBanner };
};

export const useTogglePopupBanner = () => {
  const toggleBanner = async (id) => {
    const response = await fetch(`${API_URL}/api/popup-banner/${id}/toggle`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to toggle status");
    }

    return response.json();
  };

  return { toggleBanner };
};

export const useDeletePopupBanner = () => {
  const deleteBanner = async (id) => {
    const response = await fetch(`${API_URL}/api/popup-banner/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete popup banner");
    }

    return response.json();
  };

  return { deleteBanner };
};
