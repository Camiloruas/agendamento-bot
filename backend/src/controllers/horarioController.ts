// backend/src/controllers/horarioController.ts

import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import HorarioProfissional from '../models/HorarioProfissional';
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
// Recebe um array de configurações de horário
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
            // Validação básica para cada objeto de horário
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
