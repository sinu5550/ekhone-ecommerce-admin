// hooks/useTestimonials.js

import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from "swr";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const useTestimonials = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `${API_URL}/api/testimonials`,
    fetcher
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    isEmpty: !isLoading && !error && data?.length === 0,
  };
};

export const useCreateTestimonial = () => {
  const createTestimonial = async (testimonialData) => {
    const response = await fetch(`${API_URL}/api/testimonials`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(testimonialData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create testimonial");
    }

    return response.json();
  };

  return { createTestimonial };
};

export const useUpdateTestimonial = () => {
  const updateTestimonial = async (id, testimonialData) => {
    const response = await fetch(`${API_URL}/api/testimonials/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify(testimonialData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update testimonial");
    }

    return response.json();
  };

  return { updateTestimonial };
};

export const useDeleteTestimonial = () => {
  const deleteTestimonial = async (id) => {
    const response = await fetch(`${API_URL}/api/testimonials/${id}`, {
      method: "DELETE",
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete testimonial");
    }

    return response.json();
  };

  return { deleteTestimonial };
};