// Normaliza a URL da API removendo barra final e garantindo formato correto
const getApiBaseUrl = (): string => {
  const url = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  // Remove barras no final
  return url.replace(/\/+$/, '');
};

const API_BASE_URL = getApiBaseUrl();

export interface User {
  id: string;
  email: string;
  name: string;
  dateOfBirth: string;
  googleId: string | null;
  role: 'client' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  permissions: string[];
}

// Interface para dados de registro no frontend (usa dateOfBirth)
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  dateOfBirth: string;
  role?: 'client' | 'admin';
}

// Interface para dados enviados ao backend (usa birthDate)
interface RegisterRequestData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  birthDate: string;
  role?: 'client' | 'admin';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GoogleLoginData {
  idToken: string;
}

export interface RefreshTokenData {
  refreshToken: string;
}

export interface ValidateTokenData {
  token: string;
}

export interface ValidateTokenResponse {
  valid: boolean;
  user: User;
  permissions: string[];
  token: {
    subject: string;
    email: string;
    role: string;
  };
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  // Traduz nomes de campos do backend para português
  private translateFieldName(field: string): string {
    const translations: Record<string, string> = {
      name: 'Nome',
      email: 'Email',
      password: 'Senha',
      confirmPassword: 'Confirmar Senha',
      birthDate: 'Data de Nascimento',
      dateOfBirth: 'Data de Nascimento',
      role: 'Perfil',
    };
    return translations[field] || field;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Garante que o endpoint começa com /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    // Remove barras duplas que possam ocorrer
    const url = `${this.baseURL}${normalizedEndpoint}`.replace(/([^:]\/)\/+/g, '$1');
    
    // Timeout de 30 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    // Se já houver um signal nas options, combina com o nosso
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }
    
    const config: RequestInit = {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      // Garante que não há redirecionamento automático que possa causar problemas com CORS
      redirect: 'error' as RequestRedirect,
    };

