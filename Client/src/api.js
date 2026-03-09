const BASE_URL = 'http://localhost:5000/api';

export const fetchApi = async (endpoint, options = {}) => {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include', // Sends HTTP-only JWT cookies to the backend
    };

    const finalOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, finalOptions);
        const data = await response.json();
        return { status: response.status, data };
    } catch (error) {
        return { status: 500, data: { success: false, message: error.message } };
    }
};
