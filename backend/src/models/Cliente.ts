import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

// Define os atributos do Cliente
export interface ClienteAttributes {
    id: string;
    nome: string;
    telefone: string; // Usado para identificar o cliente (número do WhatsApp)
}

// Define os atributos que são opcionais na criação
interface ClienteCreationAttributes extends Optional<ClienteAttributes, 'id'> {}

// Classe do Modelo Cliente
export class Cliente extends Model<ClienteAttributes, ClienteCreationAttributes> {
    // Usamos 'declare' para informar ao TypeScript sobre os campos, sem interferir no Sequelize.
    declare id: string;
    declare nome: string;
    declare telefone: string;

    // Timestamps adicionados automaticamente pelo Sequelize
    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    public static initialize(sequelize: Sequelize): void {
        Cliente.init({
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            nome: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            telefone: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true, // Garante que não haja dois clientes com o mesmo número
            },
        }, {
            sequelize,
            tableName: 'clientes',
            timestamps: true,
        });
    }

    // Define a associação com Agendamento
    public static associate(models: any): void {
        this.hasMany(models.Agendamento, {
            foreignKey: 'clienteId',
            as: 'agendamentos',
        });
    }
}

// Interface do modelo Cliente para uso externo
export type ClienteInstance = Cliente;

export default Cliente;