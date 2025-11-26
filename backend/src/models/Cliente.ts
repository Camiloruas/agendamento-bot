import { Model, DataTypes, Optional, Sequelize } from 'sequelize';

/**
 * @interface ClienteAttributes
 * @description Define os atributos essenciais para um cliente. O `telefone` é o identificador
 * de negócio principal, usado para vincular o cliente à sua conversa no WhatsApp.
 */
export interface ClienteAttributes {
    id: string;
    nome: string;
    telefone: string; 
}

/**
 * @interface ClienteCreationAttributes
 * @description Torna o `id` opcional durante a criação de um novo cliente,
 * pois o Sequelize (e o banco de dados) se encarregará de gerá-lo.
 */
interface ClienteCreationAttributes extends Optional<ClienteAttributes, 'id'> {}

/**
 * @class Cliente
 * @description Representa a tabela `clientes`. Este modelo é a ponte entre a aplicação
 * e o registro de clientes no banco de dados.
 */
export class Cliente extends Model<ClienteAttributes, ClienteCreationAttributes> {
    declare id: string;
    declare nome: string;
    declare telefone: string;

    declare readonly createdAt: Date;
    declare readonly updatedAt: Date;

    /**
     * @function initialize
     * @description Define a estrutura da tabela `clientes`, incluindo tipos de dados,
     * chaves e constraints.
     * @param sequelize - A instância do Sequelize.
     */
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
                unique: true, // Garante que cada número de telefone seja único, prevenindo clientes duplicados.
            },
        }, {
            sequelize,
            tableName: 'clientes',
            timestamps: true,
        });
    }

    /**
     * @function associate
     * @description Cria a associação com outros modelos. Essencial para o ORM
     * entender como os dados se conectam.
     * @param models - Um objeto contendo todos os modelos inicializados.
     */
    public static associate(models: any): void {
        // Um cliente pode ter muitos agendamentos.
        this.hasMany(models.Agendamento, {
            foreignKey: 'clienteId',
            as: 'agendamentos', // Alias para ser usado em queries (ex: `include: { as: 'agendamentos' }`)
        });
    }
}

/**
 * @type ClienteInstance
 * @description Exporta o tipo da instância do modelo para uso em outras partes do código,
 * facilitando a tipagem e o autocompletar.
 */
export type ClienteInstance = Cliente;

export default Cliente;