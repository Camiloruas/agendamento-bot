import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { createAgendamento, getAllAgendamentos, getAgendamentoById, deleteAgendamento, updateAgendamento } from "../controllers/agendamentoController";

const router = Router();

// ROTA PROTEGIDA: Apenas usuários autenticados podem criar agendamentos
// URL final será: POST /api/agendamentos
router.post("/agendamentos", protect, createAgendamento);
router.get("/agendamentos", protect, getAllAgendamentos);
router.get("/agendamentos/:id", protect, getAgendamentoById);
router.delete("/agendamentos/:id", protect, deleteAgendamento);
router.put("/agendamentos/:id", protect, updateAgendamento);
export default router;
