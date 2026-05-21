import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api';

const TOKEN_KEY = 'smartcarrent_access_token';
const USER_KEY = 'smartcarrent_user';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
  },
});

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  localStorage.removeItem(TOKEN_KEY);
  delete api.defaults.headers.common.Authorization;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeUser(user) {
  if (!user) {
    localStorage.removeItem(USER_KEY);
    return;
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

const bootToken = getStoredToken();
if (bootToken) {
  setAuthToken(bootToken);
}

export { api };
