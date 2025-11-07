import { Response } from "express";
import { DatabaseError } from "sequelize";
// NOVIDADE: Importa a interface AuthRequest para tipar a requisição
import { AuthRequest } from "../middlewares/authMiddleware";
import Agendamento from "../models/Agendamento";
import Profissional from "../models/Profissional";
// A rota só será acessível por um usuário autenticado (middleware protect)
// Usamos AuthRequest para garantir que 'userId' existe.
export const createAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  // 1. Extrai o ID do Profissional da requisição (injetado pelo middleware protect)
  const profissionalId = req.userId;
  const { dataHora, descricao } = req.body;

  // 2. Validação Básica
  if (!dataHora) {
    return res.status(400).json({
      message: "Erro: A data e hora do agendamento são obrigatórios.",
    });
  }

  // 3. Validação do ID (redundante, mas seguro)
  if (!profissionalId) {
    // Isso não deve acontecer se o middleware estiver correto
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  try {
    // 4. Criação do Agendamento
    const novoAgendamento = await Agendamento.create({
      dataHora,
      descricao: descricao || "Agendamento padrão", // Usa valor padrão se a descrição for vazia
      profissionalId, // <--- CHAVE: Conecta o agendamento ao usuário logado
    });

    // 5. Retorna a resposta de sucesso
    return res.status(201).json({
      message: "Agendamento criado com sucesso.",
      agendamento: {
        id: novoAgendamento.id,
        dataHora: novoAgendamento.dataHora,
        descricao: novoAgendamento.descricao,
        profissionalId: novoAgendamento.profissionalId,
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
      // Inclui o nome do Profissional na resposta (opcional, mas útil)
      include: [{ model: Profissional, attributes: ["id", "nome", "email"] }],
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
