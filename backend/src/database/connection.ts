import { Sequelize } from "sequelize";
import "dotenv/config";

// Carrega as variáveis de ambiente para a conexão com o banco de dados.
// É uma boa prática centralizar essa leitura para garantir que todas as partes da aplicação
// usem as mesmas credenciais, lidas de um local seguro (.env).
const dbName = process.env.DATABASE as string;
const dbUser = process.env.DATABASE_USERNAME as string;
const dbPassword = process.env.DATABASE_PASSWORD;
const dbHost = process.env.DATABASE_HOST;
const dbPort = parseInt(process.env.DATABASE_PORT || "3306", 10);

// Validação para garantir que as variáveis críticas de ambiente foram carregadas.
// Isso evita erros obscuros em tempo de execução, falhando de forma rápida e clara se a configuração estiver incompleta.
if (!dbName || !dbUser || !dbHost) {
  throw new Error("[DB ERROR] Variáveis de conexão essenciais não configuradas.");
}

/**
 * @const sequelize
 * @description Esta é a instância única do Sequelize que será usada em toda a aplicação.
 * Centralizar a criação da instância garante que todos os modelos e queries
 * utilizem o mesmo pool de conexões, o que é crucial para a performance e consistência.
 */
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "mysql", // Define o dialeto específico do banco de dados (neste caso, MariaDB, que é compatível com MySQL).
  logging: false, // Desativa os logs de queries SQL no console para não poluir a saída em produção.
  define: {
    // Impede o Sequelize de pluralizar os nomes das tabelas. O nome definido no modelo será usado literalmente.
    freezeTableName: true,
    // Habilita a criação automática dos campos `createdAt` and `updatedAt`.
    timestamps: true,
  },
});

/**
 * @function testConnection
 * @description Tenta autenticar com o banco de dados para verificar se a conexão é válida.
 * É uma função de diagnóstico essencial que é chamada na inicialização do servidor.
 * Se a conexão falhar, o processo é encerrado para evitar que a aplicação rode em um estado inválido.
 */
export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log("[DB] Conexão com o MariaDB estabelecida com sucesso!");
  } catch (error) {
    console.error("[DB ERROR] Não foi possível conectar ao MariaDB:", error);
    process.exit(1); // Encerra o processo se a conexão com o DB falhar, pois a aplicação não pode funcionar sem ele.
  }
}

export default sequelize;