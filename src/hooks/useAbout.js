// hooks/useAboutUs.js
import { fetcher, getAuthHeader } from "@/utils/authHeader";
import useSWR from 'swr';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';


//GET DATA
export const useAboutUs = () => {
    const { data, error, isLoading, mutate } = useSWR(`${API_URL}/api/about-us`, fetcher);
    const aboutUs = data?.[0] || null;

    return {
        aboutUs,
        error,
        isLoading,
        mutate
    };
};


// UPDATE DATA USING PATCH
export const useUpdateAboutUs = () => {
    const updateAboutUs = async (id, aboutData) => {
        const response = await fetch(`${API_URL}/api/about-us/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeader(),
            },
            body: JSON.stringify(aboutData),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update about us data');
        }

        return response.json();
    };

    return { updateAboutUs };
};