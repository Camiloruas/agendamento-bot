// src/database/connection.ts

import { Sequelize } from "sequelize";
import "dotenv/config";

// Mapeamento e parse das variáveis de ambiente com checagem de tipo
// O 'as string' é um recurso do TypeScript chamado 'Type Assertion'.
// Ele diz ao TS: "Confie em mim, esta variável EXISTE e é uma string."
const dbName = process.env.DATABASE as string;
const dbUser = process.env.DATABASE_USERNAME as string;
const dbPassword = process.env.DATABASE_PASSWORD;
const dbHost = process.env.DATABASE_HOST;
const dbPort = parseInt(process.env.DATABASE_PORT || "3306", 10);

if (!dbName || !dbUser || !dbHost) {
  throw new Error("[DB ERROR] Variáveis de conexão essenciais não configuradas.");
}

// Instância do Sequelize
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

export { sequelize };
