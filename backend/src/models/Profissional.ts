import { Model, DataTypes, Optional, Sequelize } from "sequelize";
import * as bcrypt from "bcrypt";


export interface ProfissionalAttributes {
    id: string; 
    nome: string;
    email: string;
    senha: string;
    createdAt?: Date;
    updatedAt?: Date;
}


export interface ProfissionalCreationAttributes extends Optional<ProfissionalAttributes, "id" | "createdAt" | "updatedAt"> {}


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
                    unique: true, 
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

        Profissional.beforeCreate(async (profissional: any) => {
            
            const senhaTextoPlano = profissional.senha as string; 

            if (!senhaTextoPlano) {
                throw new Error("Senha não fornecida para criptografia.");
            }

            const saltRounds = 8;
            const hashedPassword = await bcrypt.hash(senhaTextoPlano, saltRounds);

            profissional.senha = hashedPassword;
        });
    }

    
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


export default Profissional;