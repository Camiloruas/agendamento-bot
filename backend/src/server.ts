// src/server.ts

import * as dotenv from "dotenv";
dotenv.config();

import express, { Express, Request, Response } from "express";
import profissionalRoutes from "./routes/profissionalRoutes";
import agendamentoRoutes from "./routes/agendamentoRoutes"; // Importa as rotas de agendamento

// O '.js' é obrigatório no NodeNext/tsx, mesmo que o arquivo seja .ts
import { sequelize, testConnection } from "./database/connection";

// CARREGAMENTO DOS MODELOS: Isso é crucial para que o Sequelize saiba que eles existem
import Profissional from "./models/Profissional";
import Agendamento from "./models/Agendamento"; // <--- NOVIDADE: O import que faltava!

// Tipagem: A variável PORT deve ser um número (number)
const PORT: number = parseInt(process.env.APP_PORT || "3001", 10);

// Tipagem: A variável app é uma instância do Express (Express)
const app: Express = express();

// Middlewares
app.use(express.json());

// Rotas: Registra as rotas no Express com o prefixo /api
app.use("/api", profissionalRoutes);
app.use("/api", agendamentoRoutes); // Carrega as rotas de agendamento

// Rota de teste (movida para o final para evitar conflitos)
app.get("/", (req: Request, res: Response) => {
    res.send("API do Agendamento Bot rodando com TypeScript!");
});

// Função de Inicialização
async function startServer() {
    await testConnection();

    // Sincroniza todos os modelos (cria as tabelas 'Profissionais' e 'Agendamentos')
    await sequelize.sync({ alter: true });
    console.log("[DB] Banco de dados sincronizado com sucesso!");

    app.listen(PORT, () => {
        console.log(`[Server] Servidor rodando em http://localhost:${PORT}`);
    });
}

startServer();