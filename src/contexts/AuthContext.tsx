import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, type User, type RegisterData, type LoginData, type GoogleLoginData } from '@/lib/api';
import { authService } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  permissions: string[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (data: GoogleLoginData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  isAdmin: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserFromStorage = useCallback(() => {
    const storedUser = authService.getUser();
    const storedPermissions = authService.getPermissions();
    setUser(storedUser);
    setPermissions(storedPermissions);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const accessToken = await authService.ensureValidToken();
      if (!accessToken) {
        setUser(null);
        setPermissions([]);
        return;
      }

      const data = await apiClient.getMe(accessToken);
      setUser(data.user);
      setPermissions(data.permissions);
      authService.setUser(data.user);
      authService.setPermissions(data.permissions);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      authService.clearAuth();
      setUser(null);
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      loadUserFromStorage();

      // Verifica se há tokens e tenta validar
      const accessToken = authService.getAccessToken();
      if (accessToken) {
        if (authService.isTokenExpired(accessToken)) {
          // Tenta renovar
          const refreshed = await authService.refreshAccessToken();
          if (refreshed) {
            await refreshUser();
          } else {
            authService.clearAuth();
            setUser(null);
            setPermissions([]);
          }
        } else {
          // Token válido, carrega dados do usuário
          await refreshUser();
          authService.startRefreshTimer();
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, [loadUserFromStorage, refreshUser]);

  const login = async (data: LoginData) => {
    try {
      const response = await apiClient.login(data);
      authService.setTokens(response.accessToken, response.refreshToken);
      authService.setUser(response.user);
      authService.setPermissions(response.permissions);
      setUser(response.user);
      setPermissions(response.permissions);
      authService.startRefreshTimer();
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.register(data);
      authService.setTokens(response.accessToken, response.refreshToken);
      authService.setUser(response.user);
      authService.setPermissions(response.permissions);
      setUser(response.user);
      setPermissions(response.permissions);
      authService.startRefreshTimer();
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao cadastrar');
    }
  };

  const googleLogin = async (data: GoogleLoginData) => {
    try {
      const response = await apiClient.googleLogin(data);
      authService.setTokens(response.accessToken, response.refreshToken);
      authService.setUser(response.user);
      authService.setPermissions(response.permissions);
      setUser(response.user);
      setPermissions(response.permissions);
      authService.startRefreshTimer();
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer login com Google');
    }
  };

  const logout = async () => {
    try {
      const refreshToken = authService.getRefreshToken();
      if (refreshToken) {
        await apiClient.logout({ refreshToken });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      // Desconecta do Google se estiver disponível
      if (typeof window !== 'undefined' && window.google?.accounts?.id) {
        try {
          window.google.accounts.id.disableAutoSelect();
        } catch (error) {
          console.error('Erro ao desconectar do Google:', error);
        }
      }
      
      authService.clearAuth();
      setUser(null);
      setPermissions([]);
    }
  };

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission);
  }, [permissions]);

  const isAdmin = user?.role === 'admin';
  const isClient = user?.role === 'client';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isLoading,
        isAuthenticated,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
        hasPermission,
        isAdmin,
        isClient,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}

