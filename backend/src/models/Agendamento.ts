import { Model, DataTypes, Optional, Sequelize, BelongsToGetAssociationMixin } from "sequelize";
import Cliente from "./Cliente";
import Profissional from "./Profissional";

// 1. Definição dos Atributos
export interface AgendamentoAttributes {
  id: string;
  dataHora: Date;
  // CORRIGIDO: Agora aceita explicitamente 'string' ou 'null' (valor do banco de dados)
  descricao: string | null;
  profissionalId: string;
  clienteId: string;
}

// 2. Definição dos Atributos de Criação
// Mantemos 'descricao' como opcional para a criação (não precisa ser fornecido no POST)
export interface AgendamentoCreationAttributes extends Optional<AgendamentoAttributes, "id" | "descricao"> {}

// 3. Classe do Modelo
// O ': string | null' na linha 19 agora corresponde ao ': string | null' na linha 12
export class Agendamento extends Model<AgendamentoAttributes, AgendamentoCreationAttributes> implements AgendamentoAttributes {
  public id!: string;
  public dataHora!: Date;
  public descricao!: string | null; // CORRIGIDO: Usa string | null
  public profissionalId!: string;
  public clienteId!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Mixins de associação para o TypeScript
  public getCliente!: BelongsToGetAssociationMixin<Cliente>;
  public readonly cliente?: Cliente;
  public readonly profissional?: Profissional;

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
          allowNull: true, // allowNull: true significa que o BD pode guardar NULL
        },
        // Apenas definimos a coluna. A relação é feita no 'associate'.
        profissionalId: {
          type: DataTypes.UUID,
          allowNull: false,
        },
        // Apenas definimos a coluna. A relação é feita no 'associate'.
        clienteId: {
          type: DataTypes.UUID,
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
    // É importante que Profissional esteja importado para esta linha funcionar
    Profissional.hasMany(this, { foreignKey: "profissionalId", as: "agendamentos" });

    // Relação com Cliente
    this.belongsTo(Cliente, {
      foreignKey: "clienteId",
      as: "cliente",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    // É importante que Cliente esteja importado para esta linha funcionar
    Cliente.hasMany(this, { foreignKey: "clienteId", as: "agendamentos" });
  }
}

export default Agendamento;
