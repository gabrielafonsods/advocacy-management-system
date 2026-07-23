import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getCases,
  getCase,
  createCase,
  updateCase,
  deleteCase
} from '../controllers/case.controller';

const router = Router();
router.use(authenticate);

router.get('/', getCases);
router.get('/:id', getCase);
router.post('/', authorize('SOCIO', 'ADVOGADO', 'ESTAGIARIO'), createCase);
router.put('/:id', authorize('SOCIO', 'ADVOGADO', 'ESTAGIARIO'), updateCase);
router.delete('/:id', authorize('SOCIO'), deleteCase);

export default router;
