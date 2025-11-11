// backend/src/models/HorarioProfissional.ts

import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import Profissional from './Profissional';

// Atributos do modelo HorarioProfissional
export interface HorarioProfissionalAttributes {
    id: string;
    profissionalId: string;
    diaDaSemana: number; // 0 (Domingo) a 6 (Sábado)
    ativo: boolean;
    horarioInicio: string; // Formato "HH:MM"
    horarioFim: string; // Formato "HH:MM"
    almocoInicio: string; // Formato "HH:MM"
    almocoFim: string; // Formato "HH:MM"
}

// Atributos opcionais na criação
interface HorarioProfissionalCreationAttributes extends Optional<HorarioProfissionalAttributes, 'id'> {}

// Classe do Modelo
export class HorarioProfissional extends Model<HorarioProfissionalAttributes, HorarioProfissionalCreationAttributes> {
    declare id: string;
    declare profissionalId: string;
    declare diaDaSemana: number;
    declare ativo: boolean;
    declare horarioInicio: string;
    declare horarioFim: string;
    declare almocoInicio: string;
    declare almocoFim: string;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public static initialize(sequelize: Sequelize): void {
        HorarioProfissional.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            profissionalId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: {
                    model: 'profissionais', // Nome da tabela no DB
                    key: 'id',
                },
            },
            diaDaSemana: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    min: 0,
                    max: 6,
                },
            },
            ativo: {
                type: DataTypes.BOOLEAN,
                defaultValue: true,
                allowNull: false,
            },
            horarioInicio: {
                type: DataTypes.TIME,
                allowNull: false,
            },
            horarioFim: {
                type: DataTypes.TIME,
                allowNull: false,
            },
            almocoInicio: {
                type: DataTypes.TIME,
                allowNull: true,
            },
            almocoFim: {
                type: DataTypes.TIME,
                allowNull: true,
            },
        }, {
            sequelize,
            tableName: 'horarios_profissionais',
            timestamps: true,
            // Garante que um profissional só pode ter uma configuração por dia da semana
            indexes: [{
                unique: true,
                fields: ['profissionalId', 'diaDaSemana']
            }]
        });
    }

    // Define a associação com o Profissional
    public static associate(models: any): void {
        this.belongsTo(models.Profissional, {
            foreignKey: 'profissionalId',
            as: 'profissional',
        });
    }
}

export default HorarioProfissional;
