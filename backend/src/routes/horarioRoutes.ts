// backend/src/routes/horarioRoutes.ts

import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { getHorarios, createOrUpdateHorarios } from "../controllers/horarioController";

const router = Router();

// ROTA PROTEGIDA: Para o profissional obter sua configuração de horários
router.get("/", protect, getHorarios);

// ROTA PROTEGIDA: Para o profissional criar ou atualizar sua configuração de horários
router.post("/", protect, createOrUpdateHorarios);

export default router;
