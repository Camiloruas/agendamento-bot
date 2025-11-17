// backend/src/routes/clienteRoutes.ts

import { Router } from "express";
import { protect } from "../middlewares/authMiddleware";
import { 
    getClienteByTelefone, 
    createCliente,
    getAllClientes,
    getClienteById,
    updateCliente,
    deleteCliente
} from "../controllers/clienteController"; 

const router = Router();

// Rota para buscar um cliente pelo telefone (usado pelo bot)
router.get('/by-phone', protect, getClienteByTelefone);

// Rota para criar um novo cliente
router.post('/', protect, createCliente);

// Rota para obter todos los clientes
router.get('/', protect, getAllClientes);

// Rota para obter, atualizar e deletar um cliente por ID
router.route('/:id')
    .get(protect, getClienteById)
        .put(protect, updateCliente)
    .delete(protect, deleteCliente);

export default router;