// backend/src/routes/profissionalRoutes.ts

import { Router } from "express";
// 1. IMPORTAÇÃO DOS CONTROLLERS (createProfissional, loginProfissional, getAllProfissionais)
import { createProfissional, loginProfissional, getAllProfissionais, getProfissionalProfile } from "../controllers/profissionalController";

// 2. IMPORTAÇÃO DO MIDDLEWARE
import { protect } from "../middlewares/authMiddleware"; 

const router = Router();

// Rota POST para criar um novo profissional
router.post('/register', createProfissional);

// Rota GET PROTEGIDA para listar profissionais
router.get('/', protect, getAllProfissionais); 

// Rota POST para login
router.post('/login', loginProfissional);

// Rota GET para buscar o perfil do profissional autenticado
router.get('/profile', protect, getProfissionalProfile);

// Exporta o router
export default router;