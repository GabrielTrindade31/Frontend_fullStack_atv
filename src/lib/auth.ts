import { apiClient, type User } from './api';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

export class AuthService {
  private refreshTimer: NodeJS.Timeout | null = null;

  // Armazenamento seguro de tokens
  setTokens(accessToken: string, refreshToken: string) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  }

  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }

  setUser(user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }

  getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem(USER_KEY);
      if (!userStr) return null;
      try {
        return JSON.parse(userStr);
      } catch {
        // Se houver erro ao parsear, limpa o storage corrompido
        localStorage.removeItem(USER_KEY);
        return null;
      }
    }
    return null;
  }

  clearAuth() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
    this.stopRefreshTimer();
  }

  // Validação de email
  validateEmail(email: string): { valid: boolean; error?: string } {
    if (!email || email.trim() === '') {
      return { valid: false, error: 'Email é obrigatório' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Email inválido' };
    }
    return { valid: true };
  }


  // Validação de senha conforme especificação
  validatePassword(password: string): { valid: boolean; error?: string } {
    if (!password || password.length < 8) {
      return { valid: false, error: 'A senha deve ter no mínimo 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: 'A senha deve conter pelo menos uma letra maiúscula' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, error: 'A senha deve conter pelo menos uma letra minúscula' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: 'A senha deve conter pelo menos um número' };
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      return { valid: false, error: 'A senha deve conter pelo menos um caractere especial' };
    }
    return { valid: true };
  }

  // Decodifica JWT para verificar expiração
  private decodeJWT(token: string): { exp?: number } | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    const decoded = this.decodeJWT(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  }

  // Refresh automático de token
  async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const response = await apiClient.refreshToken({ refreshToken });
      this.setTokens(response.accessToken, response.refreshToken);
      this.setUser(response.user);
      this.startRefreshTimer();
      return true;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      this.clearAuth();
      return false;
    }
  }

  // Inicia timer para refresh automático (15 minutos = 900000ms)
  startRefreshTimer() {
    this.stopRefreshTimer();
    // Refresh 1 minuto antes da expiração (14 minutos)
    this.refreshTimer = setTimeout(() => {
      this.refreshAccessToken();
    }, 14 * 60 * 1000);
  }

  stopRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  // Verifica e renova token se necessário
  async ensureValidToken(): Promise<string | null> {
    let accessToken = this.getAccessToken();
    
    if (!accessToken || this.isTokenExpired(accessToken)) {
      const refreshed = await this.refreshAccessToken();
      if (!refreshed) return null;
      accessToken = this.getAccessToken();
    }

    return accessToken;
  }
}

export const authService = new AuthService();

