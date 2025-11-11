import * as dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import profissionalRoutes from "./routes/profissionalRoutes";
import agendamentoRoutes from "./routes/agendamentoRoutes";
import clienteRoutes from "./routes/clienteRoutes";
import horarioRoutes from "./routes/horarioRoutes"; // Importa as novas rotas

import sequelize, { testConnection } from "./database/connection";

// CARREGAMENTO DAS CLASSES DOS MODELOS
import Profissional from "./models/Profissional";
import Agendamento from "./models/Agendamento";
import Cliente from "./models/Cliente";
import HorarioProfissional from "./models/HorarioProfissional"; // Importa o novo modelo

// --- NOVO: INTERFACE PARA TIPAR OS MODELOS NO LOOP ---
// Define a estrutura mínima que esperamos dos modelos para o loop de inicialização.
interface ISequelizeModel {
    // CORREÇÃO: Usamos 'any' para evitar o erro de referência circular de tipo (ts(2502)).
    // O sequelize importado é do tipo correto, e a coerção 'as any' já protege a execução.
    initialize: (sequelize: any) => void;
    associate?: (models: any) => void; // Ajustado para aceitar modelos
}
// ----------------------------------------------------

const PORT: number = parseInt(process.env.APP_PORT || "3001", 10);
const app: Express = express();

// Middlewares
app.use(express.json());

// Rotas: Registra as rotas no Express com o prefixo /api
app.use("/api", profissionalRoutes);
app.use("/api", agendamentoRoutes);
app.use("/api", clienteRoutes);
app.use("/api", horarioRoutes); // Registra as novas rotas

// Rota de teste
app.get("/", (req: Request, res: Response) => {
  res.send("API do Agendamento Bot rodando com TypeScript!");
});

// Função de Inicialização do Servidor
async function startServer() {
  // 1. INICIALIZAÇÃO DOS MODELOS
  const models = { Profissional, Cliente, Agendamento, HorarioProfissional };

  for (const model of Object.values(models)) {
    model.initialize(sequelize);
  }

  // 2. CRIAÇÃO DAS ASSOCIAÇÕES
  for (const model of Object.values(models)) {
    if (typeof model.associate === "function") {
      model.associate(models); // Passa todos os modelos para o método associate
    }
  }

  // 3. TESTE DE CONEXÃO E SINCRONIZAÇÃO
  await testConnection();

  // Sincroniza os modelos (cria/altera tabelas conforme necessário)
  // { force: true } recria as tabelas. Use com cuidado em produção.
  await sequelize.sync({ alter: true }); // Usar alter: true para evitar perda de dados
  console.log("[DB] Banco de dados sincronizado com sucesso!");

  app.listen(PORT, () => {
    console.log(`[Server] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();