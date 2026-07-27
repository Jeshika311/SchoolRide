import axios from 'axios';

const getDefaultApiBaseUrl = () => {
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
	}

	if (import.meta.env.DEV) {
		return '/api';
	}

	if (typeof window !== 'undefined') {
		const { protocol, hostname } = window.location;

		return `${protocol}//${hostname}:5000/api`;
	}

	return '/api';
};

const API_BASE_URL = getDefaultApiBaseUrl().replace(/\/$/, '');

export const apiClient = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: true,
	headers: {
		'Content-Type': 'application/json',
	},
});

export const getApiUrl = (endpoint = '') => {
	const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
	return `${API_BASE_URL}${normalizedEndpoint}`;
};

export const fetchApi = async (endpoint, options = {}) => {
	try {
		const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('authToken') : null;
		const requestHeaders = {
			...(options.headers || {}),
		};

		if (storedToken && !requestHeaders.Authorization && !requestHeaders.authorization) {
			requestHeaders.Authorization = `Bearer ${storedToken}`;
		}

		const response = await apiClient.request({
			url: endpoint,
			method: (options.method || 'GET').toLowerCase(),
			data: options.body ?? options.data,
			params: options.params,
			headers: requestHeaders,
		});

		return {
			status: response.status,
			data: response.data,
		};
	} catch (error) {
		if (error.response) {
			return {
				status: error.response.status,
				data: error.response.data,
			};
		}

		return {
			status: 500,
			data: { success: false, message: error.message || 'Network error' },
		};
	}
};
