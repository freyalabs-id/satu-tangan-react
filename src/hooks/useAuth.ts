import { useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { queryClient } from '../lib/queryClient';

interface AuthResult {
  token: string;
  userId: string;
}

function storeSession(token: string, username: string) {
  localStorage.setItem('st_auth_token', token);
  localStorage.setItem('st_username', username);
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('st_auth_token'));
  const [username, setUsername] = useState<string>(() => localStorage.getItem('st_username') || '');

  useEffect(() => {
    function handleAuthCleared() {
      setToken(null);
      setUsername('');
    }
    window.addEventListener('st-auth-cleared', handleAuthCleared);
    return () => window.removeEventListener('st-auth-cleared', handleAuthCleared);
  }, []);

  const authenticate = useCallback(async (name: string, pin: string) => {
    queryClient.clear();
    const data = await api.post<AuthResult>('/api/auth', { username: name, pin });
    storeSession(data.token, name.toLowerCase());
    setToken(data.token);
    setUsername(name.toLowerCase());
  }, []);

  const logout = useCallback(() => {
    queryClient.clear();
    localStorage.removeItem('st_auth_token');
    localStorage.removeItem('st_username');
    setToken(null);
    setUsername('');
  }, []);

  return { token, username, authenticated: !!token, login: authenticate, register: authenticate, logout };
}
