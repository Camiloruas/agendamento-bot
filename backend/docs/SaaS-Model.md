# 📌 Modelo de Negócio SaaS — Plataforma de Agendamento via WhatsApp

**Camilo Ruas — Softwares**

Este documento define toda a estrutura de negócio, fluxo operacional, regras e diretrizes do sistema SaaS de agendamento para salões de beleza utilizando WhatsApp + Painel Web.

---

# 1. Visão Geral do Produto

A plataforma permite que salões, barbeiros e cabeleireiros utilizem um robô de WhatsApp para receber e gerenciar agendamentos automaticamente, enquanto o profissional acessa um painel web para visualizar, alterar e finalizar atendimentos.

O sistema é **multi-tenant**:

- Muitos salões utilizam o mesmo sistema.
- Cada salão possui seus dados isolados.
- Cada profissional tem sua própria agenda e bot.

---

# 2. Estrutura SaaS

## 2.1. Auto Cadastro (Self-Service)

O modelo adotado segue o padrão das empresas modernas de SaaS:

1. O profissional acessa a página **/cadastro**.
2. Ele preenche:
   - Nome do salão
   - Nome do profissional
   - Email
   - Senha
   - Telefone
3. O sistema cria automaticamente:

   - Registro do salão (`saloes`)
   - Usuário administrador (`profissionais`)
   - Configurações iniciais (`config_salao`)
   - Dias de funcionamento (`dias_trabalho`)
   - Estrutura de horários do bot no WhatsApp

4. O profissional recebe:
   - **30 dias grátis** (período de testes)
   - Acesso ao painel web imediatamente
   - WhatsApp bot funcionando automaticamente

---

## 2.2. Plano Pago (Cobrança)

Após o período de testes:

- Notificações automáticas começam 5 dias antes do fim.
- O profissional precisa pagar via:
  - PIX recorrente
  - Cartão (Stripe / Mercado Pago / Asaas)
- Se não pagar:
  - Acesso ao painel fica restrito
  - O bot continua funcionando, mas não cria novos horários
  - Após 10 dias, a conta entra em modo suspenso.

---

# 3. Perfis de Usuário

## 3.1. Administrador Geral (Você — Camilo)

Funções:

- Criar/editar planos
- Ver todos os salões
- Ativar/desativar salões
- Suporte e ajustes manuais
- Acessar o painel global

## 3.2. Profissional (cliente)

Funções:

- Fazer login no painel
- Definir dias de trabalho
- Definir horas de almoço/intervalos
- Registrar agendamentos manuais (clientes sem WhatsApp)
- Finalizar/cancelar agendamentos
- Ver agenda do dia/semana

---

# 4. Multi-Empresa (Multi-Tenant)

Todas as tabelas do banco incluem `salao_id` vinculando cada dado ao seu salão.

Exemplo de tabelas:

- `saloes`
- `profissionais`
- `dias_trabalho`
- `config_salao`
- `agendamentos`
- `servicos`
- `horarios_indisponiveis`

Regra importante:  
**Um profissional só enxerga agendamentos do seu próprio salão.**

---

# 5. Fluxo Completo de Cadastro do Profissional

## 5.1. Cadastro no site (/cadastro)

- Formulário simples
- Envia dados para API
- API cria:
  - `saloes`
  - `profissionais` (role = admin)
  - `dias_trabalho` padrão (segunda a sábado)
  - `config_salao`: intervalo de 1h, horário comercial etc.

## 5.2. Painel liberado imediatamente

Após cadastro, o profissional acessa:

- Agenda diária
- Agenda semanal
- Configurações
- Serviços oferecidos (Corte / Barba / Corte+Barba)

## 5.3. Criação automática do Bot

O sistema registra o salão no mecanismo de bot (WhatsApp ou N8N webhook).

---

# 6. Fluxo do WhatsApp — Bot do Cliente

1. Cliente envia mensagem
2. Bot identifica número e verifica histórico
3. Perguntas:
   - Deseja marcar um horário?
   - Qual serviço?
   - Qual dia?
   - Qual horário?
4. Bot grava no MySQL (MariaDB):
   - Nome
   - Telefone
   - Serviço
   - Data e hora
   - Salão que recebeu o agendamento
5. Bot envia confirmação
6. Profissional visualiza no painel em tempo real

---

# 7. Painel Web do Profissional

O painel deve conter:

## 7.1. Agenda do Dia

- Lista de agendamentos do dia corrente
- Botões:
  - Finalizar
  - Cancelar
  - Reagendar (futuro)

## 7.2. Agenda Semanal (futuro)

- Visualização por semana
- Seleção de dias

## 7.3. Cadastro de Agendamentos Manuais

Para idosos ou clientes que ligam por telefone.

## 7.4. Configurações

- Dias que trabalha
- Horários disponíveis
- Horários de intervalo (almoço variáveis)
- Serviços oferecidos
- Dados pessoais

---

# 8. Tabela de Serviços (fixo para início)

- Corte
- Barba
- Corte + Barba

---

# 9. Regras de Agendamento

- Intervalos de 1 hora
- Cada salão escolhe seus dias de folga
- Cada dia pode ter um intervalo de almoço personalizado
- O cliente só vê horários disponíveis

---

# 10. Estrutura do Banco (MariaDB)

Tabelas principais:

### `saloes`

- id
- nome
- telefone
- status
- plano
- data_fim_periodo_gratis

### `profissionais`

- id
- salao_id
- nome
- email
- senha_hash

### `agendamentos`

- id
- salao_id
- cliente_nome
- cliente_telefone
- servico
- data_hora
- status

### `dias_trabalho`

- id
- salao_id
- dia_semana
- trabalha (boolean)
- hora_inicio
- hora_fim
- intervalo_inicio
- intervalo_fim

---

# 11. Fases do Desenvolvimento (Roadmap)

1. Back-End — API
2. Banco MariaDB
3. Bot WhatsApp (N8N)
4. Painel Web React
5. Cadastro + Login
6. Agenda diária
7. Configurações
8. Sistema de planos
9. Testes
10. Deploy (Docker)

---

# 12. Conclusão

O modelo definido permite que o projeto cresça como uma plataforma SaaS profissional, podendo atender dezenas ou centenas de salões sem mudança estrutural.
