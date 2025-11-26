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


router.post("/", protect, createAgendamento);
router.get("/", protect, getAllAgendamentos);
router.get("/by-date", protect, getAgendamentosByDate);
router.get("/:id", protect, getAgendamentoById);
router.delete("/:id", protect, deleteAgendamento);
router.put("/:id", protect, updateAgendamento);


router.get("/available-slots", protect, getAvailableSlots);


router.get("/cliente/:clienteId", protect, getAgendamentosByCliente);


router.get("/has-active-appointment/:clienteId", protect, hasActiveAgendamento);

export default router;
