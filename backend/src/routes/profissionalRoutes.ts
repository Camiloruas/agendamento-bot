import { Router } from "express";
import { createProfissional, loginProfissional, getAllProfissionais, getProfissionalProfile } from "../controllers/profissionalController";
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

// Rota protegida para que um profissional autenticado possa obter seus próprios dados de perfil.
router.get('/profile', protect, getProfissionalProfile);

export default router;