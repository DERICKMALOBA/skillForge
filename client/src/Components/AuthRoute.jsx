import axios from 'axios';
// authService.js additions
import { jwtDecode } from 'jwt-decode';


export const isTokenValid = (token) => {
    try {
      const decoded = jwtDecode(token);
      return decoded.exp && decoded.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };
  
  export const getTokenData = (token) => {
    try {
      return jwtDecode(token);
    } catch {
      return null;
    }
  };
const API_URL = '/api/auth';

// Store token with role prefix
const setAuthToken = (token, role) => {
  const prefixedToken = `${role}_${token}`;
  sessionStorage.setItem('authToken', prefixedToken);
};

const getAuthToken = () => {
  return sessionStorage.getItem('authToken');
};

const removeAuthToken = () => {
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
};

const refreshToken = async () => {
  try {
    const currentToken = getAuthToken();
    if (!currentToken) throw new Error('No token found');
    
    const response = await axios.post(`${API_URL}/refresh`, {}, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    
    const [role, token] = response.data.token.split('_');
    setAuthToken(token, role);
    return token;
  } catch (error) {
    removeAuthToken();
    throw error;
  }
};

// Axios interceptor for token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return axios(originalRequest);
    }
    return Promise.reject(error);
  }
);

export { setAuthToken, getAuthToken, removeAuthToken, refreshToken };