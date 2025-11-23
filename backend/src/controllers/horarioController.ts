// backend/src/controllers/horarioController.ts

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../middlewares/authMiddleware';
import HorarioProfissional from '../models/HorarioProfissional';
import Agendamento from '../models/Agendamento';
import { HorarioProfissionalAttributes } from '../models/HorarioProfissional';
import moment from 'moment-timezone'; // Importação explícita de moment-timezone

// Função para o profissional obter sua própria configuração de horários
export const getHorarios = async (req: AuthRequest, res: Response): Promise<Response> => {
    const profissionalId = req.userId;

    if (!profissionalId) {
        return res.status(401).json({ message: "Profissional não autenticado." });
    }

    try {
        const horarios = await HorarioProfissional.findAll({
            where: { profissionalId: profissionalId },
            order: [['diaDaSemana', 'ASC']],
        });

        return res.status(200).json(horarios);
    } catch (error) {
        console.error("Erro ao buscar horários:", error);
        return res.status(500).json({ message: "Erro interno ao buscar horários." });
    }
};

// Função para o profissional criar ou atualizar seus horários
export const createOrUpdateHorarios = async (req: AuthRequest, res: Response): Promise<Response> => {
    const profissionalId = req.userId;
    const horarios: HorarioProfissionalAttributes[] = req.body;

    if (!profissionalId) {
        return res.status(401).json({ message: "Profissional não autenticado." });
    }

    if (!Array.isArray(horarios) || horarios.length === 0) {
        return res.status(400).json({ message: "O corpo da requisição deve ser um array de horários." });
    }

    try {
        const resultados = [];
        for (const horario of horarios) {
            if (horario.diaDaSemana === undefined || horario.ativo === undefined || !horario.horarioInicio || !horario.horarioFim) {
                return res.status(400).json({ message: `Horário inválido para o dia ${horario.diaDaSemana}. Campos obrigatórios faltando.` });
            }

            const [resultado, criado] = await HorarioProfissional.upsert({
                ...horario,
                profissionalId: profissionalId,
            });
            resultados.push(resultado);
        }

        return res.status(200).json({
            message: "Horários atualizados com sucesso.",
            data: resultados,
        });

    } catch (error) {
        console.error("Erro ao criar ou atualizar horários:", error);
        return res.status(500).json({ message: "Erro interno ao processar horários." });
    }
};

// --- NOVAS FUNÇÕES ---

/**
 * Retorna os próximos 30 dias em que o profissional trabalha.
 */
export const getDiasDisponiveis = async (req: Request, res: Response): Promise<Response> => {
    const { profissionalId } = req.params;

    try {
        const diasDeTrabalho = await HorarioProfissional.findAll({
            where: { profissionalId, ativo: true },
            attributes: ['diaDaSemana'],
        });

        if (!diasDeTrabalho.length) {
            return res.status(200).json([]);
        }

        const diasDeTrabalhoSet = new Set(diasDeTrabalho.map(d => d.diaDaSemana));
        const datasDisponiveis = [];
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
            const data = new Date(hoje);
            data.setDate(data.getDate() + i);
            const diaDaSemana = data.getDay();

            if (diasDeTrabalhoSet.has(diaDaSemana)) {
                datasDisponiveis.push(data.toISOString().split('T')[0]);
            }
        }

        return res.status(200).json(datasDisponiveis);

    } catch (error) {
        console.error("Erro ao buscar dias disponíveis:", error);
        return res.status(500).json({ message: "Erro interno ao buscar dias disponíveis." });
    }
};

/**
 * Retorna todos os horários de um profissional para uma data específica com seus respectivos status (Disponível/Ocupado).
 */
export const getHorariosDisponiveis = async (req: Request, res: Response): Promise<Response> => {
    const { profissionalId, date } = req.params;

    // A validação de data já foi feita em api-client.ts antes de chamar esta rota.
    // Garante que o profissionalId é UUID
    if (!profissionalId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(profissionalId)) {
        return res.status(400).json({ message: "ID do profissional inválido." });
    }

    const TIMEZONE = 'America/Sao_Paulo'; // Fuso horário a ser usado para o profissional

    try {
        const selectedDate = moment.utc(date as string); // Continua sendo UTC para o dia (YYYY-MM-DD)
        const dayOfWeek = selectedDate.day(); // 0 (Domingo) a 6 (Sábado)

        // 1. Buscar a configuração de horário do profissional para o dia da semana
        const horarioConfig = await HorarioProfissional.findOne({
            where: { profissionalId, diaDaSemana: dayOfWeek, ativo: true },
        });

        // Se não houver configuração de horário, retorna uma lista vazia.
        if (!horarioConfig) {
            return res.status(200).json([]); // Não trabalha neste dia
        }

        // 2. Buscar agendamentos existentes para o profissional na data selecionada (em UTC)
        // Precisamos dos agendamentos no fuso horário do profissional para comparar corretamente
        const startOfDayInTimezone = moment.tz(date as string, TIMEZONE).startOf('day');
        const endOfDayInTimezone = moment.tz(date as string, TIMEZONE).endOf('day');

        const existingAppointments = await Agendamento.findAll({
            where: {
                profissionalId: profissionalId,
                dataHora: {
                    [Op.between]: [startOfDayInTimezone.clone().utc().toDate(), endOfDayInTimezone.clone().utc().toDate()],
                },
                status: {
                    [Op.ne]: 'Cancelado', // Não considerar agendamentos cancelados
                },
            },
            attributes: ['dataHora'],
        });

        // Formata os horários agendados para 'HH:mm' NO FUSO HORÁRIO DO PROFISSIONAL e usa um Set para busca eficiente
        const bookedTimes = new Set(existingAppointments.map(app => moment.tz(app.dataHora, TIMEZONE).format('HH:mm')));

        // 3. Gerar todos os slots do dia com seus status
        const allSlots: { time: string, status: 'disponivel' | 'ocupado' }[] = [];
        
        // Combina a data selecionada com a hora inicial e final, tratando como o fuso horário do profissional
        const currentTime = moment.tz(`${date} ${horarioConfig.horarioInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
        const endTime = moment.tz(`${date} ${horarioConfig.horarioFim}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
        const lunchStart = horarioConfig.almocoInicio ? moment.tz(`${date} ${horarioConfig.almocoInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE) : null;
        const lunchEnd = horarioConfig.almocoFim ? moment.tz(`${date} ${horarioConfig.almocoFim}`, 'YYYY-MM-DD HH:mm', TIMEZONE) : null;

        // Itera sobre os horários do dia, de hora em hora (ou conforme a duração do slot)
        while (currentTime.isBefore(endTime)) {
            // Se o horário atual cair dentro da janela de almoço, avança o tempo para o fim do almoço
            // currentTime e lunchStart/End já estão no fuso horário correto
            if (lunchStart && lunchEnd && currentTime.isBetween(lunchStart, lunchEnd, null, '[)')) {
                currentTime.add(1, 'hour'); // Pula o almoço
                continue; 
            }

            const slotTime = currentTime.format('HH:mm'); // Formata a hora no fuso horário do profissional
            const status = bookedTimes.has(slotTime) ? 'ocupado' : 'disponivel';
            
            allSlots.push({ time: slotTime, status: status });
            
            // Avança para o próximo slot (assumindo slots de 1 hora)
            currentTime.add(1, 'hour');
        }

        return res.status(200).json(allSlots);

    } catch (error) {
        console.error("Erro ao buscar horários disponíveis:", error);
        return res.status(500).json({ message: "Erro interno ao buscar horários disponíveis.", details: (error as Error).message });
    }
};