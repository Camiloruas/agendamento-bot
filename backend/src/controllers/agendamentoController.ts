import { Response } from "express";
import { DatabaseError } from "sequelize";
// NOVIDADE: Importa a interface AuthRequest para tipar a requisição
import { AuthRequest } from "../middlewares/authMiddleware";
import Agendamento from "../models/Agendamento";
import Profissional from "../models/Profissional";
import Cliente from "../models/Cliente"; // Adicione esta linha
// A rota só será acessível por um usuário autenticado (middleware protect)
// Usamos AuthRequest para garantir que 'userId' existe.
export const createAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  // 1. Extrai os dados da requisição
  const profissionalId = req.userId;
  const { dataHora, descricao, clienteId } = req.body; // CORRIGIDO: clienteId adicionado

  // 2. Validação dos Dados
  if (!dataHora || !clienteId) { // CORRIGIDO: Validação para clienteId
    return res.status(400).json({
      message: "Erro: A data, hora e o ID do cliente são obrigatórios.",
    });
  }

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  try {
    // 3. VERIFICAÇÃO: Garante que o cliente e o profissional existem
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    const profissional = await Profissional.findByPk(profissionalId);
    if (!profissional) {
      return res.status(404).json({ message: "Profissional não encontrado." });
    }

    // 4. Criação do Agendamento
    const novoAgendamento = await Agendamento.create({
      dataHora,
      descricao: descricao || "Agendamento padrão",
      profissionalId,
      clienteId, // CORRIGIDO: clienteId incluído na criação
    });

    // 5. Retorna a resposta de sucesso
    return res.status(201).json({
      message: "Agendamento criado com sucesso.",
      agendamento: {
        id: novoAgendamento.id,
        dataHora: novoAgendamento.dataHora,
        descricao: novoAgendamento.descricao,
        profissionalId: novoAgendamento.profissionalId,
        clienteId: novoAgendamento.clienteId, // CORRIGIDO: Retorna o clienteId
      },
    });
  } catch (error) {
    const dbError = error as DatabaseError;

    console.error("Erro ao criar agendamento:", dbError);
    return res.status(500).json({
      message: "Erro interno ao processar a requisição.",
      details: dbError.message,
    });
  }
};
export const getAllAgendamentos = async (req: AuthRequest, res: Response): Promise<Response> => {
  // 1. Extrai o ID do Profissional autenticado
  const profissionalId = req.userId;

  // 2. Garante que o ID existe (verificação de segurança)
  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  try {
    // 3. Busca todos os agendamentos ONDE o profissionalId coincide com o ID do usuário logado
    const agendamentos = await Agendamento.findAll({
      where: {
        profissionalId: profissionalId, // <--- CHAVE DA FILTRAGEM
      },
      // Inclui os dados do Profissional e do Cliente na resposta
      include: [
        { model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
        { model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
      ],
      order: [["dataHora", "ASC"]], // Ordena por data e hora
    });

    // 4. Retorna a lista de agendamentos
    return res.status(200).json(agendamentos);
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    return res.status(500).json({
      message: "Erro interno do servidor ao listar agendamentos.",
    });
  }
};

export const getAgendamentoById = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId;
  const { id } = req.params; // ID do agendamento vem da URL

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  try {
    // 1. Busca o agendamento pelo ID E pelo profissionalId (Filtro de segurança)
    const agendamento = await Agendamento.findOne({
      where: {
        id: id,
        profissionalId: profissionalId, // CHAVE: Garante que só verá o seu agendamento
      },
      include: [
        { model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
        { model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
      ],
    });

    if (!agendamento) {
      // Se o ID não for encontrado OU não pertencer ao usuário logado
      return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
    }

    return res.status(200).json(agendamento);
  } catch (error) {
    console.error("Erro ao buscar agendamento:", error);
    return res.status(500).json({ message: "Erro interno ao buscar agendamento." });
  }
};

export const deleteAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId;
  const { id } = req.params; // ID do agendamento vem da URL

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  try {
    // 1. Tenta deletar o agendamento que pertence ao usuário logado
    const result = await Agendamento.destroy({
      where: {
        id: id,
        profissionalId: profissionalId, // CHAVE: Garante que só pode deletar o seu
      },
    });

    if (result === 0) {
      // Se 0 linhas foram afetadas, o agendamento não existia ou não pertencia ao usuário logado
      return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
    }

    // 2. Se a exclusão foi bem-sucedida
    return res.status(204).send(); // 204 No Content para exclusão bem-sucedida
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return res.status(500).json({ message: "Erro interno ao deletar agendamento." });
  }
};

export const updateAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId;
  const { id } = req.params; // ID do agendamento que será atualizado
  const { dataHora, descricao } = req.body; // Novos dados

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  // Validação básica: Pelo menos um campo deve ser fornecido para a atualização
  if (!dataHora && !descricao) {
    return res.status(400).json({ message: "Pelo menos 'dataHora' ou 'descricao' deve ser fornecido para atualizar." });
  }

  try {
    // 1. O Sequelize atualiza o agendamento ONDE o ID e o profissionalId coincidem
    const [updatedRowsCount] = await Agendamento.update(
      {
        dataHora: dataHora,
        descricao: descricao,
      },
      {
        where: {
          id: id,
          profissionalId: profissionalId, // CHAVE: Garante que só pode editar o seu
        },
      }
    );

    if (updatedRowsCount === 0) {
      // Se 0 linhas foram afetadas, o agendamento não existia ou não pertencia ao usuário logado
      return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
    }

    // 2. Busca e retorna o agendamento atualizado para confirmação (opcional, mas recomendado)
    const agendamentoAtualizado = await Agendamento.findByPk(id, {
      include: [
        { model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
        { model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
      ],
    });

    return res.status(200).json({
      message: "Agendamento atualizado com sucesso.",
      agendamento: agendamentoAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar agendamento:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar agendamento." });
  }
};
