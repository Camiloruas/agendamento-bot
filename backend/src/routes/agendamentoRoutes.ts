import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { 
    createAgendamento, 
    getAllAgendamentos, 
    getAgendamentoById, 
    deleteAgendamento, 
    updateAgendamento,
    getAvailableSlots, 
    getAgendamentosByCliente, 
    hasActiveAgendamento, 
    getAgendamentosByDate
} from "../controllers/agendamentoController";

const router = Router();

/**
 * @description Centraliza todas as rotas relacionadas a agendamentos.
 * O uso do middleware `protect` garante que apenas usuários (profissionais) autenticados
 * possam acessar estas rotas, protegendo os dados e a lógica de negócio.
 */

// Rotas para operações CRUD padrão em agendamentos.
router.post("/", protect, createAgendamento);
router.get("/", protect, getAllAgendamentos);
router.get("/by-date", protect, getAgendamentosByDate);
router.get("/:id", protect, getAgendamentoById);
router.delete("/:id", protect, deleteAgendamento);
router.put("/:id", protect, updateAgendamento);

// Rota para consultar a disponibilidade. Usada pelo bot para mostrar horários ao cliente.
router.get("/available-slots", protect, getAvailableSlots);

// Rota para buscar todos os agendamentos de um cliente específico.
router.get("/cliente/:clienteId", protect, getAgendamentosByCliente);

// Rota de verificação rápida, usada pelo bot para determinar o fluxo da conversa (se o cliente já tem agendamento ativo).
router.get("/has-active-appointment/:clienteId", protect, hasActiveAgendamento);

export default router;
