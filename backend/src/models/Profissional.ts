import { Model, DataTypes, Optional, Sequelize } from "sequelize";
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
export class Profissional extends Model<ProfissionalAttributes, ProfissionalCreationAttributes> {
    // Usamos 'declare' para informar ao TypeScript sobre os campos, sem interferir no Sequelize.
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
                tableName: "profissionais", // Nome da tabela no banco de dados
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
    }

    // Define as associações
    public static associate(models: any): void {
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

// Exportamos o modelo final
export default Profissional;