// backend/src/routes/profissionalRoutes.ts

import { Router } from "express";
// 1. IMPORTAÇÃO DOS CONTROLLERS (createProfissional, loginProfissional, getAllProfissionais)
import { createProfissional, loginProfissional, getAllProfissionais } from "../controllers/profissionalController";

// 2. IMPORTAÇÃO DO MIDDLEWARE
import { protect } from "../middlewares/authMiddleware"; 

const router = Router();

// Rota POST para criar um novo profissional
router.post('/profissionais/register', createProfissional);

// Rota GET PROTEGIDA para listar profissionais
router.get('/profissionais', protect, getAllProfissionais); 

// Rota POST para login
router.post('/profissionais/login', loginProfissional);

// Exporta o router
export default router;