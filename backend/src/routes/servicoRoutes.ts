import { Router } from 'express';
import { getAllServices, createService, updateService, deleteService, toggleServiceStatus } from '../controllers/servicoController';

const router = Router();

router.get('/', getAllServices);
router.post('/', createService);
router.put('/:id', updateService);
router.delete('/:id', deleteService);
router.patch('/:id/toggle', toggleServiceStatus);

export default router;
