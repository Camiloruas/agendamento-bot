import express from "express";
import { sequelize, testConnection } from "./src/database/connection.js";
import Profissional from "./src/models/Profissional.js";
import profissionalRoutes from "./src/routes/profissionalRoutes.js"; // Importa as rotas

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

async function syncDatabase() {
  try {
    // Por favor, remova o { force: true } após o primeiro teste!
    await sequelize.sync();
    console.log("Banco de dados sincronizado com sucesso!");
  } catch (error) {
    console.error("Erro ao sincronizar o banco de dados:", error);
  }
}

testConnection();
syncDatabase();

// Conecta as rotas da API
app.use("/api/profissionais", profissionalRoutes);

app.get("/", (req, res) => {
  res.send("API do Agendamento Bot está rodando!");
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
