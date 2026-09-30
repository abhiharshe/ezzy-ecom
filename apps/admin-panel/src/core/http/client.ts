import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const httpClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach JWT Bearer Token
httpClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle errors & 401 unauthorized
httpClient.interceptors.response.use(
  (response) => {
    // Unpack NestJS standard response wrapper: { success: true, data: ... }
    if (response.data && response.data.success !== undefined && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error: AxiosError<{ message?: string | string[]; errors?: unknown }>) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login if not already there
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('authUser');
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/forgot-password') && !window.location.pathname.startsWith('/reset-password')) {
        window.location.href = '/login';
      }
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;

    return Promise.reject(new Error(normalizedMessage));
  }
);
