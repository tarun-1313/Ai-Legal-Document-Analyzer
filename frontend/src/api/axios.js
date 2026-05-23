// frontend/src/api/axios.js
import axios from 'axios';
import toast from 'react-hot-toast';

// Base URL can be set via env var VITE_API_URL, fallback to localhost:8000
const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api';

const instance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 60000, // 60 second timeout for long AI operations
});

// Request interceptor – attach JWT if present
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (isFormData) {
      try {
        if (config.headers?.set) {
          config.headers.set('Content-Type', undefined);
          config.headers.set('content-type', undefined);
        }
      } catch {
      }
      if (config.headers) {
        config.headers['Content-Type'] = undefined;
        config.headers['content-type'] = undefined;
      }
    } else if (config.headers) {
      const hasContentType =
        ('Content-Type' in config.headers) || ('content-type' in config.headers);
      if (!hasContentType) {
        config.headers['Content-Type'] = 'application/json';
      }
    }
    
    // Add request timestamp for debugging
    config.metadata = { startTime: Date.now() };
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor – handle errors gracefully
instance.interceptors.response.use(
  (response) => {
    // Calculate request duration for debugging
    if (response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime;
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }
    return response;
  },
  async (error) => {
    const { config, response, message } = error;
    
    // Log error details
    console.error('[API Error]', {
      url: config?.url,
      method: config?.method,
      status: response?.status,
      message: message,
      data: response?.data,
    });
    
    // Handle specific error cases
    if (!response) {
      // Network error or timeout
      if (message?.includes('timeout')) {
        toast.error('Request timed out. Please try again.');
      } else {
        toast.error('Network error. Please check your connection.');
      }
      return Promise.reject(error);
    }
    
    switch (response.status) {
      case 401:
        // Unauthorized - clear token and redirect
        localStorage.removeItem('access_token');
        toast.error('Session expired. Please log in again.');
        window.location.href = '/auth';
        break;
        
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
        
      case 404:
        toast.error('The requested resource was not found.');
        break;
        
      case 422: {
        const validationErrors = response.data?.detail;
        if (Array.isArray(validationErrors)) {
          validationErrors.forEach((err) => {
            toast.error(`${err.loc?.join('.')}: ${err.msg}`);
          });
        } else {
          toast.error('Validation error. Please check your input.');
        }
        break;
      }
        
      case 429:
        toast.error('Too many requests. Please slow down.');
        break;
        
      case 500:
      case 502:
      case 503:
      case 504:
        toast.error('Server error. Please try again later.');
        break;
        
      default:
        toast.error(response.data?.detail || 'An unexpected error occurred.');
    }
    
    return Promise.reject(error);
  }
);

export default instance;
