import { NavigateFunction } from 'react-router-dom';
import { User } from './api';

/**
 * Redireciona o usuário para o dashboard apropriado baseado no seu role
 * 
 * @param user - Objeto do usuário com a propriedade role
 * @param navigate - Função de navegação do react-router-dom
 */
export function redirectToDashboard(user: User | null, navigate: NavigateFunction) {
  if (!user) {
    navigate('/');
    return;
  }

  if (user.role === 'admin') {
    navigate('/dashboard/admin');
  } else {
    // customer ou qualquer outro role vai para dashboard do cliente
    navigate('/dashboard/client');
  }
}

