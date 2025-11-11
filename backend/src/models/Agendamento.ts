import { Model, DataTypes, Optional, Sequelize, BelongsToGetAssociationMixin } from "sequelize";
import Cliente from "./Cliente";
import Profissional from "./Profissional";

// 1. Definição dos Atributos
export interface AgendamentoAttributes {
  id: string;
  dataHora: Date;
  descricao: string | null;
  profissionalId: string;
  clienteId: string;
  servico: 'Corte' | 'Barba' | 'Corte + Barba';
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
}

// 2. Definição dos Atributos de Criação
export interface AgendamentoCreationAttributes extends Optional<AgendamentoAttributes, "id" | "descricao" | "status"> {}

// 3. Classe do Modelo
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

  // Mixins de associação para o TypeScript
  declare getCliente: BelongsToGetAssociationMixin<Cliente>;
  declare readonly cliente?: Cliente;
  declare readonly profissional?: Profissional;

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

  public static associate(): void {
    // Relação com Profissional
    this.belongsTo(Profissional, {
      foreignKey: "profissionalId",
      as: "profissional",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Profissional.hasMany(this, { foreignKey: "profissionalId", as: "agendamentos" });

    // Relação com Cliente
    this.belongsTo(Cliente, {
      foreignKey: "clienteId",
      as: "cliente",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    Cliente.hasMany(this, { foreignKey: "clienteId", as: "agendamentos" });
  }
}

export default Agendamento;
