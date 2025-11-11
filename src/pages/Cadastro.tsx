import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import { authService } from "../lib/auth";
import { redirectToDashboard } from "../lib/redirect";

interface RegisterForm {
  firstName: string;
  lastName: string;
  email: string;
  birthDate: string;
  password: string;
  confirmPassword: string;
}

export default function CadastroPage() {
  const [form, setForm] = useState<RegisterForm>({
    firstName: "",
    lastName: "",
    email: "",
    birthDate: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Mostra toast de sucesso ao cadastrar
      success(`Conta criada com sucesso! Bem-vindo(a), ${user.name || 'usuário'}!`);
      // Redireciona baseado no role do usuário
      redirectToDashboard(user, navigate);
    }
  }, [isAuthenticated, authLoading, user, navigate, success]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value } as RegisterForm));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!form.firstName || form.firstName.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
      setIsLoading(false);
      return;
    }

    if (!form.lastName || form.lastName.trim().length < 2) {
      setError("Sobrenome deve ter pelo menos 2 caracteres");
      setIsLoading(false);
      return;
    }

    const emailValidation = authService.validateEmail(form.email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || "Email inválido");
      setIsLoading(false);
      return;
    }

    if (!form.birthDate) {
      setError("Data de nascimento é obrigatória");
      setIsLoading(false);
      return;
    }

    if (form.birthDate > today) {
      setError("Data de nascimento não pode ser no futuro");
      setIsLoading(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("As senhas não conferem");
      setIsLoading(false);
      return;
    }

    const passwordValidation = authService.validatePassword(form.password);
    if (!passwordValidation.valid) {
      setError(passwordValidation.error || "Senha inválida");
      setIsLoading(false);
      return;
    }

    try {
      await register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        birthDate: form.birthDate
      });
      // O toast e redirecionamento serão feitos pelo useEffect
    } catch (err: unknown) {
      // Exibe a mensagem de erro retornada pelo backend
      const fallbackMessage = "Erro ao cadastrar. Tente novamente.";
      let errorMessage = fallbackMessage;

      if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
        const message = (err as { message: string }).message;
        errorMessage = message.trim() ? message : fallbackMessage;
      }

      setError(errorMessage);
      showError(errorMessage);

      // Log para debug (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        const devError = err as Record<string, unknown> | null;
        console.error('Erro no cadastro:', {
          message: devError && typeof devError.message === 'string' ? devError.message : errorMessage,
          status: devError?.status,
          details: devError?.details,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 w-full min-h-screen ">
      {/* Card principal */}
      <div className="flex bg-white/10 backdrop-blur-md rounded-xl shadow-2xl max-w-3xl w-full border border-purple-500/40 overflow-hidden">
        <div className="w-full p-8 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-6 text-purple-200 text-center sm:text-left">
            Crie sua conta
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-bold text-purple-200 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="Seu nome"
                  autoComplete="given-name"
                  className="w-full px-3 py-2 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-bold text-purple-200 mb-1">
                  Sobrenome
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Seu sobrenome"
                  autoComplete="family-name"
                  className="w-full px-3 py-2 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                  minLength={2}
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-bold text-purple-200 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                autoComplete="email"
                className="w-full px-3 py-2 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="birthDate" className="block text-sm font-bold text-purple-200 mb-1">
                Data de nascimento
              </label>
              <input
                type="date"
                id="birthDate"
                value={form.birthDate}
                onChange={handleChange}
                autoComplete="bday"
                max={today}
                className="w-full px-3 py-2 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-bold text-purple-200 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="********"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-24 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-purple-200 hover:text-purple-100"
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-purple-200 mb-1">
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="********"
                  autoComplete="new-password"
                  className="w-full px-3 py-2 pr-24 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-purple-200 hover:text-purple-100"
                >
                  {showConfirmPassword ? "Ocultar" : "Mostrar"}
                </button>
              </div>
            </div>

            {error && <p className="text-pink-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-500 text-white font-semibold py-2 rounded-lg transition duration-300 ease-in-out hover:bg-purple-400 hover:shadow-lg hover:shadow-purple-400/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Cadastrando..." : "Cadastrar"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <Link 
              to="/" 
              className="text-sm text-purple-200 hover:text-purple-400"
            >
              Já possui uma conta? Faça login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
