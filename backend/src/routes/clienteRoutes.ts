
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


router.get('/by-phone', protect, getClienteByTelefone);


router.post('/', protect, createCliente);


router.get('/', protect, getAllClientes);


router.route('/:id')
    .get(protect, getClienteById)
        .put(protect, updateCliente)
    .delete(protect, deleteCliente);

export default router;