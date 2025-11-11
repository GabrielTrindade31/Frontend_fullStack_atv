import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import TextType from "../components/shared/TextType";
import GoogleLoginButton from "../components/auth/GoogleLoginButton";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../contexts/ToastContext";
import { authService } from "../lib/auth";
import { redirectToDashboard } from "../lib/redirect";
import MagnetLines from "@/components/shared/MagnetLines";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { success, error: showError } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      // Mostra toast de sucesso ao fazer login
      success(`Login realizado com sucesso! Bem-vindo(a), ${user.name || 'usuário'}!`);
      // Redireciona baseado no role do usuário
      redirectToDashboard(user, navigate);
    }
  }, [isAuthenticated, authLoading, user, navigate, success]);

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
      // O toast e redirecionamento serão feitos pelo useEffect
    } catch (err: unknown) {
      const fallbackMessage = "Erro ao fazer login. Verifique suas credenciais.";
      let errorMessage = fallbackMessage;

      if (err && typeof err === "object" && "message" in err && typeof (err as { message?: unknown }).message === "string") {
        const message = (err as { message: string }).message;
        errorMessage = message.trim() ? message : fallbackMessage;
      }

      setError(errorMessage);
      showError(errorMessage);
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
  <div className="flex bg-white/10 backdrop-blur-md rounded-xl shadow-2xl max-w-5xl w-full border border-purple-500/40 overflow-hidden">
    {/* 📝 COLUNA ESQUERDA: LOGIN */}
    <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
      <h1 className="text-3xl font-bold mb-6 text-white text-center sm:text-left">
        Login
      </h1>

      <form className="space-y-4" onSubmit={handleSubmit}>
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

        <div className="mb-6">
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
              autoComplete="current-password"
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

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full bg-purple-500 text-white font-semibold py-2 rounded-lg transition duration-300 ease-in-out hover:bg-purple-400 hover:shadow-lg hover:shadow-purple-400/40 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      {/* Divisor */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-purple-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-purple-900/10 text-purple-300">ou</span>
        </div>
      </div>

      {/* Botão do Google */}
      <div className="mb-4">
        <GoogleLoginButton 
          onError={(errorMsg) => {
            setError(errorMsg);
            showError(errorMsg);
          }}
        />
      </div>

      <div className="mt-4 text-center">
        <Link
          to="/cadastro"
          className="text-sm text-purple-200 hover:text-purple-400"
        >
          Não possui uma conta? Cadastre-se
        </Link>
      </div>
    </div>

    {/* 🎨 COLUNA DIREITA */}
    <div className="hidden md:flex relative w-1/2 items-center justify-center e">
      <MagnetLines
        rows={9}
        columns={9}
        containerSize="60vmin"
        lineColor="white"
        lineWidth="0.8vmin"
        lineHeight="5vmin"
        baseAngle={0}
        style={{ margin: "2rem auto" }}
      />
      {/* brilho leve por cima */}
    </div>
  </div>
</div>

  );
}

