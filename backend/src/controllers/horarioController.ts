import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { AuthRequest } from '../middlewares/authMiddleware';
import HorarioProfissional from '../models/HorarioProfissional';
import Agendamento from '../models/Agendamento';
import { HorarioProfissionalAttributes } from '../models/HorarioProfissional';
import moment from 'moment-timezone'; 

/**
 * Mapeia os nomes dos dias da semana (strings) para seus respectivos números (0=Domingo, 1=Segunda, etc.).
 */
const diaDaSemanaMap: { [key: string]: number } = {
    'Domingo': 0,
    'Segunda-feira': 1,
    'Terça-feira': 2,
    'Quarta-feira': 3,
    'Quinta-feira': 4,
    'Sexta-feira': 5,
    'Sábado': 6,
};

/**
 * @function getHorarios
 * @description Retorna a configuração de horários de trabalho (semanal) do profissional autenticado.
 * @param req Objeto de requisição do Express, autenticado.
 * @param res Objeto de resposta do Express.
 * @returns Uma lista com a configuração de horários para cada dia da semana.
 */
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

/**
 * @function createOrUpdateHorarios
 * @description Permite que um profissional crie ou atualize sua grade de horários de trabalho.
 * Agora, espera um objeto com os dias de trabalho selecionados e os horários comuns.
 * @param req Objeto de requisição do Express, autenticado. O corpo deve conter os dados do onboarding.
 * @param res Objeto de resposta do Express.
 * @returns Confirmação de sucesso e os dados atualizados.
 */
