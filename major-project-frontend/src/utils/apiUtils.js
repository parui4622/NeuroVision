import axios from 'axios';
import { API_BASE_URL } from './apiConfig';

// Axios instance with base URL and default headers
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token to requests if available
apiClient.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// GET request
export const fetchApi = async (endpoint) => {
  try {
    const response = await apiClient.get(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${endpoint}:`, error);
    throw error;
  }
};

// POST request
export const postApi = async (endpoint, data) => {
  try {
    const response = await apiClient.post(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error posting data to ${endpoint}:`, error);
    throw error;
  }
};

// PUT request
export const putApi = async (endpoint, data) => {
  try {
    const response = await apiClient.put(endpoint, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating data at ${endpoint}:`, error);
    throw error;
  }
};

// DELETE request
export const deleteApi = async (endpoint) => {
  try {
    const response = await apiClient.delete(endpoint);
    return response.data;
  } catch (error) {
    console.error(`Error deleting data at ${endpoint}:`, error);
    throw error;
  }
};

// Get the API base URL
export const getApiUrl = () => API_BASE_URL;

// API endpoints for different features
export const endpoints = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/signup',
    forgotPassword: '/api/password/verify',
    resetPassword: '/api/password/reset',
  },
  admin: {
    dashboard: '/api/admin',
    createAdmin: '/api/admin/create',
    changePassword: '/api/admin/change-password',
  },
  doctor: {
    dashboard: '/doctor/dashboard',
    patientDetails: '/doctor/patient-details',
  },
  predict: {
    predictAlzheimer: '/predict/alzheimer',
  }
};
