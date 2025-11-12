import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { 
    createAgendamento, 
    getAllAgendamentos, 
    getAgendamentoById, 
    deleteAgendamento, 
    updateAgendamento,
    getAvailableSlots, // Importe a nova função
    getAgendamentosByCliente, // Importe a nova função
    hasActiveAgendamento // Importe a nova função
} from "../controllers/agendamentoController";

const router = Router();

// ROTA PROTEGIDA: Apenas usuários autenticados podem criar agendamentos
// URL final será: POST /api/agendamentos
router.post("/agendamentos", protect, createAgendamento);
router.get("/agendamentos", protect, getAllAgendamentos);
router.get("/agendamentos/:id", protect, getAgendamentoById);
router.delete("/agendamentos/:id", protect, deleteAgendamento);
router.put("/agendamentos/:id", protect, updateAgendamento);

// NOVA ROTA PROTEGIDA: GET /api/agendamentos/available-slots
router.get("/agendamentos/available-slots", protect, getAvailableSlots);

// NOVA ROTA PROTEGIDA: GET /api/agendamentos/cliente/:clienteId
router.get("/agendamentos/cliente/:clienteId", protect, getAgendamentosByCliente);

// NOVA ROTA PROTEGIDA: GET /api/agendamentos/has-active-appointment/:clienteId
router.get("/agendamentos/has-active-appointment/:clienteId", protect, hasActiveAgendamento);

export default router;
