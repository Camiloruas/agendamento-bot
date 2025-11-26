import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { 
    getHorarios, 
    createOrUpdateHorarios,
    getDiasDisponiveis,
    getHorariosDisponiveis,
} from "../controllers/horarioController";

const router = Router();

/**
 * @description Define as rotas para gerenciar os horários de trabalho dos profissionais
 * e para consultar a disponibilidade.
 */

// Rota para um profissional autenticado visualizar sua própria grade de horários.
router.get("/", protect, getHorarios);

// Rota para um profissional autenticado criar ou atualizar sua grade de horários.
router.post("/", protect, createOrUpdateHorarios);

/**
 * @description Rotas públicas (mas protegidas) de consulta, usadas principalmente pelo bot-service
 * para determinar a disponibilidade de agendamento para os clientes.
 */

// Rota para buscar os dias em que um profissional trabalha nos próximos 30 dias.
router.get("/dias-disponiveis/:profissionalId", protect, getDiasDisponiveis);

// Rota para buscar os slots de horário (com status de disponível/ocupado) para um profissional em uma data específica.
router.get("/horarios-disponiveis/:profissionalId/:date", protect, getHorariosDisponiveis);

export default router;
