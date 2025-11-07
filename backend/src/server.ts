// src/server.ts

// Tipagem: Importamos Express, mas também os tipos específicos Express e Request/Response
import * as dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import profissionalRoutes from "./routes/profissionalRoutes.js";

// O '.js' é obrigatório no NodeNext/tsx, mesmo que o arquivo seja .ts
import { sequelize, testConnection } from "./database/connection.js";
import Profissional from "./models/Profissional.js";

// Tipagem: A variável PORT deve ser um número (number)
const PORT: number = parseInt(process.env.APP_PORT || "3001", 10);

// Tipagem: A variável app é uma instância do Express (Express)
const app: Express = express();

// Middlewares
app.use(express.json());
app.use("/api", profissionalRoutes);

// Rota de teste
// Tipagem: Especificamos que o req é do tipo Request e o res é do tipo Response
app.get("/", (req: Request, res: Response) => {
  res.send("API do Agendamento Bot rodando com TypeScript!");
});

// Função de Inicialização
async function startServer() {
  await testConnection();

  // NOVIDADE: Sincroniza todos os modelos (cria a tabela 'Profissionais' se não existir)
  await sequelize.sync({ alter: true }); // 'alter: true' tenta fazer alterações não destrutivas
  console.log("[DB] Banco de dados sincronizado com sucesso!");

  app.listen(PORT, () => {
    console.log(`[Server] Servidor rodando em http://localhost:${PORT}`);
  });
}

startServer();
