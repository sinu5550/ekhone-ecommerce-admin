// hooks/useBlogs.js

import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// GET DATA
export const useBlogs = () => {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    `${API_URL}/api/blog`,
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

// CREATE BLOG
export const useCreateBlog = () => {
  const createBlog = async (blogData) => {
    const response = await fetch(`${API_URL}/api/blog`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(blogData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create blog');
    }

    return response.json();
  };

  return { createBlog };
};

// UPDATE BLOG
export const useUpdateBlog = () => {
  const updateBlog = async (id, blogData) => {
    const response = await fetch(`${API_URL}/api/blog/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(blogData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update blog');
    }

    return response.json();
  };

  return { updateBlog };
};

// DELETE
export const useDeleteBlog = () => {
  const deleteBlog = async (id) => {
    const response = await fetch(`${API_URL}/api/blog/${id}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete blog');
    }

    return response.json();
  };

  return { deleteBlog };
};