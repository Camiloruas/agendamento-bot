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
export class Cliente extends Model<ClienteAttributes, ClienteCreationAttributes> implements ClienteAttributes {
    public id!: string;
    public nome!: string;
    public telefone!: string;

    // Timestamps adicionados automaticamente pelo Sequelize
    public readonly createdAt!: Date;
    public readonly updatedAt!: Date;

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
}

// Interface do modelo Cliente para uso externo
export type ClienteInstance = Cliente;

export default Cliente;