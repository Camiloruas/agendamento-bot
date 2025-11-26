
import { Router } from "express";

import { createProfissional, loginProfissional, getAllProfissionais, getProfissionalProfile } from "../controllers/profissionalController";


import { protect } from "../middlewares/authMiddleware"; 

const router = Router();


router.post('/register', createProfissional);


router.get('/', protect, getAllProfissionais); 


router.post('/login', loginProfissional);


router.get('/profile', protect, getProfissionalProfile);


export default router;