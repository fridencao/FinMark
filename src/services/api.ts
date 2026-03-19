import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (!error.response) {
      const message = '网络连接失败，请检查网络';
      console.error('[API]', message);
      return Promise.reject(new Error(message));
    }

    const status = error.response.status;
    const apiError = error.response.data?.error?.message || error.response.data?.message;

    if (status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(new Error('登录已过期，请重新登录'));
    }

    const message = apiError || `请求失败 (${status})`;
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

export default api;
