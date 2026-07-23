import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getDeadlines,
  getDeadline,
  createDeadline,
  updateDeadline,
  deleteDeadline,
} from '../controllers/deadline.controller';

const router = Router();
router.use(authenticate);

router.get('/', getDeadlines);
router.get('/:id', getDeadline);
router.post('/', authorize('SOCIO', 'ADVOGADO', 'ESTAGIARIO'), createDeadline);
router.put('/:id', authorize('SOCIO', 'ADVOGADO', 'ESTAGIARIO'), updateDeadline);
router.delete('/:id', authorize('SOCIO', 'ADVOGADO'), deleteDeadline);

export default router;
