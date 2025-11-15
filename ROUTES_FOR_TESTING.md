# Rotas da API para Testes

Este arquivo documenta todas as rotas da API para o Bot de Agendamento, incluindo descrições, requisitos de autenticação e exemplos de payloads JSON para testes.

---

## 👨‍🔧 Rotas do Profissional (`/api/profissionais`) -- Rota Testada - (Tudo OK )

### `POST /api/profissionais/register`

**Descrição:** Registra um novo profissional no sistema.

**Autenticação:** Não Requerida

**Corpo da Requisição (JSON):**

```json
{
  "nome": "João da Silva",
  "email": "joao.silva@example.com",
  "senha": "uma_senha_forte_123"
}
```

---

### `POST /api/profissionais/login`

**Descrição:** Autentica um profissional e retorna um token JWT.

**Autenticação:** Não Requerida

**Corpo da Requisição (JSON):**

```json
{
  "email": "joao.silva@example.com",
  "senha": "uma_senha_forte_123"
}
```

---

### `GET /api/profissionais`

**Descrição:** Recupera uma lista de todos os profissionais.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /api/profissionais/profile`

**Descrição:** Recupera o perfil do profissional atualmente autenticado.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

## 👤 Rotas do Cliente (`/api/clientes`)

### `POST /api/clientes`

**Descrição:** Cria um novo cliente.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):**

```json
{
  "nome": "Carlos Pereira",
  "telefone": "5585912345678"
}
```

---

### `GET /api/clientes`

**Descrição:** Recupera uma lista de todos os clientes.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /api/clientes/:id`

**Descrição:** Recupera um cliente específico pelo seu ID.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `id`: O UUID do cliente.

**Corpo da Requisição (JSON):** Nenhum

---

### `PUT /api/clientes/:id`

**Descrição:** Atualiza as informações de um cliente específico.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `id`: O UUID do cliente.

**Corpo da Requisição (JSON):**

```json
{
  "nome": "Carlos Alberto Pereira",
  "telefone": "5585987654321"
}
```

---

### `DELETE /api/clientes/:id`

**Descrição:** Deleta um cliente específico pelo seu ID.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `id`: O UUID do cliente.

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /api/clientes/by-phone`

**Descrição:** Recupera um cliente pelo seu número de telefone.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Consulta (Query):**

- `telefone`: O número de telefone do cliente.

**Corpo da Requisição (JSON):** Nenhum

**Exemplo de URL:** `/api/clientes/by-phone?telefone=5585912345678`

---

## 🗓️ Rotas de Horários (`/api/horarios`)

### `GET /api/horarios`

**Descrição:** Recupera a configuração de horários de trabalho para o profissional autenticado.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

### `POST /api/horarios`

**Descrição:** Cria ou atualiza os horários de trabalho para o profissional autenticado. Recebe um array de objetos de horário para cada dia da semana.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):**

```json
[
  {
    "diaDaSemana": 1,
    "ativo": true,
    "horarioInicio": "09:00",
    "horarioFim": "18:00",
    "almocoInicio": "12:00",
    "almocoFim": "13:00"
  },
  {
    "diaDaSemana": 2,
    "ativo": true,
    "horarioInicio": "09:00",
    "horarioFim": "18:00",
    "almocoInicio": "12:00",
    "almocoFim": "13:00"
  },
  {
    "diaDaSemana": 0,
    "ativo": false,
    "horarioInicio": "00:00",
    "horarioFim": "00:00"
  }
]
```

---

## 📅 Rotas de Agendamento (`/api/agendamentos`)

### `POST /api/agendamentos`

**Descrição:** Cria um novo agendamento.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):**

```json
{
  "clienteId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "dataHora": "2025-11-12T10:00:00.000Z",
  "servico": "Corte",
  "descricao": "Corte de cabelo masculino"
}
```

---

### `GET /api/agendamentos`

**Descrição:** Recupera todos os agendamentos para o profissional autenticado.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /api/agendamentos/:id`

**Descrição:** Recupera um agendamento específico pelo seu ID.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `id`: O UUID do agendamento.

**Corpo da Requisição (JSON):** Nenhum

---

### `PUT /api/agendamentos/:id`

**Descrição:** Atualiza um agendamento existente.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `id`: O UUID do agendamento.

**Corpo da Requisição (JSON):**

```json
{
  "dataHora": "2025-11-12T11:00:00.000Z",
  "status": "Confirmado",
  "servico": "Corte + Barba"
}
```

---

### `DELETE /api/agendamentos/:id`

**Descrição:** Deleta um agendamento específico pelo seu ID.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `id`: O UUID do agendamento.

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /api/agendamentos/available-slots`

**Descrição:** Recupera os horários de agendamento disponíveis para uma data específica.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Consulta (Query):**

- `date`: A data para verificar os horários disponíveis (formato: `YYYY-MM-DD`).

**Corpo da Requisição (JSON):** Nenhum

**Exemplo de URL:** `/api/agendamentos/available-slots?date=2025-11-12`

---

### `GET /api/agendamentos/cliente/:clienteId`

**Descrição:** Recupera todos os agendamentos para um cliente específico.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `clienteId`: O UUID do cliente.

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /api/agendamentos/has-active-appointment/:clienteId`

**Descrição:** Verifica se um cliente específico tem um agendamento futuro ativo (pendente ou confirmado).

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `clienteId`: O UUID do cliente.

**Corpo da Requisição (JSON):** Nenhum
