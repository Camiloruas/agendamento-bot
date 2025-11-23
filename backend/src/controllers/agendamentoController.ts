import { Response } from "express";
import { DatabaseError, Op } from "sequelize"; // Adicionado Op para operadores de Sequelize
import { AuthRequest } from "../middlewares/authMiddleware";
import Agendamento from "../models/Agendamento";
import Profissional from "../models/Profissional";
import Cliente from "../models/Cliente";
import HorarioProfissional from "../models/HorarioProfissional"; // Importa o novo modelo
import moment from 'moment'; // Para manipulação de datas e horas

// A rota só será acessível por um usuário autenticado (middleware protect)
// Usamos AuthRequest para garantir que 'userId' existe.
export const createAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  // 1. Extrai os dados da requisição
  const profissionalId = req.userId;
  const { dataHora, descricao, clienteId, servico } = req.body; // Adicionado 'servico'

  // 2. Validação dos Dados
  if (!dataHora || !clienteId || !servico) { // Validação para 'servico'
    return res.status(400).json({
      message: "Erro: A data, hora, ID do cliente e o serviço são obrigatórios.",
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

    // 4. VERIFICAÇÃO DE CONFLITO: Garante que o horário está vago
    const existingAppointment = await Agendamento.findOne({
      where: {
        profissionalId: profissionalId,
        dataHora: dataHora,
        status: {
          [Op.ne]: 'Cancelado' // Não considerar conflito com agendamentos cancelados
        }
      }
    });

    if (existingAppointment) {
      return res.status(409).json({
        message: "Conflito de agendamento. O horário solicitado já está ocupado.",
      });
    }

    // 5. Criação do Agendamento
    const novoAgendamento = await Agendamento.create({
      dataHora,
      descricao: descricao || "Agendamento padrão",
      profissionalId,
      clienteId,
      servico, // Incluído o serviço
      status: 'Pendente', // Status inicial
    });

    // 6. Retorna a resposta de sucesso
    return res.status(201).json({
      message: "Agendamento criado com sucesso.",
      agendamento: {
        id: novoAgendamento.id,
        dataHora: novoAgendamento.dataHora,
        descricao: novoAgendamento.descricao,
        profissionalId: novoAgendamento.profissionalId,
        clienteId: novoAgendamento.clienteId,
        servico: novoAgendamento.servico,
        status: novoAgendamento.status,
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
  const profissionalId = req.userId;

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  try {
    const agendamentos = await Agendamento.findAll({
      where: {
        profissionalId: profissionalId,
      },
      include: [
        { model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
        { model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
      ],
      order: [["dataHora", "ASC"]],
    });

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
  const { id } = req.params;

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  try {
    const agendamento = await Agendamento.findOne({
      where: {
        id: id,
        profissionalId: profissionalId,
      },
      include: [
        { model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
        { model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
      ],
    });

    if (!agendamento) {
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
  const { id } = req.params;

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  try {
    const result = await Agendamento.destroy({
      where: {
        id: id,
        profissionalId: profissionalId,
      },
    });

    if (result === 0) {
      return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao deletar agendamento:", error);
    return res.status(500).json({ message: "Erro interno ao deletar agendamento." });
  }
};

export const updateAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId;
  const { id } = req.params;
  const { dataHora, descricao, servico, status } = req.body; // Adicionado 'servico' e 'status'

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  if (!dataHora && !descricao && !servico && !status) {
    return res.status(400).json({ message: "Pelo menos um campo deve ser fornecido para atualizar." });
  }

  try {
    const [updatedRowsCount] = await Agendamento.update(
      {
        dataHora: dataHora,
        descricao: descricao,
        servico: servico,
        status: status,
      },
      {
        where: {
          id: id,
          profissionalId: profissionalId,
        },
      }
    );

    if (updatedRowsCount === 0) {
      return res.status(404).json({ message: "Agendamento não encontrado ou acesso negado." });
    }

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

// NOVO: Função para obter horários disponíveis de um profissional
export const getAvailableSlots = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId;
  const { date } = req.query; // Data no formato YYYY-MM-DD

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  if (!date || typeof date !== 'string' || !moment(date, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json({ message: "A data é obrigatória e deve estar no formato YYYY-MM-DD." });
  }

  try {
    const selectedDate = moment.utc(date as string);
    const dayOfWeek = selectedDate.day();

    const horarioConfig = await HorarioProfissional.findOne({
      where: {
        profissionalId: profissionalId,
        diaDaSemana: dayOfWeek,
        ativo: true,
      },
    });

    if (!horarioConfig) {
      return res.status(200).json([]);
    }

    const startOfDay = selectedDate.clone().startOf('day').toDate();
    const endOfDay = selectedDate.clone().endOf('day').toDate();

    const existingAppointments = await Agendamento.findAll({
      where: {
        profissionalId: profissionalId,
        dataHora: {
          [Op.between]: [startOfDay, endOfDay],
        },
        status: {
          [Op.ne]: 'Cancelado',
        },
      },
      attributes: ['dataHora'],
    });

    const bookedTimes = new Set(existingAppointments.map(app => moment.utc(app.dataHora).format('HH:mm')));

    const allSlots: { time: string, status: 'disponivel' | 'ocupado' }[] = [];
    const currentTime = moment.utc(`${date} ${horarioConfig.horarioInicio}`, 'YYYY-MM-DD HH:mm');
    const endTime = moment.utc(`${date} ${horarioConfig.horarioFim}`, 'YYYY-MM-DD HH:mm');
    const lunchStart = horarioConfig.almocoInicio ? moment.utc(`${date} ${horarioConfig.almocoInicio}`, 'YYYY-MM-DD HH:mm') : null;
    const lunchEnd = horarioConfig.almocoFim ? moment.utc(`${date} ${horarioConfig.almocoFim}`, 'YYYY-MM-DD HH:mm') : null;

    while (currentTime.isBefore(endTime)) {
      if (lunchStart && lunchEnd && currentTime.isBetween(lunchStart, lunchEnd, null, '[)')) {
          currentTime = lunchEnd.clone();
          continue;
      }

      const slotTime = currentTime.format('HH:mm');
      const status = bookedTimes.has(slotTime) ? 'ocupado' : 'disponivel';
      
      allSlots.push({ time: slotTime, status: status });
      
      currentTime.add(1, 'hour');
    }

    return res.status(200).json(allSlots);

  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    return res.status(500).json({ message: "Erro interno ao buscar horários disponíveis." });
  }
};

// NOVO: Função para obter agendamentos de um cliente específico
export const getAgendamentosByCliente = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId; // ID do profissional autenticado
  const { clienteId } = req.params; // ID do cliente vem da URL

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  if (!clienteId) {
    return res.status(400).json({ message: "O ID do cliente é obrigatório." });
  }

  try {
    // Busca agendamentos onde o clienteId corresponde E o profissionalId corresponde
    // Isso garante que um profissional só veja agendamentos de seus próprios clientes
    const agendamentos = await Agendamento.findAll({
      where: {
        clienteId: clienteId,
        profissionalId: profissionalId, // Filtro de segurança
      },
      include: [
        { model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
        { model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
      ],
      order: [["dataHora", "ASC"]],
    });

    if (agendamentos.length === 0) {
      return res.status(404).json({ message: "Nenhum agendamento encontrado para este cliente ou acesso negado." });
    }

    return res.status(200).json(agendamentos);
  } catch (error) {
    console.error("Erro ao buscar agendamentos por cliente:", error);
    return res.status(500).json({ message: "Erro interno ao buscar agendamentos do cliente." });
  }
};

// NOVO: Função para obter agendamentos por data
export const getAgendamentosByDate = async (req: AuthRequest, res: Response): Promise<Response> => {
    const profissionalId = req.userId;
    const { date } = req.query; // Data no formato YYYY-MM-DD

    if (!profissionalId) {
        return res.status(401).json({ message: "Profissional não autenticado." });
    }

    if (!date || typeof date !== 'string' || !moment(date, 'YYYY-MM-DD', true).isValid()) {
        return res.status(400).json({ message: "A data é obrigatória e deve estar no formato YYYY-MM-DD." });
    }

    try {
        const selectedDate = moment.utc(date as string);
        const startOfDay = selectedDate.clone().startOf('day').toDate();
        const endOfDay = selectedDate.clone().endOf('day').toDate();

        const agendamentos = await Agendamento.findAll({
            where: {
                profissionalId: profissionalId,
                dataHora: {
                    [Op.between]: [startOfDay, endOfDay],
                },
            },
            include: [
                { model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
                { model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
            ],
            order: [["dataHora", "ASC"]],
        });

        if (agendamentos.length === 0) {
            return res.status(404).json({ message: "Nenhum agendamento encontrado para esta data." });
        }

        return res.status(200).json(agendamentos);
    } catch (error) {
        console.error("Erro ao buscar agendamentos por data:", error);
        return res.status(500).json({ message: "Erro interno ao buscar agendamentos por data." });
    }
};

// NOVO: Função para verificar se um cliente possui agendamento ativo com um profissional
export const hasActiveAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId; // ID do profissional autenticado
  const { clienteId } = req.params; // ID do cliente vem da URL

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  if (!clienteId) {
    return res.status(400).json({ message: "O ID do cliente é obrigatório." });
  }

  try {
    const now = moment().toDate(); // Data e hora atuais

    const activeAgendamento = await Agendamento.findOne({
      where: {
        clienteId: clienteId,
        profissionalId: profissionalId,
        status: {
          [Op.in]: ['Pendente', 'Confirmado'], // Status de agendamento ativo
        },
        dataHora: {
          [Op.gte]: now, // Agendamentos que ainda não passaram
        },
      },
    });

    return res.status(200).json({ hasActive: !!activeAgendamento });
  } catch (error) {
    console.error("Erro ao verificar agendamento ativo:", error);
    return res.status(500).json({ message: "Erro interno ao verificar agendamento ativo." });
  }
};
