import * as dotenv from "dotenv";
dotenv.config();
import sequelize from "./database/connection";
import Servico from "./models/Servico";

async function runSync() {
    try {
        Servico.initialize(sequelize);
        await sequelize.sync({ alter: true });
        console.log("Sincronização de teste concluída com sucesso!");
        process.exit(0);
    } catch (error) {
        console.error("Erro na sincronização:", error);
        process.exit(1);
    }
}

runSync();
