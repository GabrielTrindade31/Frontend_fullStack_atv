import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient, type User, type RegisterData, type LoginData, type GoogleLoginData } from '@/lib/api';
import { authService } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  googleLogin: (data: GoogleLoginData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserFromStorage = useCallback(() => {
    const storedUser = authService.getUser();
    setUser(storedUser);
  }, []);

  const refreshUser = useCallback(async (silentFail = false) => {
    try {
      const accessToken = await authService.ensureValidToken();
      if (!accessToken) {
        if (!silentFail) {
          setUser(null);
        }
        return;
      }

      const userData = await apiClient.getMe(accessToken);
      setUser(userData);
      authService.setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      // Se silentFail for true, não limpa a autenticação (mantém o usuário do storage)
      if (!silentFail) {
        authService.clearAuth();
        setUser(null);
      } else {
        // Apenas loga o erro, mas mantém o usuário do storage
        if (import.meta.env.DEV) {
          console.warn('Erro ao atualizar dados do usuário, mantendo dados do storage');
        }
      }
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        loadUserFromStorage();
        
        // Verifica se há usuário no storage
        const storedUser = authService.getUser();

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
            }
          } else {
            // Token válido
            // Se já temos um usuário válido no storage, não precisa chamar getMe imediatamente
            // Apenas tenta atualizar em background (silentFail = true) sem bloquear
            if (storedUser) {
              // Tenta atualizar em background, mas não bloqueia o loading
              refreshUser(true).catch(() => {
                // Ignora erros em background
              });
              authService.startRefreshTimer();
            } else {
              // Se não temos usuário no storage, precisa buscar
              // Adiciona timeout de segurança
              const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 5000)
              );
              
              await Promise.race([refreshUser(), timeoutPromise]).catch(() => {
                // Se der timeout ou erro, mantém o estado atual
                if (import.meta.env.DEV) {
                  console.warn('Timeout ou erro ao buscar usuário, mantendo estado atual');
                }
              });
              authService.startRefreshTimer();
            }
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
        // Em caso de erro, limpa tudo para permitir acesso às páginas públicas
        authService.clearAuth();
        setUser(null);
      } finally {
        // Garante que o loading sempre termina
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [loadUserFromStorage, refreshUser]);

  const login = async (data: LoginData) => {
    try {
      const response = await apiClient.login(data);
      authService.setTokens(response.accessToken, response.refreshToken);
      authService.setUser(response.user);
      setUser(response.user);
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
      setUser(response.user);
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
      setUser(response.user);
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
    }
  };

  const isAdmin = user?.role === 'admin';
  const isCustomer = user?.role === 'customer';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        googleLogin,
        logout,
        refreshUser,
        isAdmin,
        isCustomer,
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

