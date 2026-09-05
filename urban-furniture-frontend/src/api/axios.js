import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const apiClient = axios.create({ baseURL });

// Token is kept in memory + localStorage. setAuthToken keeps axios headers in sync.
export function setAuthToken(token) {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('uf_token', token);
  } else {
    delete apiClient.defaults.headers.common.Authorization;
    localStorage.removeItem('uf_token');
  }
}

// Hydrate on load (page refresh) before React mounts anything that needs it.
const existingToken = localStorage.getItem('uf_token');
if (existingToken) setAuthToken(existingToken);

// Any 401 anywhere in the app -> force logout via a custom event the AuthContext listens for.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.dispatchEvent(new CustomEvent('uf:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default apiClient;