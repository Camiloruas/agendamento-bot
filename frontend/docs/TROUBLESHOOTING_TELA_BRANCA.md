# Soluções para Tela Branca no Gerenciar Serviços

## Problema
A tela fica branca ao clicar em "Gerenciar Serviços" no Dashboard.

## Possíveis Causas e Soluções

### 1. Erro de CORS ou Conexão com Backend

**Verificar:**
- O backend está rodando em `http://localhost:3001`?
- Abra o console do navegador (F12) e veja se há erros de rede

**Solução:**
```bash
# Certifique-se que o backend está rodando
cd backend
npm run dev
```

### 2. Erro no Console do Navegador

**Como verificar:**
1. Abra o navegador
2. Pressione F12 para abrir o DevTools
3. Vá na aba "Console"
4. Clique em "Gerenciar Serviços"
5. Veja qual erro aparece

**Erros comuns:**
- `Failed to fetch` - Backend não está rodando
- `CORS error` - Problema de CORS (improvável, já que está configurado)
- `Cannot read property` - Erro no código JavaScript

### 3. Limpar Cache do Navegador

Às vezes o navegador mantém uma versão antiga do código em cache.

**Solução:**
1. Pressione Ctrl+Shift+R (ou Cmd+Shift+R no Mac) para recarregar sem cache
2. Ou limpe o cache do navegador nas configurações

### 4. Reiniciar o Frontend

```bash
# Pare o frontend (Ctrl+C)
# Depois reinicie
cd frontend
npm run dev
```

## Teste Rápido

Para verificar se o backend está funcionando, execute:

```bash
curl http://localhost:3001/api/servicos
```

Se retornar um array (mesmo que vazio `[]`), o backend está OK.

## Se Nada Funcionar

Me envie:
1. O erro que aparece no console do navegador (F12 → Console)
2. O erro que aparece no terminal do backend (se houver)
3. O erro que aparece no terminal do frontend (se houver)
