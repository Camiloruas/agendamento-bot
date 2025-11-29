import { Router } from 'express';
import { getAllServices, createService } from '../controllers/servicoController';

const router = Router();

router.get('/', getAllServices);
router.post('/', createService);

export default router;
