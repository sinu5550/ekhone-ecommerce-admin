// src/hooks/useStoreSetting.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from "swr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export const useStoreSetting = () => {
  const { data, error, isLoading, mutate } = useSWR(
    `${API_URL}/api/store-settings`,
    fetcher,
    { revalidateOnFocus: true }
  );

  return {
    settings: data?.data || data || null,
    error,
    isLoading,
    mutate,
  };
};

export const useUpdateStoreSetting = () => {
  const updateSettings = async (settingsData) => {
    const response = await fetch(`${API_URL}/api/store-settings`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(settingsData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update store settings");
    }

    return response.json();
  };

  return { updateSettings };
};
