import * as dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import profissionalRoutes from "./routes/profissionalRoutes";
import agendamentoRoutes from "./routes/agendamentoRoutes";
import clienteRoutes from "./routes/clienteRoutes";
import horarioRoutes from "./routes/horarioRoutes"; 
import sequelize, { testConnection } from "./database/connection";

// Importa os modelos para que possam ser inicializados e associados dinamicamente.
import Profissional from "./models/Profissional";
import Agendamento from "./models/Agendamento";
import Cliente from "./models/Cliente";
import HorarioProfissional from "./models/HorarioProfissional"; 

/**
 * @interface ISequelizeModel
 * @description Define a estrutura esperada para um modelo Sequelize, garantindo que ele tenha os métodos `initialize` e, opcionalmente, `associate`.
 * Isso permite um tratamento polimórfico dos modelos durante a inicialização.
 */
interface ISequelizeModel {
    initialize: (sequelize: any) => void;
    associate?: (models: any) => void; 
}

const PORT: number = parseInt(process.env.APP_PORT || "3001", 10);
const app: Express = express();

// Middleware para permitir que o Express analise o corpo das requisições JSON.
app.use(express.json());

// Associa as rotas principais da aplicação a seus respectivos módulos de roteamento.
// O prefixo "/api" é usado como uma boa prática para versionamento e clareza.
app.use("/api/profissionais", profissionalRoutes);
app.use("/api/agendamentos", agendamentoRoutes);
app.use("/api/clientes", clienteRoutes);
app.use("/api/horarios", horarioRoutes);

// Uma rota raiz de diagnóstico para verificar se o servidor está online.
app.get("/", (req: Request, res: Response) => {
  res.send("API do Agendamento Bot rodando com TypeScript!");
});

/**
 * @function startServer
 * @description Orquestra a inicialização completa do servidor.
 * Esta função garante que a conexão com o banco de dados esteja ativa,
 * que os modelos estejam sincronizados e que as associações sejam criadas
 * antes de o servidor começar a aceitar requisições.
 */
async function startServer() {
  // Um registro central de todos os modelos da aplicação para facilitar a inicialização.
  const models = { Profissional, Cliente, Agendamento, HorarioProfissional };

  // Itera sobre todos os modelos para inicializá-los com a instância do Sequelize.
  // Isso os "conecta" ao banco de dados.
  for (const model of Object.values(models)) {
    model.initialize(sequelize);
  }

  // Após todos os modelos serem inicializados, cria as associações (relações) entre eles.
  // A separação garante que todos os modelos existam antes de tentar criar relações.
  for (const model of Object.values(models)) {
    if (typeof model.associate === "function") {
      model.associate(models); 
    }
  }

  // Verifica se a conexão com o banco de dados pode ser estabelecida.
  await testConnection();

  // Sincroniza os modelos com o banco de dados.
  // `alter: true` modifica as tabelas para corresponderem aos modelos sem apagar dados existentes.
  // Ideal para desenvolvimento, mas para produção, migrações (`migrations`) são mais seguras.
  await sequelize.sync({ alter: true }); 
  console.log("[DB] Banco de dados sincronizado com sucesso!");

  // Inicia o servidor Express para escutar na porta configurada.
  app.listen(PORT, () => {
    console.log(`[Server] Servidor rodando em http://localhost:${PORT}`);
  });
}

// Invoca a função de inicialização para iniciar a aplicação.
startServer();