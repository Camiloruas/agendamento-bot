import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../database/connection.js";
import * as bcrypt from "bcrypt";

// 1. Interface de Atributos (Tipagem para o objeto lido/escrito no DB)
export interface ProfissionalAttributes {
    id: string; // Usaremos UUID para o ID (padrão em projetos modernos)
    nome: string;
    email: string;
    senha: string;
    createdAt?: Date;
    updatedAt?: Date;
}

// 2. Interface de Criação (Opcionais no momento da Criação)
export interface ProfissionalCreationAttributes extends Optional<ProfissionalAttributes, "id" | "createdAt" | "updatedAt"> {}

// 3. Classe do Modelo (A Implementação do Sequelize)
// **CORREÇÃO PERMANENTE:** Classe vazia para evitar shadowing.
export class Profissional extends Model<ProfissionalAttributes, ProfissionalCreationAttributes> {}

// NOVIDADE: Define o tipo da instância que o Sequelize retorna (Métodos + Atributos).
// Isso resolve o erro de tipagem no Controller.
export type ProfissionalInstance = Profissional & ProfissionalAttributes;


// 4. Inicialização do Modelo (Definição da Tabela no DB)
Profissional.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4, // Gera um ID único automático
            allowNull: false,
            primaryKey: true,
        },
        nome: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true, // Garante que não haverá emails duplicados
        },
        senha: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize, // A instância de conexão
        tableName: "Profissionais", // Nome da tabela no banco de dados
        timestamps: true, // Mantém os campos createdAt e updatedAt
        modelName: "Profissional",
    }
);

Profissional.beforeCreate(async (profissional: any) => {
    // TIPAGEM TEMPORÁRIA 'any' no hook para garantir que o bcrypt funcione em runtime.
    const senhaTextoPlano = profissional.senha as string; 

    if (!senhaTextoPlano) {
        throw new Error("Senha não fornecida para criptografia.");
    }

    const saltRounds = 8;
    const hashedPassword = await bcrypt.hash(senhaTextoPlano, saltRounds);

    profissional.senha = hashedPassword;
});

// Exportamos o modelo final
export default Profissional;