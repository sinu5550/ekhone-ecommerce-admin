// utils/authHeader.js

export const getAuthHeader = () => {
    const token = localStorage.getItem("supabase_access_token");

    return token
        ? {
            Authorization: `Bearer ${token}`,
        }
        : {};
};



export const fetcher = async (url) => {
    const res = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
        },
    });

    const data = await res.json();

    if (!res.ok) {
        const error = new Error(data.message || "Something went wrong");
        error.info = data;
        error.status = res.status;
        throw error;
    }

    return data;
};
