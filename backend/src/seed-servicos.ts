import * as dotenv from "dotenv";
dotenv.config();

import sequelize from "./database/connection";
import Servico from "./models/Servico";

async function seedServicos() {
    try {
        // Inicializa o modelo
        Servico.initialize(sequelize);

        // Conecta ao banco
        await sequelize.authenticate();
        console.log("✅ Conectado ao banco de dados!");

        // Verifica se já existem serviços
        const existingServicos = await Servico.findAll();
        if (existingServicos.length > 0) {
            console.log(`⚠️  Já existem ${existingServicos.length} serviços cadastrados:`);
            existingServicos.forEach(s => {
                console.log(`   - ${s.nome} (R$ ${s.preco})`);
            });
            console.log("\nDeseja continuar e adicionar mais serviços? (Ctrl+C para cancelar)");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Serviços padrão para barbearia
        const servicosPadrao = [
            {
                nome: "Corte de Cabelo",
                descricao: "Corte masculino tradicional",
                preco: 50.00,
                duracao: 60 // em minutos
            },
            {
                nome: "Barba",
                descricao: "Aparar e modelar barba",
                preco: 30.00,
                duracao: 30
            },
            {
                nome: "Corte + Barba",
                descricao: "Combo completo de corte e barba",
                preco: 70.00,
                duracao: 90
            }
        ];

        console.log("\n📝 Cadastrando serviços...\n");

        for (const servicoData of servicosPadrao) {
            const servico = await Servico.create(servicoData);
            console.log(`✅ Serviço cadastrado: ${servico.nome} - R$ ${servico.preco}`);
        }

        console.log("\n🎉 Serviços cadastrados com sucesso!");
        console.log("\nServiços disponíveis:");

        const allServicos = await Servico.findAll();
        allServicos.forEach(s => {
            console.log(`   ${s.nome} - R$ ${s.preco} (${s.duracao} min)`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Erro ao cadastrar serviços:", error);
        process.exit(1);
    }
}

seedServicos();
