import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import * as bcrypt from "bcrypt";

/**
 * @interface ProfissionalAttributes
 * @description Define a estrutura dos atributos de um profissional, que é a entidade central
 * do sistema, responsável por realizar os agendamentos.
 */
export interface ProfissionalAttributes {
    id: string; 
    nome: string;
    email: string;
    senha: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * @interface ProfissionalCreationAttributes
 * @description Define os atributos opcionais durante a criação de um profissional.
 * `id`, `createdAt`, e `updatedAt` são gerenciados automaticamente.
 */
export interface ProfissionalCreationAttributes extends Optional<ProfissionalAttributes, "id" | "createdAt" | "updatedAt"> {}

/**
 * @class Profissional
 * @description Representa a tabela `profissionais`. Este modelo inclui a lógica de negócio
 * crucial para a segurança, como a criptografia de senhas.
 */
export class Profissional extends Model<ProfissionalAttributes, ProfissionalCreationAttributes> {
    declare id: string;
    declare nome: string;
    declare email: string;
    declare senha: string;
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public static initialize(sequelize: Sequelize): void {
        Profissional.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4, 
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
                    unique: true, // Garante que cada profissional tenha um email único.
                },
                senha: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
            },
            {
                sequelize, 
                tableName: "profissionais", 
                timestamps: true, 
                modelName: "Profissional",
            }
        );

        /**
         * @hook beforeCreate
         * @description Este hook do Sequelize é acionado automaticamente antes de um novo
         * profissional ser salvo no banco de dados. Sua finalidade é interceptar a senha
         * em texto plano e substituí-la por um hash seguro, garantindo que senhas
         * nunca sejam armazenadas de forma desprotegida.
         */
        Profissional.beforeCreate(async (profissional: any) => {
            const senhaTextoPlano = profissional.senha as string; 

            if (!senhaTextoPlano) {
                throw new Error("Senha não fornecida para criptografia.");
            }

            const saltRounds = 8; // O "custo" da criptografia. Um valor maior é mais seguro, porém mais lento.
            const hashedPassword = await bcrypt.hash(senhaTextoPlano, saltRounds);

            profissional.senha = hashedPassword;
        });
    }

    public static associate(models: any): void {
        // Um profissional pode ter muitos agendamentos e várias configurações de horário.
        this.hasMany(models.Agendamento, {
            foreignKey: 'profissionalId',
            as: 'agendamentos',
        });
        this.hasMany(models.HorarioProfissional, {
            foreignKey: 'profissionalId',
            as: 'horarios',
        });
    }
}

export default Profissional;