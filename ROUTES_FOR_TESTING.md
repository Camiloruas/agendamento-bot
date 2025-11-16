# Rotas da API para Testes

Este arquivo documenta as rotas da API para o Bot de Agendamento. Os caminhos abaixo são relativos à URL base da API (ex: `http://localhost:3001/api`).

---

## 👨‍🔧 Rotas do Profissional (`/profissionais`) Testado - OK

### `POST /profissionais/register`

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

### `POST /profissionais/login` Testado - OK

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

### `GET /profissionais` Testado - OK

**Descrição:** Recupera uma lista de todos os profissionais.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /profissionais/profile` - Testado - OK

**Descrição:** Recupera o perfil do profissional atualmente autenticado.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

## 👤 Rotas do Cliente (`/clientes`) Testado - OK

### `POST /clientes`

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

### `GET /clientes` Testado - OK

**Descrição:** Recupera uma lista de todos os clientes.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /clientes/:id` Testado OK

**Descrição:** Recupera um cliente específico pelo seu ID.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `id`: O UUID do cliente.

**Corpo da Requisição (JSON):** Nenhum

---

### `PUT /clientes/:id` Testado - OK

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

### `DELETE /clientes/:id` Testado - OK

**Descrição:** Deleta um cliente específico pelo seu ID.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Caminho (Path):**

- `id`: O UUID do cliente.

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /clientes/by-phone` - Testado - OK

**Descrição:** Recupera um cliente pelo seu número de telefone.

**Autenticação:** Requerida (Bearer Token)

**Parâmetros de Consulta (Query):**

- `telefone`: O número de telefone do cliente.

**Corpo da Requisição (JSON):** Nenhum

**Exemplo de URL:** `/clientes/by-phone?telefone=5585912345678`

---

## 🗓️ Rotas de Horários (`/horarios`)

### `GET /horarios`

**Descrição:** Recupera a configuração de horários de trabalho para o profissional autenticado.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

**Corpo da Requisição (JSON):**
```json
[
  {
    "diaDaSemana": 0,
    "ativo": true,
    "horarioInicio": "09:00",
    "horarioFim": "18:00",
    "almocoInicio": "12:00",
    "almocoFim": "13:00"
  },
  {
    "diaDaSemana": 1,
    "ativo": true,
    "horarioInicio": "09:00",
    "horarioFim": "18:00",
    "almocoInicio": "12:00",
    "almocoFim": "13:00"
  }
]

---

## 📅 Rotas de Agendamento (`/agendamentos`)

### `POST /agendamentos`

**Descrição:** Cria um novo agendamento.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):**
```json
{
  "dataHora": "2025-12-25T10:00:00Z",
  "clienteId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "servico": "Corte",
  "descricao": "Corte de cabelo com João"
}
```

---

### `GET /agendamentos`

**Descrição:** Recupera todos os agendamentos para o profissional autenticado.

**Autenticação:** Requerida (Bearer Token)

---

### `GET /agendamentos/:id`

**Descrição:** Recupera um agendamento específico pelo seu ID.

**Autenticação:** Requerida (Bearer Token)

---

### `PUT /agendamentos/:id`

**Descrição:** Atualiza um agendamento existente.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):**
```json
{
  "dataHora": "2025-12-25T11:00:00Z",
  "status": "Confirmado"
}
```

---

### `DELETE /agendamentos/:id`

**Descrição:** Deleta um agendamento específico pelo seu ID.

**Autenticação:** Requerida (Bearer Token)

**Corpo da Requisição (JSON):** Nenhum

---

### `GET /agendamentos/available-slots`

**Descrição:** Recupera os horários de agendamento disponíveis para uma data específica.

**Autenticação:** Requerida (Bearer Token)

**Exemplo de URL:** `/agendamentos/available-slots?date=2025-11-12`

---

### `GET /agendamentos/cliente/:clienteId`

**Descrição:** Recupera todos os agendamentos para um cliente específico.

**Autenticação:** Requerida (Bearer Token)

---

### `GET /agendamentos/has-active-appointment/:clienteId`

**Descrição:** Verifica se um cliente específico tem um agendamento futuro ativo.

**Autenticação:** Requerida (Bearer Token)

