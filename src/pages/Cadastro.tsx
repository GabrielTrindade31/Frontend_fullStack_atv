import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../lib/auth";
import { redirectToDashboard } from "../lib/redirect";

export default function CadastroPage() {
  const [form, setForm] = useState({ 
    name: "", 
    email: "", 
    password: "", 
    confirmPassword: "",
    dateOfBirth: ""
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { register, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Redireciona baseado no role do usuário
      redirectToDashboard(user, navigate);
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const emailValidation = authService.validateEmail(form.email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || "Email inválido");
      setIsLoading(false);
      return;
    }

    if (!form.name || form.name.trim().length < 2) {
      setError("Nome deve ter pelo menos 2 caracteres");
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

    const dateValidation = authService.validateDateOfBirth(form.dateOfBirth);
    if (!dateValidation.valid) {
      setError(dateValidation.error || "Data de nascimento inválida");
      setIsLoading(false);
      return;
    }

    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        dateOfBirth: form.dateOfBirth,
        role: 'client'
      });
    } catch (err: any) {
      // Exibe a mensagem de erro retornada pelo backend
      const errorMessage = err.message || "Erro ao cadastrar. Tente novamente.";
      setError(errorMessage);
      
      // Log para debug (apenas em desenvolvimento)
      if (import.meta.env.DEV) {
        console.error('Erro no cadastro:', {
          message: err.message,
          status: err.status,
          details: err.details,
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
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-bold text-purple-200 mb-1">
                Nome
              </label>
              <input
                type="text"
                id="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Seu nome"
                autoComplete="name"
                className="w-full px-3 py-2 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
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
              <label htmlFor="password" className="block text-sm font-bold text-purple-200 mb-1">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={form.password}
                onChange={handleChange}
                placeholder="********"
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>

            <div className="mb-4">
              <label htmlFor="dateOfBirth" className="block text-sm font-bold text-purple-200 mb-1">
                Data de Nascimento
              </label>
              <input
                type="date"
                id="dateOfBirth"
                value={form.dateOfBirth}
                onChange={handleChange}
                autoComplete="bday"
                className="w-full px-3 py-2 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-bold text-purple-200 mb-1">
                Confirmar Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-purple-500/50 rounded-lg bg-purple-950/60 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
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
