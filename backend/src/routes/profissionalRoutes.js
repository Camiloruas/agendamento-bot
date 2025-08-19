import { Router } from 'express';
import profissionalController from '../controllers/profissionalController.js';

const router = Router();

// Rota para criar um novo profissional (acessível via POST em /api/profissionais)
router.post('/', profissionalController.create);

export default router;