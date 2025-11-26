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

/**
 * @description Agrupa as rotas para o gerenciamento de clientes.
 * Todas as rotas são protegidas, o que significa que um profissional deve estar
 * autenticado para interagir com os dados dos clientes.
 */

// Rota otimizada para o bot: permite identificar um cliente rapidamente pelo seu número de WhatsApp.
router.get('/by-phone', protect, getClienteByTelefone);

// Rota para o bot registrar um novo cliente que iniciou a conversa.
router.post('/', protect, createCliente);

// Rota padrão para listar todos os clientes, útil para a interface de administração.
router.get('/', protect, getAllClientes);

// Agrupa as operações de Leitura, Atualização e Deleção (RUD) para um cliente específico por ID.
// Esta abordagem `router.route()` é uma maneira limpa de encadear múltiplos verbos HTTP para o mesmo caminho.
router.route('/:id')
    .get(protect, getClienteById)
    .put(protect, updateCliente)
    .delete(protect, deleteCliente);

export default router;