import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { createAgendamento, getAllAgendamentos } from "../controllers/agendamentoController";

const router = Router();

// ROTA PROTEGIDA: Apenas usuários autenticados podem criar agendamentos
// URL final será: POST /api/agendamentos
router.post("/agendamentos", protect, createAgendamento);
router.get('/agendamentos', protect, getAllAgendamentos);
export default router;
