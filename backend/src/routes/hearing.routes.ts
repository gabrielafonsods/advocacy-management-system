import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import {
  getHearings,
  getHearing,
  createHearing,
  updateHearing,
  deleteHearing,
} from '../controllers/hearing.controller';

const router = Router();
router.use(authenticate);

router.get('/', getHearings);
router.get('/:id', getHearing);
router.post('/', authorize('SOCIO', 'ADVOGADO', 'ESTAGIARIO'), createHearing);
router.put('/:id', authorize('SOCIO', 'ADVOGADO', 'ESTAGIARIO'), updateHearing);
router.delete('/:id', authorize('SOCIO', 'ADVOGADO'), deleteHearing);

export default router;
