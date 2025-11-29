import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export interface ServicoAttributes {
    id: string;
    nome: string;
    descricao: string | null;
    preco: number;
    duracao: number; // em minutos
    ativo: boolean; // Controla se o serviço aparece no bot
}

export interface ServicoCreationAttributes extends Optional<ServicoAttributes, "id" | "descricao"> { }

export class Servico extends Model<ServicoAttributes, ServicoCreationAttributes> {
    declare id: string;
    declare nome: string;
    declare descricao: string | null;
    declare preco: number;
    declare duracao: number;
    declare ativo: boolean;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public static initialize(sequelize: Sequelize): void {
        Servico.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
                },
                nome: {
                    type: DataTypes.STRING,
                    allowNull: false,
                },
                descricao: {
                    type: DataTypes.STRING,
                    allowNull: true,
                },
                preco: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: false,
                },
                duracao: {
                    type: DataTypes.INTEGER,
                    allowNull: false,
                    comment: "Duração em minutos",
                },
                ativo: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: true,
                    comment: "Define se o serviço está ativo e visível no bot",
                },
            },
            {
                sequelize,
                tableName: "servicos",
                timestamps: true,
            }
        );
    }

    public static associate(models: any): void {
        // Adicionar associações futuras aqui, se necessário.
        // Ex: this.hasMany(models.Agendamento, { foreignKey: 'servicoId' });
    }
}

export default Servico;
