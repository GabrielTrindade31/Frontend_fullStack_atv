# 🔍 Como Ver os Logs de Debug

## 📍 Onde Ver os Logs

Os logs aparecem no **Console do Navegador**. Siga estes passos:

### 1. Abrir o Console do Navegador

**Chrome/Edge:**
- Pressione `F12` ou `Ctrl + Shift + I` (Windows/Linux)
- Ou `Cmd + Option + I` (Mac)
- Clique na aba **Console**

**Firefox:**
- Pressione `F12` ou `Ctrl + Shift + K` (Windows/Linux)
- Ou `Cmd + Option + K` (Mac)
- Clique na aba **Console**

**Safari:**
- Pressione `Cmd + Option + C` (Mac)
- Ou vá em **Desenvolvedor** → **Mostrar Console JavaScript**

### 2. O que Procurar nos Logs

#### Logs do ProtectedRoute
Procure por:
```
ProtectedRoute - Estado: { ... }
```

Isso mostra:
- `requireAdmin`: Se a rota requer admin
- `requireClient`: Se a rota requer cliente
- `isLoading`: Se está carregando
- `isAuthenticated`: Se está autenticado
- `isAdmin`: Se o usuário é admin
- `isClient`: Se o usuário é cliente
- `userRole`: O role do usuário
- `user`: Objeto completo do usuário

#### Logs do AdminDashboard
Procure por:
```
AdminDashboard - Estado: { ... }
```

Isso mostra:
- `user`: Objeto do usuário
- `isLoading`: Se está carregando
- `isAuthenticated`: Se está autenticado
- `isAdmin`: Se é admin
- `userRole`: O role do usuário

#### Logs do GoogleLogin
Procure por:
```
GoogleLoginButton - Token recebido, fazendo login...
GoogleLogin - Enviando dados: { ... }
GoogleLogin - Erro detalhado: { ... }
```

### 3. Filtrar os Logs

No console, você pode:
- **Filtrar por texto**: Digite no campo de busca (ex: "ProtectedRoute", "AdminDashboard")
- **Filtrar por tipo**: Clique nos ícones para mostrar apenas erros, avisos, etc.
- **Limpar o console**: Clique no ícone de limpar (🚫) ou pressione `Ctrl + L`

### 4. Ver Detalhes dos Erros

Se houver erros, eles aparecerão em **vermelho** no console. Clique neles para ver:
- Mensagem de erro
- Stack trace (onde o erro ocorreu)
- Detalhes adicionais

## 🔧 Logs em Produção

**Importante**: Os logs de debug só aparecem em **desenvolvimento** (quando `import.meta.env.DEV` é `true`).

Em produção, os logs não aparecem para não poluir o console do usuário.

## 🐛 Troubleshooting

### Não vejo logs no console

1. **Verifique se está em desenvolvimento**: Os logs só aparecem quando `import.meta.env.DEV === true`
2. **Verifique se o console está aberto**: Certifique-se de que a aba Console está selecionada
3. **Limpe o console**: Pode haver muitos logs antigos
4. **Recarregue a página**: Os logs aparecem quando os componentes são renderizados

### Vejo erros no console

1. **Copie a mensagem de erro completa**
2. **Veja o stack trace**: Isso mostra onde o erro ocorreu
3. **Verifique a aba Network**: Veja se há requisições falhando
4. **Verifique a aba Application**: Veja se há dados no localStorage

## 📸 Capturar Screenshots

Se precisar de ajuda, capture:
1. **Screenshot do console** com os logs
2. **Screenshot da aba Network** (se houver erros de requisição)
3. **Screenshot da aba Application** → **Local Storage** (para ver os dados armazenados)

## 🎯 Exemplo de Logs

### Log Normal (Sucesso)
```
ProtectedRoute - Estado: {
  requireAdmin: true,
  requireClient: false,
  isLoading: false,
  isAuthenticated: true,
  isAdmin: true,
  isClient: false,
  userRole: "admin",
  user: { id: "...", name: "...", email: "...", role: "admin" }
}
```

### Log de Erro
```
GoogleLogin - Erro detalhado: {
  message: "Erro 400: Requisição inválida",
  status: 400,
  details: { error: "Invalid token" }
}
```

## 📝 Notas

- Os logs são **apenas para debug** e não devem ser commitados em produção
- Em produção, use um serviço de monitoramento (como Sentry) para rastrear erros
- Os logs podem conter informações sensíveis - não compartilhe logs públicos

