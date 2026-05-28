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
		const response = await apiClient.request({
			url: endpoint,
			method: (options.method || 'GET').toLowerCase(),
			data: options.body ?? options.data,
			params: options.params,
			headers: options.headers,
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
