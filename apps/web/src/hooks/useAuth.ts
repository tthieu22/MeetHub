import { useEffect, useState, useCallback } from "react";
import { refreshAccessToken, logoutUser, getStoredToken, setStoredToken } from "@web/utils/auth.utils";

export const useAuth = () => {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    setAuthToken(token);
  }, []);

  const refreshToken = useCallback(async () => {
    if (isRefreshing) {
      return null;
    }

    setIsRefreshing(true);
    try {
      const newToken = await refreshAccessToken();
      if (newToken) {
        setAuthToken(newToken);
        return newToken;
      } else {
        logoutUser();
        return null;
      }
    } catch (error) {
      console.error('Failed to refresh token:', error);
      logoutUser();
      return null;
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing]);

  const updateToken = useCallback((token: string) => {
    setStoredToken(token);
    setAuthToken(token);
  }, []);

  const clearToken = useCallback(() => {
    logoutUser();
    setAuthToken(null);
  }, []);

  return { 
    authToken, 
    refreshToken, 
    updateToken, 
    clearToken,
    isRefreshing 
  };
};
