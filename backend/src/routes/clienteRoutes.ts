// backend/src/routes/clienteRoutes.ts

import { Router } from "express";
import { protect } from "../middlewares/authMiddleware"; // Proteção para garantir que só o bot acesse
import { 
    getClienteByTelefone, 
    createCliente 
} from "../controllers/clienteController"; 

const router = Router();

// ROTA PROTEGIDA: GET /api/clientes (Busca por telefone - Usado para verificar se o cliente já existe)
// Nota: O bot enviará o token JWT e o telefone na query.
router.get('/clientes', protect, getClienteByTelefone);

// ROTA PROTEGIDA: POST /api/clientes (Cria um novo cliente após o bot coletar o nome)
router.post('/clientes', protect, createCliente);

export default router;