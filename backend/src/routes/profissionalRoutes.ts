// backend/src/routes/profissionalRoutes.ts

import { Router } from 'express'; // Importa apenas a classe Router do Express
import { createProfissional } from '../controllers/profissionalController.js'; // Importa a função do nosso Controller

// Tipagem: Cria uma instância do roteador
const router: Router = Router();

// Rota POST para criar um novo profissional
// URL final será: /api/profissionais
router.post('/profissionais', createProfissional);

// Exporta o router para que o server.ts possa utilizá-lo
export default router;