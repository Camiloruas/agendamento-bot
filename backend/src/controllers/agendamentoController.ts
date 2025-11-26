import { Response } from "express";
import { DatabaseError, Op } from "sequelize"; 
import { AuthRequest } from "../middlewares/authMiddleware";
import Agendamento from "../models/Agendamento";
import Profissional from "../models/Profissional";
import Cliente from "../models/Cliente";
import HorarioProfissional from "../models/HorarioProfissional"; 
import moment from 'moment'; 

/**
 * @function createAgendamento
 * @description Cria um novo agendamento, garantindo que o horário esteja disponível e
 * que o profissional e cliente existam.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns Retorna o agendamento criado ou uma mensagem de erro.
 */
export const createAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId;
  const { dataHora, descricao, clienteId, servico } = req.body; 

  // Validação essencial para garantir que os dados mínimos para um agendamento foram fornecidos.
  if (!dataHora || !clienteId || !servico) { 
    return res.status(400).json({
      message: "Erro: A data, hora, ID do cliente e o serviço são obrigatórios.",
    });
  }

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  try {
    // Verificações de integridade referencial para evitar agendamentos "órfãos".
    const cliente = await Cliente.findByPk(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    const profissional = await Profissional.findByPk(profissionalId);
    if (!profissional) {
      return res.status(404).json({ message: "Profissional não encontrado." });
    }

    // Lógica de negócio principal: previne agendamentos duplos no mesmo horário.
    const existingAppointment = await Agendamento.findOne({
      where: {
        profissionalId: profissionalId,
        dataHora: dataHora,
        status: {
          [Op.ne]: 'Cancelado' 
        }
      }
    });

    if (existingAppointment) {
      return res.status(409).json({
        message: "Conflito de agendamento. O horário solicitado já está ocupado.",
      });
    }

    // Persiste o novo agendamento no banco de dados.
    const novoAgendamento = await Agendamento.create({
      dataHora,
      descricao: descricao || "Agendamento padrão",
      profissionalId,
      clienteId,
      servico, 
      status: 'Pendente', 
    });

    // Retorna uma resposta clara de sucesso com o objeto criado.
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

/**
 * @function getAllAgendamentos
 * @description Retorna todos os agendamentos associados a um profissional autenticado.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns Uma lista de agendamentos.
 */
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
      include: [ // Eager loading para trazer dados relacionados e evitar N+1 queries.
        { model: Profissional, as: 'profissional', attributes: ["id", "nome", "email"] },
        { model: Cliente, as: 'cliente', attributes: ["id", "nome", "telefone"] }
      ],
      order: [["dataHora", "ASC"]], // Ordena para uma visualização cronológica.
    });

    return res.status(200).json(agendamentos);
  } catch (error) {
    console.error("Erro ao listar agendamentos:", error);
    return res.status(500).json({
      message: "Erro interno do servidor ao listar agendamentos.",
    });
  }
};

/**
 * @function getAgendamentoById
 * @description Busca um agendamento específico por ID, garantindo que ele pertença ao profissional autenticado.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns O agendamento encontrado ou um erro 404.
 */
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
        profissionalId: profissionalId, // Cláusula de segurança para garantir o pertencimento.
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

/**
 * @function deleteAgendamento
 * @description Exclui um agendamento, verificando a propriedade antes da exclusão.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns Retorna 204 No Content em caso de sucesso.
 */
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

/**
 * @function updateAgendamento
 * @description Atualiza os dados de um agendamento existente.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns O agendamento atualizado.
 */
