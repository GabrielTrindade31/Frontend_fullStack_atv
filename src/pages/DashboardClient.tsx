import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";

export default function ClientDashboard() {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    success("Logout realizado com sucesso. Até logo!");
    navigate("/");
  };

  // Mostra loading enquanto carrega
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] relative z-30">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  // Se não está autenticado, não deveria chegar aqui (ProtectedRoute bloqueia)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] relative z-30">
        <div className="text-white text-xl">Acesso negado</div>
      </div>
    );
  }

  // Se user não estiver disponível, mostra mensagem
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] relative z-30">
        <div className="text-white text-xl">Carregando dados do usuário...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full max-w-4xl mx-auto p-6 relative z-30">
      <div className="w-full bg-gray-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/60 p-8 relative z-30">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Dashboard do Cliente</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Sair
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-2">Informações do Usuário</h2>
            <div className="space-y-2 text-gray-300">
              <p><strong className="text-white">Nome:</strong> {user?.name}</p>
              <p><strong className="text-white">Email:</strong> {user?.email}</p>
              <p><strong className="text-white">Data de Nascimento:</strong> {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('pt-BR') : 'N/A'}</p>
              <p><strong className="text-white">Role:</strong> {user?.role}</p>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-4">
            <h2 className="text-xl font-semibold text-white mb-2">Bem-vindo ao Dashboard!</h2>
            <p className="text-gray-300">
              Esta é a área do cliente. Aqui você pode acessar a loja, contratar financiamentos e acompanhar seus pontos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

