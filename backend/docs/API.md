# Documentação da API - Agendamento Bot

Base URL: `http://localhost:3001/api`

## Índice
- [Autenticação](#autenticação)
- [Profissionais](#profissionais)
- [Clientes](#clientes)
- [Agendamentos](#agendamentos)
- [Horários](#horários)
- [Serviços](#serviços)

---

## Autenticação

A maioria das rotas requer autenticação via JWT. Após fazer login, inclua o token no header:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

---

## Profissionais

### 1. Registrar Profissional
**POST** `/profissionais/register`

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "senha": "senha123",
  "telefone": "5511999999999"
}
```

**Resposta (201):**
```json
{
  "id": "uuid-aqui",
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "telefone": "5511999999999",
  "createdAt": "2025-11-29T20:00:00.000Z",
  "updatedAt": "2025-11-29T20:00:00.000Z"
}
```

### 2. Login
**POST** `/profissionais/login`

**Body:**
```json
{
  "email": "joao@exemplo.com",
  "senha": "senha123"
}
```

**Resposta (200):**
```json
{
  "message": "Login bem-sucedido.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "profissional": {
    "id": "uuid-aqui",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "telefone": "5511999999999"
  }
}
```

### 3. Listar Todos os Profissionais
**GET** `/profissionais`
**Headers:** `Authorization: Bearer TOKEN`

**Resposta (200):**
```json
[
  {
    "id": "uuid-1",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "telefone": "5511999999999",
    "createdAt": "2025-11-29T20:00:00.000Z",
    "updatedAt": "2025-11-29T20:00:00.000Z"
  }
]
```

### 4. Ver Perfil
**GET** `/profissionais/profile`
**Headers:** `Authorization: Bearer TOKEN`

**Resposta (200):**
```json
{
  "id": "uuid-aqui",
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "telefone": "5511999999999",
  "createdAt": "2025-11-28T10:00:00.000Z",
  "updatedAt": "2025-11-28T10:00:00.000Z"
}
```

### 5. Atualizar Perfil
**PUT** `/profissionais/profile`
**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "nome": "João Silva Atualizado",
  "email": "joao.novo@exemplo.com",
  "telefone": "5511988888888"
}
```

**Resposta (200):**
```json
{
  "message": "Perfil atualizado com sucesso.",
  "profissional": {
    "id": "uuid-aqui",
    "nome": "João Silva Atualizado",
    "email": "joao.novo@exemplo.com",
    "telefone": "5511988888888",
    "createdAt": "2025-11-28T10:00:00.000Z",
    "updatedAt": "2025-11-29T20:30:00.000Z"
  }
}
```

### 6. Alterar Senha
**PUT** `/profissionais/password`
**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "currentPassword": "senha123",
  "newPassword": "novaSenha456"
}
```

**Resposta (200):**
```json
{
  "message": "Senha atualizada com sucesso."
}
```

### 7. Deletar Profissional
**DELETE** `/profissionais/:id`
**Headers:** `Authorization: Bearer TOKEN`

**Exemplo:** `/profissionais/uuid-do-profissional`

**Resposta (200):**
```json
{
  "message": "Profissional deletado com sucesso.",
  "id": "uuid-do-profissional"
}
```

---

## Clientes

### 1. Criar Cliente
**POST** `/clientes`
**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "nome": "Maria Santos",
  "telefone": "5511977777777",
  "email": "maria@exemplo.com"
}
```

**Resposta (201):**
```json
{
  "id": "uuid-cliente",
  "nome": "Maria Santos",
  "telefone": "5511977777777",
  "email": "maria@exemplo.com"
}
```

### 2. Listar Todos os Clientes
**GET** `/clientes`
**Headers:** `Authorization: Bearer TOKEN`

### 3. Buscar Cliente por Telefone
**GET** `/clientes/by-phone?telefone=5511977777777`
**Headers:** `Authorization: Bearer TOKEN`

### 4. Buscar Cliente por ID
**GET** `/clientes/:id`
**Headers:** `Authorization: Bearer TOKEN`

### 5. Atualizar Cliente
**PUT** `/clientes/:id`
**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "nome": "Maria Santos Atualizada",
  "email": "maria.nova@exemplo.com"
}
```

### 6. Deletar Cliente
**DELETE** `/clientes/:id`
**Headers:** `Authorization: Bearer TOKEN`

---

## Agendamentos

### 1. Criar Agendamento
**POST** `/agendamentos`
**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "clienteId": "uuid-do-cliente",
  "dataHora": "2025-12-01T14:00:00.000Z",
  "servico": "Corte de Cabelo",
  "descricao": "Cliente prefere corte curto"
}
```

**Resposta (201):**
```json
{
  "id": "uuid-agendamento",
  "profissionalId": "uuid-profissional",
  "clienteId": "uuid-cliente",
  "dataHora": "2025-12-01T14:00:00.000Z",
  "servico": "Corte de Cabelo",
  "status": "Pendente",
  "descricao": "Cliente prefere corte curto"
}
```

### 2. Listar Todos os Agendamentos
**GET** `/agendamentos`
**Headers:** `Authorization: Bearer TOKEN`

### 3. Buscar Agendamentos por Data
**GET** `/agendamentos/by-date?date=2025-12-01`
**Headers:** `Authorization: Bearer TOKEN`

### 4. Buscar Agendamento por ID
**GET** `/agendamentos/:id`
**Headers:** `Authorization: Bearer TOKEN`

### 5. Atualizar Agendamento
**PUT** `/agendamentos/:id`
**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "dataHora": "2025-12-01T15:00:00.000Z",
  "status": "Confirmado",
  "descricao": "Horário alterado"
}
```

### 6. Deletar Agendamento
**DELETE** `/agendamentos/:id`
**Headers:** `Authorization: Bearer TOKEN`

### 7. Buscar Agendamentos de um Cliente
**GET** `/agendamentos/cliente/:clienteId`
**Headers:** `Authorization: Bearer TOKEN`

### 8. Verificar se Cliente tem Agendamento Ativo
**GET** `/agendamentos/has-active-appointment/:clienteId`
**Headers:** `Authorization: Bearer TOKEN`

**Resposta (200):**
```json
{
  "hasActiveAppointment": true,
  "agendamento": {
    "id": "uuid",
    "dataHora": "2025-12-01T14:00:00.000Z",
    "servico": "Corte de Cabelo",
    "status": "Pendente"
  }
}
```

---

## Horários

### 1. Ver Horários do Profissional
**GET** `/horarios`
**Headers:** `Authorization: Bearer TOKEN`

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "profissionalId": "uuid-prof",
    "diaDaSemana": 1,
    "ativo": true,
    "horarioInicio": "09:00",
    "horarioFim": "18:00",
    "almocoInicio": "12:00",
    "almocoFim": "13:00"
  }
]
```

### 2. Criar/Atualizar Horários
**POST** `/horarios`
**Headers:** `Authorization: Bearer TOKEN`

**Body:**
```json
{
  "diasTrabalho": ["Segunda-feira", "Terça-feira", "Quarta-feira"],
  "horarioAbertura": "09:00",
  "horarioFechamento": "18:00",
  "intervaloInicio": "12:00",
  "intervaloFim": "13:00"
}
```

### 3. Buscar Dias Disponíveis
**GET** `/horarios/dias-disponiveis/:profissionalId`
**Headers:** `Authorization: Bearer TOKEN`

**Resposta (200):**
```json
[
  "2025-12-01",
  "2025-12-02",
  "2025-12-03"
]
```

### 4. Buscar Horários Disponíveis em uma Data
**GET** `/horarios/horarios-disponiveis/:profissionalId/:date`
**Headers:** `Authorization: Bearer TOKEN`

**Exemplo:** `/horarios/horarios-disponiveis/uuid-prof/2025-12-01`

**Resposta (200):**
```json
[
  { "time": "09:00", "status": "disponivel" },
  { "time": "10:00", "status": "ocupado" },
  { "time": "11:00", "status": "disponivel" },
  { "time": "14:00", "status": "disponivel" }
]
```

---

## Serviços

### 1. Listar Todos os Serviços
**GET** `/servicos`

**Resposta (200):**
```json
[
  {
    "id": "uuid",
    "nome": "Corte de Cabelo",
    "descricao": "Corte masculino tradicional",
    "preco": 50.00,
    "duracao": 60
  }
]
```

### 2. Criar Serviço
**POST** `/servicos`

**Body:**
```json
{
  "nome": "Corte de Cabelo",
  "descricao": "Corte masculino tradicional",
  "preco": 50.00,
  "duracao": 60
}
```

**Resposta (201):**
```json
{
  "id": "uuid-gerado",
  "nome": "Corte de Cabelo",
  "descricao": "Corte masculino tradicional",
  "preco": 50.00,
  "duracao": 60,
  "createdAt": "2025-11-29T20:00:00.000Z",
  "updatedAt": "2025-11-29T20:00:00.000Z"
}
```

---

## Testando com cURL

### Exemplo: Registrar, Fazer Login e Deletar Profissional

```bash
# 1. Registrar
curl -X POST http://localhost:3001/api/profissionais/register \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "senha": "senha123",
    "telefone": "5511999999999"
  }'

# 2. Login (copie o token da resposta)
curl -X POST http://localhost:3001/api/profissionais/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "joao@exemplo.com",
    "senha": "senha123"
  }'

# 3. Deletar Profissional (use o token e o ID do profissional)
curl -X DELETE http://localhost:3001/api/profissionais/uuid-do-profissional \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 4. Criar Cliente (use o token do login)
curl -X POST http://localhost:3001/api/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Maria Santos",
    "telefone": "5511977777777"
  }'

# 5. Criar Agendamento
curl -X POST http://localhost:3001/api/agendamentos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "clienteId": "uuid-do-cliente",
    "dataHora": "2025-12-01T14:00:00.000Z",
    "servico": "Corte de Cabelo"
  }'
```

---

## Códigos de Status HTTP

- `200` - OK (sucesso)
- `201` - Created (recurso criado)
- `400` - Bad Request (dados inválidos)
- `401` - Unauthorized (não autenticado)
- `404` - Not Found (recurso não encontrado)
- `409` - Conflict (conflito, ex: email já existe)
- `500` - Internal Server Error (erro no servidor)
