import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../database/connection';
import Profissional from './Profissional'; // Importa o modelo Profissional

// 1. Definição dos Atributos (o que o TS reconhece)
export interface AgendamentoAttributes {
    id: string;
    dataHora: Date;
    descricao: string;
    // Chave estrangeira que conecta ao Profissional
    profissionalId: string; 
}

// 2. Definição dos Atributos de Criação (o que é opcional ao criar)
export interface AgendamentoCreationAttributes extends Optional<AgendamentoAttributes, 'id'> {}

// 3. Definição da Instância do Modelo (o que o Sequelize retorna)
export interface AgendamentoInstance extends Model<AgendamentoAttributes, AgendamentoCreationAttributes>, AgendamentoAttributes {}

// 4. Definição do Modelo (Tabela)
const Agendamento = sequelize.define<AgendamentoInstance>('Agendamento', {
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
    // Chave estrangeira (FK)
    profissionalId: {
        type: DataTypes.UUID,
        allowNull: false,
        // Garante que o ID faz referência à tabela Profissionais
        references: { 
            model: Profissional,
            key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
    },
});

// Define a associação (Relacionamento 1:N)
// Um profissional tem muitos agendamentos.
Profissional.hasMany(Agendamento, { foreignKey: 'profissionalId' });
// Um agendamento pertence a um profissional.
Agendamento.belongsTo(Profissional, { foreignKey: 'profissionalId' });

export default Agendamento;