import { Router } from "express";
import { 
    createProfissional, 
    loginProfissional, 
    getAllProfissionais, 
    getProfissionalProfile,
    updateProfissionalProfile, // Importar a nova função
    changeProfissionalPassword, // Importar a nova função
} from "../controllers/profissionalController";
import { protect } from "../middlewares/authMiddleware"; 

const router = Router();

/**
 * @description Define as rotas para autenticação e gerenciamento de profissionais.
 * A separação entre rotas públicas (`/register`, `/login`) e protegidas (`/`, `/profile`)
 * é fundamental para a segurança do sistema.
 */

// Rota pública para registrar um novo profissional no sistema.
router.post('/register', createProfissional);

// Rota pública para que um profissional possa se autenticar e obter um token.
router.post('/login', loginProfissional);

// Rota protegida para listar todos os profissionais. Acessível apenas por usuários autenticados.
router.get('/', protect, getAllProfissionais); 

// Rotas protegidas para gerenciar o perfil do profissional autenticado.
router.route('/profile')
    .get(protect, getProfissionalProfile)
    .put(protect, updateProfissionalProfile); // Rota para atualizar o perfil

// Rota protegida para alterar a senha do profissional autenticado.
router.put('/password', protect, changeProfissionalPassword);

export default router;