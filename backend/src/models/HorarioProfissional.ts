import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import Profissional from './Profissional';

/**
 * @interface HorarioProfissionalAttributes
 * @description Descreve a estrutura de um registro de horário de trabalho de um profissional.
 * Este modelo define os dias e horas em que um profissional está disponível para agendamentos.
 */
export interface HorarioProfissionalAttributes {
    id: string;
    profissionalId: string;
    diaDaSemana: number; // 0 (Domingo) a 6 (Sábado), para alinhar com o padrão JavaScript `Date.getDay()`.
    ativo: boolean; // Permite desativar um dia de trabalho sem apagar o registro.
    horarioInicio: string; // Formato "HH:MM".
    horarioFim: string; // Formato "HH:MM".
    almocoInicio: string; // Formato "HH:MM", opcional.
    almocoFim: string; // Formato "HH:MM", opcional.
}

/**
 * @interface HorarioProfissionalCreationAttributes
 * @description Define quais atributos são opcionais ao criar um novo registro de horário.
 */
interface HorarioProfissionalCreationAttributes extends Optional<HorarioProfissionalAttributes, 'id'> {}

/**
 * @class HorarioProfissional
 * @description Representa a tabela `horarios_profissionais`, que armazena a grade de trabalho
 * semanal de cada profissional.
 */
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
                    model: 'profissionais', 
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
            // Um índice único é crucial para garantir que não haja múltiplas configurações
            // de horário para o mesmo profissional no mesmo dia da semana.
            indexes: [{
                unique: true,
                fields: ['profissionalId', 'diaDaSemana']
            }]
        });
    }

    public static associate(models: any): void {
        // Define a relação de pertencimento: um horário pertence a um profissional.
        this.belongsTo(models.Profissional, {
            foreignKey: 'profissionalId',
            as: 'profissional',
        });
    }
}

export default HorarioProfissional;
