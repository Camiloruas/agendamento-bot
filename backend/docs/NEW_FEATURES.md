# Planejamento da Nova Fase do Projeto

Este documento descreve as novas funcionalidades a serem implementadas no sistema, conforme solicitado. O objetivo é criar uma interface de painel para o profissional gerenciar sua agenda, que se integrará com o bot de agendamento existente.

## Análise do Código Existente vs. Novos Requisitos

| Funcionalidade | Situação Atual | Ações Necessárias |
| :--- | :--- | :--- |
| **Backend** | Funcional, com TypeScript e Express.js. | Manter a base, adicionar/modificar rotas conforme necessário. |
| **Banco de Dados** | Conexão com Sequelize já configurada. | Adicionar/modificar modelos para novos campos (preço, duração do serviço, etc.). |
| **Autenticação** | Login com JWT para profissionais já existe. | Implementar fluxo de "Esqueci minha senha". |
| **Frontend** | Inexistente. | **Criar todo o frontend do zero** (React/Vue/Angular, etc.). |
| **Cadastro de Profissional** | Rota de criação de profissional (`/api/profissionais/register`) já existe. | Criar a tela de cadastro no frontend. Adicionar campo de telefone do salão. |
| **Onboarding** | Inexistente. | Criar as telas e a lógica para o profissional configurar seus dias, horários e serviços pela primeira vez. |
| **Painel do Profissional** | Inexistente. | Criar as telas do dashboard, agenda diária, etc. |
| **Agendamento Manual** | Inexistente. | Criar a funcionalidade no backend e a tela no frontend. |
| **Gestão de Serviços** | O modelo `Agendamento` tem um campo `servico` fixo. | Modificar para permitir que o profissional personalize serviços, preços e duração. |
| **Planos/Assinaturas** | Inexistente. | Criar a tela e a lógica de planos (mesmo que a cobrança seja futura). |

---

## Detalhamento das Novas Funcionalidades

### ETAPA — CADASTRO DO PROFISSIONAL + PAINEL DO SALÃO

#### 1. Tela de Acesso Inicial (Login)
- **Objetivo:** Permitir que o profissional entre no sistema.
- **Elementos:**
  - Campo Email
  - Campo Senha
  - Botão `Entrar`
  - Link `“Criar minha conta”`
  - Link `“Esqueci minha senha”`
- **Lógica:**
  - A rota de login (`/api/profissionais/login`) já existe e pode ser utilizada.
  - Criar a tela de login no frontend.
  - Implementar a lógica para redirecionar para o painel em caso de sucesso.
  - O fluxo de "Esqueci minha senha" será implementado em uma fase posterior.

#### 2. Tela de Cadastro do Profissional
- **Objetivo:** Registrar um novo profissional.
- **Campos:**
  - Nome completo
  - Email (login)
  - Senha
  - Confirmação de senha
  - Telefone (WhatsApp do salão)
- **Lógica:**
  - A rota de cadastro (`/api/profissionais/register`) já existe. Será necessário **modificar o modelo `Profissional` e a rota para incluir o campo `telefone`**.
  - Criar a tela de cadastro no frontend.
  - Após o cadastro, logar o usuário automaticamente e redirecioná-lo para a tela de Configuração Inicial (Onboarding).

#### 3. Tela de Configuração Inicial (Onboarding)
- **Objetivo:** Configurar a agenda do profissional pela primeira vez.
- **Etapas:**
  1. **Dias de trabalho:** Selecionar os dias da semana (Seg-Dom).
  2. **Horário de atendimento:** Definir horário de abertura e fechamento.
  3. **Intervalo (almoço):** Configurar início e fim do intervalo.
  4. **Serviços:** Visualizar serviços pré-definidos (`Corte`, `Barba`, `Corte + Barba`) e, no futuro, configurar preço e duração.
- **Lógica:**
  - A rota para criar/atualizar horários (`/api/horarios`) já existe e pode ser usada para salvar as configurações de dias, horários e intervalos.
  - Será necessário criar novas tabelas e rotas para gerenciar os **serviços customizáveis** (preço, duração).
  - Criar as telas do fluxo de onboarding no frontend.

#### 4. Painel do Profissional
- **Objetivo:** Tela principal para o profissional gerenciar seus agendamentos.
- **Seções:**
  1. **Visão Geral do Dia:** Dashboard com próximo agendamento e total do dia.
  2. **Agenda (Calendário diário):** Lista de horários do dia (livres, ocupados, intervalos).
     - **Ações:** Marcar como concluído, cancelar.
  3. **Cadastrar Agendamentos Manualmente:** Formulário para adicionar agendamentos que não vieram pelo bot.
  4. **Configurações da Agenda:** Editar dias, horários, intervalos e serviços.
  5. **Configurações da Conta:** Alterar dados pessoais e senha.
  6. **Plano / Assinatura:** Exibir informações do plano atual.
- **Lógica:**
  - Utilizar as rotas existentes (`/api/agendamentos`, `/api/horarios`) para buscar e exibir os dados.
  - Criar a rota e a lógica para o **agendamento manual**.
  - Criar a rota para **marcar um agendamento como concluído** (atualizar o status).
  - Criar todas as telas e componentes do painel no frontend.

#### 5. Integração com o Bot (Em segundo plano)
- **Objetivo:** Garantir que o bot sempre use as informações mais recentes do painel.
- **Lógica:**
  - O `bot-service` já existe e provavelmente consome as rotas da API.
  - A integração já deve funcionar, pois o bot buscará os dados atualizados a cada interação. Nenhuma grande alteração deve ser necessária no bot, a menos que novas rotas sejam criadas (ex: para serviços customizados).

---

### Resumo do Fluxo
1.  **Profissional se cadastra:** (Frontend + Backend) - Requer pequena alteração no backend.
2.  **Faz configuração inicial:** (Frontend + Backend) - Requer novas telas no frontend e possivelmente novas tabelas/rotas no backend para serviços.
3.  **Painel é carregado:** (Frontend + Backend) - Requer a criação de todo o painel no frontend, consumindo as rotas existentes e novas.
4.  **Bot já sabe quem é o dono da conta:** (Já implementado) - O bot usa o `profissionalId` para filtrar os dados.
5.  **Clientes marcam horário pelo WhatsApp:** (Já implementado)
6.  **Profissional acompanha tudo no painel:** (Frontend) - A ser criado.
