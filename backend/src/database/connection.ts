// src/database/connection.ts

import { Sequelize } from "sequelize";
import "dotenv/config";
// REMOVIDO: Importações de modelos (Profissional, Agendamento, Cliente)

// Mapeamento e parse das variáveis de ambiente
const dbName = process.env.DATABASE as string;
const dbUser = process.env.DATABASE_USERNAME as string;
const dbPassword = process.env.DATABASE_PASSWORD;
const dbHost = process.env.DATABASE_HOST;
const dbPort = parseInt(process.env.DATABASE_PORT || "3306", 10);

if (!dbName || !dbUser || !dbHost) {
  throw new Error("[DB ERROR] Variáveis de conexão essenciais não configuradas.");
}

// 1. Instância do Sequelize (PONTO DE CRIAÇÃO)
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql",
  logging: false,
  define: {
    freezeTableName: true,
    timestamps: true,
  },
});

// REMOVIDO: Associações (movidas para server.ts)

// Tipagem: a função promete retornar um resultado vazio (void) de forma assíncrona.
export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("[DB] Conexão com o MariaDB estabelecida com sucesso!");
  } catch (error) {
    console.error("[DB ERROR] Não foi possível conectar ao MariaDB:", error);
    process.exit(1);
  }
}

export default sequelize;