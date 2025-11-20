// backend/src/controllers/horarioController.ts

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../middlewares/authMiddleware';
import HorarioProfissional from '../models/HorarioProfissional';
import Agendamento from '../models/Agendamento';
import { HorarioProfissionalAttributes } from '../models/HorarioProfissional';

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
 * Retorna os horários disponíveis para um profissional em uma data específica.
 */
export const getHorariosDisponiveis = async (req: Request, res: Response): Promise<Response> => {
    const { profissionalId, date } = req.params;
    const diaDaSemana = new Date(date).getUTCDay();

    try {
        const configHorario = await HorarioProfissional.findOne({
            where: { profissionalId, diaDaSemana, ativo: true },
        });

        if (!configHorario) {
            return res.status(200).json([]); // Não trabalha neste dia
        }

        // 1. Gerar todos os slots do dia
        const slots = [];
        const [startHour] = configHorario.horarioInicio.split(':').map(Number);
        const [endHour] = configHorario.horarioFim.split(':').map(Number);
        // Assumindo duração de 1 hora por slot
        for (let hour = startHour; hour < endHour; hour++) {
            slots.push(`${String(hour).padStart(2, '0')}:00`);
        }

        // 2. Buscar agendamentos existentes para o dia
        const inicioDoDia = new Date(`${date}T00:00:00.000Z`);
        const fimDoDia = new Date(`${date}T23:59:59.999Z`);

        const agendamentos = await Agendamento.findAll({
            where: {
                profissionalId,
                dataHora: {
                    [Op.between]: [inicioDoDia, fimDoDia],
                },
            },
            attributes: ['dataHora'],
        });

        const horariosOcupados = new Set(
            agendamentos.map(a => new Date(a.dataHora).getUTCHours())
        );

        // 3. Filtrar slots disponíveis
        const horariosDisponiveis = slots.filter(slot => {
            const hour = Number(slot.split(':')[0]);
            return !horariosOcupados.has(hour);
        });

        return res.status(200).json(horariosDisponiveis);

    } catch (error) {
        console.error("Erro ao buscar horários disponíveis:", error);
        return res.status(500).json({ message: "Erro interno ao buscar horários." });
    }
};
