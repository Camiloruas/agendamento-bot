import { Model, DataTypes, Optional, Sequelize, BelongsToGetAssociationMixin } from "sequelize";
import Cliente from "./Cliente";
import Profissional from "./Profissional";

/**
 * @interface AgendamentoAttributes
 * @description Define a estrutura de um agendamento, servindo como um contrato para os tipos de dados.
 * Isso garante consistência em toda a aplicação ao manipular objetos de agendamento.
 */
export interface AgendamentoAttributes {
  id: string;
  dataHora: Date;
  descricao: string | null;
  profissionalId: string;
  clienteId: string;
  servico: 'Corte' | 'Barba' | 'Corte + Barba';
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
}

/**
 * @interface AgendamentoCreationAttributes
 * @description Define quais atributos são opcionais ao criar um novo agendamento.
 * `id` é gerado automaticamente pelo banco de dados, e `descricao` e `status` têm valores padrão.
 */
export interface AgendamentoCreationAttributes extends Optional<AgendamentoAttributes, "id" | "descricao" | "status"> {}

/**
 * @class Agendamento
 * @description Representa a tabela `agendamentos` no banco de dados.
 * Este modelo encapsula toda a lógica de negócio e as definições de dados para agendamentos,
 * incluindo seus campos, tipos e relacionamentos.
 */
export class Agendamento extends Model<AgendamentoAttributes, AgendamentoCreationAttributes> {
  declare id: string;
  declare dataHora: Date;
  declare descricao: string | null;
  declare profissionalId: string;
  declare clienteId: string;
  declare servico: 'Corte' | 'Barba' | 'Corte + Barba';
  declare status: 'Pendente' | 'Confirmado' | 'Cancelado';

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;

  // Mixins fornecidos pelo Sequelize para habilitar o type-checking em associações.
  // Permitem, por exemplo, chamar `agendamento.getCliente()` com segurança de tipo.
  declare getCliente: BelongsToGetAssociationMixin<Cliente>;
  declare readonly cliente?: Cliente;
  declare readonly profissional?: Profissional;

  /**
   * @function initialize
   * @description Inicializa o modelo, definindo seus campos e configurações.
   * É chamado centralmente no `server.ts` para registrar o modelo na instância do Sequelize.
   * @param sequelize - A instância do Sequelize.
   */
  public static initialize(sequelize: Sequelize): void {
    Agendamento.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        dataHora: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        descricao: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        profissionalId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        clienteId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        servico: {
            type: DataTypes.ENUM('Corte', 'Barba', 'Corte + Barba'),
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('Pendente', 'Confirmado', 'Cancelado'),
            defaultValue: 'Pendente',
            allowNull: false,
        },
      },
      {
        sequelize,
        tableName: "agendamentos",
        timestamps: true,
      }
    );
  }

  /**
   * @function associate
   * @description Define os relacionamentos (associações) deste modelo com outros.
   * É chamado no `server.ts` após todos os modelos serem inicializados para evitar problemas de referência circular.
   */
  public static associate(): void {
    // Um agendamento pertence a um único profissional.
    this.belongsTo(Profissional, {
      foreignKey: "profissionalId",
      as: "profissional",
      onDelete: "CASCADE", // Se um profissional for deletado, seus agendamentos também serão.
      onUpdate: "CASCADE",
    });

    // Um agendamento pertence a um único cliente.
    this.belongsTo(Cliente, {
      foreignKey: "clienteId",
      as: "cliente",
      onDelete: "CASCADE", // Se um cliente for deletado, seus agendamentos também serão.
      onUpdate: "CASCADE",
    });
  }
}

export default Agendamento;
