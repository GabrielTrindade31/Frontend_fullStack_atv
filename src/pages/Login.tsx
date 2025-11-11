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
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
  const hasGoogleClientId = googleClientId.trim().length > 0;
  const maskedGoogleClientId = hasGoogleClientId
    ? googleClientId.length > 12
      ? `${googleClientId.slice(0, 6)}…${googleClientId.slice(-6)}`
      : googleClientId
    : "";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showGoogleHelp, setShowGoogleHelp] = useState(!hasGoogleClientId);
  const [lastGoogleError, setLastGoogleError] = useState<string | null>(null);
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

  const handleTogglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleGoogleError = (errorMsg: string) => {
    const detailedMessage = errorMsg.includes("400")
      ? `${errorMsg} Verifique as instruções abaixo para alinhar o frontend e o backend.`
      : errorMsg;

    setLastGoogleError(errorMsg);
    setShowGoogleHelp(true);
    setError(detailedMessage);
    showError(detailedMessage);
  };

  const googleTroubleshootingSteps = [
    "Confirme no backend qual endpoint de login social está disponível (ex.: /auth/login/google ou /auth/google).",
    "Verifique no backend qual chave o corpo deve receber (idToken, token ou credential) e alinhe com a implementação atual.",
    "Certifique-se de que o Client ID configurado no Google Cloud Console é do tipo Web e corresponde ao valor usado no backend.",
    "Abra o console e a aba Network do navegador para capturar a resposta completa do erro 400 e ajustar conforme a documentação do backend.",
    "Consulte o arquivo TROUBLESHOOTING_GOOGLE_OAUTH.md no projeto para um passo a passo detalhado de configuração e depuração.",
  ];

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
              onClick={handleTogglePasswordVisibility}
              aria-pressed={showPassword}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-purple-200 hover:text-purple-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
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
        <GoogleLoginButton onError={handleGoogleError} />
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowGoogleHelp((prev) => !prev)}
          className="w-full text-left text-xs sm:text-sm font-semibold text-purple-200 hover:text-purple-100 transition"
        >
          {showGoogleHelp ? "Ocultar dicas para resolver o erro 400 do Google" : "Como resolver erros 400 no login com Google?"}
        </button>

        {showGoogleHelp && (
          <div className="rounded-lg border border-purple-500/40 bg-purple-950/40 p-4 text-xs sm:text-sm text-purple-100 space-y-3">
            {!hasGoogleClientId && (
              <p className="font-semibold text-purple-50">
                Nenhum Client ID do Google foi detectado. Configure a variável
                <code className="mx-1 rounded bg-purple-900 px-1 py-0.5">VITE_GOOGLE_CLIENT_ID</code>
                no arquivo <code>.env</code> e reinicie o servidor do frontend.
              </p>
            )}

            {hasGoogleClientId && maskedGoogleClientId && (
              <p className="text-purple-200">
                Client ID detectado: <span className="font-semibold break-all">{maskedGoogleClientId}</span>
              </p>
            )}

            {lastGoogleError && (
              <p className="text-red-300">
                Último erro recebido: <span className="font-semibold">{lastGoogleError}</span>
              </p>
            )}

            <ul className="list-disc space-y-2 pl-4">
              {googleTroubleshootingSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}
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