    let response: Response;
    try {
      response = await fetch(url, config);
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Tempo de requisição excedido. Verifique sua conexão.');
      }
      if (error instanceof TypeError) {
        if (error.message.includes('fetch')) {
          throw new Error('Erro de conexão. Verifique se o servidor está rodando e a URL da API está correta.');
        }
        if (error.message.includes('Failed to fetch')) {
          throw new Error(`Erro de conexão com a API. Verifique se a URL está correta: ${url}`);
        }
        if (error.message.includes('CORS')) {
          throw new Error('Erro de CORS. Verifique se o backend está configurado para aceitar requisições desta origem.');
        }
      }
      // Se for erro de redirecionamento, fornece mensagem mais clara
      if (error.message && error.message.includes('redirect')) {
        throw new Error(`Erro de redirecionamento. Verifique se a URL da API está correta (sem barra final): ${this.baseURL}`);
      }
      throw error;
    }

    // Verifica se houve redirecionamento (não deveria acontecer com redirect: 'error')
    if (response.redirected) {
      throw new Error(`A URL da API foi redirecionada. Verifique se a URL está correta: ${this.baseURL}`);
    }

    // Verifica se a resposta é do tipo CORS error (status 0 geralmente indica erro de CORS)
    if (response.status === 0) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'esta origem';
      throw new Error(`Erro de CORS. Verifique se o backend está configurado para aceitar requisições de ${origin}. URL da API: ${this.baseURL}`);
    }

    if (!response.ok) {
      let errorMessage = `Erro ${response.status}: ${response.statusText}`;
      let errorDetails: any = null;
      
      // Mensagens específicas para erros comuns
      if (response.status === 400) {
        errorMessage = 'Erro 400: Requisição inválida. Verifique se os dados estão no formato correto.';
      } else if (response.status === 404) {
        errorMessage = `Endpoint não encontrado: ${url}. Verifique se a URL da API está correta: ${this.baseURL}`;
      } else if (response.status === 422) {
        // Erro de validação - precisa extrair detalhes
        errorMessage = 'Erro de validação. Verifique os dados informados.';
      } else if (response.status === 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      } else if (response.status === 503) {
        errorMessage = 'Serviço temporariamente indisponível. Tente novamente mais tarde.';
      }
      
      // Clona a resposta para poder ler o JSON múltiplas vezes se necessário
      const responseClone = response.clone();
      
      try {
        const errorData = await responseClone.json();
        errorDetails = errorData;
        
        // Para erro 400 (Bad Request), tenta extrair detalhes
        if (response.status === 400) {
          if (errorData.message && typeof errorData.message === 'string') {
            errorMessage = `Erro 400: ${errorData.message}`;
          } else if (errorData.error && typeof errorData.error === 'string') {
            errorMessage = `Erro 400: ${errorData.error}`;
          } else if (errorData.detail && typeof errorData.detail === 'string') {
            errorMessage = `Erro 400: ${errorData.detail}`;
          } else if (typeof errorData === 'string') {
            errorMessage = `Erro 400: ${errorData}`;
          }
        }
        // Para erro 422, extrai mensagens de validação detalhadas
        else if (response.status === 422) {
          // Tenta diferentes formatos de resposta de validação
          if (errorData.message && typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (errorData.error && typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (Array.isArray(errorData.errors)) {
            // Formato: { errors: ["erro1", "erro2"] }
            errorMessage = errorData.errors.join('; ');
          } else if (errorData.errors && typeof errorData.errors === 'object') {
            // Formato: { errors: { field: ["msg"], field2: ["msg2"] } }
            const errorMessages: string[] = [];
            for (const [field, messages] of Object.entries(errorData.errors)) {
              if (Array.isArray(messages)) {
                errorMessages.push(...messages.map((msg: string) => `${this.translateFieldName(field)}: ${msg}`));
              } else if (typeof messages === 'string') {
                errorMessages.push(`${this.translateFieldName(field)}: ${messages}`);
              }
            }
            if (errorMessages.length > 0) {
              errorMessage = errorMessages.join('; ');
            }
          }
        } else {
          // Para outros erros, tenta diferentes formatos de mensagem
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (Array.isArray(errorData.errors)) {
            errorMessage = errorData.errors.join(', ');
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        }
      } catch (parseError) {
        // Se não conseguir parsear JSON, tenta ler como texto para 400 e 422
        if (response.status === 400 || response.status === 422) {
          try {
            const textResponse = response.clone();
            const text = await textResponse.text();
            if (text) {
              errorMessage = text || errorMessage;
            }
          } catch {
            // Ignora se não conseguir ler como texto
          }
        }
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).details = errorDetails;
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string }> {
    return this.request<{ status: string }>('/health/');
  }

  // Normaliza a resposta do backend para a interface User do frontend
  private normalizeUser(user: any): User {
    if (!user) {
      throw new Error('Usuário não encontrado na resposta do servidor');
    }
    return {
      ...user,
      // Converte birthDate (backend) para dateOfBirth (frontend) se necessário
      dateOfBirth: user.birthDate || user.dateOfBirth || '',
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    // Converte dateOfBirth para birthDate (formato esperado pelo backend)
    // Baseado no Swagger, o backend espera: name, email, password, confirmPassword, birthDate
    // O campo role não é enviado no cadastro (o backend define o role padrão)
    const requestData: RegisterRequestData = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      confirmPassword: data.confirmPassword,
      birthDate: data.dateOfBirth, // O backend espera birthDate no formato YYYY-MM-DD
    };
    
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(requestData),
    });
    
    // Normaliza a resposta para garantir que dateOfBirth está presente
    return {
      ...response,
      user: this.normalizeUser(response.user),
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Normaliza a resposta para garantir que dateOfBirth está presente
    return {
      ...response,
      user: this.normalizeUser(response.user),
    };
  }

  async googleLogin(data: GoogleLoginData): Promise<AuthResponse> {
    // Log para debug (apenas em desenvolvimento)
    if (typeof window !== 'undefined' && import.meta.env.DEV) {
      console.log('GoogleLogin - Enviando dados:', {
        endpoint: '/auth/login/google',
        hasIdToken: !!data.idToken,
        idTokenLength: data.idToken?.length,
        baseURL: this.baseURL,
        fullURL: `${this.baseURL}/auth/login/google`,
      });
    }
    
    try {
      // Prioriza o endpoint documentado no Swagger
      const response = await this.request<AuthResponse>('/auth/login/google', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      
      // Normaliza a resposta para garantir que dateOfBirth está presente
      return {
        ...response,
        user: this.normalizeUser(response.user),
      };
    } catch (error: any) {
      // Log detalhado do erro
      if (typeof window !== 'undefined' && import.meta.env.DEV) {
        console.error('GoogleLogin - Erro detalhado:', {
          message: error.message,
          status: error.status,
          details: error.details,
          endpoint: '/auth/login/google',
        });
        
        // Se for 404, tenta endpoint alternativo comumente usado
        if (error.status === 404) {
          console.warn('GoogleLogin - Endpoint /auth/login/google não encontrado. Tentando /auth/google como fallback.');
        }
      }

      // Fallback para implementações que utilizam /auth/google
      if (error.status === 404) {
        const response = await this.request<AuthResponse>('/auth/google', {
          method: 'POST',
          body: JSON.stringify(data),
        });
        return {
          ...response,
          user: this.normalizeUser(response.user),
        };
      }

      throw error;
    }
  }

  async refreshToken(data: RefreshTokenData): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/token/refresh', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Normaliza a resposta para garantir que dateOfBirth está presente
    return {
      ...response,
      user: this.normalizeUser(response.user),
    };
  }

  async logout(data: RefreshTokenData): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(accessToken: string): Promise<{ user: User; permissions: string[] }> {
    const response = await this.request<{ user: User; permissions: string[] }>('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    // Verifica se a resposta tem user antes de normalizar
    if (!response || !response.user) {
      throw new Error('Resposta inválida do servidor: usuário não encontrado');
    }
    
    // Normaliza a resposta para garantir que dateOfBirth está presente
    return {
      ...response,
      user: this.normalizeUser(response.user),
    };
  }

  async validateToken(data: ValidateTokenData): Promise<ValidateTokenResponse> {
    const response = await this.request<ValidateTokenResponse>('/auth/token/introspect', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    // Normaliza a resposta se houver user
    if (response.user) {
      return {
        ...response,
        user: this.normalizeUser(response.user),
      };
    }
    
    return response;
  }

  async getUsers(accessToken: string): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('/auth/users', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  async getUserById(accessToken: string, id: string): Promise<{ user: User; permissions: string[] }> {
    const response = await this.request<{ user: User; permissions: string[] }>(`/auth/users/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    // Normaliza a resposta para garantir que dateOfBirth está presente
    return {
      ...response,
      user: this.normalizeUser(response.user),
    };
  }
}

export const apiClient = new ApiClient(API_BASE_URL);


