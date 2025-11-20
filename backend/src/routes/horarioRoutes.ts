// backend/src/routes/horarioRoutes.ts

import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { 
    getHorarios, 
    createOrUpdateHorarios,
    getDiasDisponiveis,
    getHorariosDisponiveis,
} from "../controllers/horarioController";

const router = Router();

// Rota para o profissional obter sua própria configuração de horários
router.get("/", protect, getHorarios);

// Rota para o profissional criar ou atualizar sua configuração de horários
router.post("/", protect, createOrUpdateHorarios);

// --- NOVAS ROTAS PÚBLICAS (usadas pelo bot para os clientes) ---

// Rota para buscar os dias disponíveis de um profissional específico
router.get("/dias-disponiveis/:profissionalId", protect, getDiasDisponiveis);

// Rota para buscar os horários (slots) disponíveis em uma data específica
router.get("/horarios-disponiveis/:profissionalId/:date", protect, getHorariosDisponiveis);

export default router;
