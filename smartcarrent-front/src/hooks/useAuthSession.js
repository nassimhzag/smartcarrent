import { useEffect, useMemo, useState } from 'react';
import { getStoredToken, getStoredUser, setAuthToken, storeUser } from '../api/client';
import { loginRequest, logoutRequest, meRequest, registerRequest } from '../services/authService';
import { verifyOtpRequest } from '../services/otpService';

function isAdmin(user) {
  return user?.role === 'admin';
}

function isUtilisateur(user) {
  return user?.role === 'utilisateur' || user?.role === 'client';
}

export default function useAuthSession() {
  const [user, setUser] = useState(getStoredUser());
  const [token, setToken] = useState(getStoredToken());
  const [booting, setBooting] = useState(Boolean(getStoredToken()));

  useEffect(() => {
    async function bootstrap() {
      if (!token) {
        setBooting(false);
        return;
      }

      try {
        const data = await meRequest();
        const nextUser = data?.user || null;
        setUser(nextUser);
        storeUser(nextUser);
      } catch (error) {
        setAuthToken(null);
        storeUser(null);
        setUser(null);
        setToken(null);
      } finally {
        setBooting(false);
      }
    }

    bootstrap();
  }, [token]);

  async function login(payload) {
    const data = await loginRequest(payload);

    const nextToken = data?.token;
    const nextUser = data?.user;

    if (nextToken) {
      setAuthToken(nextToken);
      setToken(nextToken);
    }

    if (nextUser) {
      setUser(nextUser);
      storeUser(nextUser);
    }

    return data;
  }

  async function register(payload) {
    const data = await registerRequest(payload);

    const nextToken = data?.token;
    const nextUser = data?.user;

    // Si la verification email est requise, le backend ne renvoie pas de token :
    // on ne stocke rien et la page Register redirige vers /verify-otp.
    if (nextToken) {
      setAuthToken(nextToken);
      setToken(nextToken);
      if (nextUser) {
        setUser(nextUser);
        storeUser(nextUser);
      }
    }

    return data;
  }

  async function verifyOtp(payload) {
    const data = await verifyOtpRequest(payload);

    const nextToken = data?.token;
    const nextUser = data?.user;

    if (nextToken) {
      setAuthToken(nextToken);
      setToken(nextToken);
    }

    if (nextUser) {
      setUser(nextUser);
      storeUser(nextUser);
    }

    return data;
  }

  async function logout() {
    try {
      await logoutRequest();
    } catch (error) {
      // Ignore logout network errors and clear local session anyway.
    }

    setAuthToken(null);
    storeUser(null);
    setUser(null);
    setToken(null);
  }

  return useMemo(
    () => ({
      user,
      token,
      booting,
      login,
      register,
      verifyOtp,
      logout,
      isAuthenticated: Boolean(token && user),
      isAdmin: isAdmin(user),
      isUtilisateur: isUtilisateur(user),
    }),
    [user, token, booting]
  );
}