export const updateAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId;
  const { id } = req.params;
  const { dataHora, descricao, servico, status } = req.body; 

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  if (!dataHora && !descricao && !servico && !status) {
    return res.status(400).json({ message: "Pelo menos um campo deve ser fornecido para atualizar." });
  }

  try {
    const [updatedRowsCount] = await Agendamento.update(
      { dataHora, descricao, servico, status },
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

/**
 * @function getAvailableSlots
 * @description Calcula e retorna os horários (slots) disponíveis para um profissional em uma data específica.
 * Leva em consideração o horário de trabalho, almoço e agendamentos existentes.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns Uma lista de slots de tempo com seu status ('disponivel' ou 'ocupado').
 */
export const getAvailableSlots = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId;
  const { date } = req.query; 

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  if (!date || typeof date !== 'string' || !moment(date, 'YYYY-MM-DD', true).isValid()) {
    return res.status(400).json({ message: "A data é obrigatória e deve estar no formato YYYY-MM-DD." });
  }

  try {
    const selectedDate = moment.utc(date as string);
    const dayOfWeek = selectedDate.day();

    // Busca a configuração de trabalho do profissional para aquele dia da semana.
    const horarioConfig = await HorarioProfissional.findOne({
      where: {
        profissionalId: profissionalId,
        diaDaSemana: dayOfWeek,
        ativo: true,
      },
    });

    if (!horarioConfig) {
      return res.status(200).json([]); // Se não trabalha no dia, retorna lista vazia.
    }

    const startOfDay = selectedDate.clone().startOf('day').toDate();
    const endOfDay = selectedDate.clone().endOf('day').toDate();

    // Busca todos os agendamentos já existentes para o dia para identificar os horários ocupados.
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

    // Gera todos os possíveis slots de horário do dia, verificando o status de cada um.
    const allSlots: { time: string, status: 'disponivel' | 'ocupado' }[] = [];
    const currentTime = moment.utc(`${date} ${horarioConfig.horarioInicio}`, 'YYYY-MM-DD HH:mm');
    const endTime = moment.utc(`${date} ${horarioConfig.horarioFim}`, 'YYYY-MM-DD HH:mm');
    const lunchStart = horarioConfig.almocoInicio ? moment.utc(`${date} ${horarioConfig.almocoInicio}`, 'YYYY-MM-DD HH:mm') : null;
    const lunchEnd = horarioConfig.almocoFim ? moment.utc(`${date} ${horarioConfig.almocoFim}`, 'YYYY-MM-DD HH:mm') : null;

    while (currentTime.isBefore(endTime)) {
      // Pula o horário de almoço.
      if (lunchStart && lunchEnd && currentTime.isBetween(lunchStart, lunchEnd, null, '[)')) {
          currentTime = lunchEnd.clone();
          continue;
      }

      const slotTime = currentTime.format('HH:mm');
      const status = bookedTimes.has(slotTime) ? 'ocupado' : 'disponivel';
      
      allSlots.push({ time: slotTime, status: status });
      
      currentTime.add(1, 'hour'); // Avança para o próximo slot (assumindo duração de 1h).
    }

    return res.status(200).json(allSlots);

  } catch (error) {
    console.error("Erro ao buscar horários disponíveis:", error);
    return res.status(500).json({ message: "Erro interno ao buscar horários disponíveis." });
  }
};

/**
 * @function getAgendamentosByCliente
 * @description Retorna todos os agendamentos de um cliente específico para o profissional autenticado.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns Uma lista de agendamentos do cliente.
 */
export const getAgendamentosByCliente = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId; 
  const { clienteId } = req.params; 

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  if (!clienteId) {
    return res.status(400).json({ message: "O ID do cliente é obrigatório." });
  }

  try {
    // A cláusula `where` dupla é uma medida de segurança para garantir que um profissional
    // só possa ver agendamentos de seus próprios clientes.
    const agendamentos = await Agendamento.findAll({
      where: {
        clienteId: clienteId,
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
    console.error("Erro ao buscar agendamentos por cliente:", error);
    return res.status(500).json({ message: "Erro interno ao buscar agendamentos do cliente." });
  }
};

/**
 * @function getAgendamentosByDate
 * @description Retorna todos os agendamentos de uma data específica para o profissional autenticado.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns Uma lista de agendamentos para a data.
 */
export const getAgendamentosByDate = async (req: AuthRequest, res: Response): Promise<Response> => {
    const profissionalId = req.userId;
    const { date } = req.query; 

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

/**
 * @function hasActiveAgendamento
 * @description Verifica se um cliente possui um agendamento futuro (ativo) com o profissional autenticado.
 * Útil para o bot decidir qual menu apresentar ao usuário.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns Um booleano indicando a existência de um agendamento ativo.
 */
export const hasActiveAgendamento = async (req: AuthRequest, res: Response): Promise<Response> => {
  const profissionalId = req.userId; 
  const { clienteId } = req.params; 

  if (!profissionalId) {
    return res.status(401).json({ message: "Profissional não autenticado." });
  }

  if (!clienteId) {
    return res.status(400).json({ message: "O ID do cliente é obrigatório." });
  }

  try {
    const now = moment().toDate(); 

    const activeAgendamento = await Agendamento.findOne({
      where: {
        clienteId: clienteId,
        profissionalId: profissionalId,
        status: {
          [Op.in]: ['Pendente', 'Confirmado'], // Apenas status que representam um agendamento válido.
        },
        dataHora: {
          [Op.gte]: now, // Apenas agendamentos que ainda não ocorreram.
        },
      },
    });

    return res.status(200).json({ hasActive: !!activeAgendamento });
  } catch (error) {
    console.error("Erro ao verificar agendamento ativo:", error);
    return res.status(500).json({ message: "Erro interno ao verificar agendamento ativo." });
  }
};
