import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import TextType from "../components/shared/TextType";
import MetaBalls from "../components/shared/MetaBalls";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../lib/auth";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Redireciona baseado no role
      if (user?.role === 'admin') {
        navigate('/dashboard/admin');
      } else {
        navigate('/dashboard/client');
      }
    }
  }, [isAuthenticated, authLoading, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validação básica de email
    const emailValidation = authService.validateEmail(form.email);
    if (!emailValidation.valid) {
      setError(emailValidation.error || "Email inválido");
      setIsLoading(false);
      return;
    }

    if (!form.password || form.password.length === 0) {
      setError("Senha é obrigatória");
      setIsLoading(false);
      return;
    }

    try {
      await login(form);
      // O redirecionamento será feito pelo useEffect
    } catch (err: any) {
      setError(err.message || "Erro ao fazer login. Verifique suas credenciais.");
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
    <div className="flex flex-col items-center justify-center gap-6 w-full">
      <div className="text-center mb-4">
        <TextType
          text={[
            "Bem-vindo(a) ",
            "Conecte-se e comece a usar!",
            "Acesse sua conta",
          ]}
          typingSpeed={60}
          pauseDuration={1200}
          showCursor={true}
          cursorCharacter="_"
          className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg tracking-wide"
        />
      </div>

      {/* 🧩 Card principal */}
      <div className="flex bg-gray-800 backdrop-blur-md rounded-xl shadow-2xl max-w-5xl w-full border border-gray-700/60 overflow-hidden">
        {/* 📝 COLUNA ESQUERDA: LOGIN */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <h1 className="text-3xl font-bold mb-6 text-white text-center sm:text-left">
            Login
          </h1>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-bold text-white mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-bold text-white mb-1">
                Senha
              </label>
              <input
                type="password"
                id="password"
                value={form.password}
                onChange={handleChange}
                placeholder="********"
                className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-emerald-400 text-gray-950 font-semibold py-2 rounded-lg transition duration-300 ease-in-out hover:cursor-pointer hover:bg-cyan-500 hover:text-white hover:shadow-lg hover:shadow-cyan-500/50 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">ou</span>
            </div>
          </div>

          {/* Botão do Google */}
          <div className="mb-4">
            <GoogleLoginButton 
              onError={(errorMsg) => setError(errorMsg)}
            />
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/cadastro"
              className="text-sm text-white hover:text-emerald-400"
            >
              Não possui uma conta? Cadastre-se
            </Link>
          </div>
        </div>

        <div className="hidden md:flex relative w-1/2 items-center justify-center">
          <MetaBalls
            color="#ffffff"
            cursorBallColor="#00ffff"
            cursorBallSize={2}
            ballCount={18}
            animationSize={30}
            enableMouseInteraction={true}
            enableTransparency={true}
            hoverSmoothness={0.08}
            clumpFactor={1}
            speed={0.1}
          />

          {/* brilho leve por cima */}
          <div className="absolute inset-0 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

