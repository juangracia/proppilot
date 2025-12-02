import { Capacitor } from '@capacitor/core';

const getApiBaseUrl = () => {
  // In native app, always use production backend
  if (Capacitor.isNativePlatform()) {
    return 'https://backend-production-1752.up.railway.app/api';
  }
  // In web, use env variable or proxy
  return import.meta.env.VITE_API_URL || '/api';
};

export const API_BASE_URL = getApiBaseUrl();