export const createOrUpdateHorarios = async (req: AuthRequest, res: Response): Promise<Response> => {
    const profissionalId = req.userId;
    const { diasTrabalho, horarioAbertura, horarioFechamento, intervaloInicio, intervaloFim } = req.body;

    if (!profissionalId) {
        return res.status(401).json({ message: "Profissional não autenticado." });
    }

    if (!Array.isArray(diasTrabalho) || !horarioAbertura || !horarioFechamento) {
        return res.status(400).json({ message: "Dados de horário inválidos. Campos obrigatórios faltando." });
    }

    try {
        // Primeiro, desativa todos os horários existentes para o profissional.
        await HorarioProfissional.update(
            { ativo: false },
            { where: { profissionalId: profissionalId } }
        );

        const horariosParaAtualizar: HorarioProfissionalAttributes[] = [];
        for (const diaNome of diasTrabalho) {
            const diaNumero = diaDaSemanaMap[diaNome];
            if (diaNumero !== undefined) {
                horariosParaAtualizar.push({
                    id: '', // Será gerado pelo banco ou atualizado pelo upsert
                    profissionalId: profissionalId,
                    diaDaSemana: diaNumero,
                    ativo: true,
                    horarioInicio: horarioAbertura,
                    horarioFim: horarioFechamento,
                    almocoInicio: intervaloInicio || null,
                    almocoFim: intervaloFim || null,
                });
            }
        }

        const resultados = [];
        for (const horario of horariosParaAtualizar) {
            // `upsert` vai inserir um novo registro ou atualizar um existente baseado em `profissionalId` e `diaDaSemana`.
            const [resultado] = await HorarioProfissional.upsert(horario);
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

/**
 * @function getDiasDisponiveis
 * @description Retorna uma lista de datas para os próximos 30 dias em que um profissional trabalha.
 * Essencial para o bot de agendamento mostrar ao cliente quais dias ele pode escolher.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns Um array de strings de data no formato 'YYYY-MM-DD'.
 */
export const getDiasDisponiveis = async (req: Request, res: Response): Promise<Response> => {
    const { profissionalId } = req.params;

    if (!profissionalId) {
        return res.status(400).json({ message: "O ID do profissional é obrigatório." });
    }

    try {
        // Primeiro, busca-se quais dias da semana o profissional *costuma* trabalhar.
        const diasDeTrabalho = await HorarioProfissional.findAll({
            where: { profissionalId, ativo: true },
            attributes: ['diaDaSemana'],
        });

        if (!diasDeTrabalho.length) {
            return res.status(200).json([]);
        }

        // Em seguida, projeta-se essa configuração para os próximos 30 dias.
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
 * @function getHorariosDisponiveis
 * @description Retorna os slots de horário de um dia específico, marcando-os como 'disponivel' ou 'ocupado'.
 * Esta é a lógica central para a disponibilidade, cruzando o horário de trabalho do profissional com os agendamentos já existentes.
 * @param req Objeto de requisição do Express.
 * @param res Objeto de resposta do Express.
 * @returns Um array de objetos, cada um representando um slot de tempo com seu status.
 */
export const getHorariosDisponiveis = async (req: Request, res: Response): Promise<Response> => {
    const { profissionalId, date } = req.params;

    if (!profissionalId || !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(profissionalId)) {
        return res.status(400).json({ message: "ID do profissional inválido." });
    }

    const TIMEZONE = 'America/Sao_Paulo'; // É crucial definir um fuso horário para consistência.

    try {
        const selectedDate = moment.utc(date as string); 
        const dayOfWeek = selectedDate.day(); 

        const horarioConfig = await HorarioProfissional.findOne({
            where: { profissionalId, diaDaSemana: dayOfWeek, ativo: true },
        });

        if (!horarioConfig) {
            return res.status(200).json([]); 
        }

        // Busca agendamentos existentes no fuso horário local do profissional para evitar erros de um dia para o outro.
        const startOfDayInTimezone = moment.tz(date as string, TIMEZONE).startOf('day');
        const endOfDayInTimezone = moment.tz(date as string, TIMEZONE).endOf('day');

        const existingAppointments = await Agendamento.findAll({
            where: {
                profissionalId: profissionalId,
                dataHora: {
                    [Op.between]: [startOfDayInTimezone.clone().utc().toDate(), endOfDayInTimezone.clone().utc().toDate()],
                },
                status: {
                    [Op.ne]: 'Cancelado', 
                },
            },
            attributes: ['dataHora'],
        });

        const bookedTimes = new Set(existingAppointments.map(app => moment.tz(app.dataHora, TIMEZONE).format('HH:mm')));

        // Gera todos os slots de horário possíveis para o dia.
        const allSlots: { time: string, status: 'disponivel' | 'ocupado' }[] = [];
        
        const currentTime = moment.tz(`${date} ${horarioConfig.horarioInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
        const endTime = moment.tz(`${date} ${horarioConfig.horarioFim}`, 'YYYY-MM-DD HH:mm', TIMEZONE);
        const lunchStart = horarioConfig.almocoInicio ? moment.tz(`${date} ${horarioConfig.almocoInicio}`, 'YYYY-MM-DD HH:mm', TIMEZONE) : null;
        const lunchEnd = horarioConfig.almocoFim ? moment.tz(`${date} ${horarioConfig.almocoFim}`, 'YYYY-MM-DD HH:mm', TIMEZONE) : null;

        // Itera sobre o expediente, slot a slot, para determinar a disponibilidade.
        while (currentTime.isBefore(endTime)) {
            // Verifica e pula o horário de almoço, se configurado.
            if (lunchStart && lunchEnd && currentTime.isBetween(lunchStart, lunchEnd, null, '[)')) {
                currentTime.add(1, 'hour'); 
                continue; 
            }

            const slotTime = currentTime.format('HH:mm'); 
            const status = bookedTimes.has(slotTime) ? 'ocupado' : 'disponivel';
            
            allSlots.push({ time: slotTime, status: status });
            
            currentTime.add(1, 'hour'); // Avança para o próximo slot.
        }

        return res.status(200).json(allSlots);

    } catch (error) {
        console.error("Erro ao buscar horários disponíveis:", error);
        return res.status(500).json({ message: "Erro interno ao buscar horários disponíveis.", details: (error as Error).message });
    }
};