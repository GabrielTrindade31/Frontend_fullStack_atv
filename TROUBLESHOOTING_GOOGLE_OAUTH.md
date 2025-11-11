# 🔧 Troubleshooting: Erro 400 no Google OAuth

## 📍 Onde Ver os Logs

Os logs aparecem no **Console do Navegador**:

1. **Abra o Console**: Pressione `F12` ou `Ctrl + Shift + I` (Windows) / `Cmd + Option + I` (Mac)
2. **Vá para a aba Console**: Clique na aba "Console"
3. **Procure por logs**: Os logs aparecem quando você tenta fazer login com Google

### Logs que você verá:

```
GoogleLoginButton - Token recebido, fazendo login...
GoogleLogin - Enviando dados: { endpoint: '/auth/login/google', ... }
GoogleLogin - Erro detalhado: { message: '...', status: 400, ... }
```

## 🔍 Diagnóstico do Erro 400

O erro 400 (Bad Request) geralmente indica que:

1. **Endpoint incorreto**: O backend pode esperar um endpoint diferente
2. **Formato de dados incorreto**: O backend pode esperar um formato diferente
3. **Campo incorreto**: O backend pode esperar `token` em vez de `idToken`
4. **Backend não configurado**: O backend pode não estar configurado para Google OAuth

## ✅ Soluções Possíveis

### 1. Verificar o Endpoint no Backend

O frontend está enviando para `/auth/login/google`. Verifique se o backend tem este endpoint:

**Opções comuns:**
- `/auth/login/google` ✅ (atual)
- `/auth/google`
- `/auth/google/login`
- `/api/auth/google`

### 2. Verificar o Formato dos Dados

O frontend está enviando:
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIs..."
}
```

O backend pode esperar:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIs..."
}
```

ou

```json
{
  "credential": "eyJhbGciOiJSUzI1NiIs..."
}
```

### 3. Verificar a Configuração do Google OAuth

Certifique-se de que:
- O Google OAuth está configurado no backend
- O Client ID do Google está correto no backend
- As URLs autorizadas no Google Cloud Console incluem:
  - URL do frontend (ex: `https://frontend-full-stack-sistema.vercel.app`)
  - URL do backend (se necessário)

### 4. Verificar a Resposta do Backend

No console do navegador, veja a aba **Network**:
1. Abra o Console (`F12`)
2. Vá para a aba **Network**
3. Tente fazer login com Google
4. Procure pela requisição para `/auth/login/google`
5. Clique nela e veja:
   - **Headers**: Verifique a URL e os headers
   - **Payload**: Verifique o que está sendo enviado
   - **Response**: Veja a resposta do backend (pode ter mais detalhes do erro)

## 🔧 Correções no Código

Se o backend espera um formato diferente, você pode precisar ajustar o código:

### Se o backend espera `token` em vez de `idToken`:

Edite `src/lib/api.ts`:

```typescript
async googleLogin(data: GoogleLoginData): Promise<AuthResponse> {
  // Converte idToken para token se o backend espera 'token'
  const requestData = {
    token: data.idToken, // ou credential: data.idToken
  };
  
  const response = await this.request<AuthResponse>('/auth/login/google', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
  // ...
}
```

### Se o endpoint é diferente:

Edite `src/lib/api.ts`:

```typescript
async googleLogin(data: GoogleLoginData): Promise<AuthResponse> {
  const response = await this.request<AuthResponse>('/auth/google', { // Mudou aqui
    method: 'POST',
    body: JSON.stringify(data),
  });
  // ...
}
```

## 📝 Checklist

- [ ] Verifique o endpoint no Swagger/documentação do backend
- [ ] Verifique o formato dos dados esperado pelo backend
- [ ] Verifique se o Google OAuth está configurado no backend
- [ ] Verifique as URLs autorizadas no Google Cloud Console
- [ ] Veja os logs no console do navegador
- [ ] Veja a resposta do backend na aba Network
- [ ] Verifique se o `VITE_GOOGLE_CLIENT_ID` está configurado no Vercel

## 🎯 Próximos Passos

1. **Abra o Console do Navegador** (`F12`)
2. **Vá para a aba Network**
3. **Tente fazer login com Google**
4. **Veja a requisição falhada** e a resposta do backend
5. **Compartilhe**:
   - A URL do endpoint que está sendo chamado
   - O payload que está sendo enviado
   - A resposta do backend (erro completo)
   - A documentação do backend (Swagger) para o endpoint de Google OAuth

Com essas informações, podemos ajustar o código para corresponder ao que o backend espera.

