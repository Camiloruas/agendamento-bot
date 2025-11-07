import { Model, DataTypes, Optional } from "sequelize";
import { sequelize } from "../database/connection.js";
import * as bcrypt from "bcrypt";

export interface ProfissionalAttributes {
  id: string; // Usaremos UUID para o ID (padrão em projetos modernos)
  nome: string;
  email: string;
  senha: string;
  // Campos automáticos do Sequelize, mas é bom tipar
  createdAt?: Date;
  updatedAt?: Date;
}

// 2. Interface de Criação (Opcionais no momento da Criação)
// O 'id' e os campos de tempo (createdAt, updatedAt) são gerados automaticamente, então são opcionais
export interface ProfissionalCreationAttributes extends Optional<ProfissionalAttributes, "id" | "createdAt" | "updatedAt"> {}

// 3. Classe do Modelo (A Implementação do Sequelize)
// Usamos <ProfissionalAttributes, ProfissionalCreationAttributes> para tipar o Modelo
export class Profissional extends Model<ProfissionalAttributes, ProfissionalCreationAttributes> implements ProfissionalAttributes {
  public id!: string;
  public nome!: string;
  public email!: string;
  public senha!: string;

  // Campos automáticos
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// 4. Inicialização do Modelo (Definição da Tabela no DB)
Profissional.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4, // Gera um ID único automático (ex: eb8d691f-...)
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
      unique: true, // Garante que não haverá emails duplicados
    },
    senha: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize, // A instância de conexão
    tableName: "Profissionais", // Nome da tabela no banco de dados
    timestamps: true, // Mantém os campos createdAt e updatedAt
    modelName: "Profissional",
  }
);

Profissional.beforeCreate(async (profissional) => {
  // Definimos o custo do hash (quanto maior, mais seguro, porem  mais lento)
  const saltRounds = 8;

  // Gera o hash da senha
  const hashedPassword = await bcrypt.hash(profissional.senha, saltRounds);

  // Sobrescreve a senha de texto simples com o hash criptografado
  profissional.senha = hashedPassword;
});

// Exportamos o modelo final
export default Profissional;
