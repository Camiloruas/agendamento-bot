# Robô de Agendamento para Salão de Beleza

## Descrição Geral do Projeto

Este projeto apresenta um **Robô de Agendamento via WhatsApp**, uma solução automatizada desenvolvida para otimizar o processo de marcação de compromissos. O robô proporciona que os usuários agendem serviços ou compromissos de forma intuitiva, recebendo confirmações e lembretes diretamente pelo WhatsApp.

## Demonstração

Assista a uma breve demonstração do robô em ação e veja como ele simplifica o processo de agendamento:

[![Assista à Demonstração no YouTube](https://img.youtube.com/vi/ines78N-htE/0.jpg)](https://www.youtube.com/shorts/ines78N-htE "Assista à Demonstração no YouTube")

**Clique na imagem acima para assistir ao vídeo demonstrativo!**

## Tecnologias Utilizadas

O desenvolvimento deste robô utilizou um conjunto de tecnologias modernas para garantir performance, escalabilidade e manutenibilidade:

- **Backend:** Node.js (com Express.js para a API) e TypeScript
  - Proporciona um ambiente de execução assíncrono e eficiente, com a robustez e segurança de tipos que o TypeScript oferece.
- **Banco de Dados:** MariaDB
  - Um sistema de gerenciamento de banco de dados relacional que garante a persistência e integridade dos dados de agendamento.
- **Integração WhatsApp:** API/SDK de WhatsApp
  - Interface para comunicação programática com a plataforma WhatsApp, permitindo o envio e recebimento de mensagens.
- **Controle de Versão:** Git
  - Utilizado para gerenciamento do código-fonte e colaboração no desenvolvimento.
- **Gerenciamento de Pacotes:** npm/yarn
  - Para instalação e gerenciamento das dependências do projeto.

## Como Funciona

O fluxo de operação do robô de agendamento é dividido em etapas lógicas:

1.  **Recebimento da Mensagem:** O robô monitora e intercepta mensagens enviadas para o número de WhatsApp configurado.
2.  **Identificação da Intenção:** Utiliza lógica de processamento de linguagem para compreender a intenção do usuário (ex: "Olá" , "quero agendar", "qual minha agenda?" etc. ).
3.  **Coleta de Informações:** Inicia um diálogo interativo para coletar todos os dados necessários para o agendamento (nome, data, hora, tipo de serviço, etc.).
4.  **Registro no Banco de Dados:** Após coletar as informações, os dados são validados e persistidos de forma segura no banco de dados MariaDB.
5.  **Resposta ao Usuário:** O robô envia uma mensagem de confirmação do agendamento, incluindo todos os detalhes, e um lembrete próximo à data do compromisso.

Todos os agendamentos são armazenados de forma consistente no MariaDB, garantindo que nenhum dado seja perdido e que a recuperação seja sempre precisa.

## Arquitetura do Projeto

O backend do robô é estruturado em camadas para promover a separação de responsabilidades, facilitar a manutenção e permitir a escalabilidade:

- **Camada de Rotas (Routes):** Define os endpoints da API que interagem com a plataforma WhatsApp (webhook) e orquestra as requisições recebidas.
- **Camada de Controladores (Controllers):** Lida com a lógica de negócio principal, processando as entradas do usuário, coordenando a interação com os serviços e preparando as respostas.
- **Camada de Serviços (Services):** Contém a lógica de negócio específica, como identificação de intenção, validação de dados e comunicação com a API do WhatsApp.
- **Camada de Repositório (Repositories):** Responsável pela interação direta com o banco de dados MariaDB, abstraindo as operações de CRUD (Create, Read, Update, Delete).

Essa organização modular contribui para um código limpo e de fácil entendimento, crucial para projetos de portfólio.

## Como Executar o Projeto Localmente

Para configurar e executar o projeto em seu ambiente local, siga as instruções abaixo:

### Pré-requisitos

- Node.js (versão 14 ou superior)
- npm ou yarn
- Servidor MariaDB (local ou em nuvem)
- Credenciais de uma API/SDK de WhatsApp

### Instalação

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/Camiloruas/portifolio-Single-Page.git # Substitua pelo repositório correto do robô
    cd portifolio-Single-Page # Navegue até a pasta do projeto
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    # ou
    yarn install
    ```

### Configuração das Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto baseado no `.env.example` (se houver) e preencha com suas credenciais:

```
# Exemplo de .env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=agendamento_bot
WHATSAPP_API_KEY=your_whatsapp_api_key
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
```

### Inicialização do Servidor

1.  **Configure o Banco de Dados:**
    Crie o banco de dados `agendamento_bot` (ou o nome que você definiu em `DB_NAME`) no seu servidor MariaDB. O projeto pode incluir scripts de migração ou inicialização de schema; verifique a pasta `database` ou `src/database` se existirem.
2.  **Inicie o Servidor:**
    ```bash
    npm run dev
    # ou
    yarn dev
    ```
    O servidor será iniciado, geralmente na porta 3000 (ou conforme configurado). Você poderá então configurar os webhooks da sua API de WhatsApp para apontar para o seu servidor local.

## Pontos de Destaque

- **Escalabilidade:** A arquitetura modular e o uso de Node.js permitem que o sistema seja facilmente escalado para lidar com um volume crescente de agendamentos e usuários.
- **Boas Práticas de Desenvolvimento:** Código limpo, testes unitários (se aplicável) e aderência a padrões de projeto garantem a qualidade e manutenibilidade do software.
- **Uso de TypeScript:** A tipagem estática do TypeScript reduz erros em tempo de desenvolvimento e melhora a legibilidade do código.
- **Organização do Código:** A estrutura de pastas e a separação de responsabilidades facilitam a navegação e o entendimento do projeto por outros desenvolvedores.

## Status do Projeto

Atualmente, o projeto encontra-se **em desenvolvimento**.

### Planos Futuros:

- **Integração com Inteligência Artificial (IA):** Implementar processamento de linguagem natural mais avançado para uma compreensão mais sofisticada das conversas dos usuários.
- **Integração com n8n:** Conectar o robô a plataformas de automação como n8n para estender suas capacidades, permitindo integrações com outras ferramentas e fluxos de trabalho personalizados.

## Licença

Este projeto está licenciado sob a Licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.

## Contato

Conecte-se comigo e explore mais projetos:

- **GitHub:** [Camilo Ruas](https://github.com/Camiloruas)
- **LinkedIn:** [Camilo Ruas](https://www.linkedin.com/in/camilo-ruas-3a2a6425/)
