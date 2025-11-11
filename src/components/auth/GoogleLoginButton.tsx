import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options?: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: string;
              locale?: string;
            }
          ) => void;
          prompt: (notification?: () => void) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleLoginButtonProps {
  onError?: (error: string) => void;
}

export default function GoogleLoginButton({ onError }: GoogleLoginButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const { googleLogin } = useAuth();

  // Carrega o script do Google Identity Services
  useEffect(() => {
    // Verifica se o Google já está carregado
    if (window.google?.accounts?.id) {
      setIsGoogleLoaded(true);
      return;
    }

    // Aguarda o carregamento do script
    const checkGoogle = setInterval(() => {
      if (window.google?.accounts?.id) {
        setIsGoogleLoaded(true);
        clearInterval(checkGoogle);
      }
    }, 100);

    // Timeout de segurança
    const timeout = setTimeout(() => {
      clearInterval(checkGoogle);
      if (!window.google?.accounts?.id) {
        console.error('Google Identity Services não carregou');
        onError?.('Erro ao carregar Google Identity Services');
      }
    }, 10000);

    return () => {
      clearInterval(checkGoogle);
      clearTimeout(timeout);
    };
  }, [onError]);

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    if (!response.credential) {
      onError?.('Token do Google não recebido');
      return;
    }

    setIsLoading(true);

    try {
      // Log para debug
      console.log('GoogleLoginButton - Token recebido, fazendo login...', {
        tokenLength: response.credential.length,
        tokenPrefix: response.credential.substring(0, 20) + '...',
      });
      
      await googleLogin({ idToken: response.credential });
      // O redirecionamento será feito pelo useEffect na página de Login
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      
      // Mensagem de erro mais detalhada
      let errorMessage = 'Erro ao fazer login com Google';
      
      if (error.status === 400) {
        errorMessage = 'Erro 400: Requisição inválida. Verifique se o Google OAuth está configurado corretamente no backend.';
      } else if (error.status === 401) {
        errorMessage = 'Erro 401: Não autorizado. Token do Google inválido ou expirado.';
      } else if (error.status === 404) {
        errorMessage = 'Erro 404: Endpoint não encontrado. Verifique se o backend está rodando e a URL está correta.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [googleLogin, onError]);

  // Inicializa o botão do Google quando estiver pronto
  useEffect(() => {
    if (!isGoogleLoaded || !buttonRef.current) return;

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!googleClientId) {
      console.error('VITE_GOOGLE_CLIENT_ID não configurado');
      onError?.('Configuração do Google não encontrada');
      return;
    }

    try {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleCredentialResponse,
      });

      window.google?.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: '100%',
      });
    } catch (error) {
      console.error('Erro ao inicializar Google Login:', error);
      onError?.('Erro ao inicializar login com Google');
    }
  }, [isGoogleLoaded, handleCredentialResponse, onError]);

  if (!isGoogleLoaded) {
    return (
      <div className="w-full flex items-center justify-center py-2">
        <div className="text-gray-400 text-sm">Carregando Google...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div ref={buttonRef} className="w-full flex justify-center"></div>
      {isLoading && (
        <div className="mt-2 text-center text-sm text-gray-400">
          Fazendo login...
        </div>
      )}
    </div>
  );
}

